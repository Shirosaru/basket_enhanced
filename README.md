# Basket Enhanced v2.1

Production-ready DeFi basket minting system with multi-chain support, real-time tracking, and Chainlink integration.

## Quick Start

### Prerequisites
- Node.js 18+
- npm/yarn

### Setup

```bash
# Install dependencies
npm install

# Configure environment
cp .env.example .env
# Edit .env and add your API keys, RPC URLs, and contract addresses
```

### Run

```bash
# Terminal 1: Backend API (port 3001)
npm run dev --workspace=backend

# Terminal 2: Frontend UI (port 3000)  
npm run dev --workspace=frontend

# Terminal 3: Mock POR Server (optional, port 4000)
node -e "const http=require('http');http.createServer((r,s)=>{s.writeHead(200,{'Content-Type':'application/json'});s.end(JSON.stringify({verified:true,por:{reserve:1000000000}}))}).listen(4000,()=>console.log('Mock POR on :4000'))"

# Or all at once
npm run dev
```

Open **http://localhost:3000** in your browser.

## Configuration

Edit `.env` with your settings:

```dotenv
# Backend
PORT=3001
VALID_API_KEYS=your-api-key
CRE_PROJECT_ROOT=/path/to/basket_enhanced
CRE_WORKFLOW_PATH=/path/to/basket_enhanced/workflow

# Blockchain RPC endpoints
ETH_RPC_URL=https://eth-mainnet.g.alchemy.com/v2/YOUR_KEY
POLYGON_RPC_URL=https://polygon-rpc.com
ARBITRUM_RPC_URL=https://arb1.arbitrum.io/rpc

# Contract Addresses (see .env.example)
STABLECOIN_ADDRESS_ETH=0x...
MINTING_CONSUMER_ADDRESS_ETH=0x...
STABLECOIN_ADDRESS_POLYGON=0x...
MINTING_CONSUMER_ADDRESS_POLYGON=0x...
STABLECOIN_ADDRESS_ARBITRUM=0x...
MINTING_CONSUMER_ADDRESS_ARBITRUM=0x...

# POR APIs
POR_API_URL_STAGING=https://your-por-api.com/verify
POR_API_URL_PRODUCTION=https://prod-por-api.com/verify
```

Edit `frontend/.env`:

```dotenv
NEXT_PUBLIC_API_URL=http://localhost:3001
NEXT_PUBLIC_WALLET_CONNECT_ID=your_wallet_connect_id
NEXT_PUBLIC_BASKET_FACTORY_ETHEREUM=0x...
# See frontend/.env.example for all chain addresses
```

## Features

- ✅ **Multi-Chain Support** — Ethereum, Polygon, Arbitrum, and more
- ✅ **Basket Minting** — Create and mint baskets with custom assets
- ✅ **Real-Time Tracking** — Live mint status and history
- ✅ **Proof of Reserve** — Chainlink oracle integration
- ✅ **Asset Management** — Multiple asset types (monetary, NFT, digital, physical-backed)
- ✅ **Dynamic Configuration** — Add chains and assets via API

## API Endpoints

### Health Check
```bash
GET /health
```

### Chains
```bash
# Register a new chain
POST /chains/register
Header: X-API-Key: <your-key>

# List chains
GET /chains
Header: X-API-Key: <your-key>
```

### Assets (Multi-Chain)
```bash
# Register multi-chain asset
POST /multichain/assets/register
Header: X-API-Key: <your-key>

# Get asset
GET /multichain/assets/:assetId

# List assets
GET /multichain/assets
```

### Baskets (Multi-Chain)
```bash
# Create basket
POST /multichain/baskets
Header: X-API-Key: <your-key>

# Get basket
GET /multichain/baskets/:basketId

# List baskets by chain
GET /multichain/baskets/by-chain/:chainId
```

### Minting
```bash
# Request mint
POST /multichain/mints
Header: X-API-Key: <your-key>
Content-Type: application/json

# Get mint status
GET /multichain/mints/:mintId

# Get mint history by beneficiary
GET /multichain/mints/beneficiary/:address

# Get basket statistics
GET /multichain/mints/basket/:basketId
```

For complete API documentation, see [docs/API_REFERENCE.md](docs/API_REFERENCE.md).

## Architecture

```
backend/           TypeScript backend with express
├── src/
│   ├── types/              Type definitions
│   ├── middleware/         Authentication
│   ├── services/           Business logic
│   ├── routes/             API endpoints
│   └── index.ts
├── data/                   Persistent JSON storage
└── package.json

frontend/          Next.js React frontend
├── src/
│   ├── app/                Pages and layout
│   ├── components/         React components
│   ├── config/             Wagmi and contract configs
│   ├── hooks/              Custom hooks
│   ├── lib/                Utilities
│   └── types/              Type definitions
└── package.json

contracts/         Solidity smart contracts
├── src/                    Contract source code
└── script/                 Deployment scripts

workflow/          Chainlink CRE workflow
├── src/                    Workflow logic
├── scripts/                Utility scripts
└── config.json             Environment-based config
```

## Data Storage

All data is persisted locally:
- **Backend**: `backend/data/` (JSON files)
- **Backups**: `~/.basket-enhanced/` (timestamped)

## Development

```bash
# Watch and rebuild
npm run build
npm run dev

# Linting
npm run lint

# Type checking
npm run type-check
```

## Environment Variables

See `.env.example` for all available configuration options. At minimum, set:
- `VALID_API_KEYS` - API authentication
- `ETH_RPC_URL`, `POLYGON_RPC_URL`, etc. - Blockchain endpoints
- Stablecoin and minting consumer addresses for each chain
- `POR_API_URL_STAGING` and `POR_API_URL_PRODUCTION` - POR verification endpoints

## Supported Chains

**Mainnets:**
- Ethereum (1)
- Polygon (137)
- Arbitrum One (42161)
- Optimism (10)
- Base (8453)
- Avalanche C-Chain (43114)

**Testnets:**
- Ethereum Sepolia (11155111)
- Polygon Amoy (80002)
- Arbitrum Sepolia (421614)

Custom chains can be registered via the `/chains/register` API.

## Security

⚠️ **Important:**
- Never commit `.env` files — use `.env.example` as a template
- Store private keys and API keys in environment variables only
- Use strong API key authentication in production
- See [docs/SECURITY_CHECKLIST.md](docs/SECURITY_CHECKLIST.md) for full security guidelines

## Troubleshooting

**Port already in use:**
```bash
# Kill process on port 3001 (backend)
lsof -ti:3001 | xargs kill -9

# Kill process on port 3000 (frontend)
lsof -ti:3000 | xargs kill -9
```

**Missing environment variables:**
```bash
# Check your .env file has all required variables
cat .env.example
```

**Build errors:**
```bash
# Clear build cache
rm -rf dist build .next

# Reinstall dependencies
npm ci
npm run build
```

## Additional Resources

- [Demo Guide](docs/DEMO.md) — Walkthrough of features
- [API Reference](docs/API_REFERENCE.md) — Detailed API documentation
- [Architecture](docs/ARCHITECTURE.md) — System design and structure
- [Security Checklist](docs/SECURITY_CHECKLIST.md) — Security best practices

## License

See LICENSE file for details.


**Get Multi-Chain Mint Record**
```bash
GET /multichain/mints/:mintId
X-API-Key: <key>
```

**Get Mints by Chain**
```bash
GET /multichain/mints/chain/:chainId
X-API-Key: <key>
```

**Get Cross-Chain Basket Statistics**
```bash
GET /multichain/mints/basket/:basketId
X-API-Key: <key>

Response:
{
  "basketId": "bUSD",
  "totalMints": 10,
  "completedMints": 8,
  "failedMints": 1,
  "pendingMints": 1,
  "totalMinted": "8000",
  "chainsActive": 2,
  "byChain": {
    "ethereum-mainnet": { "count": 5, "totalAmount": "5000" },
    "polygon-mainnet": { "count": 3, "totalAmount": "3000" }
  }
}
```

**Get Beneficiary Cross-Chain Statistics**
```bash
GET /multichain/mints/beneficiary/:address
X-API-Key: <key>

Response:
{
  "beneficiary": "0x...",
  "totalMints": 15,
  "completedMints": 12,
  "byChain": {
    "ethereum-mainnet": { "count": 5, "totalAmount": "5000" },
    "polygon-mainnet": { "count": 7, "totalAmount": "7000" }
  },
  "assetTotals": [
    {
      "assetId": "DUSD",
      "symbol": "DUSD",
      "totalAmount": "8400",
      "chainsActive": ["ethereum-mainnet", "polygon-mainnet"]
    }
  ]
}
```

**List All Multi-Chain Mints**
```bash
GET /multichain/mints
X-API-Key: <key>
```

### Assets Management (Single-Chain - v2.0 Compatible)

**Create Basket**
```bash
POST /baskets
X-API-Key: <key>
Content-Type: application/json

{
  "id": "bUSD",
  "name": "Basket USD",
  "symbol": "bUSD",
  "assets": [
    { "assetId": "DUSD", "weight": 60, "proportion": "60%" },
    { "assetId": "AUDT", "weight": 40, "proportion": "40%" }
  ]
}
```

**Get Basket**
```bash
GET /baskets/:basketId
X-API-Key: <key>
```

**Expand Basket (Preview)**
```bash
POST /baskets/:basketId/expand
X-API-Key: <key>
Content-Type: application/json

{
  "amount": "1000"
}
```

**List All Baskets**
```bash
GET /baskets
X-API-Key: <key>
```

### Minting Operations

**Initiate Mint**
```bash
POST /mints
X-API-Key: <key>
Content-Type: application/json

{
  "basketId": "bUSD",
  "beneficiary": "0x1234567890123456789012345678901234567890",
  "amount": "1000",
  "assetTypeFilter": "monetary"  # optional: filter by asset type
}
```

**Get Mint Status**
```bash
GET /mints/status/:transactionId
X-API-Key: <key>
```

**Get Mints by Beneficiary**
```bash
GET /mints/beneficiary/:address
X-API-Key: <key>
```

**Get Basket Statistics**
```bash
GET /mints/basket/:basketId
X-API-Key: <key>
```

**List All Mints**
```bash
GET /mints
X-API-Key: <key>
```

## Data Models

### Asset
```typescript
{
  id: string;
  type: 'monetary' | 'digital-asset' | 'nft' | 'physical-backed' | 'custom';
  name: string;
  symbol: string;
  decimals: number;
  contractAddress: string;
  metadata?: Record<string, any>;
  createdAt: string;
  updatedAt: string;
}
```

### Basket
```typescript
{
  id: string;
  name: string;
  symbol: string;
  assets: BasketAsset[];
  status: 'active' | 'paused' | 'deprecated';
  createdAt: string;
  updatedAt: string;
}
```

### MintRecord (Real-time Tracking)
```typescript
{
  id: string;
  basketId: string;
  transactionId: string;
  beneficiary: string;
  amount: string;
  assets: MintedAsset[];          // Captures exact assets minted
  status: 'pending' | 'completed' | 'failed';
  createdAt: string;
  completedAt?: string;
  error?: string;
}
```

## Persistent Storage

All data is automatically persisted and backed up:

- **Primary Storage**: `data/assets.json`, `data/baskets.json`, `data/mints.json`
- **Backups**: `~/.basket-enhanced/` (timestamped)

## Real-Time Minting Flow

1. **Request Received**: Mint request validated and logged
2. **State Captured**: MintRecord created immediately with asset breakdown
3. **Workflow Triggered**: CRE workflow executes with multi-asset payload
4. **Status Updated**: MintRecord updated with completion status
5. **Audit Trail**: Full history maintained in persistent storage

## Improvements Over v1.0

| Feature | v1.0 | v2.0 | v2.1 |
|---------|------|------|------|
| Asset Types | Stablecoins only | 5+ types | 5+ types |
| Minting Tracking | Hardcoded | Real-time persistent | Real-time persistent |
| Automation | Manual config | Dynamic registry | Dynamic registry |
| Basket Composition | Fixed | Weighted + dynamic | Weighted + dynamic |
| Audit Trail | Basic logging | Full state tracking | Full state tracking |
| Non-Monetary Assets | ❌ | ✅ | ✅ |
| Multi-Chain Support | ❌ | ❌ | ✅ |
| Cross-Chain Baskets | ❌ | ❌ | ✅ |
| Chain Registry | ❌ | ❌ | ✅ |
| Plug & Play Chains | ❌ | ❌ | ✅ |

## Multi-Chain Examples

### Example 1: Add New Chain

```bash
# Register a new chain (e.g., Fantom)
curl -X POST http://localhost:3001/chains/register \
  -H "X-API-Key: your-key" \
  -H "Content-Type: application/json" \
  -d '{
    "id": "fantom-mainnet",
    "name": "custom",
    "displayName": "Fantom",
    "chainId": 250,
    "rpcUrl": "https://rpc.ftm.tools",
    "explorerUrl": "https://ftmscan.com",
    "nativeCurrency": {
      "name": "Fantom",
      "symbol": "FTM",
      "decimals": 18
    },
    "isTestnet": false
  }'

# Add existing assets to Fantom
curl -X POST http://localhost:3001/multichain/assets/DUSD/add-chain \
  -H "X-API-Key: your-key" \
  -H "Content-Type: application/json" \
  -d '{
    "chainId": "fantom-mainnet",
    "contractAddress": "0x0000000000000000000000000000000000000003",
    "decimals": 6
  }'

# Add Fantom to existing baskets
curl -X POST http://localhost:3001/multichain/baskets/bUSD/add-chain \
  -H "X-API-Key: your-key" \
  -H "Content-Type: application/json" \
  -d '{ "chainId": "fantom-mainnet" }'

# Verify - list baskets on Fantom
curl -X GET http://localhost:3001/multichain/baskets/by-chain/fantom-mainnet \
  -H "X-API-Key: your-key"
```

### Example 2: Cross-Chain Mint Analysis

```bash
# Get comprehensive stats for a beneficiary across all chains
curl -X GET http://localhost:3001/multichain/mints/beneficiary/0x1234567890123456789012345678901234567890 \
  -H "X-API-Key: your-key"

# Response shows:
# - Total mints across all chains
# - Breakdown by chain
# - Assets received with active chains
# - Complete cross-chain footprint

# Get basket performance across chains
curl -X GET http://localhost:3001/multichain/mints/basket/bUSD \
  -H "X-API-Key: your-key"

# Response shows:
# - Which chains have mints
# - Total volume per chain
# - Asset distribution across chains
```

### Example 3: Multi-Chain Asset with Fallback

```bash
# Create asset deployed on multiple chains
POST /multichain/assets/register
{
  "id": "STABLECOIN",
  "type": "monetary",
  "name": "Universal Stablecoin",
  "symbol": "STABLE",
  "defaultChain": "ethereum-mainnet",  # Fallback chain
  "chains": {
    "ethereum-mainnet": {
      "contractAddress": "0xA0b86...",
      "decimals": 18
    },
    "polygon-mainnet": {
      "contractAddress": "0xB1c9...",
      "decimals": 6
    },
    "arbitrum-mainnet": {
      "contractAddress": "0xC2d8...",
      "decimals": 18
    },
    "optimism-mainnet": {
      "contractAddress": "0xD3e7...",
      "decimals": 6
    }
  }
}

# Create basket available on all chains
POST /multichain/baskets
{
  "id": "global-stable",
  "name": "Global Stablecoin Basket",
  "symbol": "GSTABLE",
  "supportedChains": ["ethereum-mainnet", "polygon-mainnet", "arbitrum-mainnet", "optimism-mainnet"],
  "defaultChain": "ethereum-mainnet",
  "assets": [
    { "assetId": "STABLECOIN", "weight": 100, "proportion": "100%" }
  ]
}
```

## Supported Chains

Pre-configured chains included:

**Mainnets:**
- Ethereum (chainId: 1)
- Polygon (chainId: 137)
- Arbitrum One (chainId: 42161)
- Optimism (chainId: 10)
- Base (chainId: 8453)
- Avalanche C-Chain (chainId: 43114)

**Testnets:**
- Ethereum Sepolia (chainId: 11155111)
- Polygon Mumbai (chainId: 80001)

**Custom:**
- Add any EVM or non-EVM chain via API

## Environment Setup

```bash
# Install dependencies
npm install

# Development
npm run dev

# Build
npm run build

# Production
npm start
```

## Configuration

Set environment variables:
```bash
PORT=3001
CRE_PROJECT_ROOT=/path/to/project
CRE_WORKFLOW_PATH=/path/to/workflow
VALID_API_KEYS=key1,key2,key3
```

## Non-Monetary Asset Support

The system supports any asset type across any chain:

- **Monetary**: Stablecoins (DUSD, AUDT on multiple chains)
- **NFTs**: Collectibles deployed cross-chain
- **Digital Assets**: Tokens, fungible assets
- **Physical-backed**: Real-world asset representations
- **Custom**: Any asset with metadata

Baskets can mix asset types with configurable weights across chains!

## Example Workflows

### Create Multi-Asset Basket
```bash
# Register NFT
curl -X POST http://localhost:3001/assets/register \
  -H "X-API-Key: your-key" \
  -H "Content-Type: application/json" \
  -d '{
    "id": "LBBT",
    "type": "nft",
    "name": "Labubu",
    "symbol": "LBBT",
    "decimals": 0,
    "contractAddress": "0x0000000000000000000000000000000000000002"
  }'

# Create basket with USD + NFT
curl -X POST http://localhost:3001/baskets \
  -H "X-API-Key: your-key" \
  -H "Content-Type: application/json" \
  -d '{
    "id": "mixed-basket",
    "name": "Mixed",
    "symbol": "MIXD",
    "assets": [
      {"assetId": "DUSD", "weight": 70, "proportion": "70%"},
      {"assetId": "LBBT", "weight": 30, "proportion": "30%"}
    ]
  }'

# Mint from basket
curl -X POST http://localhost:3001/mints \
  -H "X-API-Key: your-key" \
  -H "Content-Type: application/json" \
  -d '{
    "basketId": "mixed-basket",
    "beneficiary": "0x1234567890123456789012345678901234567890",
    "amount": "1000"
  }'
```

## Improvements Over v1.0

| Feature | v1.0 | v2.0 |
|---------|------|------|
| Asset Types | Stablecoins only | 5+ types supported |
| Minting Tracking | Hardcoded | Real-time persistent |
| Automation | Manual config | Dynamic registry |
| Basket Composition | Fixed | Weighted + dynamic |
| Audit Trail | Basic logging | Full state tracking |
| Non-Monetary Assets | ❌ | ✅ |

## Next Steps

- Add webhook callbacks for multi-chain mint events
- Implement cross-chain bridge integration
- Add analytics dashboard with multi-chain views
- Support for Solana, Cosmos, and other non-EVM chains
- Implement asset oracle integration across chains
- Cross-chain settlement and atomic swaps
