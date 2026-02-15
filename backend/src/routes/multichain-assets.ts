import { Router, type Request, type Response } from 'express';
import { z } from 'zod';
import { multiChainAssetRegistry } from '../services/multichain-asset-registry.js';
import { chainRegistry } from '../services/chain-registry.js';

const router = Router();

const registerMultiChainAssetSchema = z.object({
  id: z.string().min(1, 'Asset ID is required'),
  type: z.enum(['monetary', 'digital-asset', 'nft', 'physical-backed', 'custom'] as const),
  name: z.string().min(1, 'Name is required'),
  symbol: z.string().min(1, 'Symbol is required').max(20),
  defaultChain: z.string().min(1, 'Default chain is required'),
  chains: z.record(
    z.object({
      chainId: z.string(),
      contractAddress: z.string().regex(/^0x[a-fA-F0-9]{40}$/, 'Invalid contract address'),
      decimals: z.number().int().min(0).max(18),
      metadata: z.record(z.any()).optional(),
    })
  ),
  metadata: z.record(z.any()).optional(),
});

// Register a multi-chain asset
router.post('/register', (req: Request, res: Response) => {
  try {
    const result = registerMultiChainAssetSchema.safeParse(req.body);

    if (!result.success) {
      res.status(400).json({
        success: false,
        error: 'VALIDATION_ERROR',
        message: result.error.errors.map(e => `${e.path}: ${e.message}`).join(', '),
      });
      return;
    }

    const asset = multiChainAssetRegistry.registerMultiChainAsset(result.data);

    console.log(`[MultiChainAssets] Registered: ${asset.id}`);

    res.json({
      success: true,
      message: `Asset "${asset.symbol}" registered on ${Object.keys(asset.chains).length} chains`,
      asset,
    });
  } catch (error: any) {
    console.error('[MultiChainAssets Register] Error:', error);
    res.status(400).json({
      success: false,
      error: error.message,
    });
  }
});

// Get asset by ID
router.get('/:assetId', (req: Request, res: Response) => {
  try {
    const asset = multiChainAssetRegistry.getAsset(req.params.assetId);

    if (!asset) {
      res.status(404).json({
        success: false,
        error: 'NOT_FOUND',
        message: `Asset ${req.params.assetId} not found`,
      });
      return;
    }

    // Enrich with chain info
    const enrichedChains: any = {};
    Object.entries(asset.chains).forEach(([chainId, chainAsset]) => {
      const chain = chainRegistry.getChain(chainId);
      enrichedChains[chainId] = {
        ...chainAsset,
        chain: chain ? { id: chain.id, name: chain.displayName } : null,
      };
    });

    res.json({
      success: true,
      asset: {
        ...asset,
        chains: enrichedChains,
      },
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

// Get assets by chain
router.get('/by-chain/:chainId', (req: Request, res: Response) => {
  try {
    const assets = multiChainAssetRegistry.getAssetsByChain(req.params.chainId);

    res.json({
      success: true,
      chainId: req.params.chainId,
      count: assets.length,
      assets,
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

// Get all assets
router.get('/', (req: Request, res: Response) => {
  try {
    const assets = multiChainAssetRegistry.getAllAssets();
    const byType: Record<string, number> = {};

    assets.forEach(asset => {
      byType[asset.type] = (byType[asset.type] || 0) + 1;
    });

    res.json({
      success: true,
      total: assets.length,
      byType,
      assets: assets.map(a => ({
        ...a,
        chainsDeployed: Object.keys(a.chains).length,
      })),
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

// Add asset to a new chain
router.post('/:assetId/add-chain', (req: Request, res: Response) => {
  try {
    const { chainId, contractAddress, decimals, metadata } = req.body;

    if (!chainId || !contractAddress || decimals === undefined) {
      res.status(400).json({
        success: false,
        error: 'VALIDATION_ERROR',
        message: 'chainId, contractAddress, and decimals are required',
      });
      return;
    }

    const asset = multiChainAssetRegistry.addAssetToChain(req.params.assetId, chainId, {
      chainId,
      contractAddress,
      decimals,
      metadata,
    });

    console.log(`[MultiChainAssets] Added ${req.params.assetId} to chain ${chainId}`);

    res.json({
      success: true,
      message: `Asset added to chain ${chainId}`,
      asset,
    });
  } catch (error: any) {
    console.error('[MultiChainAssets Add Chain] Error:', error);
    res.status(400).json({
      success: false,
      error: error.message,
    });
  }
});

// Remove asset from a chain
router.delete('/:assetId/remove-chain/:chainId', (req: Request, res: Response) => {
  try {
    const asset = multiChainAssetRegistry.removeAssetFromChain(req.params.assetId, req.params.chainId);

    console.log(`[MultiChainAssets] Removed ${req.params.assetId} from chain ${req.params.chainId}`);

    res.json({
      success: true,
      message: `Asset removed from chain ${req.params.chainId}`,
      asset,
    });
  } catch (error: any) {
    console.error('[MultiChainAssets Remove Chain] Error:', error);
    res.status(400).json({
      success: false,
      error: error.message,
    });
  }
});

export { router as multiChainAssetsRouter };
