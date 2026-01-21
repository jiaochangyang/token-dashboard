# Quick Start Guide

## Prerequisites

1. **PostgreSQL Database**: You need a running PostgreSQL instance.

   Using Docker:
   ```bash
   docker run --name postgres -e POSTGRES_PASSWORD=postgres -p 5432:5432 -d postgres
   ```

   Or install locally via Homebrew (macOS):
   ```bash
   brew install postgresql
   brew services start postgresql
   createdb token_dashboard
   ```

2. **Anvil** (for local testing):
   ```bash
   # Install foundry if not already installed
   curl -L https://foundry.paradigm.xyz | bash
   foundryup
   
   # Start local blockchain
   anvil
   ```

## Setup Steps

### 1. Install Dependencies

```bash
cd backend
bun install
```

### 2. Configure Environment

```bash
cp .env.example .env
```

Edit `.env` if needed (default uses localhost PostgreSQL).

### 3. Run Database Migrations

```bash
bun run db:migrate
```

### 4. Build Smart Contract

Make sure MyToken is compiled:

```bash
cd ../smartcontract
forge build
cd ../backend
```

### 5. Start the API Server

```bash
bun run dev
```

The API will be running at `http://localhost:3000`

## Usage Examples

### Step 1: Onboard MyToken Contract

Use the helper script:

```bash
bun run onboard:mytoken
```

This will output a `tokenContractId` - save this for the next step.

Or manually via curl:

```bash
curl -X POST http://localhost:3000/tokens \
  -H "Content-Type: application/json" \
  -d @- << 'EOF'
{
  "name": "MyToken",
  "symbol": "MTK",
  "decimals": 18,
  "abi": [...],
  "bytecode": "0x..."
}
EOF
```

### Step 2: Deploy the Contract

Replace `YOUR_TOKEN_CONTRACT_ID` and `YOUR_PRIVATE_KEY`:

```bash
curl -X POST http://localhost:3000/deployments \
  -H "Content-Type: application/json" \
  -d '{
    "tokenContractId": "YOUR_TOKEN_CONTRACT_ID",
    "name": "MyToken",
    "symbol": "MTK",
    "decimals": 18,
    "initialSupply": "1000000000000000000000000",
    "chainId": 31337,
    "rpcUrl": "http://localhost:8545",
    "privateKey": "0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80"
  }'
```

**Note**: The private key above is Anvil's default account #0. Never use this in production!

Save the returned `contractAddress` from the response - you'll use this to interact with the token.

### Step 3: Add Addresses to Allowlist

Replace `CONTRACT_ADDRESS` with the deployed contract address from step 2:

```bash
curl -X POST http://localhost:3000/tokens/CONTRACT_ADDRESS/add-to-allowlist \
  -H "Content-Type: application/json" \
  -d '{
    "rpcUrl": "http://localhost:8545",
    "privateKey": "0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80",
    "account": "0x70997970C51812dc3A010C7d01b50e0d17dc79C8"
  }'
```

### Step 4: Transfer Tokens

```bash
curl -X POST http://localhost:3000/tokens/CONTRACT_ADDRESS/transfer \
  -H "Content-Type: application/json" \
  -d '{
    "rpcUrl": "http://localhost:8545",
    "privateKey": "0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80",
    "to": "0x70997970C51812dc3A010C7d01b50e0d17dc79C8",
    "value": "1000000000000000000"
  }'
```

### Step 5: Check Balance

```bash
curl "http://localhost:3000/tokens/CONTRACT_ADDRESS/balance-of/0x70997970C51812dc3A010C7d01b50e0d17dc79C8?rpcUrl=http://localhost:8545"
```

### Step 6: Check if Address is Allowlisted

```bash
curl "http://localhost:3000/tokens/CONTRACT_ADDRESS/is-allowlisted/0x70997970C51812dc3A010C7d01b50e0d17dc79C8?rpcUrl=http://localhost:8545"
```

## Testing with Anvil

Anvil provides 10 test accounts with private keys. Here are the first three:

1. **Account #0** (Deployer - automatically allowlisted):
   - Address: `0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266`
   - Private Key: `0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80`

2. **Account #1**:
   - Address: `0x70997970C51812dc3A010C7d01b50e0d17dc79C8`
   - Private Key: `0x59c6995e998f97a5a0044966f0945389dc9e86dae88c7a8412f4603b6b78690d`

3. **Account #2**:
   - Address: `0x3C44CdDdB6a900fa2b585dd299e03d12FA4293BC`
   - Private Key: `0x5de4111afa1a4b94908f83103eb1f1706367c2e68ca870fc3fb9a804cdab365a`

## Database Management

### View Database with Drizzle Studio

```bash
bun run db:studio
```

This opens a web UI at `https://local.drizzle.studio` to view and edit your database.

### Reset Database

If you need to reset everything:

```bash
# Drop all tables
psql -d token_dashboard -c "DROP SCHEMA public CASCADE; CREATE SCHEMA public;"

# Re-run migrations
bun run db:migrate
```

## API Documentation

Visit `http://localhost:3000` to see available endpoints.

For full API documentation, see [README.md](./README.md).

## Troubleshooting

### Database Connection Error

Ensure PostgreSQL is running:
```bash
pg_isready
```

Check your `DATABASE_URL` in `.env`.

### Contract Deployment Fails

1. Make sure Anvil is running
2. Verify the RPC URL is correct (`http://localhost:8545` for Anvil)
3. Check that the private key has enough ETH

### Transaction Fails: "NotAllowlisted"

Both sender and recipient must be on the allowlist. Use the `/interact/add-to-allowlist` endpoint first.

### Cannot Read Contract

Verify:
1. The deployment exists and was successful
2. The RPC URL is correct
3. The contract address matches the deployment
