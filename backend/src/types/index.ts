/**
 * Core types for the enhanced basket system
 */

export type AssetType = 'monetary' | 'digital-asset' | 'nft' | 'physical-backed' | 'custom';

export interface Asset {
  id: string;
  type: AssetType;
  name: string;
  symbol: string;
  decimals: number;
  contractAddress: string;
  metadata?: Record<string, any>;
  createdAt: string;
  updatedAt: string;
}

export interface Basket {
  id: string;
  name: string;
  symbol: string;
  description?: string;
  assets: BasketAsset[];
  totalValueLocked?: string;
  status: 'active' | 'paused' | 'deprecated';
  createdAt: string;
  updatedAt: string;
}

export interface BasketAsset {
  assetId: string;
  weight: number; // percentage 0-100
  proportion: string; // exact amount
}

export interface MintRequest {
  basketId: string;
  beneficiary: string;
  amount: string;
  assetTypeFilter?: AssetType; // optional: mint only certain asset types
  chainId?: string; // optional: specify target chain id (e.g., 'ethereum-mainnet')
}

export interface MintRecord {
  id: string;
  basketId: string;
  transactionId: string;
  beneficiary: string;
  amount: string;
  assets: MintedAsset[];
  status: 'pending' | 'completed' | 'failed';
  createdAt: string;
  completedAt?: string;
  error?: string;
}

export interface MintedAsset {
  assetId: string;
  symbol: string;
  type: AssetType;
  amount: string;
  contractAddress: string;
  txHash?: string;
}

export interface WorkflowPayload {
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
  assets: AssetPayload[];
  valueDate: string;
  bankReference: string;
  metadata?: Record<string, any>;
}

export interface AssetPayload {
  assetId: string;
  symbol: string;
  type: AssetType;
  amount: string;
  contractAddress: string;
  metadata?: Record<string, any>;
}

export interface CREWorkflowResult {
  success: boolean;
  transactionId: string;
  mintRecord?: MintRecord;
  output?: string;
  error?: string;
}
