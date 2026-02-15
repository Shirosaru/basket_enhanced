import { Router, type Request, type Response } from 'express';
import { z } from 'zod';
import { multiChainBasketRegistry } from '../services/multichain-basket-registry.js';
import { multiChainAssetRegistry } from '../services/multichain-asset-registry.js';
import { chainRegistry } from '../services/chain-registry.js';

const router = Router();

const createMultiChainBasketSchema = z.object({
  id: z.string().min(1, 'Basket ID is required'),
  name: z.string().min(1, 'Name is required'),
  symbol: z.string().min(1, 'Symbol is required').max(20),
  description: z.string().optional(),
  supportedChains: z.array(z.string()).min(1, 'Must support at least one chain'),
  defaultChain: z.string(),
  assets: z.array(
    z.object({
      assetId: z.string(),
      weight: z.number().min(0).max(100),
      proportion: z.string(),
      chainId: z.string().optional(),
    })
  ),
});

// Create a multi-chain basket
router.post('/', (req: Request, res: Response) => {
  try {
    const result = createMultiChainBasketSchema.safeParse(req.body);

    if (!result.success) {
      res.status(400).json({
        success: false,
        error: 'VALIDATION_ERROR',
        message: result.error.errors.map(e => `${e.path}: ${e.message}`).join(', '),
      });
      return;
    }

    const basket = multiChainBasketRegistry.createBasket({
      ...result.data,
      status: 'active',
    });

    console.log(`[MultiChainBaskets] Created: ${basket.id}`);

    res.json({
      success: true,
      message: `Basket "${basket.symbol}" created on ${basket.supportedChains.length} chains`,
      basket,
    });
  } catch (error: any) {
    console.error('[MultiChainBaskets Create] Error:', error);
    res.status(400).json({
      success: false,
      error: error.message,
    });
  }
});

// Get basket by ID
router.get('/:basketId', (req: Request, res: Response) => {
  try {
    const basket = multiChainBasketRegistry.getBasket(req.params.basketId);

    if (!basket) {
      res.status(404).json({
        success: false,
        error: 'NOT_FOUND',
        message: `Basket ${req.params.basketId} not found`,
      });
      return;
    }

    // Enrich with asset and chain info
    const enrichedAssets = basket.assets.map(ba => {
      const asset = multiChainAssetRegistry.getAsset(ba.assetId);
      return {
        ...ba,
        asset: asset ? { id: asset.id, symbol: asset.symbol, type: asset.type } : null,
      };
    });

    const enrichedChains = basket.supportedChains.map(chainId => {
      const chain = chainRegistry.getChain(chainId);
      return {
        id: chainId,
        name: chain?.displayName || 'Unknown',
        chainId: chain?.chainId,
      };
    });

    res.json({
      success: true,
      basket: {
        ...basket,
        assets: enrichedAssets,
        chainsEnriched: enrichedChains,
      },
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

// Get baskets by chain
router.get('/by-chain/:chainId', (req: Request, res: Response) => {
  try {
    const baskets = multiChainBasketRegistry.getBasketsByChain(req.params.chainId);

    res.json({
      success: true,
      chainId: req.params.chainId,
      count: baskets.length,
      baskets,
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

// Get all baskets
router.get('/', (req: Request, res: Response) => {
  try {
    const baskets = multiChainBasketRegistry.getAllBaskets();

    res.json({
      success: true,
      total: baskets.length,
      baskets: baskets.map(b => ({
        ...b,
        chainsSupported: b.supportedChains.length,
        assetsCount: b.assets.length,
      })),
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

// Add chain to basket
router.post('/:basketId/add-chain', (req: Request, res: Response) => {
  try {
    const { chainId } = req.body;

    if (!chainId) {
      res.status(400).json({
        success: false,
        error: 'VALIDATION_ERROR',
        message: 'chainId is required',
      });
      return;
    }

    const basket = multiChainBasketRegistry.addChainToBasket(req.params.basketId, chainId);

    console.log(`[MultiChainBaskets] Added chain ${chainId} to basket ${req.params.basketId}`);

    res.json({
      success: true,
      message: `Chain ${chainId} added to basket`,
      basket,
    });
  } catch (error: any) {
    console.error('[MultiChainBaskets Add Chain] Error:', error);
    res.status(400).json({
      success: false,
      error: error.message,
    });
  }
});

// Remove chain from basket
router.delete('/:basketId/remove-chain/:chainId', (req: Request, res: Response) => {
  try {
    const basket = multiChainBasketRegistry.removeChainFromBasket(req.params.basketId, req.params.chainId);

    console.log(`[MultiChainBaskets] Removed chain ${req.params.chainId} from basket ${req.params.basketId}`);

    res.json({
      success: true,
      message: `Chain ${req.params.chainId} removed from basket`,
      basket,
    });
  } catch (error: any) {
    console.error('[MultiChainBaskets Remove Chain] Error:', error);
    res.status(400).json({
      success: false,
      error: error.message,
    });
  }
});

export { router as multiChainBasketsRouter };
