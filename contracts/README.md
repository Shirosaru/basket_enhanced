# Basket Enhanced Contracts

Smart contracts for the Basket system including:
- **StablecoinERC20**: ERC20 token with role-based mint/burn
- **MintingConsumerWithACE**: Chainlink ACE integration for automated minting
- **BasketFactory**: Factory for deploying new basket instances

## Build

```bash
forge build
```

## Deploy

```bash
# Set environment variables
export PRIVATE_KEY=0x...
export ADMIN_ADDRESS=0x...
export POLICY_ENGINE=0x...

# Deploy
forge script script/DeployBasketFactory.s.sol --broadcast
```

## Testing

```bash
forge test
```
