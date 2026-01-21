# Token Dashboard - Running Stack

The entire stack is now running and ready for use!

## Running Services

### 1. Anvil (Local Blockchain)
- **URL**: `http://localhost:8545`
- **Chain ID**: 31337
- **Status**: ✅ Running in background

**Test Accounts Available:**
```
Account #0: 0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266
Private Key: 0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80

Account #1: 0x70997970C51812dc3A010C7d01b50e0d17dc79C8
Private Key: 0x59c6995e998f97a5a0044966f0945389dc9e86dae88c7a8412f4603b6b78690d

...and 8 more accounts (see terminal output)
```

### 2. Backend API Server
- **URL**: `http://localhost:3000`
- **Status**: ✅ Running in background with hot reload
- **Framework**: Elysia (Bun)

**Available API Endpoints:**
- `GET /deployments` - List all deployments
- `GET /deployments/:id` - Get deployment by ID
- `GET /deployments/by-address/:address` - Get deployment by address
- `GET /transactions` - List all transactions
- `GET /transactions/by-deployment/:id` - Get transactions by deployment
- `GET /token-contracts` - List token contracts
- `POST /deployments` - Deploy a new token
- `POST /tokens/:address/*` - Token write operations (transfer, mint, etc.)
- `GET /tokens/:address/*` - Token read operations (balance, allowance, etc.)

### 3. Frontend Dashboard
- **URL**: `http://localhost:5173`
- **Status**: ✅ Running in background with HMR
- **Framework**: React 19 + Vite 7

## Configured Accounts in Backend

The backend has the following accounts configured in `.env`:

```
DEPLOYER_PRIVATE_KEY - Used for contract deployments
A1 - Account 1 (0x750184f026a44d2dD63788569F75898d2fa96Ec6)
A2 - Account 2 (0x1C74298b6005881A41861572067aA124E066362e)
A3 - Account 3 (0x8A999CF05e21DB1D45f12C72Bd18D65A58b75c74)
```

## Getting Started

### 1. Access the Dashboard
Open your browser and navigate to: **http://localhost:5173**

You should see the Token Dashboard landing page.

### 2. Deploy a Test Token (Using API)

Deploy a token to see it in the dashboard:

```bash
curl -X POST http://localhost:3000/deployments \
  -H "Content-Type: application/json" \
  -d '{
    "tokenContractId": "YOUR_TOKEN_CONTRACT_ID",
    "name": "My Test Token",
    "symbol": "MTT",
    "decimals": 18,
    "initialSupply": "1000000000000000000000",
    "chainId": 31337,
    "rpcUrl": "http://localhost:8545"
  }'
```

**Note**: You need to have a token contract in the database first. Check available contracts:
```bash
curl http://localhost:3000/token-contracts
```

### 3. View Tokens
Once you deploy a token, refresh the dashboard to see it appear in the grid.

### 4. Click on a Token
Click any token card to view detailed information including:
- Contract information
- Token details (name, symbol, decimals, total supply)
- Allowlisted addresses and their balances
- Transaction history

## Stopping the Stack

To stop all running services:

```bash
# Stop Anvil
pkill -f anvil

# Stop backend
pkill -f "bun run dev"

# Stop frontend (or just Ctrl+C in the terminal)
pkill -f "vite"
```

Or use the task management commands:
```bash
/tasks         # List all running tasks
```

## Troubleshooting

### Port Already in Use
If you get "address already in use" errors:
```bash
# Kill existing processes
pkill -f anvil
pkill -f "bun run dev"
pkill -f vite
```

### Database Connection Issues
Make sure PostgreSQL is running:
```bash
# Check if PostgreSQL is running
pg_isready

# If not, start it (macOS with Homebrew)
brew services start postgresql
```

### Frontend Can't Connect to Backend
Check that the backend is running and accessible:
```bash
curl http://localhost:3000/deployments
```

## Development Workflow

1. **Smart Contracts**: Develop in `smartcontract/src/`
   - Compile: `cd smartcontract && forge build`
   - Test: `forge test`

2. **Backend**: Develop in `backend/src/`
   - Hot reload is enabled - changes auto-refresh

3. **Frontend**: Develop in `frontend/src/`
   - HMR (Hot Module Replacement) is enabled - changes reflect instantly

## Next Steps

- Deploy some test tokens using the API
- Interact with tokens (transfer, mint, etc.)
- Add more features to the frontend
- Deploy to a testnet (Sepolia)

Enjoy exploring your token dashboard! 🚀
