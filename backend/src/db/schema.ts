import {
  pgTable,
  text,
  timestamp,
  integer,
  jsonb,
  varchar,
  boolean,
} from "drizzle-orm/pg-core";
import { createId } from "@paralleldrive/cuid2";

export const tokenContracts = pgTable("token_contracts", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => createId()),
  name: varchar("name", { length: 255 }).notNull(),
  symbol: varchar("symbol", { length: 50 }).notNull(),
  decimals: integer("decimals").notNull(),
  abi: jsonb("abi").notNull(),
  bytecode: text("bytecode").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const deployments = pgTable("deployments", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => createId()),
  tokenContractId: text("token_contract_id")
    .notNull()
    .references(() => tokenContracts.id, { onDelete: "cascade" }),
  contractAddress: varchar("contract_address", { length: 42 })
    .notNull()
    .unique(),
  chainId: integer("chain_id").notNull(),
  deployerAddress: varchar("deployer_address", { length: 42 }).notNull(),
  transactionHash: varchar("transaction_hash", { length: 66 }).notNull(),
  initialSupply: text("initial_supply").notNull(),
  gasUsed: text("gas_used"),
  deployedAt: timestamp("deployed_at").defaultNow().notNull(),
  status: varchar("status", { length: 20 }).notNull().default("pending"),
});

export const transactions = pgTable("transactions", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => createId()),
  deploymentId: text("deployment_id")
    .notNull()
    .references(() => deployments.id, { onDelete: "cascade" }),
  transactionHash: varchar("transaction_hash", { length: 66 }).notNull(),
  functionName: varchar("function_name", { length: 100 }).notNull(),
  parameters: jsonb("parameters"),
  fromAddress: varchar("from_address", { length: 42 }).notNull(),
  status: varchar("status", { length: 20 }).notNull().default("pending"),
  gasUsed: text("gas_used"),
  errorMessage: text("error_message"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export type TokenContract = typeof tokenContracts.$inferSelect;
export type NewTokenContract = typeof tokenContracts.$inferInsert;
export type Deployment = typeof deployments.$inferSelect;
export type NewDeployment = typeof deployments.$inferInsert;
export type Transaction = typeof transactions.$inferSelect;
export type NewTransaction = typeof transactions.$inferInsert;
