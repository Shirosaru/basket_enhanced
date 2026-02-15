import { readFileSync, writeFileSync } from 'fs';
import { join } from 'path';
import { homedir } from 'os';
import { MultiChainMintRecord, ChainMintedAsset } from '../types/multichain.js';

const multiChainMintsPath = join(process.cwd(), 'data/multichain-mints.json');

/**
 * Multi-Chain Mint State Service - tracks mints across all chains
 */
export class MultiChainMintStateService {
  private mints: Map<string, MultiChainMintRecord> = new Map();

  constructor() {
    this.loadMints();
  }

  /**
   * Load mints from persistent storage
   */
  private loadMints(): void {
    try {
      const data = readFileSync(multiChainMintsPath, 'utf-8');
      const parsed = JSON.parse(data);
      Object.entries(parsed).forEach(([id, mint]) => {
        this.mints.set(id, mint as MultiChainMintRecord);
      });
      console.log(`[MultiChainMintState] Loaded ${this.mints.size} multi-chain mint records`);
    } catch (error) {
      console.log('[MultiChainMintState] No existing multi-chain mints file, starting fresh');
      this.mints = new Map();
    }
  }

  /**
   * Save mints to persistent storage
   */
  private saveMints(): void {
    const mintsObj: Record<string, MultiChainMintRecord> = {};
    this.mints.forEach((mint, id) => {
      mintsObj[id] = mint;
    });
    writeFileSync(multiChainMintsPath, JSON.stringify(mintsObj, null, 2) + '\n');
    this.backupToHome(mintsObj);
  }

  /**
   * Backup to home directory
   */
  private backupToHome(data: any): void {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const backupPath = join(homedir(), `.basket-enhanced/multichain-mints-${timestamp}.json`);
    try {
      writeFileSync(backupPath, JSON.stringify(data, null, 2) + '\n');
    } catch (err) {
      console.warn(`[MultiChainMintState] Failed to backup: ${err}`);
    }
  }

  /**
   * Create a new mint record
   */
  createMintRecord(
    basketId: string,
    chainId: string,
    chainName: string,
    transactionId: string,
    beneficiary: string,
    amount: string,
    assets: ChainMintedAsset[]
  ): MultiChainMintRecord {
    const id = `mint-${chainId}-${transactionId}`;
    const record: MultiChainMintRecord = {
      id,
      basketId,
      chainId,
      chainName,
      transactionId,
      beneficiary,
      amount,
      assets,
      status: 'pending',
      createdAt: new Date().toISOString(),
    };

    this.mints.set(id, record);
    this.saveMints();
    console.log(`[MultiChainMintState] Created mint record on ${chainName}: ${id}`);
    return record;
  }

  /**
   * Get mint record by ID
   */
  getMintRecord(id: string): MultiChainMintRecord | undefined {
    return this.mints.get(id);
  }

  /**
   * Update mint record status
   */
  updateMintRecord(
    id: string,
    updates: {
      status?: 'completed' | 'failed';
      assets?: ChainMintedAsset[];
      error?: string;
    }
  ): MultiChainMintRecord {
    const record = this.mints.get(id);
    if (!record) {
      throw new Error(`Mint record ${id} not found`);
    }

    const updated: MultiChainMintRecord = {
      ...record,
      ...updates,
      completedAt: updates.status ? new Date().toISOString() : record.completedAt,
    };

    this.mints.set(id, updated);
    this.saveMints();
    console.log(`[MultiChainMintState] Updated mint: ${id}, status: ${updated.status}`);
    return updated;
  }

  /**
   * Get mints by chain
   */
  getMintsByChain(chainId: string): MultiChainMintRecord[] {
    const records: MultiChainMintRecord[] = [];
    this.mints.forEach(mint => {
      if (mint.chainId === chainId) {
        records.push(mint);
      }
    });
    return records;
  }

  /**
   * Get mints by basket
   */
  getMintsByBasket(basketId: string): MultiChainMintRecord[] {
    const records: MultiChainMintRecord[] = [];
    this.mints.forEach(mint => {
      if (mint.basketId === basketId) {
        records.push(mint);
      }
    });
    return records;
  }

  /**
   * Get mints by beneficiary
   */
  getMintsByBeneficiary(beneficiary: string): MultiChainMintRecord[] {
    const records: MultiChainMintRecord[] = [];
    this.mints.forEach(mint => {
      if (mint.beneficiary === beneficiary) {
        records.push(mint);
      }
    });
    return records;
  }

  /**
   * Get cross-chain mints for beneficiary (aggregated)
   */
  getBeneficiaryCrossChainStats(beneficiary: string) {
    const mints = this.getMintsByBeneficiary(beneficiary);
    const completed = mints.filter(m => m.status === 'completed');

    const byChain: Record<string, { count: number; totalAmount: string; assets: number }> = {};
    const assetTotals: Record<string, { symbol: string; totalAmount: number; chains: Set<string> }> = {};

    completed.forEach(mint => {
      if (!byChain[mint.chainId]) {
        byChain[mint.chainId] = { count: 0, totalAmount: '0', assets: 0 };
      }
      byChain[mint.chainId].count++;
      byChain[mint.chainId].totalAmount = (parseFloat(byChain[mint.chainId].totalAmount) + parseFloat(mint.amount)).toString();
      byChain[mint.chainId].assets += mint.assets.length;

      mint.assets.forEach(asset => {
        if (!assetTotals[asset.assetId]) {
          assetTotals[asset.assetId] = { symbol: asset.symbol, totalAmount: 0, chains: new Set() };
        }
        assetTotals[asset.assetId].totalAmount += parseFloat(asset.amount);
        assetTotals[asset.assetId].chains.add(asset.chainId);
      });
    });

    return {
      beneficiary,
      totalMints: mints.length,
      completedMints: completed.length,
      byChain,
      assetTotals: Object.entries(assetTotals).map(([assetId, data]) => ({
        assetId,
        symbol: data.symbol,
        totalAmount: data.totalAmount.toString(),
        chainsActive: Array.from(data.chains),
      })),
    };
  }

  /**
   * Get basket stats across all chains
   */
  getBasketCrossChainStats(basketId: string) {
    const mints = this.getMintsByBasket(basketId);
    const completed = mints.filter(m => m.status === 'completed');

    const byChain: Record<string, { count: number; totalAmount: string }> = {};
    let totalMinted = 0;

    completed.forEach(mint => {
      if (!byChain[mint.chainId]) {
        byChain[mint.chainId] = { count: 0, totalAmount: '0' };
      }
      byChain[mint.chainId].count++;
      byChain[mint.chainId].totalAmount = (parseFloat(byChain[mint.chainId].totalAmount) + parseFloat(mint.amount)).toString();
      totalMinted += parseFloat(mint.amount);
    });

    return {
      basketId,
      totalMints: mints.length,
      completedMints: completed.length,
      failedMints: mints.filter(m => m.status === 'failed').length,
      pendingMints: mints.filter(m => m.status === 'pending').length,
      totalMinted: totalMinted.toString(),
      chainsActive: Object.keys(byChain).length,
      byChain,
    };
  }

  /**
   * Get all mints
   */
  getAllMints(): MultiChainMintRecord[] {
    return Array.from(this.mints.values());
  }
}

// Singleton instance
export const multiChainMintStateService = new MultiChainMintStateService();
