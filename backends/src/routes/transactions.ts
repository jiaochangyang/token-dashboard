import { Elysia, t } from "elysia";
import { db } from "../db";
import { transactions } from "../db/schema";
import { eq } from "drizzle-orm";

export const transactionsRoute = new Elysia({ prefix: "/transactions" })
  .get("/", async () => {
    const allTransactions = await db.select().from(transactions);
    return {
      success: true,
      data: allTransactions,
    };
  })
  .get(
    "/by-deployment/:deploymentId",
    async ({ params: { deploymentId }, error }) => {
      const txns = await db
        .select()
        .from(transactions)
        .where(eq(transactions.deploymentId, deploymentId));

      return {
        success: true,
        data: txns,
      };
    },
    {
      params: t.Object({
        deploymentId: t.String(),
      }),
    }
  );
