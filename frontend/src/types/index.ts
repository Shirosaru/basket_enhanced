import { type Address } from 'viem';

export interface Basket {
  id: string;
  address: Address;
  name: string;
  symbol: string;
  owner: Address;
  totalSupply: bigint;
  composition: AssetComposition[];
  porStatus: {
    lastHash: string;
    lastTimestamp: number;
    isValid: boolean;
    reserveBalance: bigint;
  };
}

export interface AssetComposition {
  assetType: string;
  weight: bigint;
  backing: Address;
}

export interface MintRequest {
  id: string;
  beneficiary: Address;
  amount: bigint;
  transactionId: string;
  status: 'pending' | 'executed' | 'failed';
  createdAt: number;
}

export interface PORProof {
  hash: string;
  timestamp: number;
  reserveBalance: bigint;
  verified: boolean;
}
