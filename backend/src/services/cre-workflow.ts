import crypto from 'crypto';
import { MintRequest, WorkflowPayload, CREWorkflowResult, MintedAsset, AssetPayload } from '../types/index.js';
import { assetRegistry } from './asset-registry.js';
import { mintStateService } from './mint-state.js';

/**
 * Enhanced CRE Workflow Service - supports multiple asset types
 */
export class CREWorkflowService {
  /**
   * Generate unique transaction ID
   */
  private static generateTransactionId(): string {
    const timestamp = new Date().toISOString().slice(0, 10).replace(/-/g, '');
    const random = crypto.randomBytes(4).toString('hex').toUpperCase();
    return `BSKT${timestamp}${random}`;
  }

  /**
   * Generate bank reference (bytes32 format)
   */
  private static generateBankReference(transactionId: string): string {
    const buffer = Buffer.alloc(32);
    buffer.write(transactionId);
    return '0x' + buffer.toString('hex');
  }

  /**
   * Trigger minting for a basket
   */
  static async triggerMint(request: MintRequest): Promise<CREWorkflowResult> {
    const transactionId = this.generateTransactionId();
    const bankReference = this.generateBankReference(transactionId);

    try {
      // Load basket and expand assets
      const basket = assetRegistry.getBasket(request.basketId);
      if (!basket) {
        throw new Error(`Basket ${request.basketId} not found`);
      }

      // Expand basket into constituent assets with proportional amounts
      const expandedAssets = assetRegistry.expandBasket(request.basketId, request.amount);

      // Filter by type if specified
      const filteredAssets = request.assetTypeFilter
        ? expandedAssets.filter(ea => ea.asset.type === request.assetTypeFilter)
        : expandedAssets;

      if (filteredAssets.length === 0) {
        throw new Error(`No assets found matching filter`);
      }

      // Convert to minted assets for tracking
      const mintedAssets: MintedAsset[] = filteredAssets.map(ea => ({
        assetId: ea.asset.id,
        symbol: ea.asset.symbol,
        type: ea.asset.type,
        amount: ea.amount,
        contractAddress: ea.asset.contractAddress,
      }));

      // Create mint record (captures state before workflow)
      const mintRecord = mintStateService.createMintRecord(
        request.basketId,
        transactionId,
        request.beneficiary,
        request.amount,
        mintedAssets
      );

      // Build workflow payload with all assets
      const assetPayloads: AssetPayload[] = filteredAssets.map(ea => ({
        assetId: ea.asset.id,
        symbol: ea.asset.symbol,
        type: ea.asset.type,
        amount: ea.amount,
        contractAddress: ea.asset.contractAddress,
        metadata: ea.asset.metadata,
      }));

      const payload = this.buildWorkflowPayload(
        transactionId,
        bankReference,
        request.beneficiary,
        request.amount,
        assetPayloads
      );

      console.log(`[CREWorkflow] Starting mint - TX: ${transactionId}, Assets: ${filteredAssets.length}`);
      console.log(`[CREWorkflow] Minting ${request.amount} of basket ${request.basketId}`);

      // Run workflow
      const workflowResult = await this.runCRESimulation(payload);

      if (workflowResult.success) {
        // Update mint record with success
        const updated = mintStateService.updateMintRecord(mintRecord.id, {
          status: 'completed',
          assets: mintedAssets,
        });

        return {
          success: true,
          transactionId,
          mintRecord: updated,
          output: workflowResult.output,
        };
      } else {
        // Update mint record with failure
        mintStateService.updateMintRecord(mintRecord.id, {
          status: 'failed',
          error: workflowResult.error,
        });

        throw new Error(workflowResult.error || 'Workflow failed');
      }
    } catch (error: any) {
      console.error(`[CREWorkflow] Error: ${error.message}`);
      return {
        success: false,
        transactionId,
        error: error.message,
      };
    }
  }

  /**
   * Build workflow payload
   */
  private static buildWorkflowPayload(
    transactionId: string,
    bankReference: string,
    beneficiary: string,
    amount: string,
    assets: AssetPayload[]
  ): WorkflowPayload {
    return {
      messageType: 'MT103-MULTI-ASSET',
      transactionId,
      sender: {
        name: 'BSKT Backend',
        account: 'BSKT001',
        bankCode: 'BSKTAPI',
      },
      beneficiary: {
        name: 'Wallet',
        account: beneficiary,
      },
      amount,
      assets,
      valueDate: new Date().toISOString().slice(0, 10),
      bankReference,
      metadata: {
        timestamp: new Date().toISOString(),
        assetCount: assets.length,
        assetTypes: [...new Set(assets.map(a => a.type))],
      },
    };
  }

  /**
   * Run CRE workflow simulation
   */
  private static async runCRESimulation(payload: WorkflowPayload): Promise<{ success: boolean; output: string; error?: string }> {
    // Mock CRE workflow for demo purposes
    return new Promise((resolve) => {
      console.log(`[CRE] Running mock workflow simulation for TX: ${payload.transactionId}`);
      console.log(`[CRE] Assets: ${payload.assets.length}, Amount: ${payload.amount}`);
      
      // Simulate workflow execution time
      setTimeout(() => {
        // Mock successful POR verification
        const mockOutput = JSON.stringify({
          success: true,
          transactionId: payload.transactionId,
          porVerified: true,
          reserveBalance: '1000000000',
          timestamp: new Date().toISOString(),
          message: 'POR verification successful via mock CRE workflow',
        }, null, 2);
        
        console.log(`[CRE] Mock workflow completed successfully`);
        resolve({ success: true, output: mockOutput });
      }, 1500);
    });
  }
}
