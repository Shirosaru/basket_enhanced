// Contract addresses - update with your deployed contracts
export const CONTRACTS = {
  basketFactory: {
    sepolia: process.env.NEXT_PUBLIC_BASKET_FACTORY_SEPOLIA || '0x0000000000000000000000000000000000000000',
    ethereum: process.env.NEXT_PUBLIC_BASKET_FACTORY_ETHEREUM || '0x0000000000000000000000000000000000000000',
    polygon: process.env.NEXT_PUBLIC_BASKET_FACTORY_POLYGON || '0x0000000000000000000000000000000000000000',
    arbitrum: process.env.NEXT_PUBLIC_BASKET_FACTORY_ARBITRUM || '0x0000000000000000000000000000000000000000',
    base: process.env.NEXT_PUBLIC_BASKET_FACTORY_BASE || '0x0000000000000000000000000000000000000000',
  },
  porOracle: {
    sepolia: process.env.NEXT_PUBLIC_POR_ORACLE_SEPOLIA || '0x0000000000000000000000000000000000000000',
  },
};

// ABIs
export const STABLECOIN_ABI = [
  'function mint(address to, uint256 amount) external',
  'function burn(address from, uint256 amount) external',
  'function burnFrom(address from, uint256 amount) external',
  'function totalSupply() view returns (uint256)',
  'function balanceOf(address account) view returns (uint256)',
  'function transfer(address to, uint256 amount) returns (bool)',
  'function approve(address spender, uint256 amount) returns (bool)',
  'function allowance(address owner, address spender) view returns (uint256)',
  'function reserveBalance() view returns (uint256)',
  'function lastPORTimestamp() view returns (uint256)',
  'function lastPORHash() view returns (bytes32)',
  'function isPORValid() view returns (bool)',
  'function checkReserveRatio() view returns (bool, uint256)',
  'function getComposition() view returns (tuple(string,uint256,address)[])',
  'function verifyAndUpdatePOR(bytes32 porHash, uint256 newReserveBalance) external',
  'event MintExecuted(address indexed to, uint256 amount, bytes32 indexed porHash)',
  'event PORVerified(bytes32 indexed porHash, uint256 timestamp, uint256 reserveBalance)',
];

export const BASKET_FACTORY_ABI = [
  'function createBasket(string name, string symbol, address admin, address creForwarder) external returns (address, address)',
  'function createBasketWithComposition(string name, string symbol, address admin, address creForwarder, string[] assets, uint256[] weights, address[] backing) external returns (address, address)',
  'function setPOROracleAddress(address _porOracle) external',
  'event BasketCreated(address indexed creator, address indexed admin, address indexed stablecoin, address mintingConsumer, string name, string symbol, address porVerifier)',
];

export const MINTING_CONSUMER_ABI = [
  'function requestMint(address beneficiary, uint256 amount, string transactionId) external returns (bytes32)',
  'function executePendingMint(bytes32 requestId) external',
  'function getPendingMint(bytes32 requestId) view returns (address, uint256, string, uint256, bool)',
  'function onReport(bytes metadata, bytes report) external',
  'event MintRequested(address indexed beneficiary, uint256 amount, string transactionId, bytes32 requestId)',
  'event MintExecuted(address indexed beneficiary, uint256 amount, bytes32 indexed porHash)',
];
