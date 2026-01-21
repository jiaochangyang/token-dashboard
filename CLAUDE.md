# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Repository Structure

This is a monorepo for a token dashboard application with three main components:

- **smartcontract/** - Foundry-based Solidity smart contracts for EVM
- **frontend/** - React + TypeScript application built with Vite
- **backend/** - Elysia API server running on Bun

Each component is independent with its own dependencies and tooling.

## Development Commands

### Smart Contracts (smartcontract/)

All Foundry commands must be run from within the `smartcontract/` directory:

```bash
cd smartcontract
forge build                 # Compile contracts
forge test                  # Run all tests
forge test -vv              # Run tests with verbose output
forge test --match-test testFunctionName  # Run specific test
forge fmt                   # Format Solidity code
forge snapshot              # Generate gas snapshots
anvil                       # Start local Ethereum node
```

Deploy a contract:
```bash
forge script script/Counter.s.sol:CounterScript --rpc-url <rpc_url> --private-key <private_key>
```

### Frontend (frontend/)

The frontend uses Bun as the package manager and runtime:

```bash
cd frontend
bun dev                     # Start development server
bun run build               # Build for production (runs TypeScript check + Vite build)
bun run lint                # Run ESLint
bun run preview             # Preview production build
```

### Backend (backend/)

The backend is an Elysia server using Bun:

```bash
cd backend
bun run dev                 # Start development server with hot reload (port 3000)
```

## Architecture Notes

- **Package Manager**: The project uses Bun for both frontend and backend. Do not use npm or yarn.
- **Smart Contract Library**: Uses forge-std (installed as git submodule in smartcontract/lib/)
- **Frontend Framework**: React 19 with TypeScript, using Vite 7 as build tool
- **Backend Framework**: Elysia web framework optimized for Bun runtime
- **Solidity Version**: ^0.8.13 (see smartcontract/src/Counter.sol)

## Key Files

- `smartcontract/foundry.toml` - Foundry configuration
- `frontend/vite.config.ts` - Vite build configuration
- `frontend/tsconfig.json` - TypeScript configuration for frontend
- `backend/src/index.ts` - Backend entry point
