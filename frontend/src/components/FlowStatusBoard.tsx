'use client';

import { useEffect, useState } from 'react';
import { useBasketFlow } from '@/lib/store';
import Link from 'next/link';

export function FlowStatusBoard() {
  const {
    currentBasketId,
    basketSymbol,
    isPORValid,
    porVerifiedAt,
    lastMintId,
    lastMintStatus,
    lastMintAmount,
    flowStep,
    mintHistory,
  } = useBasketFlow();

  const [porExpired, setPorExpired] = useState(false);
  const [timeRemaining, setTimeRemaining] = useState<string>('');

  // Check POR expiration every second
  useEffect(() => {
    if (!porVerifiedAt) return;

    const checkExpiration = () => {
      const now = Date.now();
      const elapsed = (now - porVerifiedAt) / 1000; // seconds
      const expiresIn = 3600 - elapsed; // 1 hour window

      if (expiresIn <= 0) {
        setPorExpired(true);
        setTimeRemaining('Expired');
      } else {
        setPorExpired(false);
        const minutes = Math.floor(expiresIn / 60);
        const seconds = Math.floor(expiresIn % 60);
        setTimeRemaining(`${minutes}m ${seconds}s`);
      }
    };

    checkExpiration();
    const interval = setInterval(checkExpiration, 1000);
    return () => clearInterval(interval);
  }, [porVerifiedAt]);

  return (
    <div className="fixed top-0 right-0 w-96 max-h-screen bg-white border-l border-gray-200 overflow-y-auto">
      <div className="sticky top-0 bg-gradient-to-b from-blue-50 to-white border-b border-gray-200 p-4 z-10">
        <h2 className="font-bold text-lg">Minting Flow Status</h2>
        <p className="text-sm text-gray-600">Current Step: {flowStep.toUpperCase()}</p>
      </div>

      <div className="p-4 space-y-6">
        {/* Step 1: Basket Selection */}
        <div className={`border-2 rounded-lg p-4 ${currentBasketId ? 'border-green-300 bg-green-50' : 'border-gray-300 bg-gray-50'}`}>
          <div className="flex items-center justify-between mb-2">
            <h3 className="font-semibold flex items-center gap-2">
              <span className={`w-6 h-6 rounded-full flex items-center justify-center text-white text-sm ${currentBasketId ? 'bg-green-500' : 'bg-gray-400'}`}>
                {currentBasketId ? '✓' : '1'}
              </span>
              Basket Selected
            </h3>
            <Link href="/baskets" className="text-sm text-blue-600 hover:underline">
              Change
            </Link>
          </div>
          {currentBasketId ? (
            <div className="text-sm space-y-1 ml-8">
              <p>
                <span className="text-gray-600">ID:</span> {currentBasketId}
              </p>
              <p>
                <span className="text-gray-600">Symbol:</span> {basketSymbol}
              </p>
            </div>
          ) : (
            <div className="text-sm text-gray-600 ml-8">
              <Link href="/baskets" className="text-blue-600 hover:underline">
                Click to select or create a basket
              </Link>
            </div>
          )}
        </div>

        {/* Step 2: POR Verification */}
        <div className={`border-2 rounded-lg p-4 ${isPORValid && !porExpired ? 'border-green-300 bg-green-50' : isPORValid && porExpired ? 'border-yellow-300 bg-yellow-50' : 'border-gray-300 bg-gray-50'}`}>
          <div className="flex items-center justify-between mb-2">
            <h3 className="font-semibold flex items-center gap-2">
              <span className={`w-6 h-6 rounded-full flex items-center justify-center text-white text-sm ${isPORValid && !porExpired ? 'bg-green-500' : porExpired ? 'bg-yellow-500' : 'bg-gray-400'}`}>
                {isPORValid && !porExpired ? '✓' : '2'}
              </span>
              POR Verified
            </h3>
            <Link href="/por" className="text-sm text-blue-600 hover:underline">
              {isPORValid && !porExpired ? 'Update' : 'Setup'}
            </Link>
          </div>
          {isPORValid ? (
            <div className="text-sm space-y-1 ml-8">
              <p className="text-gray-600">Status: {porExpired ? '⚠️ Expired' : '✓ Valid'}</p>
              <p className="text-gray-600">Expires in: {timeRemaining}</p>
              {porExpired && <p className="text-yellow-700 font-medium">POR verification expired. Update to continue minting.</p>}
            </div>
          ) : (
            <div className="text-sm text-gray-600 ml-8">
              <Link href="/por" className="text-blue-600 hover:underline">
                Click to verify Proof of Reserve
              </Link>
            </div>
          )}
        </div>

        {/* Step 3: Minting */}
        <div className={`border-2 rounded-lg p-4 ${lastMintStatus === 'completed' ? 'border-green-300 bg-green-50' : lastMintStatus === 'pending' ? 'border-blue-300 bg-blue-50' : lastMintStatus === 'failed' ? 'border-red-300 bg-red-50' : 'border-gray-300 bg-gray-50'}`}>
          <div className="flex items-center justify-between mb-2">
            <h3 className="font-semibold flex items-center gap-2">
              <span className={`w-6 h-6 rounded-full flex items-center justify-center text-white text-sm ${
                lastMintStatus === 'completed' ? 'bg-green-500' : lastMintStatus === 'pending' ? 'bg-blue-500 animate-spin' : lastMintStatus === 'failed' ? 'bg-red-500' : 'bg-gray-400'
              }`}>
                {lastMintStatus === 'completed' ? '✓' : lastMintStatus === 'pending' ? '⟳' : '3'}
              </span>
              Minting
            </h3>
            {isPORValid && !porExpired && (
              <Link href="/mint" className="text-sm text-blue-600 hover:underline">
                {lastMintStatus ? 'New Mint' : 'Start'}
              </Link>
            )}
          </div>
          {lastMintId ? (
            <div className="text-sm space-y-1 ml-8">
              <p>
                <span className="text-gray-600">Mint ID:</span> {lastMintId}
              </p>
              <p>
                <span className="text-gray-600">Amount:</span> {lastMintAmount}
              </p>
              <p className="flex items-center gap-2">
                <span className="text-gray-600">Status:</span>
                <span className={`font-medium ${
                  lastMintStatus === 'completed' ? 'text-green-600' : lastMintStatus === 'pending' ? 'text-blue-600' : 'text-red-600'
                }`}>
                  {lastMintStatus === 'completed' ? '✓ Completed' : lastMintStatus === 'pending' ? '⟳ Processing...' : '✗ Failed'}
                </span>
              </p>
            </div>
          ) : (
            <div className="text-sm text-gray-600 ml-8">
              {isPORValid && !porExpired ? (
                <Link href="/mint" className="text-blue-600 hover:underline">
                  Click to initiate minting
                </Link>
              ) : (
                <p>Complete POR verification first</p>
              )}
            </div>
          )}
        </div>

        {/* Mint History */}
        {mintHistory.length > 0 && (
          <div className="border border-gray-200 rounded-lg p-4">
            <h3 className="font-semibold mb-3">Recent Mints</h3>
            <div className="space-y-2 max-h-48 overflow-y-auto">
              {mintHistory.slice(0, 5).map((mint) => (
                <div key={mint.id} className="text-xs bg-gray-50 p-2 rounded border border-gray-200">
                  <p className="font-medium">{mint.id}</p>
                  <p className="text-gray-600">Amount: {mint.amount}</p>
                  <p className={`text-xs font-medium ${
                    mint.status === 'completed' ? 'text-green-600' : mint.status === 'pending' ? 'text-blue-600' : 'text-red-600'
                  }`}>
                    {mint.status.toUpperCase()}
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div className="space-y-2 pt-4 border-t border-gray-200">
          <button
            onClick={() => {
              window.location.href = '/';
            }}
            className="w-full px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 text-sm font-medium"
          >
            Back to Dashboard
          </button>
        </div>
      </div>
    </div>
  );
}
