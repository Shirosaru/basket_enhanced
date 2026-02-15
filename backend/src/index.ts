import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { join } from 'path';
import { apiKeyAuth } from './middleware/auth.js';
import { assetsRouter } from './routes/assets.js';
import { basketsRouter } from './routes/baskets.js';
import { mintsRouter } from './routes/mints.js';
import { chainsRouter } from './routes/chains.js';
import { multiChainAssetsRouter } from './routes/multichain-assets.js';
import { multiChainBasketsRouter } from './routes/multichain-baskets.js';
import { multiChainMintsRouter } from './routes/multichain-mints.js';

// Load environment variables
dotenv.config({ path: join(process.cwd(), '../.env') });

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json());

// Health check (no auth)
app.get('/health', (_req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    version: '2.1.0',
    features: [
      'multi-asset-support',
      'real-time-minting-tracking',
      'non-monetary-assets',
      'multi-chain-support',
      'cross-chain-baskets',
      'chain-agnostic-architecture',
    ],
  });
});

// Protected routes (require API key)
// Single-chain routes (backward compatible)
app.use('/assets', apiKeyAuth, assetsRouter);
app.use('/baskets', apiKeyAuth, basketsRouter);
app.use('/mints', apiKeyAuth, mintsRouter);

// Multi-chain routes
app.use('/chains', apiKeyAuth, chainsRouter);
app.use('/multichain/assets', apiKeyAuth, multiChainAssetsRouter);
app.use('/multichain/baskets', apiKeyAuth, multiChainBasketsRouter);
app.use('/multichain/mints', apiKeyAuth, multiChainMintsRouter);

// 404 handler
app.use((_req, res) => {
  res.status(404).json({
    success: false,
    error: 'NOT_FOUND',
    message: 'Endpoint not found',
  });
});

// Error handler
app.use((err: any, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  console.error('[Error]', err);
  res.status(500).json({
    success: false,
    error: 'INTERNAL_SERVER_ERROR',
    message: err.message || 'An unexpected error occurred',
  });
});

// Start server
app.listen(PORT, () => {
  console.log(`\n${'='.repeat(70)}`);
  console.log(`Backend server running on http://localhost:${PORT}`);
  console.log(`${'='.repeat(70)}`);
  console.log(`Mode: Enhanced Basket System v2.1.0`);
  console.log(`Features:`);
  console.log(`  ✓ Multi-asset support (monetary + non-monetary)`);
  console.log(`  ✓ Real-time minting state tracking`);
  console.log(`  ✓ Automated asset discovery and validation`);
  console.log(`  ✓ Dynamic basket composition`);
  console.log(`  ✓ Multi-chain plug & play support`);
  console.log(`  ✓ Cross-chain basket deployment`);
  console.log(`  ✓ Chain-agnostic architecture`);
  console.log(`Auth: API key required (x-api-key header)`);
  console.log(`${'='.repeat(70)}`);
  console.log(`\nAPI Endpoints:`);
  console.log(`  Single-chain (v2.0 compatible):`);
  console.log(`    - /assets          (CRUD for single-chain assets)`);
  console.log(`    - /baskets         (CRUD for single-chain baskets)`);
  console.log(`    - /mints           (Minting operations)`);
  console.log(`\n  Multi-chain (v2.1 new):`);
  console.log(`    - /chains          (Chain registry & management)`);
  console.log(`    - /multichain/assets    (Multi-chain asset management)`);
  console.log(`    - /multichain/baskets   (Cross-chain basket management)`);
  console.log(`    - /multichain/mints     (Cross-chain minting)`);
  console.log(`${'='.repeat(70)}\n`);
});
