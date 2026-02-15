import { Router, type Request, type Response } from 'express';
import { z } from 'zod';
import { assetRegistry } from '../services/asset-registry.js';
import { AssetType, Asset } from '../types/index.js';

const router = Router();

// Validation schemas
const registerAssetSchema = z.object({
  id: z.string().min(1, 'Asset ID is required'),
  type: z.enum(['monetary', 'digital-asset', 'nft', 'physical-backed', 'custom'] as const),
  name: z.string().min(1, 'Name is required'),
  symbol: z.string().min(1, 'Symbol is required').max(20),
  decimals: z.number().int().min(0).max(18),
  contractAddress: z.string().regex(/^0x[a-fA-F0-9]{40}$/, 'Invalid contract address'),
  metadata: z.record(z.any()).optional(),
});

// Register a new asset
router.post('/register', (req: Request, res: Response) => {
  try {
    const result = registerAssetSchema.safeParse(req.body);

    if (!result.success) {
      res.status(400).json({
        success: false,
        error: 'VALIDATION_ERROR',
        message: result.error.errors.map(e => `${e.path}: ${e.message}`).join(', '),
      });
      return;
    }

    const asset = assetRegistry.registerAsset(result.data);

    console.log(`[Assets] Registered: ${asset.id} (${asset.type})`);

    res.json({
      success: true,
      message: `Asset "${asset.symbol}" registered successfully`,
      asset,
    });
  } catch (error: any) {
    console.error('[Assets Register] Error:', error);
    res.status(400).json({
      success: false,
      error: error.message,
    });
  }
});

// Get asset by ID
router.get('/:assetId', (req: Request, res: Response) => {
  try {
    const asset = assetRegistry.getAsset(req.params.assetId);

    if (!asset) {
      res.status(404).json({
        success: false,
        error: 'NOT_FOUND',
        message: `Asset ${req.params.assetId} not found`,
      });
      return;
    }

    res.json({ success: true, asset });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

// Get assets by type
router.get('/type/:assetType', (req: Request, res: Response) => {
  try {
    const type = req.params.assetType as AssetType;
    const assets = assetRegistry.getAssetsByType(type);

    res.json({
      success: true,
      type,
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
    const assets = assetRegistry.getAllAssets();
    const byType: Record<string, number> = {};

    assets.forEach(asset => {
      byType[asset.type] = (byType[asset.type] || 0) + 1;
    });

    res.json({
      success: true,
      total: assets.length,
      byType,
      assets,
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

export { router as assetsRouter };
