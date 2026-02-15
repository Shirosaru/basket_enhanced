/**
 * Multi-chain types and interfaces
 */

export type ChainName = 'ethereum' | 'polygon' | 'arbitrum' | 'optimism' | 'base' | 'avalanche' | 'custom';

export interface ChainConfig {
  id: string;
  name: ChainName;
  displayName: string;
  chainId: number;
  rpcUrl: string;
  explorerUrl: string;
  nativeCurrency: {
    name: string;
    symbol: string;
    decimals: number;
  };
  isTestnet: boolean;
  metadata?: Record<string, any>;
  createdAt: string;
  updatedAt: string;
}

export interface ChainAsset {
  chainId: string;
  contractAddress: string;
  decimals: number;
  metadata?: Record<string, any>;
}

export interface AssetChains {
  [chainId: string]: ChainAsset;
}

export interface MultiChainAsset {
  id: string;
  type: 'monetary' | 'digital-asset' | 'nft' | 'physical-backed' | 'custom';
  name: string;
  symbol: string;
  chains: AssetChains; // chainId -> contract address mapping
  defaultChain: string;
  metadata?: Record<string, any>;
  createdAt: string;
  updatedAt: string;
}

export interface ChainBasketAsset {
  assetId: string;
  weight: number;
  proportion: string;
  chainId?: string; // optional: specify which chain for this asset
}

export interface MultiChainBasket {
  id: string;
  name: string;
  symbol: string;
  description?: string;
  assets: ChainBasketAsset[];
  supportedChains: string[]; // chainIds where this basket can be minted
  defaultChain: string;
  status: 'active' | 'paused' | 'deprecated';
  createdAt: string;
  updatedAt: string;
}

export interface MultiChainMintRequest {
  basketId: string;
  chainId: string; // which chain to mint on
  beneficiary: string;
  amount: string;
  assetTypeFilter?: string;
}

export interface ChainMintedAsset {
  assetId: string;
  symbol: string;
  type: string;
  amount: string;
  chainId: string;
  chainName: string;
  contractAddress: string;
  explorerUrl?: string;
  txHash?: string;
}

export interface MultiChainMintRecord {
  id: string;
  basketId: string;
  chainId: string;
  chainName: string;
  transactionId: string;
  beneficiary: string;
  amount: string;
  assets: ChainMintedAsset[];
  status: 'pending' | 'completed' | 'failed';
  createdAt: string;
  completedAt?: string;
  error?: string;
}

export interface MultiChainWorkflowPayload {
  messageType: string;
  transactionId: string;
  sender: {
    name: string;
    account: string;
    bankCode: string;
  };
  beneficiary: {
    name: string;
    account: string;
  };
  amount: string;
  chain: {
    id: string;
    name: string;
    chainId: number;
    rpcUrl: string;
  };
  assets: ChainAssetPayload[];
  valueDate: string;
  bankReference: string;
  metadata?: Record<string, any>;
}

export interface ChainAssetPayload {
  assetId: string;
  symbol: string;
  type: string;
  amount: string;
  contractAddress: string;
  chainId: string;
  metadata?: Record<string, any>;
}
