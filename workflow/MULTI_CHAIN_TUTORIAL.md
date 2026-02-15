# Multi-Chain Tutorial — Quick Start

This short tutorial walks through registering chains and assets, creating a multi-chain basket, and triggering a mint via the workflow HTTP trigger. It uses the local backend (default port 3001) and workflow (default port 3000) included in this repository.

**Prerequisites**
- **Backend**: running on `http://localhost:3001` (see backend startup in repo README).
- **Workflow**: running on `http://localhost:3000` (run compiled `dist/main.js` or the runtime during development).
- **Config**: edit the runtime config in [workflow/config.json](workflow/config.json#L1) or ensure the selected environment block (e.g., `staging-settings`) is loaded by your runtime.
- Replace API keys and RPC URLs with your real values.

**Files**
- **Payload example**: [workflow/http_trigger_payload.json](workflow/http_trigger_payload.json#L1)
- **Demo commands**: this file contains the curl commands used in the quick demo.

**1) Start services**
From the repository root:

```bash
# install deps once
npm run install:all

# start backend
npm run dev:backend

# run workflow (dev mode) or built dist
npm run dev:workflow
# OR
npm run build:workflow && node workflow/dist/main.js
```

**2) Register chains**
Register Ethereum and Polygon on the backend. Replace `my-demo-key` with your `X-API-Key`.

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

**3) Register a multi-chain asset**
Register a stablecoin mapped to both chains.

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

**4) Create a multi-chain basket**

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

**5) Trigger a mint via the workflow HTTP trigger**
Use the example payload in [workflow/http_trigger_payload.json](workflow/http_trigger_payload.json#L1) or the inline example below. This requests a mint on `ethereum-mainnet`.

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
- The workflow validates the payload schema.
- The workflow performs POR checks if configured ([`onVerifyPOR`](workflow/main.ts#L1)).
- The workflow encodes the mint call and submits the transaction to the configured chain.
- If CCIP bridging is configured, the workflow can bridge assets/messages to the destination chain.

**6) Verify results**

```bash
curl http://localhost:3001/multichain/mints/mint-demo-001 -H "X-API-Key: my-demo-key"
```

The response contains mint state, transaction hashes, and timestamps.

**Notes, gotchas & tips**
- Amount scaling: amounts in the HTTP payload are human-readable and must be scaled by token decimals before calling `mint` on-chain. The workflow now scales using the `decimals` value (global `decimals` in config or per-asset `chains[...] .decimals`).
- Config selection: `workflow/config.json` contains environment blocks (`staging-settings`, `production-settings`). Ensure the runtime loads the correct block (or flatten the config to top-level `chains`).
- Gas price: prefer providing `gasPrice` or querying the provider; avoid magic constants.
- Dry-run: run `node workflow/scripts/dry_run_mint.ts` to print scaled amounts and simulated tx hashes.

**Next steps / automation**
- Wrap these curl calls into a script to automate the demo with small delays.
- Use testnets or stub RPCs for safe testing.
- Add monitoring and retry logic around the workflow `submit()` for production resilience.

If you want, I can add a one-click demo script that performs steps 2–5 automatically against a local dev environment.
