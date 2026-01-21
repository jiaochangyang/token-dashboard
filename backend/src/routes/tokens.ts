import { Elysia, t } from "elysia";
import { db } from "../db";
import { tokenContracts } from "../db/schema";
import { eq } from "drizzle-orm";

export const tokensRoute = new Elysia({ prefix: "/contracts" })
  .post(
    "/",
    async ({ body }) => {
      const [token] = await db
        .insert(tokenContracts)
        .values({
          name: body.name,
          symbol: body.symbol,
          decimals: body.decimals,
          abi: body.abi,
          bytecode: body.bytecode,
        })
        .returning();

      return {
        success: true,
        data: token,
      };
    },
    {
      body: t.Object({
        name: t.String({ minLength: 1, maxLength: 255 }),
        symbol: t.String({ minLength: 1, maxLength: 50 }),
        decimals: t.Number({ minimum: 0, maximum: 255 }),
        abi: t.Any(),
        bytecode: t.String({ minLength: 1 }),
      }),
    },
  )
  .get("/", async () => {
    const tokens = await db.select().from(tokenContracts);
    return {
      success: true,
      data: tokens,
    };
  })
  .get(
    "/:id",
    async ({ params: { id }, error }) => {
      const [token] = await db
        .select()
        .from(tokenContracts)
        .where(eq(tokenContracts.id, id));

      if (!token) {
        return error(404, {
          success: false,
          message: "Token contract not found",
        });
      }

      return {
        success: true,
        data: token,
      };
    },
    {
      params: t.Object({
        id: t.String(),
      }),
    },
  )
  .delete(
    "/:id",
    async ({ params: { id }, error }) => {
      const [deleted] = await db
        .delete(tokenContracts)
        .where(eq(tokenContracts.id, id))
        .returning();

      if (!deleted) {
        return error(404, {
          success: false,
          message: "Token contract not found",
        });
      }

      return {
        success: true,
        message: "Token contract deleted successfully",
      };
    },
    {
      params: t.Object({
        id: t.String(),
      }),
    },
  );
