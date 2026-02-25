CREATE TABLE "deployments" (
    "id" text PRIMARY KEY NOT NULL,
    "token_contract_id" text NOT NULL,
    "contract_address" varchar(42) NOT NULL,
    "chain_id" integer NOT NULL,
    "deployer_address" varchar(42) NOT NULL,
    "transaction_hash" varchar(66) NOT NULL,
    "initial_supply" text NOT NULL,
    "gas_used" text,
    "deployed_at" timestamp DEFAULT now () NOT NULL,
    "status" varchar(20) DEFAULT 'pending' NOT NULL,
    CONSTRAINT "deployments_contract_address_unique" UNIQUE ("contract_address")
);

--> statement-breakpoint
CREATE TABLE "token_contracts" (
    "id" text PRIMARY KEY NOT NULL,
    "name" varchar(255) NOT NULL,
    "symbol" varchar(50) NOT NULL,
    "decimals" integer NOT NULL,
    "abi" jsonb NOT NULL,
    "bytecode" text NOT NULL,
    "created_at" timestamp DEFAULT now () NOT NULL,
    "updated_at" timestamp DEFAULT now () NOT NULL
);

--> statement-breakpoint
CREATE TABLE "transactions" (
    "id" text PRIMARY KEY NOT NULL,
    "deployment_id" text NOT NULL,
    "transaction_hash" varchar(66) NOT NULL,
    "function_name" varchar(100) NOT NULL,
    "parameters" jsonb,
    "from_address" varchar(42) NOT NULL,
    "status" varchar(20) DEFAULT 'pending' NOT NULL,
    "gas_used" text,
    "error_message" text,
    "created_at" timestamp DEFAULT now () NOT NULL
);

--> statement-breakpoint
ALTER TABLE "deployments" ADD CONSTRAINT "deployments_token_contract_id_token_contracts_id_fk" FOREIGN KEY ("token_contract_id") REFERENCES "public"."token_contracts" ("id") ON DELETE cascade ON UPDATE no action;

--> statement-breakpoint
ALTER TABLE "transactions" ADD CONSTRAINT "transactions_deployment_id_deployments_id_fk" FOREIGN KEY ("deployment_id") REFERENCES "public"."deployments" ("id") ON DELETE cascade ON UPDATE no action;
