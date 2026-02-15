import { readFileSync, writeFileSync } from 'fs';
import { join } from 'path';
import { homedir } from 'os';
import { MultiChainBasket, ChainBasketAsset } from '../types/multichain.js';

const multiChainBasketsPath = join(process.cwd(), 'data/multichain-baskets.json');

/**
 * Multi-Chain Basket Registry - manages baskets across multiple chains
 */
export class MultiChainBasketRegistry {
  private baskets: Map<string, MultiChainBasket> = new Map();

  constructor() {
    this.loadBaskets();
  }

  /**
   * Load baskets from persistent storage
   */
  private loadBaskets(): void {
    try {
      const data = readFileSync(multiChainBasketsPath, 'utf-8');
      const parsed = JSON.parse(data);
      Object.entries(parsed).forEach(([id, basket]) => {
        this.baskets.set(id, basket as MultiChainBasket);
      });
      console.log(`[MultiChainBasketRegistry] Loaded ${this.baskets.size} multi-chain baskets`);
    } catch (error) {
      console.log('[MultiChainBasketRegistry] No existing multi-chain baskets file, starting fresh');
      this.baskets = new Map();
    }
  }

  /**
   * Save baskets to persistent storage
   */
  private saveBaskets(): void {
    const basketsObj: Record<string, MultiChainBasket> = {};
    this.baskets.forEach((basket, id) => {
      basketsObj[id] = basket;
    });
    writeFileSync(multiChainBasketsPath, JSON.stringify(basketsObj, null, 2) + '\n');
    this.backupToHome(basketsObj);
  }

  /**
   * Backup to home directory
   */
  private backupToHome(data: any): void {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const backupPath = join(homedir(), `.basket-enhanced/multichain-baskets-${timestamp}.json`);
    try {
      writeFileSync(backupPath, JSON.stringify(data, null, 2) + '\n');
    } catch (err) {
      console.warn(`[MultiChainBasketRegistry] Failed to backup: ${err}`);
    }
  }

  /**
   * Create a multi-chain basket
   */
  createBasket(basket: Omit<MultiChainBasket, 'createdAt' | 'updatedAt'>): MultiChainBasket {
    if (this.baskets.has(basket.id)) {
      throw new Error(`Basket ${basket.id} already exists`);
    }

    // Validate supported chains are not empty
    if (basket.supportedChains.length === 0) {
      throw new Error('Basket must support at least one chain');
    }

    // Validate default chain is in supported chains
    if (!basket.supportedChains.includes(basket.defaultChain)) {
      throw new Error(`Default chain ${basket.defaultChain} not in supported chains`);
    }

    // Validate weights sum to 100
    const totalWeight = basket.assets.reduce((sum, ba) => sum + ba.weight, 0);
    if (totalWeight !== 100) {
      throw new Error(`Asset weights must sum to 100 (current: ${totalWeight})`);
    }

    const now = new Date().toISOString();
    const fullBasket: MultiChainBasket = {
      ...basket,
      createdAt: now,
      updatedAt: now,
    };

    this.baskets.set(basket.id, fullBasket);
    this.saveBaskets();
    console.log(`[MultiChainBasketRegistry] Created basket: ${basket.id} on ${basket.supportedChains.length} chains`);
    return fullBasket;
  }

  /**
   * Get basket by ID
   */
  getBasket(id: string): MultiChainBasket | undefined {
    return this.baskets.get(id);
  }

  /**
   * Get baskets supported on a specific chain
   */
  getBasketsByChain(chainId: string): MultiChainBasket[] {
    const result: MultiChainBasket[] = [];
    this.baskets.forEach(basket => {
      if (basket.supportedChains.includes(chainId)) {
        result.push(basket);
      }
    });
    return result;
  }

  /**
   * Get all baskets
   */
  getAllBaskets(): MultiChainBasket[] {
    return Array.from(this.baskets.values());
  }

  /**
   * Add chain to basket's supported chains
   */
  addChainToBasket(basketId: string, chainId: string): MultiChainBasket {
    const basket = this.baskets.get(basketId);
    if (!basket) {
      throw new Error(`Basket ${basketId} not found`);
    }

    if (basket.supportedChains.includes(chainId)) {
      throw new Error(`Basket ${basketId} already supports chain ${chainId}`);
    }

    basket.supportedChains.push(chainId);
    basket.updatedAt = new Date().toISOString();
    this.saveBaskets();
    console.log(`[MultiChainBasketRegistry] Added chain ${chainId} to basket ${basketId}`);
    return basket;
  }

  /**
   * Remove chain from basket's supported chains
   */
  removeChainFromBasket(basketId: string, chainId: string): MultiChainBasket {
    const basket = this.baskets.get(basketId);
    if (!basket) {
      throw new Error(`Basket ${basketId} not found`);
    }

    if (!basket.supportedChains.includes(chainId)) {
      throw new Error(`Basket ${basketId} does not support chain ${chainId}`);
    }

    // Prevent removing if it's the only chain
    if (basket.supportedChains.length === 1) {
      throw new Error('Cannot remove basket from its only chain');
    }

    // Update default chain if needed
    if (basket.defaultChain === chainId) {
      const remainingChains = basket.supportedChains.filter(c => c !== chainId);
      basket.defaultChain = remainingChains[0];
    }

    basket.supportedChains = basket.supportedChains.filter(c => c !== chainId);
    basket.updatedAt = new Date().toISOString();
    this.saveBaskets();
    console.log(`[MultiChainBasketRegistry] Removed chain ${chainId} from basket ${basketId}`);
    return basket;
  }
}

// Singleton instance
export const multiChainBasketRegistry = new MultiChainBasketRegistry();
