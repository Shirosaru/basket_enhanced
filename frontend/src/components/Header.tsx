'use client';

import { useState } from 'react';
import { ConnectButton } from '@rainbow-me/rainbowkit';
import Link from 'next/link';
import { useBasketFlow } from '@/lib/store';

const CHAINS = [
  { id: 'ethereum-mainnet', name: 'Ethereum Mainnet', icon: '⟠' },
  { id: 'ethereum-sepolia', name: 'Ethereum Sepolia', icon: '⟠' },
  { id: 'polygon-mainnet', name: 'Polygon', icon: '🟣' },
  { id: 'polygon-amoy', name: 'Polygon Amoy', icon: '🟣' },
  { id: 'arbitrum-mainnet', name: 'Arbitrum', icon: '🔵' },
  { id: 'arbitrum-sepolia', name: 'Arbitrum Sepolia', icon: '🔵' },
];

export function Header() {
  const { selectedChain, setSelectedChain } = useBasketFlow();
  const [dropdownOpen, setDropdownOpen] = useState(false);

  const currentChain = CHAINS.find(c => c.id === selectedChain);
  const displayChain = currentChain || CHAINS[0]; // Default to Ethereum Mainnet

  return (
    <header className="bg-white shadow">
      <nav className="max-w-7xl mx-auto px-4 py-4 flex justify-between items-center">
        <div className="text-2xl font-bold text-primary">
          <Link href="/">🧺 Basket Enhanced</Link>
        </div>
        <div className="flex gap-6 items-center">
          <Link href="/" className="text-gray-600 hover:text-gray-900">
            Home
          </Link>
          <Link href="/baskets" className="text-gray-600 hover:text-gray-900">
            Baskets
          </Link>
          <Link href="/mint" className="text-gray-600 hover:text-gray-900">
            Mint
          </Link>
          <Link href="/por" className="text-gray-600 hover:text-gray-900">
            POR
          </Link>
          
          {/* Chain Selector Dropdown */}
          <div className="relative">
            <button
              onClick={() => setDropdownOpen(!dropdownOpen)}
              className="flex items-center gap-2 px-3 py-2 bg-blue-50 border border-blue-200 rounded-lg hover:bg-blue-100 transition text-sm font-medium text-gray-700"
            >
              <span>{displayChain.icon}</span>
              <span className="max-w-xs truncate">{displayChain.name}</span>
              <span className="text-xs">▼</span>
            </button>
            
            {dropdownOpen && (
              <div className="absolute right-0 mt-2 w-48 bg-white border border-gray-200 rounded-lg shadow-lg z-50">
                {CHAINS.map((chain) => (
                  <button
                    key={chain.id}
                    onClick={() => {
                      setSelectedChain(chain.id);
                      setDropdownOpen(false);
                    }}
                    className={`w-full text-left px-4 py-2 flex items-center gap-2 ${
                      selectedChain === chain.id
                        ? 'bg-blue-50 border-l-4 border-blue-500 text-blue-900 font-semibold'
                        : 'hover:bg-gray-50 text-gray-700'
                    }`}
                  >
                    <span>{chain.icon}</span>
                    <span>{chain.name}</span>
                    {selectedChain === chain.id && <span className="ml-auto">✓</span>}
                  </button>
                ))}
              </div>
            )}
          </div>

          <ConnectButton />
        </div>
      </nav>
    </header>
  );
}
