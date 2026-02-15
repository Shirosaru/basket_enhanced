'use client';

import { useState, useEffect } from 'react';
import { CreateBasketComponent } from '@/components/CreateBasket';
import { useBasketFlow } from '@/lib/store';

interface Basket {
  id: string;
  name: string;
  symbol: string;
  assets: any[];
}

export default function BasketsPage() {
  const [baskets, setBaskets] = useState<Basket[]>([]);
  const [loading, setLoading] = useState(true);
  const { setCurrentBasket, basketSymbol } = useBasketFlow();

  useEffect(() => {
    // Fetch baskets from backend with timeout
    const fetchBaskets = async () => {
      try {
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 2000); // 2 second timeout

        const res = await fetch('http://localhost:3001/baskets', {
          headers: { 'X-API-Key': 'development-key-1' },
          signal: controller.signal,
        });
        clearTimeout(timeout);

        if (res.ok) {
          const data = await res.json();
          setBaskets(data.baskets || []);
          setLoading(false);
          return;
        }
      } catch (e) {
        // Silently fail and use mock baskets
      }

      // Fallback to mock baskets
      setBaskets([
        {
          id: 'bUSD',
          name: 'Basket USD',
          symbol: 'bUSD',
          assets: [
            { assetId: 'DUSD', weight: 60 },
            { assetId: 'AUDT', weight: 40 },
          ],
        },
        {
          id: 'mixed-basket',
          name: 'Mixed Asset Basket',
          symbol: 'MIXD',
          assets: [
            { assetId: 'DUSD', weight: 70 },
            { assetId: 'LBBT', weight: 30 },
          ],
        },
      ]);
      setLoading(false);
    };

    fetchBaskets();
  }, []);

  const handleSelectBasket = (basket: Basket) => {
    setCurrentBasket(basket.id, basket.symbol, '0x' + '0'.repeat(40));
  };

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold mb-2">Manage Baskets</h1>
        <p className="text-gray-600">Select an existing basket or create a new one.</p>
      </div>

      {/* Existing Baskets */}
      <div>
        <h2 className="text-2xl font-bold mb-4">Available Baskets</h2>
        {loading ? (
          <p className="text-gray-500">Loading baskets...</p>
        ) : baskets.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {baskets.map((basket) => (
              <div
                key={basket.id}
                className={`p-4 rounded-lg border-2 cursor-pointer transition ${
                  basketSymbol === basket.symbol
                    ? 'border-blue-500 bg-blue-50'
                    : 'border-gray-200 bg-white hover:border-blue-300'
                }`}
                onClick={() => handleSelectBasket(basket)}
              >
                <div className="flex items-start justify-between mb-2">
                  <div>
                    <h3 className="font-bold text-lg">{basket.name}</h3>
                    <p className="text-sm text-gray-600 font-mono">{basket.symbol}</p>
                  </div>
                  {basketSymbol === basket.symbol && (
                    <span className="bg-blue-500 text-white px-2 py-1 rounded text-xs">Selected</span>
                  )}
                </div>
                <p className="text-sm text-gray-600 mb-3">
                  {basket.assets.length} asset{basket.assets.length !== 1 ? 's' : ''}
                </p>
                <button
                  onClick={() => handleSelectBasket(basket)}
                  className="w-full bg-blue-600 text-white py-2 rounded font-semibold hover:bg-blue-700 transition"
                >
                  {basketSymbol === basket.symbol ? '✓ Selected' : 'Select'}
                </button>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-gray-500">No baskets available. Create one below.</p>
        )}
      </div>

      {/* Create New Basket */}
      <div className="mt-12 pt-8 border-t">
        <h2 className="text-2xl font-bold mb-4">Create New Basket</h2>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            <CreateBasketComponent />
          </div>

          {/* Info Panel */}
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-bold mb-4">Requirements</h3>
            <ul className="space-y-3 text-sm text-gray-600">
              <li className="flex gap-2">
                <span>✓</span>
                <span>Token name and symbol</span>
              </li>
              <li className="flex gap-2">
                <span>✓</span>
                <span>Admin address</span>
              </li>
              <li className="flex gap-2">
                <span>✓</span>
                <span>CRE Forwarder address</span>
              </li>
              <li className="flex gap-2">
                <span>✓</span>
                <span>Asset composition</span>
              </li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
