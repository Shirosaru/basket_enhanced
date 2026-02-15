'use client';

import { useState, useEffect } from 'react';
import { useChainId } from 'wagmi';
import { useRouter } from 'next/navigation';
import { CONTRACTS, BASKET_FACTORY_ABI } from '@/config/contracts';
import { CreateBasketSchema, PORVerificationSchema, MintRequestSchema } from '@/lib/schemas';
import { useBasketFlow } from '@/lib/store';
import type { CreateBasketFormData } from '@/lib/schemas';

export function CreateBasketComponent() {
  const [formData, setFormData] = useState<CreateBasketFormData>({
    name: 'USD Basket',
    symbol: 'USDB',
    admin: '0x0000000000000000000000000000000000000000',
    creForwarder: '0x0000000000000000000000000000000000000000',
    composition: [
      {
        assetType: 'DUSD',
        weight: 100,
        backing: '0x0000000000000000000000000000000000000000',
      },
    ],
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [mintAmount, setMintAmount] = useState('1000000');
  const [availableAssets, setAvailableAssets] = useState<any[]>([]);
  const [flowProgress, setFlowProgress] = useState<{
    stage: 'basket' | 'por' | 'mint' | 'complete';
    message: string;
    status: 'pending' | 'processing' | 'success' | 'error';
    error?: string;
  } | null>(null);

  const chainId = useChainId();
  const router = useRouter();
  const {
    setCurrentBasket,
    setFlowStep,
    setPORInfo,
    recordMint,
    updateMintStatus,
    setBasketStatus,
    setPORStatus,
    setMintStatus,
  } = useBasketFlow();

  // Load available assets from backend
  useEffect(() => {
    const fetchAssets = async () => {
      try {
        const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
        const apiKey = process.env.NEXT_PUBLIC_API_KEY || 'development-key-1';
        const res = await fetch(`${apiUrl}/assets`, {
          headers: { 'X-API-Key': apiKey },
          signal: AbortSignal.timeout(2000),
        });
        const data = await res.json();
        console.log('[CreateBasket] Assets loaded:', data);
        if (data.success && data.assets) {
          setAvailableAssets(data.assets);
        }
      } catch (err) {
        console.log('[CreateBasket] Using fallback assets:', err);
        // Fallback to common assets
        setAvailableAssets([
          { id: 'DUSD', symbol: 'DUSD', name: 'Demo USD' },
          { id: 'AUDT', symbol: 'AUDT', name: 'Australian Dollar Token' },
          { id: 'LBBT', symbol: 'LBBT', name: 'Labubu Token' },
        ]);
      }
    };
    fetchAssets();
  }, []);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleCompositionChange = (index: number, field: string, value: string | number) => {
    setFormData((prev) => ({
      ...prev,
      composition: prev.composition.map((c, i) =>
        i === index ? { ...c, [field]: value } : c
      ),
    }));
  };

  const handleAddComposition = () => {
    setFormData((prev) => ({
      ...prev,
      composition: [
        ...prev.composition,
        {
          assetType: '',
          weight: 0,
          backing: '0x0000000000000000000000000000000000000000',
        },
      ],
    }));
  };

  const handleRemoveComposition = (index: number) => {
    setFormData((prev) => ({
      ...prev,
      composition: prev.composition.filter((_, i) => i !== index),
    }));
  };

  const runFullFlow = async () => {
    setLoading(true);
    try {
      console.log('[CreateBasket] Starting flow with data:', formData);
      
      // Step 1: Validate and create basket
      setFlowProgress({
        stage: 'basket',
        message: 'Creating basket...',
        status: 'processing',
      });

      let validated;
      try {
        validated = CreateBasketSchema.parse(formData);
        console.log('[CreateBasket] Validated:', validated);
      } catch (validationError: any) {
        console.error('[CreateBasket] Validation error:', validationError);
        throw new Error(`Validation failed: ${validationError.errors?.map((e: any) => e.message).join(', ') || validationError.message}`);
      }
      
      const basketId = validated.symbol.toLowerCase();
      console.log('[CreateBasket] BasketId:', basketId);

      // Call backend API to create basket
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
      const apiKey = process.env.NEXT_PUBLIC_API_KEY || 'development-key-1';
      
      console.log('[CreateBasket] Calling API:', `${apiUrl}/baskets`);

      const basketPayload = {
        id: basketId,
        name: validated.name,
        symbol: validated.symbol,
        description: validated.description || `Basket containing ${validated.composition.length} assets`,
        assets: validated.composition.map((comp, idx) => ({
          assetId: comp.assetType || `asset-${idx}`,
          weight: comp.weight,
          proportion: (comp.weight / 100).toString(),
        })),
      };
      
      console.log('[CreateBasket] Payload:', basketPayload);

      const basketRes = await fetch(`${apiUrl}/baskets`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-API-Key': apiKey,
        },
        body: JSON.stringify(basketPayload),
        signal: AbortSignal.timeout(5000),
      });

      console.log('[CreateBasket] Response status:', basketRes.status);
      const basketData = await basketRes.json();
      console.log('[CreateBasket] Response data:', basketData);

      if (!basketRes.ok) {
        throw new Error(basketData.error || basketData.message || 'Failed to create basket');
      }

      setCurrentBasket(basketId, validated.symbol, CONTRACTS.basketFactory.sepolia);
      setBasketStatus('success');
      setFlowProgress({
        stage: 'basket',
        message: `✓ Basket ${validated.symbol} created`,
        status: 'success',
      });

      // Step 2: Mint with POR Verification
      await new Promise((resolve) => setTimeout(resolve, 1000));

      setFlowProgress({
        stage: 'mint',
        message: 'Minting tokens with POR verification...',
        status: 'processing',
      });

      // Call real backend mint endpoint which triggers POR verification internally
      const mintRes = await fetch(`${apiUrl}/mints`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-API-Key': apiKey,
        },
        body: JSON.stringify({
          basketId: basketId,
          beneficiary: '0x0000000000000000000000000000000000000000',
          amount: mintAmount,
          transactionId: 'TXN-' + Date.now(),
        }),
      });

      const mintData = await mintRes.json();

      if (!mintRes.ok) {
        throw new Error(mintData.error || mintData.message || 'Mint request failed');
      }

      // POR verified and mint succeeded
      setPORInfo(mintData.transactionId, Date.now(), true);
      setPORStatus('success');
      
      // Record mint success
      const mintId = mintData.mintRecord?.id || `MINT-${Date.now()}`;
      recordMint(mintId, mintAmount);
      updateMintStatus(mintId, 'completed');
      setMintStatus('success');

      setFlowProgress({
        stage: 'mint',
        message: `✓ Minted ${mintAmount} tokens (POR verified)`,
        status: 'success',
      });

      // Complete
      await new Promise((resolve) => setTimeout(resolve, 500));
      
      setFlowProgress({
        stage: 'complete',
        message: `🎉 Basket created and ${mintAmount} tokens minted!`,
        status: 'success',
      });

      setFlowStep('mint');
      setSuccess(true);

      // Redirect to results after 3 seconds
      setTimeout(() => {
        router.push('/mint');
      }, 3000);
    } catch (err: any) {
      console.error('[CreateBasket] Flow error:', err);
      const errorMsg = err.message || 'Flow failed';
      setFlowProgress((prev) => ({
        stage: prev?.stage || 'basket',
        message: errorMsg,
        status: 'error',
        error: errorMsg,
      }));
      setError(errorMsg);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    console.log('[CreateBasket] Form submitted');
    setError(null);
    setSuccess(false);
    setLoading(true);
    
    try {
      setFlowProgress({
        stage: 'basket',
        message: 'Starting automated flow...',
        status: 'pending',
      });

      await new Promise((resolve) => setTimeout(resolve, 500));
      await runFullFlow();
    } catch (err: any) {
      console.error('[CreateBasket] Submit error:', err);
      setError(err.message || 'Failed to submit form');
      setFlowProgress({
        stage: 'basket',
        message: err.message || 'Failed',
        status: 'error',
        error: err.message,
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <h2 className="text-2xl font-bold mb-6">Create New Basket</h2>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Basic Info */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Token Name
            </label>
            <input
              type="text"
              name="name"
              value={formData.name}
              onChange={handleInputChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md"
              placeholder="USD Basket"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Token Symbol
            </label>
            <input
              type="text"
              name="symbol"
              value={formData.symbol}
              onChange={handleInputChange}
              maxLength={5}
              className="w-full px-3 py-2 border border-gray-300 rounded-md"
              placeholder="USDB"
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Admin Address
            </label>
            <input
              type="text"
              name="admin"
              value={formData.admin}
              onChange={handleInputChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md font-mono text-sm"
              placeholder="0x..."
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              CRE Forwarder Address
            </label>
            <input
              type="text"
              name="creForwarder"
              value={formData.creForwarder}
              onChange={handleInputChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md font-mono text-sm"
              placeholder="0x..."
            />
          </div>
        </div>

        {/* Composition */}
        <div>
          <div className="flex justify-between items-center mb-3">
            <h3 className="text-lg font-semibold">Asset Composition</h3>
            <button
              type="button"
              onClick={handleAddComposition}
              className="px-3 py-1 bg-primary text-white rounded text-sm"
            >
              + Add Asset
            </button>
          </div>

          <div className="space-y-3">
            {formData.composition.map((comp, idx) => (
              <div key={idx} className="grid grid-cols-4 gap-2 items-end">
                <div>
                  <label className="block text-xs text-gray-600 mb-1">Asset</label>
                  <select
                    value={comp.assetType}
                    onChange={(e) => handleCompositionChange(idx, 'assetType', e.target.value)}
                    className="w-full px-2 py-1 border border-gray-300 rounded text-sm"
                  >
                    <option value="">Select asset</option>
                    {availableAssets.map(asset => (
                      <option key={asset.id} value={asset.id}>
                        {asset.symbol} - {asset.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs text-gray-600 mb-1">Weight (%)</label>
                  <input
                    type="number"
                    value={comp.weight}
                    onChange={(e) => handleCompositionChange(idx, 'weight', parseFloat(e.target.value))}
                    className="w-full px-2 py-1 border border-gray-300 rounded text-sm"
                    min="0"
                    max="100"
                  />
                </div>

                <div>
                  <label className="block text-xs text-gray-600 mb-1">Backing Address</label>
                  <input
                    type="text"
                    value={comp.backing}
                    onChange={(e) => handleCompositionChange(idx, 'backing', e.target.value)}
                    className="w-full px-2 py-1 border border-gray-300 rounded text-sm font-mono"
                    placeholder="0x..."
                  />
                </div>

                {formData.composition.length > 1 && (
                  <button
                    type="button"
                    onClick={() => handleRemoveComposition(idx)}
                    className="px-2 py-1 bg-red-500 text-white rounded text-sm"
                  >
                    Remove
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Auto-Mint Amount */}
        <div className="border-t pt-4">
          <h3 className="text-lg font-semibold mb-3">Initial Auto-Mint</h3>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Mint Amount (in smallest units)
            </label>
            <input
              type="text"
              value={mintAmount}
              onChange={(e) => setMintAmount(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md"
              placeholder="1000000"
            />
            <p className="text-xs text-gray-500 mt-1">
              Amount of tokens to mint after basket creation (e.g., 1000000 = 1 token with 6 decimals)
            </p>
          </div>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 rounded p-3 text-red-700 text-sm">
            {error}
          </div>
        )}

        <button
          type="submit"
          disabled={loading || success}
          className="w-full bg-blue-600 text-white py-2 rounded font-semibold hover:bg-blue-700 disabled:bg-gray-400 transition"
        >
          {loading ? 'Processing...' : success ? 'Redirecting...' : 'Create Basket & Auto-Mint'}
        </button>
      </form>

      {/* Progress Modal */}
      {flowProgress && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-lg p-8 max-w-md w-full mx-4">
            <h3 className="text-lg font-bold mb-6">Automated Minting Flow</h3>

            {/* Step 1: Basket */}
            <div className="mb-6 pb-4 border-b">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-3">
                  {flowProgress.stage === 'basket' && flowProgress.status === 'processing' && (
                    <div className="w-5 h-5 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
                  )}
                  {flowProgress.stage !== 'basket' && (
                    <div className="w-5 h-5 bg-green-500 rounded-full flex items-center justify-center text-white text-sm">
                      ✓
                    </div>
                  )}
                  {flowProgress.stage === 'basket' && flowProgress.status === 'error' && (
                    <div className="w-5 h-5 bg-red-500 rounded-full flex items-center justify-center text-white text-sm">
                      ✗
                    </div>
                  )}
                  <span className="font-semibold">Create Basket</span>
                </div>
              </div>
              {flowProgress.stage === 'basket' && (
                <p className="text-sm text-gray-600 ml-8">
                  {flowProgress.status === 'processing' ? 'Creating basket...' : flowProgress.message}
                </p>
              )}
            </div>

            {/* Step 2: Mint with POR */}
            <div className="mb-6">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-3">
                  {flowProgress.stage === 'mint' && flowProgress.status === 'processing' && (
                    <div className="w-5 h-5 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
                  )}
                  {(flowProgress.stage === 'basket' || (flowProgress.stage === 'mint' && flowProgress.status === 'pending')) && (
                    <div className="w-5 h-5 bg-gray-300 rounded-full" />
                  )}
                  {flowProgress.stage === 'complete' && (
                    <div className="w-5 h-5 bg-green-500 rounded-full flex items-center justify-center text-white text-sm">
                      ✓
                    </div>
                  )}
                  {flowProgress.stage === 'mint' && flowProgress.status === 'error' && (
                    <div className="w-5 h-5 bg-red-500 rounded-full flex items-center justify-center text-white text-sm">
                      ✗
                    </div>
                  )}
                  <span className="font-semibold">Mint Tokens (with POR)</span>
                </div>
              </div>
              {flowProgress.stage === 'mint' && (
                <p className="text-sm text-gray-600 ml-8">
                  {flowProgress.status === 'processing' ? 'Minting tokens with POR verification...' : flowProgress.message}
                </p>
              )}
            </div>

            {/* Error Display */}
            {flowProgress.status === 'error' && (
              <div className="bg-red-50 border border-red-200 rounded p-3 text-red-700 text-sm mb-4">
                <strong>Error:</strong> {flowProgress.error}
              </div>
            )}

            {/* Success Message */}
            {flowProgress.stage === 'complete' && flowProgress.status === 'success' && (
              <div className="bg-green-50 border border-green-200 rounded p-4 text-green-700 text-center">
                <div className="text-3xl mb-2">🎉</div>
                <p className="font-semibold">Complete!</p>
                <p className="text-sm mt-1">Redirecting to minting page...</p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
