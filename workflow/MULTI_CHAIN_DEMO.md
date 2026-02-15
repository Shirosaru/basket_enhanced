# Multi-Chain Demo & Tutorial

This quick tutorial shows a minimal, hands-on demo for registering chains and assets, creating a multi-chain basket, and triggering a mint that flows through the workflow and (optionally) a CCIP bridge.

Prerequisites
- Repository root: run `npm run install:all` once to install workspace deps.
- Backend service running (default port `3001`) and workflow (runtime or compiled `dist/main.js`) running (default port `3000`).
- Edit `config.json` in this workspace when needed: see [workflow/config.json](workflow/config.json#L1).

Endpoints used in examples
- Backend chain/asset APIs: http://localhost:3001
- Workflow HTTP trigger: http://localhost:3000/trigger

Notes
- Replace `X-API-Key` values and RPC URLs with your environment values.
- These are minimal examples to get you started; production workflows require secure key handling, retry logic, and monitoring.

1) Start services

From the repo root:

```bash
# install once
npm run install:all

# start backend (from root workspace scripts)
npm run dev:backend

# compile/watch workflow (or run built dist)
npm run dev:workflow
# OR
npm run build:workflow && node workflow/dist/main.js
```

2) Register two chains (example: Ethereum and Polygon)

```bash
curl -X POST http://localhost:3001/chains/register \
  -H "Content-Type: application/json" \
  -H "X-API-Key: my-demo-key" \
  -d '{
    "id": "ethereum-mainnet",
    "name": "ethereum",
    "displayName": "Ethereum Mainnet",
    "chainId": 1,
    "rpcUrl": "https://eth-mainnet.example.rpc/",
    "explorerUrl": "https://etherscan.io",
    "isTestnet": false,
    "nativeCurrency": {"name":"Ether","symbol":"ETH","decimals":18}
  }'

curl -X POST http://localhost:3001/chains/register \
  -H "Content-Type: application/json" \
  -H "X-API-Key: my-demo-key" \
  -d '{
    "id": "polygon-mainnet",
    "name": "polygon",
    "displayName": "Polygon Mainnet",
    "chainId": 137,
    "rpcUrl": "https://polygon.example.rpc/",
    "explorerUrl": "https://polygonscan.com",
    "isTestnet": false,
    "nativeCurrency": {"name":"Matic","symbol":"MATIC","decimals":18}
  }'
```

3) Register a multi-chain asset (stablecoin example)

```bash
curl -X POST http://localhost:3001/multichain/assets/register \
  -H "Content-Type: application/json" \
  -H "X-API-Key: my-demo-key" \
  -d '{
    "id": "DUSD",
    "type": "monetary",
    "name": "Demo USD",
    "symbol": "DUSD",
    "defaultChain": "ethereum-mainnet",
    "chains": {
      "ethereum-mainnet": {"contractAddress":"0x1111111111111111111111111111111111111111","decimals":6},
      "polygon-mainnet":  {"contractAddress":"0x2222222222222222222222222222222222222222","decimals":6}
    }
  }'
```

4) Create a multi-chain basket that uses that asset

```bash
curl -X POST http://localhost:3001/multichain/baskets \
  -H "Content-Type: application/json" \
  -H "X-API-Key: my-demo-key" \
  -d '{
    "id": "bUSD",
    "name": "Basket USD",
    "symbol": "bUSD",
    "supportedChains": ["ethereum-mainnet","polygon-mainnet"],
    "defaultChain": "ethereum-mainnet",
    "assets": [{"assetId":"DUSD","weight":100}]
  }'
```

5) Trigger a mint via the workflow (HTTP trigger)

Example payload stored in this workspace: [workflow/http_trigger_payload.json](workflow/http_trigger_payload.json#L1).

Here is an example inline payload — this requests a mint on `ethereum-mainnet` for `bUSD`:

```bash
curl -X POST http://localhost:3000/trigger \
  -H "Content-Type: application/json" \
  -d '{
    "mintId":"mint-demo-001",
    "basketId":"bUSD",
    "chainId":"ethereum-mainnet",
    "beneficiary":"0xYourBeneficiaryAddress",
    "amount":"1000000",
    "transactionId":"TX-12345",
    "metadata": { "note": "demo mint" }
  }'
```

What happens:
- Workflow validates payload and POR (if configured).
- Workflow triggers ACE events and calls the minting consumer on the selected chain.
- If the basket is cross-chain and CCIP bridging is configured, the workflow can call CCIP to bridge minted assets or messages to the `polygon-mainnet` chain.

6) Verify results

- Check backend mint records:

```bash
curl http://localhost:3001/multichain/mints/mint-demo-001 -H "X-API-Key: my-demo-key"
```

- Check middleware logs and workflow logs; CCIP bridging will produce a tx/log you can inspect on the chain explorer configured for the destination chain.

Troubleshooting & next steps
- If you don't see `dist/main.js` after `npm run build:workflow`, confirm the `main.ts` entry and TypeScript config in [workflow/tsconfig.json](workflow/tsconfig.json#L1).
- To test bridging without real on-chain transactions, stub RPC endpoints or use testnets and mock contract addresses.
- To automate this demo, wrap the curl calls in a script and add small delays to allow operations to finish.

Want me to add this demo content into the `workflow/README.md` as a short guide and/or run the demo steps against your local services now? If you want I can also create a small script to perform the registration + demo mint automatically.
