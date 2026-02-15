import { readFileSync, writeFileSync } from 'fs';
import { join } from 'path';
import { homedir } from 'os';
import { ChainConfig, ChainName } from '../types/multichain.js';

const chainsPath = join(process.cwd(), 'data/chains.json');

/**
 * Chain Registry Service - manages blockchain configurations
 */
export class ChainRegistry {
  private chains: Map<string, ChainConfig> = new Map();

  constructor() {
    this.loadChains();
  }

  /**
   * Load chains from persistent storage
   */
  private loadChains(): void {
    try {
      const data = readFileSync(chainsPath, 'utf-8');
      const parsed = JSON.parse(data);
      Object.entries(parsed).forEach(([id, chain]) => {
        this.chains.set(id, chain as ChainConfig);
      });
      console.log(`[ChainRegistry] Loaded ${this.chains.size} chains`);
    } catch (error) {
      console.log('[ChainRegistry] No existing chains file, starting fresh');
      this.chains = new Map();
    }
  }

  /**
   * Save chains to persistent storage
   */
  private saveChains(): void {
    const chainsObj: Record<string, ChainConfig> = {};
    this.chains.forEach((chain, id) => {
      chainsObj[id] = chain;
    });
    writeFileSync(chainsPath, JSON.stringify(chainsObj, null, 2) + '\n');
    this.backupToHome(chainsObj);
  }

  /**
   * Backup chains to home directory
   */
  private backupToHome(data: any): void {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const backupPath = join(homedir(), `.basket-enhanced/chains-${timestamp}.json`);
    try {
      writeFileSync(backupPath, JSON.stringify(data, null, 2) + '\n');
      console.log(`[ChainRegistry] Backup: ${backupPath}`);
    } catch (err) {
      console.warn(`[ChainRegistry] Failed to backup: ${err}`);
    }
  }

  /**
   * Register a new chain
   */
  registerChain(chain: Omit<ChainConfig, 'createdAt' | 'updatedAt'>): ChainConfig {
    if (this.chains.has(chain.id)) {
      throw new Error(`Chain ${chain.id} already exists`);
    }

    const now = new Date().toISOString();
    const fullChain: ChainConfig = {
      ...chain,
      createdAt: now,
      updatedAt: now,
    };

    this.chains.set(chain.id, fullChain);
    this.saveChains();
    console.log(`[ChainRegistry] Registered chain: ${chain.id} (${chain.name}, chainId: ${chain.chainId})`);
    return fullChain;
  }

  /**
   * Get chain by ID
   */
  getChain(id: string): ChainConfig | undefined {
    return this.chains.get(id);
  }

  /**
   * Get chain by name
   */
  getChainByName(name: ChainName): ChainConfig | undefined {
    let result: ChainConfig | undefined;
    this.chains.forEach(chain => {
      if (chain.name === name) {
        result = chain;
      }
    });
    return result;
  }

  /**
   * Get all chains
   */
  getAllChains(): ChainConfig[] {
    return Array.from(this.chains.values());
  }

  /**
   * Get all mainnet chains
   */
  getMainnetChains(): ChainConfig[] {
    return Array.from(this.chains.values()).filter(c => !c.isTestnet);
  }

  /**
   * Get all testnet chains
   */
  getTestnetChains(): ChainConfig[] {
    return Array.from(this.chains.values()).filter(c => c.isTestnet);
  }

  /**
   * Update chain configuration
   */
  updateChain(
    id: string,
    updates: Partial<Omit<ChainConfig, 'id' | 'createdAt' | 'updatedAt'>>
  ): ChainConfig {
    const chain = this.chains.get(id);
    if (!chain) {
      throw new Error(`Chain ${id} not found`);
    }

    const updated: ChainConfig = {
      ...chain,
      ...updates,
      updatedAt: new Date().toISOString(),
    };

    this.chains.set(id, updated);
    this.saveChains();
    console.log(`[ChainRegistry] Updated chain: ${id}`);
    return updated;
  }

  /**
   * Verify chain exists
   */
  chainExists(id: string): boolean {
    return this.chains.has(id);
  }
}

// Singleton instance
export const chainRegistry = new ChainRegistry();
