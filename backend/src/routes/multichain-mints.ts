import { Router, type Request, type Response } from 'express';
import { z } from 'zod';
import { multiChainMintStateService } from '../services/multichain-mint-state.js';

const router = Router();

const multiChainMintSchema = z.object({
  basketId: z.string().min(1, 'Basket ID is required'),
  chainId: z.string().min(1, 'Chain ID is required'),
  beneficiary: z.string().regex(/^0x[a-fA-F0-9]{40}$/, 'Invalid Ethereum address'),
  amount: z.string().regex(/^\d+(\.\d+)?$/, 'Amount must be a valid number string'),
  assetTypeFilter: z.enum(['monetary', 'digital-asset', 'nft', 'physical-backed', 'custom']).optional(),
});

// Get mint by ID
router.get('/:mintId', (req: Request, res: Response) => {
  try {
    const record = multiChainMintStateService.getMintRecord(req.params.mintId);

    if (!record) {
      res.status(404).json({
        success: false,
        error: 'NOT_FOUND',
        message: `Mint record not found`,
      });
      return;
    }

    res.json({
      success: true,
      mintRecord: record,
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

// Get mints by chain
router.get('/chain/:chainId', (req: Request, res: Response) => {
  try {
    const mints = multiChainMintStateService.getMintsByChain(req.params.chainId);

    const stats = {
      total: mints.length,
      completed: mints.filter(m => m.status === 'completed').length,
      failed: mints.filter(m => m.status === 'failed').length,
      pending: mints.filter(m => m.status === 'pending').length,
    };

    res.json({
      success: true,
      chainId: req.params.chainId,
      stats,
      mints,
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

// Get mints by basket (cross-chain)
router.get('/basket/:basketId', (req: Request, res: Response) => {
  try {
    const stats = multiChainMintStateService.getBasketCrossChainStats(req.params.basketId);

    res.json({
      success: true,
      basketId: req.params.basketId,
      stats,
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

// Get mints by beneficiary (cross-chain)
router.get('/beneficiary/:address', (req: Request, res: Response) => {
  try {
    const stats = multiChainMintStateService.getBeneficiaryCrossChainStats(req.params.address);

    res.json({
      success: true,
      stats,
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

// Get all mints
router.get('/', (req: Request, res: Response) => {
  try {
    const mints = multiChainMintStateService.getAllMints();
    const stats = {
      total: mints.length,
      completed: mints.filter(m => m.status === 'completed').length,
      failed: mints.filter(m => m.status === 'failed').length,
      pending: mints.filter(m => m.status === 'pending').length,
      chainsActive: new Set(mints.map(m => m.chainId)).size,
    };

    res.json({
      success: true,
      stats,
      mints,
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

export { router as multiChainMintsRouter };
