# Token Dashboard Frontend

A React-based dashboard for viewing and managing ERC20 token deployments.

## Features

- **Token List View**: Browse all deployed tokens with key information
- **Token Detail View**: Comprehensive token details including:
  - Contract information (address, chain, deployer, owner)
  - Token metadata (name, symbol, decimals, total supply)
  - Allowlisted addresses with their balances
  - Transaction history

## Getting Started

### Prerequisites

- Bun runtime installed
- Backend API server running on `http://localhost:3000`

### Installation

```bash
cd frontend
bun install
```

### Development

Start the development server:

```bash
bun dev
```

The app will be available at `http://localhost:5173`

### Build for Production

```bash
bun run build
```

Preview the production build:

```bash
bun run preview
```

## Project Structure

```
src/
├── api.ts              # API client for backend communication
├── types.ts            # TypeScript type definitions
├── pages/
│   ├── TokensPage.tsx       # Token list page
│   └── TokenDetailPage.tsx  # Token detail page
├── App.tsx             # Main app component with routing
├── App.css             # Component styles
├── index.css           # Global styles
└── main.tsx            # App entry point
```

## API Integration

The frontend connects to the backend API at `http://localhost:3000` and uses the following endpoints:

- `GET /deployments` - Get all token deployments
- `GET /deployments/:id` - Get deployment by ID
- `GET /deployments/by-address/:address` - Get deployment by contract address
- `GET /transactions` - Get all transactions
- `GET /transactions/by-deployment/:deploymentId` - Get transactions for a deployment
- `GET /tokens/:address/*` - Various token read operations (name, symbol, balance, etc.)

## Technologies Used

- **React 19** - UI framework
- **TypeScript** - Type safety
- **React Router 7** - Client-side routing
- **Vite 7** - Build tool and dev server
- **Bun** - Package manager and runtime

## Supported Networks

The dashboard supports the following networks:

- Ethereum Mainnet (Chain ID: 1)
- Sepolia Testnet (Chain ID: 11155111)
- Localhost (Chain ID: 31337)

## Styling

The app uses vanilla CSS with:

- Responsive design for mobile and desktop
- Dark mode support via `prefers-color-scheme`
- Reduced motion support for accessibility
- Clean, modern card-based UI
