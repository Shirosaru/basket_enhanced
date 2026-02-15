import { Router, type Request, type Response } from 'express';
import { z } from 'zod';
import { assetRegistry } from '../services/asset-registry.js';
import { Basket } from '../types/index.js';

const router = Router();

const createBasketSchema = z.object({
  id: z.string().min(1, 'Basket ID is required'),
  name: z.string().min(1, 'Name is required'),
  symbol: z.string().min(1, 'Symbol is required').max(20),
  description: z.string().optional(),
  assets: z.array(
    z.object({
      assetId: z.string(),
      weight: z.number().min(0).max(100),
      proportion: z.string(),
    })
  ),
});

// Create a new basket
router.post('/', (req: Request, res: Response) => {
  try {
    const result = createBasketSchema.safeParse(req.body);

    if (!result.success) {
      res.status(400).json({
        success: false,
        error: 'VALIDATION_ERROR',
        message: result.error.errors.map(e => `${e.path}: ${e.message}`).join(', '),
      });
      return;
    }

    const basket = assetRegistry.createBasket({
      ...result.data,
      status: 'active',
    });

    console.log(`[Baskets] Created: ${basket.id} with ${basket.assets.length} assets`);

    res.json({
      success: true,
      message: `Basket "${basket.symbol}" created successfully`,
      basket,
    });
  } catch (error: any) {
    console.error('[Baskets Create] Error:', error);
    res.status(400).json({
      success: false,
      error: error.message,
    });
  }
});

// Get basket by ID
router.get('/:basketId', (req: Request, res: Response) => {
  try {
    const basket = assetRegistry.getBasket(req.params.basketId);

    if (!basket) {
      res.status(404).json({
        success: false,
        error: 'NOT_FOUND',
        message: `Basket ${req.params.basketId} not found`,
      });
      return;
    }

    // Enrich with asset details
    const enrichedAssets = basket.assets.map(ba => {
      const asset = assetRegistry.getAsset(ba.assetId);
      return {
        ...ba,
        asset: asset || null,
      };
    });

    res.json({
      success: true,
      basket: {
        ...basket,
        assets: enrichedAssets,
      },
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
    const baskets = assetRegistry.getAllBaskets();

    res.json({
      success: true,
      total: baskets.length,
      baskets,
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

// Expand basket (see what assets and amounts you'd get)
router.post('/:basketId/expand', (req: Request, res: Response) => {
  try {
    const { amount } = req.body;

    if (!amount || typeof amount !== 'string') {
      res.status(400).json({
        success: false,
        error: 'VALIDATION_ERROR',
        message: 'amount is required and must be a string',
      });
      return;
    }

    const expanded = assetRegistry.expandBasket(req.params.basketId, amount);

    res.json({
      success: true,
      basketId: req.params.basketId,
      totalAmount: amount,
      assets: expanded.map(e => ({
        assetId: e.asset.id,
        symbol: e.asset.symbol,
        type: e.asset.type,
        amount: e.amount,
      })),
    });
  } catch (error: any) {
    console.error('[Baskets Expand] Error:', error);
    res.status(400).json({
      success: false,
      error: error.message,
    });
  }
});

export { router as basketsRouter };
