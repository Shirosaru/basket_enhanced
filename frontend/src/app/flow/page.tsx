'use client';

import { useEffect, useState } from 'react';
import { useBasketFlow } from '@/lib/store';
import { CreateBasketSchema, PORVerificationSchema, MintRequestSchema } from '@/lib/schemas';
import type { CreateBasketFormData, PORVerificationData, MintRequestFormData } from '@/lib/schemas';

export default function FlowPage() {
  const {
    basketStatus,
    porStatus,
    mintStatus,
    basketError,
    porError,
    mintError,
    setBasketStatus,
    setPORStatus,
    setMintStatus,
    setCurrentBasket,
    setPORInfo,
    recordMint,
    updateMintStatus,
  } = useBasketFlow();

  const [basketData, setBasketData] = useState<CreateBasketFormData>({
    name: 'USD Basket',
    symbol: 'USDB',
    admin: '0x0000000000000000000000000000000000000000',
    creForwarder: '0x0000000000000000000000000000000000000000',
    composition: [
      {
        assetType: 'USD',
        weight: 100,
        backing: '0x0000000000000000000000000000000000000000',
      },
    ],
  });

  const [porData, setPorData] = useState<PORVerificationData>({
    porHash: '0x' + '0'.repeat(64),
    reserveBalance: '1000000000000',
  });

  const [mintData, setMintData] = useState<MintRequestFormData>({
    beneficiary: '0x0000000000000000000000000000000000000000',
    amount: '1000000',
    transactionId: 'TXN-' + Date.now(),
  });

  // Step 1: Create Basket
  const handleCreateBasket = async () => {
    try {
      setBasketStatus('pending');
      const validated = CreateBasketSchema.parse(basketData);
      
      // Simulate basket creation
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      const basketId = validated.symbol.toLowerCase();
      setCurrentBasket(basketId, validated.symbol, '0x' + '0'.repeat(40));
      setBasketStatus('success');
      return true;
    } catch (err: any) {
      setBasketStatus('error', err.message);
      return false;
    }
  };

  // Step 2: Verify POR
  const handleVerifyPOR = async () => {
    try {
      setPORStatus('pending');
      const validated = PORVerificationSchema.parse(porData);
      
      // Simulate POR verification
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      setPORInfo(validated.porHash, Date.now(), true);
      setPORStatus('success');
      return true;
    } catch (err: any) {
      setPORStatus('error', err.message);
      return false;
    }
  };

  // Step 3: Mint Tokens
  const handleMint = async () => {
    try {
      setMintStatus('pending');
      const validated = MintRequestSchema.parse(mintData);
      
      const mintId = `MINT-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
      recordMint(mintId, validated.amount);
      
      // Simulate minting
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      updateMintStatus(mintId, 'completed');
      setMintStatus('success');
      return true;
    } catch (err: any) {
      setMintStatus('error', err.message);
      return false;
    }
  };

  // Auto-progress through steps
  useEffect(() => {
    const runFlow = async () => {
      if (basketStatus === null) {
        await handleCreateBasket();
      }
    };
    runFlow();
  }, []);

  useEffect(() => {
    const runFlow = async () => {
      if (basketStatus === 'success' && porStatus === null) {
        await new Promise(resolve => setTimeout(resolve, 500));
        await handleVerifyPOR();
      }
    };
    runFlow();
  }, [basketStatus]);

  useEffect(() => {
    const runFlow = async () => {
      if (porStatus === 'success' && mintStatus === null) {
        await new Promise(resolve => setTimeout(resolve, 500));
        await handleMint();
      }
    };
    runFlow();
  }, [porStatus]);

  return (
    <div className="max-w-4xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Basket Creation & Minting Flow</h1>
        <p className="text-gray-600">Automatic end-to-end workflow with PoR verification</p>
      </div>

      <div className="space-y-6">
        {/* Step 1: Basket */}
        <div className="bg-white rounded-lg shadow p-6 border-l-4 border-blue-500">
          <div className="flex items-start justify-between mb-4">
            <div>
              <h2 className="text-xl font-bold">Step 1: Create Basket</h2>
              <p className="text-sm text-gray-600">USDB token configuration</p>
            </div>
            <div className="flex items-center gap-2">
              {basketStatus === 'pending' && (
                <div className="flex items-center gap-2 text-blue-600">
                  <div className="animate-spin w-4 h-4 border-2 border-blue-600 border-t-transparent rounded-full"></div>
                  <span className="text-sm font-medium">Processing...</span>
                </div>
              )}
              {basketStatus === 'success' && (
                <div className="flex items-center gap-2 text-green-600">
                  <span className="text-lg">✓</span>
                  <span className="text-sm font-medium">Complete</span>
                </div>
              )}
              {basketStatus === 'error' && (
                <div className="flex items-center gap-2 text-red-600">
                  <span className="text-lg">✗</span>
                  <span className="text-sm font-medium">Failed</span>
                </div>
              )}
            </div>
          </div>

          {basketStatus === 'error' && basketError && (
            <div className="bg-red-50 border border-red-200 rounded p-3 text-red-700 text-sm mb-4">
              <strong>Error:</strong> {basketError}
            </div>
          )}

          {basketStatus && basketStatus !== 'success' && !basketStatus.includes('error') && (
            <div className="space-y-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Token Name</label>
                <input
                  type="text"
                  value={basketData.name}
                  onChange={(e) => setBasketData({ ...basketData, name: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  disabled
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Token Symbol</label>
                <input
                  type="text"
                  value={basketData.symbol}
                  onChange={(e) => setBasketData({ ...basketData, symbol: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  disabled
                />
              </div>
            </div>
          )}

          {basketStatus === 'success' && (
            <div className="bg-green-50 border border-green-200 rounded p-3 text-green-700 text-sm">
              ✓ Basket <strong>{basketData.symbol}</strong> created successfully
            </div>
          )}
        </div>

        {/* Step 2: POR */}
        <div className={`bg-white rounded-lg shadow p-6 border-l-4 ${
          porStatus === null ? 'border-gray-300' : 'border-blue-500'
        } ${porStatus === null ? 'opacity-60' : ''}`}>
          <div className="flex items-start justify-between mb-4">
            <div>
              <h2 className="text-xl font-bold">Step 2: Verify Proof of Reserve</h2>
              <p className="text-sm text-gray-600">CRE Workflow validation</p>
            </div>
            <div className="flex items-center gap-2">
              {porStatus === 'pending' && (
                <div className="flex items-center gap-2 text-blue-600">
                  <div className="animate-spin w-4 h-4 border-2 border-blue-600 border-t-transparent rounded-full"></div>
                  <span className="text-sm font-medium">Processing...</span>
                </div>
              )}
              {porStatus === 'success' && (
                <div className="flex items-center gap-2 text-green-600">
                  <span className="text-lg">✓</span>
                  <span className="text-sm font-medium">Complete</span>
                </div>
              )}
              {porStatus === 'error' && (
                <div className="flex items-center gap-2 text-red-600">
                  <span className="text-lg">✗</span>
                  <span className="text-sm font-medium">Failed</span>
                </div>
              )}
            </div>
          </div>

          {porStatus === 'error' && porError && (
            <div className="bg-red-50 border border-red-200 rounded p-3 text-red-700 text-sm mb-4">
              <strong>Error:</strong> {porError}
            </div>
          )}

          {porStatus && porStatus !== 'success' && !porStatus.includes('error') && (
            <div className="space-y-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">POR Hash</label>
                <input
                  type="text"
                  value={porData.porHash}
                  onChange={(e) => setPorData({ ...porData, porHash: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md font-mono text-sm"
                  disabled
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Reserve Balance</label>
                <input
                  type="text"
                  value={porData.reserveBalance}
                  onChange={(e) => setPorData({ ...porData, reserveBalance: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  disabled
                />
              </div>
            </div>
          )}

          {porStatus === 'success' && (
            <div className="bg-green-50 border border-green-200 rounded p-3 text-green-700 text-sm">
              ✓ POR verified and valid for minting
            </div>
          )}
        </div>

        {/* Step 3: Mint */}
        <div className={`bg-white rounded-lg shadow p-6 border-l-4 ${
          mintStatus === null ? 'border-gray-300' : 'border-blue-500'
        } ${mintStatus === null ? 'opacity-60' : ''}`}>
          <div className="flex items-start justify-between mb-4">
            <div>
              <h2 className="text-xl font-bold">Step 3: Mint Tokens</h2>
              <p className="text-sm text-gray-600">Issue stablecoins with backing</p>
            </div>
            <div className="flex items-center gap-2">
              {mintStatus === 'pending' && (
                <div className="flex items-center gap-2 text-blue-600">
                  <div className="animate-spin w-4 h-4 border-2 border-blue-600 border-t-transparent rounded-full"></div>
                  <span className="text-sm font-medium">Processing...</span>
                </div>
              )}
              {mintStatus === 'success' && (
                <div className="flex items-center gap-2 text-green-600">
                  <span className="text-lg">✓</span>
                  <span className="text-sm font-medium">Complete</span>
                </div>
              )}
              {mintStatus === 'error' && (
                <div className="flex items-center gap-2 text-red-600">
                  <span className="text-lg">✗</span>
                  <span className="text-sm font-medium">Failed</span>
                </div>
              )}
            </div>
          </div>

          {mintStatus === 'error' && mintError && (
            <div className="bg-red-50 border border-red-200 rounded p-3 text-red-700 text-sm mb-4">
              <strong>Error:</strong> {mintError}
            </div>
          )}

          {mintStatus && mintStatus !== 'success' && !mintStatus.includes('error') && (
            <div className="space-y-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Beneficiary Address</label>
                <input
                  type="text"
                  value={mintData.beneficiary}
                  onChange={(e) => setMintData({ ...mintData, beneficiary: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md font-mono text-sm"
                  disabled
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Amount</label>
                <input
                  type="text"
                  value={mintData.amount}
                  onChange={(e) => setMintData({ ...mintData, amount: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  disabled
                />
              </div>
            </div>
          )}

          {mintStatus === 'success' && (
            <div className="bg-green-50 border border-green-200 rounded p-3 text-green-700 text-sm">
              ✓ Minting complete! {mintData.amount} tokens issued.
            </div>
          )}
        </div>

        {/* Summary */}
        {basketStatus === 'success' && porStatus === 'success' && mintStatus === 'success' && (
          <div className="bg-green-50 border-2 border-green-500 rounded-lg p-6">
            <h3 className="text-xl font-bold text-green-900 mb-3">🎉 Flow Complete!</h3>
            <p className="text-green-800 mb-4">
              Successfully created basket, verified reserves through PoR, and minted tokens.
            </p>
            <div className="space-y-2 text-sm text-green-700">
              <p>✓ Basket: {basketData.symbol}</p>
              <p>✓ PoR Status: Valid</p>
              <p>✓ Tokens Minted: {mintData.amount}</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
