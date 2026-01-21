import { Elysia, t } from "elysia";
import { db } from "../db";
import { sql } from "drizzle-orm";
import * as schema from "../db/schema";

export const databaseRoute = new Elysia({ prefix: "/database" })
  // Clear all tables
  .delete(
    "/clear",
    async ({ body }) => {
      const { confirmation } = body;

      // Require explicit confirmation
      if (confirmation !== "DELETE ALL DATA") {
        return {
          success: false,
          error:
            "Confirmation required. Send { confirmation: 'DELETE ALL DATA' }",
        };
      }

      try {
        // Get all table names from schema
        const tables = [
          schema.transactions,
          schema.deployments,
          schema.tokenContracts,
        ];

        const tableNames = ["transactions", "deployments", "token_contracts"];

        // Disable foreign key checks temporarily
        await db.execute(sql`SET session_replication_role = 'replica'`);

        const clearedTables: string[] = [];

        // Truncate each table
        for (const tableName of tableNames) {
          await db.execute(
            sql.raw(`TRUNCATE TABLE ${tableName} RESTART IDENTITY CASCADE`),
          );
          clearedTables.push(tableName);
        }

        // Re-enable foreign key checks
        await db.execute(sql`SET session_replication_role = 'origin'`);

        return {
          success: true,
          message: "All tables cleared successfully",
          clearedTables,
        };
      } catch (error) {
        // Re-enable foreign key checks in case of error
        try {
          await db.execute(sql`SET session_replication_role = 'origin'`);
        } catch {}

        return {
          success: false,
          error: error instanceof Error ? error.message : "Unknown error",
        };
      }
    },
    {
      body: t.Object({
        confirmation: t.String(),
      }),
    },
  )

  // Get table statistics
  .get("/stats", async () => {
    try {
      const [transactionsCount] = await db.execute(
        sql`SELECT COUNT(*) as count FROM transactions`,
      );
      const [deploymentsCount] = await db.execute(
        sql`SELECT COUNT(*) as count FROM deployments`,
      );
      const [contractsCount] = await db.execute(
        sql`SELECT COUNT(*) as count FROM token_contracts`,
      );

      return {
        success: true,
        tables: {
          transactions: Number(transactionsCount.count),
          deployments: Number(deploymentsCount.count),
          token_contracts: Number(contractsCount.count),
        },
        total:
          Number(transactionsCount.count) +
          Number(deploymentsCount.count) +
          Number(contractsCount.count),
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      };
    }
  })

  // Reset database (clear + reseed)
  .post(
    "/reset",
    async ({ body }) => {
      const { confirmation } = body;

    if (confirmation !== "DELETE ALL DATA") {
      return {
        success: false,
        error: "Confirmation required. Send { confirmation: 'DELETE ALL DATA' }",
      };
    }

    try {
      // Clear all tables
      await db.execute(sql`SET session_replication_role = 'replica'`);

      await db.execute(
        sql.raw(`TRUNCATE TABLE transactions RESTART IDENTITY CASCADE`)
      );
      await db.execute(
        sql.raw(`TRUNCATE TABLE deployments RESTART IDENTITY CASCADE`)
      );
      await db.execute(
        sql.raw(`TRUNCATE TABLE token_contracts RESTART IDENTITY CASCADE`)
      );

      await db.execute(sql`SET session_replication_role = 'origin'`);

      // Re-seed with default data if seed file exists
      let seeded = false;
      try {
        const { seedDatabase } = await import("../seed");
        await seedDatabase();
        seeded = true;
      } catch (error) {
        // Seed file might not exist, that's okay
      }

      return {
        success: true,
        message: seeded
          ? "Database reset and reseeded successfully"
          : "Database reset successfully (no seed data available)",
      };
    } catch (error) {
      try {
        // Clear only deployment-related tables, preserve token_contracts
        await db.execute(sql`SET session_replication_role = 'replica'`);

        // Clear transactions first (has FK to deployments)
        await db.execute(
          sql.raw(`TRUNCATE TABLE transactions RESTART IDENTITY CASCADE`),
        );

        // Clear deployments (has FK to token_contracts, but we preserve token_contracts)
        await db.execute(
          sql.raw(`TRUNCATE TABLE deployments RESTART IDENTITY CASCADE`),
        );

        // NOTE: token_contracts table is intentionally preserved

        await db.execute(sql`SET session_replication_role = 'origin'`);

        // Get count of preserved token contracts
        const [contractsCount] = await db.execute(
          sql`SELECT COUNT(*) as count FROM token_contracts`,
        );

        // Re-seed deployment data if seed file exists
        let seeded = false;
        try {
          const { seedDatabase } = await import("../seed");
          await seedDatabase();
          seeded = true;
        } catch (error) {
          // Seed file might not exist, that's okay
        }

        return {
          success: true,
          message: seeded
            ? "Database reset and reseeded successfully (token templates preserved)"
            : "Database reset successfully (token templates preserved)",
          preserved: {
            token_contracts: Number(contractsCount.count),
          },
        };
      } catch (error) {
        try {
          await db.execute(sql`SET session_replication_role = 'origin'`);
        } catch {}

        return {
          success: false,
          error: error instanceof Error ? error.message : "Unknown error",
        };
      }
    },
    {
      body: t.Object({
        confirmation: t.String(),
      }),
    },
  );
