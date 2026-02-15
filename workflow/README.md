# Bank Stablecoin POR ACE CCIP Workflow

Enhanced CRE workflow integrating:
- **POR**: Proof of Reserve verification
- **ACE**: Actionable Cryptographic Events
- **CCIP**: Cross-Chain Interoperability Protocol
- **Multi-Chain**: Support for multiple blockchain networks
- **Multi-Asset**: Support for various asset types

## Architecture

```
HTTP Request
    ↓
Parse & Validate Payload
    ↓
Verify Proof of Reserve (POR)
    ↓
Trigger ACE Events
    ↓
Execute Multi-Asset Mint
    ↓
Process CCIP Bridge (if cross-chain)
    ↓
Return Status & Confirmations
```

## Configuration

# Bank Stablecoin POR ACE CCIP Workflow

Enhanced CRE workflow integrating:

- **POR**: Proof of Reserve verification
- **ACE**: Actionable Cryptographic Events
- **CCIP**: Cross-Chain Interoperability Protocol
- **Multi-Chain**: Support for multiple blockchain networks
- **Multi-Asset**: Support for various asset types

## Architecture

```
HTTP Request
    ↓
Parse & Validate Payload
    ↓
Verify Proof of Reserve (POR)
    ↓
Trigger ACE Events
    ↓
Execute Multi-Asset Mint
    ↓
Process CCIP Bridge (if cross-chain)
    ↓
Return Status & Confirmations
```

## Configuration

Edit `config.json` to set:

- Chain RPC endpoints
- Stablecoin contract addresses
- Minting consumer addresses
- POR API URL

## Usage

Notes:

- From the repository root this workspace is available as `workflow` in the npm workspace. Many project-level scripts are defined in the repo root `package.json`.
- The `dev` script for this workspace runs `tsc --watch` (compiles TypeScript in watch mode). To execute the workflow runtime you should build and run the compiled output.

Recommended (from repo root):

```bash
# Install all workspaces once
npm run install:all

# Compile workflow in watch mode
npm run dev:workflow

# Build workflow (output -> workflow/dist)
npm run build:workflow
```

Directly inside the `workflow` folder:

```bash
cd workflow
npm install
npm run dev       # runs `tsc --watch`
npm run build     # compiles to `dist/`

# after build, run the compiled entry (if present)
node dist/main.js

#run frontend and backend
npm run dev:all

```


There is no test script bundled in this workspace; use the backend workspace tests via the repo root (`npm run test`) if needed.

## HTTP Trigger

Send mint requests to the workflow (example):

```bash
curl -X POST http://localhost:3000/trigger \
  -H "Content-Type: application/json" \
  -d @http_trigger_payload.json
```

## Features

- ✅ Multi-chain minting
- ✅ Multi-asset support
- ✅ Proof of Reserve verification
- ✅ ACE event triggers
- ✅ CCIP bridge integration
- ✅ Real-time logging
- ✅ Error handling and retry logic

## Notes

- If you want a long-running process that both compiles and executes TypeScript directly, add a runner (e.g. `ts-node` or a small `node` entry) to the workspace `package.json`.
- If `dist/main.js` is not present after `npm run build`, check the `main.ts` entry point and the compiled output path.

For more project-level commands see the root [package.json](../package.json).

## Multi-Chain Demo

A short hands-on tutorial is available: [Multi-Chain Demo & Tutorial](MULTI_CHAIN_DEMO.md#L1).
