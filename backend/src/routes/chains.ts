import { Router, type Request, type Response } from 'express';
import { z } from 'zod';
import { chainRegistry } from '../services/chain-registry.js';
import { ChainName } from '../types/multichain.js';

const router = Router();

const registerChainSchema = z.object({
  id: z.string().min(1, 'Chain ID is required'),
  name: z.enum(['ethereum', 'polygon', 'arbitrum', 'optimism', 'base', 'avalanche', 'custom'] as const),
  displayName: z.string().min(1, 'Display name is required'),
  chainId: z.number().int().positive(),
  rpcUrl: z.string().url('Invalid RPC URL'),
  explorerUrl: z.string().url('Invalid explorer URL'),
  nativeCurrency: z.object({
    name: z.string(),
    symbol: z.string(),
    decimals: z.number().int(),
  }),
  isTestnet: z.boolean().default(false),
  metadata: z.record(z.any()).optional(),
});

// Register a new chain
router.post('/register', (req: Request, res: Response) => {
  try {
    const result = registerChainSchema.safeParse(req.body);

    if (!result.success) {
      res.status(400).json({
        success: false,
        error: 'VALIDATION_ERROR',
        message: result.error.errors.map(e => `${e.path}: ${e.message}`).join(', '),
      });
      return;
    }

    const chain = chainRegistry.registerChain(result.data);

    console.log(`[Chains] Registered: ${chain.id}`);

    res.json({
      success: true,
      message: `Chain "${chain.displayName}" registered successfully`,
      chain,
    });
  } catch (error: any) {
    console.error('[Chains Register] Error:', error);
    res.status(400).json({
      success: false,
      error: error.message,
    });
  }
});

// Get chain by ID
router.get('/:chainId', (req: Request, res: Response) => {
  try {
    const chain = chainRegistry.getChain(req.params.chainId);

    if (!chain) {
      res.status(404).json({
        success: false,
        error: 'NOT_FOUND',
        message: `Chain ${req.params.chainId} not found`,
      });
      return;
    }

    res.json({ success: true, chain });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

// Get all chains
router.get('/', (req: Request, res: Response) => {
  try {
    const { type } = req.query;
    let chains = chainRegistry.getAllChains();

    if (type === 'testnet') {
      chains = chainRegistry.getTestnetChains();
    } else if (type === 'mainnet') {
      chains = chainRegistry.getMainnetChains();
    }

    res.json({
      success: true,
      total: chains.length,
      chains,
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

// Update chain configuration
router.put('/:chainId', (req: Request, res: Response) => {
  try {
    const updateSchema = registerChainSchema.partial().omit({ id: true });
    const result = updateSchema.safeParse(req.body);

    if (!result.success) {
      res.status(400).json({
        success: false,
        error: 'VALIDATION_ERROR',
        message: result.error.errors.map(e => `${e.path}: ${e.message}`).join(', '),
      });
      return;
    }

    const chain = chainRegistry.updateChain(req.params.chainId, result.data);

    console.log(`[Chains] Updated: ${chain.id}`);

    res.json({
      success: true,
      message: `Chain "${chain.displayName}" updated successfully`,
      chain,
    });
  } catch (error: any) {
    console.error('[Chains Update] Error:', error);
    res.status(400).json({
      success: false,
      error: error.message,
    });
  }
});

export { router as chainsRouter };
