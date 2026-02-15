import { readFileSync, writeFileSync } from 'fs';
import { join } from 'path';
import { homedir } from 'os';
import { Asset, Basket, AssetType } from '../types/index.js';

const assetsPath = join(process.cwd(), 'data/assets.json');
const basketsPath = join(process.cwd(), 'data/baskets.json');

/**
 * Asset Registry Service - manages all assets (monetary and non-monetary)
 */
export class AssetRegistry {
  private assets: Map<string, Asset> = new Map();
  private baskets: Map<string, Basket> = new Map();

  constructor() {
    this.loadAssets();
    this.loadBaskets();
  }

  /**
   * Load assets from persistent storage
   */
  private loadAssets(): void {
    try {
      const data = readFileSync(assetsPath, 'utf-8');
      const parsed = JSON.parse(data);
      Object.entries(parsed).forEach(([id, asset]) => {
        this.assets.set(id, asset as Asset);
      });
      console.log(`[AssetRegistry] Loaded ${this.assets.size} assets`);
    } catch (error) {
      console.log('[AssetRegistry] No existing assets file, starting fresh');
      this.assets = new Map();
    }
  }

  /**
   * Load baskets from persistent storage
   */
  private loadBaskets(): void {
    try {
      const data = readFileSync(basketsPath, 'utf-8');
      const parsed = JSON.parse(data);
      Object.entries(parsed).forEach(([id, basket]) => {
        this.baskets.set(id, basket as Basket);
      });
      console.log(`[AssetRegistry] Loaded ${this.baskets.size} baskets`);
    } catch (error) {
      console.log('[AssetRegistry] No existing baskets file, starting fresh');
      this.baskets = new Map();
    }
  }

  /**
   * Save assets to persistent storage
   */
  private saveAssets(): void {
    const assetsObj: Record<string, Asset> = {};
    this.assets.forEach((asset, id) => {
      assetsObj[id] = asset;
    });
    writeFileSync(assetsPath, JSON.stringify(assetsObj, null, 2) + '\n');
    this.backupToHome('assets', assetsObj);
  }

  /**
   * Save baskets to persistent storage
   */
  private saveBaskets(): void {
    const basketsObj: Record<string, Basket> = {};
    this.baskets.forEach((basket, id) => {
      basketsObj[id] = basket;
    });
    writeFileSync(basketsPath, JSON.stringify(basketsObj, null, 2) + '\n');
    this.backupToHome('baskets', basketsObj);
  }

  /**
   * Backup data to home directory with timestamp
   */
  private backupToHome(name: string, data: any): void {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const backupPath = join(homedir(), `.basket-enhanced/${name}-${timestamp}.json`);
    try {
      writeFileSync(backupPath, JSON.stringify(data, null, 2) + '\n');
      console.log(`[AssetRegistry] Backup: ${backupPath}`);
    } catch (err) {
      console.warn(`[AssetRegistry] Failed to backup: ${err}`);
    }
  }

  /**
   * Register a new asset
   */
  registerAsset(asset: Omit<Asset, 'createdAt' | 'updatedAt'>): Asset {
    if (this.assets.has(asset.id)) {
      throw new Error(`Asset ${asset.id} already exists`);
    }

    const now = new Date().toISOString();
    const fullAsset: Asset = {
      ...asset,
      createdAt: now,
      updatedAt: now,
    };

    this.assets.set(asset.id, fullAsset);
    this.saveAssets();
    console.log(`[AssetRegistry] Registered asset: ${asset.id} (${asset.type})`);
    return fullAsset;
  }

  /**
   * Get asset by ID
   */
  getAsset(id: string): Asset | undefined {
    return this.assets.get(id);
  }

  /**
   * Get all assets of a specific type
   */
  getAssetsByType(type: AssetType): Asset[] {
    const assets: Asset[] = [];
    this.assets.forEach(asset => {
      if (asset.type === type) {
        assets.push(asset);
      }
    });
    return assets;
  }

  /**
   * Get all assets
   */
  getAllAssets(): Asset[] {
    return Array.from(this.assets.values());
  }

  /**
   * Create a new basket with assets
   */
  createBasket(basket: Omit<Basket, 'createdAt' | 'updatedAt'>): Basket {
    if (this.baskets.has(basket.id)) {
      throw new Error(`Basket ${basket.id} already exists`);
    }

    // Validate all assets exist
    for (const basketAsset of basket.assets) {
      if (!this.assets.has(basketAsset.assetId)) {
        throw new Error(`Asset ${basketAsset.assetId} not found`);
      }
    }

    // Validate weights sum to 100
    const totalWeight = basket.assets.reduce((sum, ba) => sum + ba.weight, 0);
    if (totalWeight !== 100) {
      throw new Error(`Asset weights must sum to 100 (current: ${totalWeight})`);
    }

    const now = new Date().toISOString();
    const fullBasket: Basket = {
      ...basket,
      createdAt: now,
      updatedAt: now,
    };

    this.baskets.set(basket.id, fullBasket);
    this.saveBaskets();
    console.log(`[AssetRegistry] Created basket: ${basket.id} with ${basket.assets.length} assets`);
    return fullBasket;
  }

  /**
   * Get basket by ID
   */
  getBasket(id: string): Basket | undefined {
    return this.baskets.get(id);
  }

  /**
   * Get all baskets
   */
  getAllBaskets(): Basket[] {
    return Array.from(this.baskets.values());
  }

  /**
   * Expand a basket into its constituent assets with proportional amounts
   */
  expandBasket(basketId: string, totalAmount: string): { asset: Asset; amount: string }[] {
    const basket = this.baskets.get(basketId);
    if (!basket) {
      throw new Error(`Basket ${basketId} not found`);
    }

    const totalAmountNum = parseFloat(totalAmount);
    const expanded: { asset: Asset; amount: string }[] = [];

    for (const basketAsset of basket.assets) {
      const asset = this.assets.get(basketAsset.assetId);
      if (!asset) continue;

      const proportionalAmount = (totalAmountNum * basketAsset.weight) / 100;
      expanded.push({
        asset,
        amount: proportionalAmount.toString(),
      });
    }

    return expanded;
  }
}

// Singleton instance
export const assetRegistry = new AssetRegistry();
