import { readFileSync, writeFileSync } from 'fs';
import { join } from 'path';
import { homedir } from 'os';
import { MintRecord, MintedAsset } from '../types/index.js';

const mintsPath = join(process.cwd(), 'data/mints.json');

/**
 * Mint State Service - tracks all minting activity in real-time
 */
export class MintStateService {
  private mints: Map<string, MintRecord> = new Map();

  constructor() {
    this.loadMints();
  }

  /**
   * Load mints from persistent storage
   */
  private loadMints(): void {
    try {
      const data = readFileSync(mintsPath, 'utf-8');
      const parsed = JSON.parse(data);
      Object.entries(parsed).forEach(([id, mint]) => {
        this.mints.set(id, mint as MintRecord);
      });
      console.log(`[MintState] Loaded ${this.mints.size} mint records`);
    } catch (error) {
      console.log('[MintState] No existing mints file, starting fresh');
      this.mints = new Map();
    }
  }

  /**
   * Save mints to persistent storage
   */
  private saveMints(): void {
    const mintsObj: Record<string, MintRecord> = {};
    this.mints.forEach((mint, id) => {
      mintsObj[id] = mint;
    });
    writeFileSync(mintsPath, JSON.stringify(mintsObj, null, 2) + '\n');
    this.backupToHome(mintsObj);
  }

  /**
   * Backup mints to home directory
   */
  private backupToHome(data: any): void {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const backupPath = join(homedir(), `.basket-enhanced/mints-${timestamp}.json`);
    try {
      writeFileSync(backupPath, JSON.stringify(data, null, 2) + '\n');
      console.log(`[MintState] Backup: ${backupPath}`);
    } catch (err) {
      console.warn(`[MintState] Failed to backup: ${err}`);
    }
  }

  /**
   * Create a new mint record
   */
  createMintRecord(
    basketId: string,
    transactionId: string,
    beneficiary: string,
    amount: string,
    assets: MintedAsset[]
  ): MintRecord {
    const id = `mint-${transactionId}`;
    const record: MintRecord = {
      id,
      basketId,
      transactionId,
      beneficiary,
      amount,
      assets,
      status: 'pending',
      createdAt: new Date().toISOString(),
    };

    this.mints.set(id, record);
    this.saveMints();
    console.log(`[MintState] Created mint record: ${id}`);
    return record;
  }

  /**
   * Get mint record by ID
   */
  getMintRecord(id: string): MintRecord | undefined {
    return this.mints.get(id);
  }

  /**
   * Update mint record status and transaction hashes
   */
  updateMintRecord(
    id: string,
    updates: {
      status?: 'completed' | 'failed';
      assets?: MintedAsset[];
      error?: string;
    }
  ): MintRecord {
    const record = this.mints.get(id);
    if (!record) {
      throw new Error(`Mint record ${id} not found`);
    }

    const updated: MintRecord = {
      ...record,
      ...updates,
      completedAt: updates.status ? new Date().toISOString() : record.completedAt,
    };

    this.mints.set(id, updated);
    this.saveMints();
    console.log(`[MintState] Updated mint record: ${id}, status: ${updated.status}`);
    return updated;
  }

  /**
   * Get all mint records for a basket
   */
  getMintsByBasket(basketId: string): MintRecord[] {
    const records: MintRecord[] = [];
    this.mints.forEach(mint => {
      if (mint.basketId === basketId) {
        records.push(mint);
      }
    });
    return records;
  }

  /**
   * Get all mint records for a beneficiary
   */
  getMintsByBeneficiary(beneficiary: string): MintRecord[] {
    const records: MintRecord[] = [];
    this.mints.forEach(mint => {
      if (mint.beneficiary === beneficiary) {
        records.push(mint);
      }
    });
    return records;
  }

  /**
   * Get total minted amount by asset
   */
  getTotalMintedByAsset(assetId: string): { symbol: string; totalAmount: string; count: number } {
    let totalAmount = 0;
    let count = 0;
    let symbol = assetId;

    this.mints.forEach(mint => {
      if (mint.status === 'completed') {
        mint.assets.forEach(asset => {
          if (asset.assetId === assetId) {
            totalAmount += parseFloat(asset.amount);
            count++;
            symbol = asset.symbol;
          }
        });
      }
    });

    return {
      symbol,
      totalAmount: totalAmount.toString(),
      count,
    };
  }

  /**
   * Get statistics for a basket
   */
  getBasketStats(basketId: string) {
    const mints = this.getMintsByBasket(basketId);
    const completed = mints.filter(m => m.status === 'completed');
    const failed = mints.filter(m => m.status === 'failed');
    const pending = mints.filter(m => m.status === 'pending');

    const totalMinted = completed.reduce((sum, mint) => sum + parseFloat(mint.amount), 0);

    const assetTotals: Record<string, { symbol: string; amount: number }> = {};
    completed.forEach(mint => {
      mint.assets.forEach(asset => {
        if (!assetTotals[asset.assetId]) {
          assetTotals[asset.assetId] = { symbol: asset.symbol, amount: 0 };
        }
        assetTotals[asset.assetId].amount += parseFloat(asset.amount);
      });
    });

    return {
      totalMints: mints.length,
      completed: completed.length,
      failed: failed.length,
      pending: pending.length,
      totalMinted: totalMinted.toString(),
      assetTotals,
    };
  }

  /**
   * Get all mint records
   */
  getAllMints(): MintRecord[] {
    return Array.from(this.mints.values());
  }
}

// Singleton instance
export const mintStateService = new MintStateService();
