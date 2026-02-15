# Basket Enhanced Frontend

Modern, responsive web interface for managing POR-backed stablecoins on multiple blockchains.

## Features

- **Connect Wallet**: RainbowKit integration for seamless Web3 authentication
- **Create Baskets**: Deploy new stablecoins with custom asset composition
- **Manage POR**: Update Proof of Reserve using Chainlink oracles
- **Mint Tokens**: Request minting with mandatory POR verification
- **Multi-Chain**: Support for Ethereum, Polygon, Arbitrum, Optimism, Base, Avalanche
- **Real-Time Status**: Live dashboard view of basket state and reserve ratios
- **Type-Safe**: Full TypeScript support with Zod validation

## Tech Stack

- **Framework**: Next.js 15 (App Router)
- **Styling**: Tailwind CSS
- **Web3**: Wagmi + Viem
- **Wallet**: RainbowKit
- **State**: Zustand + React Query
- **Validation**: Zod
- **Type-Safety**: TypeScript 5.6

## Getting Started

### Installation

```bash
npm install
# or
yarn install
# or
pnpm install
```

### Environment Setup

```bash
cp .env.example .env.local
```

Edit `.env.local` and add:
- Your WalletConnect Project ID
- Deployed contract addresses
- POR Oracle addresses
- Backend API URL

### Development

```bash
npm run dev
# Frontend runs on http://localhost:3000
```

### Build for Production

```bash
npm run build
npm start
```

## Project Structure

```
src/
├── app/                    # Next.js app router pages
│   ├── layout.tsx         # Root layout with providers
│   ├── page.tsx           # Home page
│   ├── baskets/           # Basket management
│   ├── mint/              # Mint interface
│   ├── por/               # POR dashboard
│   └── globals.css        # Global styles
├── components/            # React components
│   ├── Header.tsx        # Navigation header
│   ├── CreateBasket.tsx   # Basket creation form
│   ├── MintRequest.tsx    # Mint request form
│   └── PORVerification.tsx # POR management
├── config/               # Configuration files
│   ├── wagmi.ts         # Wagmi configuration
│   └── contracts.ts     # Contract ABIs and addresses
├── hooks/               # Custom React hooks
├── lib/                 # Utility functions
│   └── schemas.ts       # Zod validation schemas
└── types/              # TypeScript type definitions
```

## Key Components

### CreateBasket
Form for deploying new POR-backed stablecoins with:
- Token metadata (name, symbol)
- Admin and CRE Forwarder addresses
- Dynamic asset composition with weights
- Full validation

### MintRequest
Request stablecoin minting with:
- Beneficiary address input
- Amount specification
- Transaction ID tracking
- Automatic POR validity checks

### PORVerification
Manage Proof of Reserve with:
- POR hash submission
- Reserve balance updates
- Real-time status display
- Expiration warnings

## API Integration

The frontend connects to:

1. **Blockchain RPC** (via Wagmi):
   - Read: `totalSupply`, `reserveBalance`, `composition`
   - Write: Mint, burn, POR updates

2. **Backend API** (optional):
   - POST `/mint` - Submit mint requests
   - GET `/baskets` - List baskets
   - GET `/por/:basketId` - POR status

## Smart Contract Interaction

### Reading Data
```typescript
const { data: isPORValid } = useContractRead({
  address: stablecoinAddress,
  abi: STABLECOIN_ABI,
  functionName: 'isPORValid',
});
```

### Writing Transactions
```typescript
const { write: mint } = useContractWrite({
  address: stablecoinAddress,
  abi: STABLECOIN_ABI,
  functionName: 'mint',
});

mint({
  args: [beneficiary, amount],
});
```

## Network Support

Configured for:
- Mainnet: Ethereum, Polygon, Arbitrum, Optimism, Base, Avalanche
- Testnet: Sepolia, Mumbai

Add more networks in `src/config/wagmi.ts`:

```typescript
import { myChain } from 'wagmi/chains';

export const config = getDefaultConfig({
  chains: [...existingChains, myChain],
  transports: {
    ...existingTransports,
    [myChain.id]: http(),
  },
});
```

## Deployment

### Vercel (Recommended)

```bash
vercel deploy
```

Set environment variables in Vercel dashboard.

### Docker

```bash
docker build -t basket-frontend .
docker run -p 3000:3000 basket-frontend
```

### Manual

```bash
npm run build
npm start
```

## Testing

```bash
npm run lint
npm run type-check
```

## Development

### Add New Page

```bash
# Create file: src/app/new-page/page.tsx
export default function NewPage() {
  return <div>Content</div>;
}
```

### Add New Component

```bash
# Create file: src/components/NewComponent.tsx
'use client';

export function NewComponent() {
  return <div>Component</div>;
}
```

### Add Smart Contract Interaction

1. Add ABI to `src/config/contracts.ts`
2. Create hook in `src/hooks/useNewContract.ts`
3. Use in component: `const { data } = useNewContract()`

## Troubleshooting

**RainbowKit not showing?**
- Clear browser cache
- Check wallet extension is installed
- Verify project ID is valid

**Contract calls failing?**
- Verify contract address is correct
- Check network matches deployment
- Ensure user has balance for gas

**POR validation failing?**
- POR must be refreshed every hour
- Check oracle is configured
- Verify reserve balance is sufficient

## Documentation

- [Next.js Docs](https://nextjs.org/docs)
- [Wagmi Docs](https://wagmi.sh)
- [RainbowKit Docs](https://www.rainbowkit.com)
- [Tailwind CSS](https://tailwindcss.com)

## Contributing

1. Create feature branch: `git checkout -b feature/amazing-feature`
2. Commit changes: `git commit -m 'Add amazing feature'`
3. Push to branch: `git push origin feature/amazing-feature`
4. Open Pull Request

## License

MIT - See LICENSE for details
