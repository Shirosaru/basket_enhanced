import { Router, type Request, type Response } from 'express';
import { z } from 'zod';
import { CREWorkflowService } from '../services/cre-workflow.js';
import { mintStateService } from '../services/mint-state.js';

const router = Router();

const mintSchema = z.object({
  basketId: z.string().min(1, 'Basket ID is required'),
  beneficiary: z.string().regex(/^0x[a-fA-F0-9]{40}$/, 'Invalid Ethereum address'),
  amount: z.string().regex(/^\d+(\.\d+)?$/, 'Amount must be a valid number string'),
  chainId: z.string().optional(),
  assetTypeFilter: z.enum(['monetary', 'digital-asset', 'nft', 'physical-backed', 'custom']).optional(),
});

// Trigger minting
router.post('/', async (req: Request, res: Response) => {
  try {
    const result = mintSchema.safeParse(req.body);

    if (!result.success) {
      res.status(400).json({
        success: false,
        error: 'VALIDATION_ERROR',
        message: result.error.errors.map(e => `${e.path}: ${e.message}`).join(', '),
      });
      return;
    }

    const { basketId, beneficiary, amount, assetTypeFilter, chainId } = result.data;

    console.log(`[Mint] Request - Basket: ${basketId}, Amount: ${amount}, Beneficiary: ${beneficiary}`);

    // Trigger workflow
    const workflowResult = await CREWorkflowService.triggerMint({
      basketId,
      beneficiary,
      amount,
      assetTypeFilter,
      chainId,
    });

    if (workflowResult.success) {
      res.json({
        success: true,
        transactionId: workflowResult.transactionId,
        message: `Minting initiated for ${amount} of basket ${basketId}`,
        mintRecord: workflowResult.mintRecord,
      });
    } else {
      res.status(400).json({
        success: false,
        transactionId: workflowResult.transactionId,
        error: workflowResult.error,
      });
    }
  } catch (error: any) {
    console.error('[Mint Error]', error);
    res.status(500).json({
      success: false,
      error: 'INTERNAL_ERROR',
      message: error.message,
    });
  }
});

// Get mint status
router.get('/status/:transactionId', (req: Request, res: Response) => {
  try {
    const mintId = `mint-${req.params.transactionId}`;
    const record = mintStateService.getMintRecord(mintId);

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

// Get all mints for a beneficiary
router.get('/beneficiary/:address', (req: Request, res: Response) => {
  try {
    const mints = mintStateService.getMintsByBeneficiary(req.params.address);

    res.json({
      success: true,
      beneficiary: req.params.address,
      totalMints: mints.length,
      mints,
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

// Get all mints for a basket
router.get('/basket/:basketId', (req: Request, res: Response) => {
  try {
    const stats = mintStateService.getBasketStats(req.params.basketId);

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

// Get all mints
router.get('/', (req: Request, res: Response) => {
  try {
    const mints = mintStateService.getAllMints();
    const stats = {
      total: mints.length,
      completed: mints.filter(m => m.status === 'completed').length,
      failed: mints.filter(m => m.status === 'failed').length,
      pending: mints.filter(m => m.status === 'pending').length,
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

export { router as mintsRouter };
