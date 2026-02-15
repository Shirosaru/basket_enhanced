'use client';

import { useEffect, useState } from 'react';
import { MintRequestComponent } from '@/components/MintRequest';
import { useBasketFlow } from '@/lib/store';

export default function MintPage() {
  const [mounted, setMounted] = useState(false);
  const { currentBasketId, isPORValid, basketSymbol } = useBasketFlow();
  
  useEffect(() => {
    setMounted(true);
  }, []);

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold mb-2">Mint Tokens</h1>
        <p className="text-gray-600">Mint stablecoins from your baskets after POR verification.</p>
      </div>

      {!mounted ? (
        <div className="text-gray-500">Loading...</div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Mint Form */}
          <div className="lg:col-span-2">
            {currentBasketId ? (
              <>
                <div className="mb-4 bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <p className="text-sm text-blue-900">
                    <span className="font-semibold">Basket:</span> {basketSymbol}
                  </p>
                  {!isPORValid && (
                    <p className="text-sm text-amber-700 mt-2">
                      ⚠️ POR verification required. <a href="/por" className="underline">Go to POR page</a>
                    </p>
                  )}
                  {isPORValid && (
                    <p className="text-sm text-green-700 mt-2">
                      ✓ POR verified and valid
                    </p>
                  )}
                </div>
                <MintRequestComponent stablecoinAddress="0x0000000000000000000000000000000000000000" />
              </>
            ) : (
              <div className="bg-white rounded-lg shadow p-6">
                <div className="text-center py-12">
                  <p className="text-gray-600 mb-4">Please select a basket first</p>
                  <a href="/baskets" className="px-4 py-2 bg-blue-600 text-white rounded inline-block">
                    Go to Baskets
                  </a>
                </div>
              </div>
            )}
          </div>

          {/* Info Panel */}
          <div className="space-y-4">
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <h3 className="font-semibold text-blue-900 mb-3">✓ Mint Requirements</h3>
              <ul className="text-sm text-blue-800 space-y-2">
                <li>✓ Basket selected</li>
                <li className={isPORValid ? '✓ text-green-700' : '✗ text-amber-700'}>
                  {isPORValid ? '✓' : '✗'} POR verified & valid
                </li>
                <li>✓ Valid beneficiary address</li>
                <li>✓ Positive mint amount</li>
                <li>✓ Sufficient reserves backing</li>
              </ul>
            </div>

            <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
              <h3 className="font-semibold text-amber-900 mb-3">Why POR Required</h3>
              <p className="text-sm text-amber-800 mb-3">
                Proof of Reserve verification ensures that sufficient assets back every token minted. Verified through Chainlink CRE Workflow.
              </p>
              <ul className="text-xs text-amber-700 space-y-1 list-disc list-inside">
                <li>Prevents over-minting</li>
                <li>Maintains 1:1 backing</li>
                <li>Verifies real reserves exist</li>
                <li>Ensures minter trust</li>
              </ul>
            </div>

            <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
              <h3 className="font-semibold text-gray-900 mb-3">CRE Workflow</h3>
              <ol className="text-xs text-gray-700 space-y-1 list-decimal list-inside">
                <li>Mint request submitted</li>
                <li>CRE workflow triggered</li>
                <li>Chainlink POR oracle called</li>
                <li>Reserves verified</li>
                <li>Signed report generated</li>
                <li>Tokens minted on-chain</li>
              </ol>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
