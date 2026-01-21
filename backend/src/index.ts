import { Elysia } from "elysia";
import { cors } from "@elysiajs/cors";
import { tokensRoute } from "./routes/tokens";
import { deploymentsRoute } from "./routes/deployments";
import { interactionsRoute } from "./routes/interactions";
import { transactionsRoute } from "./routes/transactions";
import { databaseRoute } from "./routes/database";

const app = new Elysia()
  .use(
    cors({
      origin: true,
      credentials: true,
    }),
  )
  .get("/", () => ({
    message: "MyToken Dashboard API",
    version: "1.0.0",
    endpoints: {
      contracts: "/contracts - Manage token contract templates (ABI/bytecode)",
      deployments: "/deployments - Deploy and track contract deployments",
      transactions: "/transactions - View transaction history",
      interactions: "/tokens/:address/* - Interact with deployed tokens",
      database: "/database - Database management (clear, stats, reset)",
    },
  }))
  .use(tokensRoute)
  .use(deploymentsRoute)
  .use(transactionsRoute)
  .use(interactionsRoute)
  .use(databaseRoute)
  .listen(3000);

console.log(
  `🦊 Elysia is running at ${app.server?.hostname}:${app.server?.port}`,
);
