import { readFileSync, writeFileSync } from 'fs';
import { join } from 'path';
import { homedir } from 'os';
import { MultiChainAsset, AssetChains, ChainAsset } from '../types/multichain.js';
import { AssetType } from '../types/index.js';

const multiChainAssetsPath = join(process.cwd(), 'data/multichain-assets.json');

/**
 * Multi-Chain Asset Registry - manages assets across multiple chains
 */
export class MultiChainAssetRegistry {
  private assets: Map<string, MultiChainAsset> = new Map();

  constructor() {
    this.loadAssets();
  }

  /**
   * Load assets from persistent storage
   */
  private loadAssets(): void {
    try {
      const data = readFileSync(multiChainAssetsPath, 'utf-8');
      const parsed = JSON.parse(data);
      Object.entries(parsed).forEach(([id, asset]) => {
        this.assets.set(id, asset as MultiChainAsset);
      });
      console.log(`[MultiChainAssetRegistry] Loaded ${this.assets.size} multi-chain assets`);
    } catch (error) {
      console.log('[MultiChainAssetRegistry] No existing multi-chain assets file, starting fresh');
      this.assets = new Map();
    }
  }

  /**
   * Save assets to persistent storage
   */
  private saveAssets(): void {
    const assetsObj: Record<string, MultiChainAsset> = {};
    this.assets.forEach((asset, id) => {
      assetsObj[id] = asset;
    });
    writeFileSync(multiChainAssetsPath, JSON.stringify(assetsObj, null, 2) + '\n');
    this.backupToHome(assetsObj);
  }

  /**
   * Backup to home directory
   */
  private backupToHome(data: any): void {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const backupPath = join(homedir(), `.basket-enhanced/multichain-assets-${timestamp}.json`);
    try {
      writeFileSync(backupPath, JSON.stringify(data, null, 2) + '\n');
    } catch (err) {
      console.warn(`[MultiChainAssetRegistry] Failed to backup: ${err}`);
    }
  }

  /**
   * Register a multi-chain asset
   */
  registerMultiChainAsset(asset: Omit<MultiChainAsset, 'createdAt' | 'updatedAt'>): MultiChainAsset {
    if (this.assets.has(asset.id)) {
      throw new Error(`Asset ${asset.id} already exists`);
    }

    // Validate at least one chain
    if (Object.keys(asset.chains).length === 0) {
      throw new Error('Asset must be deployed on at least one chain');
    }

    // Validate default chain exists
    if (!asset.chains[asset.defaultChain]) {
      throw new Error(`Default chain ${asset.defaultChain} not found in asset chains`);
    }

    const now = new Date().toISOString();
    const fullAsset: MultiChainAsset = {
      ...asset,
      createdAt: now,
      updatedAt: now,
    };

    this.assets.set(asset.id, fullAsset);
    this.saveAssets();
    console.log(`[MultiChainAssetRegistry] Registered: ${asset.id} on ${Object.keys(asset.chains).length} chains`);
    return fullAsset;
  }

  /**
   * Get asset by ID
   */
  getAsset(id: string): MultiChainAsset | undefined {
    return this.assets.get(id);
  }

  /**
   * Get asset on specific chain
   */
  getAssetOnChain(assetId: string, chainId: string): ChainAsset | undefined {
    const asset = this.assets.get(assetId);
    if (!asset) return undefined;
    return asset.chains[chainId];
  }

  /**
   * Get all assets available on a specific chain
   */
  getAssetsByChain(chainId: string): MultiChainAsset[] {
    const result: MultiChainAsset[] = [];
    this.assets.forEach(asset => {
      if (asset.chains[chainId]) {
        result.push(asset);
      }
    });
    return result;
  }

  /**
   * Add asset to new chain
   */
  addAssetToChain(assetId: string, chainId: string, chainAsset: ChainAsset): MultiChainAsset {
    const asset = this.assets.get(assetId);
    if (!asset) {
      throw new Error(`Asset ${assetId} not found`);
    }

    if (asset.chains[chainId]) {
      throw new Error(`Asset ${assetId} already deployed on chain ${chainId}`);
    }

    asset.chains[chainId] = chainAsset;
    asset.updatedAt = new Date().toISOString();
    this.saveAssets();
    console.log(`[MultiChainAssetRegistry] Added ${assetId} to chain ${chainId}`);
    return asset;
  }

  /**
   * Remove asset from chain
   */
  removeAssetFromChain(assetId: string, chainId: string): MultiChainAsset {
    const asset = this.assets.get(assetId);
    if (!asset) {
      throw new Error(`Asset ${assetId} not found`);
    }

    if (!asset.chains[chainId]) {
      throw new Error(`Asset ${assetId} not deployed on chain ${chainId}`);
    }

    // Prevent removing if it's the only chain
    if (Object.keys(asset.chains).length === 1) {
      throw new Error('Cannot remove asset from its only chain');
    }

    // Update default chain if needed
    if (asset.defaultChain === chainId) {
      const remainingChains = Object.keys(asset.chains).filter(c => c !== chainId);
      asset.defaultChain = remainingChains[0];
    }

    delete asset.chains[chainId];
    asset.updatedAt = new Date().toISOString();
    this.saveAssets();
    console.log(`[MultiChainAssetRegistry] Removed ${assetId} from chain ${chainId}`);
    return asset;
  }

  /**
   * Get all assets
   */
  getAllAssets(): MultiChainAsset[] {
    return Array.from(this.assets.values());
  }

  /**
   * Get assets by type
   */
  getAssetsByType(type: AssetType): MultiChainAsset[] {
    const result: MultiChainAsset[] = [];
    this.assets.forEach(asset => {
      if (asset.type === type) {
        result.push(asset);
      }
    });
    return result;
  }
}

// Singleton instance
export const multiChainAssetRegistry = new MultiChainAssetRegistry();
