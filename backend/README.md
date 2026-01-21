# MyToken Dashboard Backend

Backend API for managing MyToken ERC20 contract deployments and interactions.

## Features

- **Token Contract Management**: Onboard MyToken ABI and bytecode
- **Deployment Management**: Deploy MyToken contracts to EVM chains
- **Contract Interactions**: Complete API for all MyToken functions
- **Transaction Tracking**: Log all contract interactions
- **PostgreSQL Database**: Persistent storage with Drizzle ORM

## Tech Stack

- **Runtime**: Bun
- **Framework**: Elysia
- **Database**: PostgreSQL
- **ORM**: Drizzle ORM
- **Blockchain**: viem

## Setup

### Prerequisites

- Bun installed
- PostgreSQL running locally or accessible remotely

### Installation

```bash
bun install
```

### Database Setup

1. Create a PostgreSQL database:

```bash
createdb token_dashboard
```

2. Copy the environment file:

```bash
cp .env.example .env
```

3. Update `.env` with your database connection string.

4. Run migrations:

```bash
bun run db:migrate
```

### Development

Start the development server:

```bash
bun run dev
```

The API will be available at `http://localhost:3000`

## API Endpoints

### Token Contracts

- `POST /tokens` - Onboard a new token contract (ABI + bytecode)
- `GET /tokens` - List all token contracts
- `GET /tokens/:id` - Get a specific token contract
- `DELETE /tokens/:id` - Delete a token contract

### Deployments

- `POST /deployments` - Deploy a token contract
- `GET /deployments` - List all deployments
- `GET /deployments/:id` - Get a specific deployment
- `GET /deployments/by-address/:address` - Get deployment by contract address

### Contract Interactions

All interaction endpoints use the contract address as the identifier: `/tokens/:address/*`

#### Write Functions

- `POST /tokens/:address/transfer` - Transfer tokens
- `POST /tokens/:address/approve` - Approve spender
- `POST /tokens/:address/transfer-from` - Transfer from approved address
- `POST /tokens/:address/mint` - Mint new tokens (owner only)
- `POST /tokens/:address/burn` - Burn tokens
- `POST /tokens/:address/add-to-allowlist` - Add address to allowlist (owner only)
- `POST /tokens/:address/remove-from-allowlist` - Remove from allowlist (owner only)
- `POST /tokens/:address/pause` - Pause contract (owner only)
- `POST /tokens/:address/unpause` - Unpause contract (owner only)

#### Read Functions

- `GET /tokens/:address/balance-of/:account` - Get token balance
- `GET /tokens/:address/allowance/:owner/:spender` - Get allowance
- `GET /tokens/:address/is-allowlisted/:account` - Check if address is allowlisted
- `GET /tokens/:address/allowlist-length` - Get allowlist length
- `GET /tokens/:address/allowlist-address/:index` - Get address at index
- `GET /tokens/:address/total-supply` - Get total supply
- `GET /tokens/:address/name` - Get token name
- `GET /tokens/:address/symbol` - Get token symbol
- `GET /tokens/:address/decimals` - Get token decimals
- `GET /tokens/:address/paused` - Check if contract is paused
- `GET /tokens/:address/owner` - Get contract owner

## Example Usage

### 1. Onboard Token Contract

```bash
curl -X POST http://localhost:3000/tokens \
  -H "Content-Type: application/json" \
  -d '{
    "name": "MyToken",
    "symbol": "MTK",
    "decimals": 18,
    "abi": [...],
    "bytecode": "0x..."
  }'
```

### 2. Deploy Contract

```bash
curl -X POST http://localhost:3000/deployments \
  -H "Content-Type: application/json" \
  -d '{
    "tokenContractId": "...",
    "name": "MyToken",
    "symbol": "MTK",
    "decimals": 18,
    "initialSupply": "1000000000000000000000000",
    "chainId": 31337,
    "rpcUrl": "http://localhost:8545",
    "privateKey": "0x..."
  }'
```

### 3. Transfer Tokens

Replace `:address` with the deployed contract address from step 2:

```bash
curl -X POST http://localhost:3000/tokens/0xYourContractAddress/transfer \
  -H "Content-Type: application/json" \
  -d '{
    "rpcUrl": "http://localhost:8545",
    "privateKey": "0x...",
    "to": "0x...",
    "value": "1000000000000000000"
  }'
```

### 4. Check Balance

```bash
curl "http://localhost:3000/tokens/0xYourContractAddress/balance-of/0xAccountAddress?rpcUrl=http://localhost:8545"
```

## Database Schema

### token_contracts

- `id` - Primary key
- `name` - Token name
- `symbol` - Token symbol
- `decimals` - Token decimals
- `abi` - Contract ABI (JSON)
- `bytecode` - Contract bytecode
- `created_at` - Timestamp
- `updated_at` - Timestamp

### deployments

- `id` - Primary key
- `token_contract_id` - Foreign key to token_contracts
- `contract_address` - Deployed contract address
- `chain_id` - Blockchain network ID
- `deployer_address` - Address that deployed the contract
- `transaction_hash` - Deployment transaction hash
- `initial_supply` - Initial token supply
- `deployed_at` - Timestamp
- `status` - Deployment status

### transactions

- `id` - Primary key
- `deployment_id` - Foreign key to deployments
- `transaction_hash` - Transaction hash
- `function_name` - Called function name
- `parameters` - Function parameters (JSON)
- `from_address` - Caller address
- `status` - Transaction status
- `gas_used` - Gas consumed
- `created_at` - Timestamp

## Supported Chains

- Ethereum Mainnet (Chain ID: 1)
- Sepolia Testnet (Chain ID: 11155111)
- Localhost/Anvil (Chain ID: 31337)

To add more chains, update the `chainMap` in the deployment and interaction routes.

## Scripts

- `bun run dev` - Start development server
- `bun run db:generate` - Generate database migrations
- `bun run db:migrate` - Run database migrations
- `bun run db:studio` - Open Drizzle Studio (database GUI)
