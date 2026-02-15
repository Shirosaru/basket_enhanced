'use client';

import { useState } from 'react';
import { PORVerificationComponent } from '@/components/PORVerification';

export default function PORPage() {
  const [selectedBasket, setSelectedBasket] = useState('');

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold mb-2">Proof of Reserve</h1>
        <p className="text-gray-600">Manage and verify POR for your baskets using Chainlink oracles.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* POR Component */}
        <div className="lg:col-span-2">
          {selectedBasket ? (
            <PORVerificationComponent stablecoinAddress={selectedBasket} />
          ) : (
            <div className="bg-white rounded-lg shadow p-6">
              <div className="text-center py-12">
                <p className="text-gray-600 mb-4">Please select a basket first</p>
                <button
                  onClick={() => setSelectedBasket('0x0000000000000000000000000000000000000000')}
                  className="px-4 py-2 bg-primary text-white rounded"
                >
                  Select Basket
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Info Panel */}
        <div className="bg-white rounded-lg shadow p-6 space-y-6">
          <div>
            <h3 className="text-lg font-bold mb-3">How POR Works</h3>
            <ol className="space-y-2 text-sm text-gray-600">
              <li className="flex gap-2">
                <span className="font-bold">1.</span>
                <span>Issuer deposits reserves into smart contract</span>
              </li>
              <li className="flex gap-2">
                <span className="font-bold">2.</span>
                <span>Chainlink oracle verifies reserve amounts</span>
              </li>
              <li className="flex gap-2">
                <span className="font-bold">3.</span>
                <span>Oracle signs POR hash with timestamp</span>
              </li>
              <li className="flex gap-2">
                <span className="font-bold">4.</span>
                <span>Minting enabled for 1 hour window</span>
              </li>
              <li className="flex gap-2">
                <span className="font-bold">5.</span>
                <span>After 1 hour, refresh POR to continue</span>
              </li>
            </ol>
          </div>

          <div>
            <h4 className="font-semibold text-sm mb-2">Chainlink Integration</h4>
            <p className="text-xs text-gray-600">
              Uses Chainlink's decentralized oracle network to provide tamper-proof, real-time proof of reserve data.
            </p>
          </div>

          <div>
            <h4 className="font-semibold text-sm mb-2">Reserve Ratio</h4>
            <p className="text-xs text-gray-600">
              Minimum 100% - every token must be backed by equal reserve value. Smart contracts enforce this automatically.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
