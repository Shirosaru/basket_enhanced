'use client';

import Link from 'next/link';

export default function Home() {
  return (
    <div className="space-y-12">
      {/* Hero */}
      <div className="bg-gradient-to-r from-blue-600 to-blue-800 text-white rounded-lg p-8">
        <h1 className="text-4xl font-bold mb-4">🧺 Basket Enhanced</h1>
        <p className="text-xl mb-6">
          Create and manage POR-backed stablecoins with full Chainlink integration
        </p>
        <div className="grid grid-cols-3 gap-4">
          <div>
            <div className="text-3xl font-bold">100%</div>
            <p className="text-blue-100">Reserve-Backed</p>
          </div>
          <div>
            <div className="text-3xl font-bold">Multi-Chain</div>
            <p className="text-blue-100">Deployment Ready</p>
          </div>
          <div>
            <div className="text-3xl font-bold">ACE</div>
            <p className="text-blue-100">Policy Protected</p>
          </div>
        </div>
      </div>

      {/* CTA: Create or Select Basket */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Create Basket */}
        <Link href="/baskets">
          <div className="bg-gradient-to-br from-green-50 to-green-100 border-2 border-green-500 rounded-lg p-8 cursor-pointer hover:shadow-lg transition transform hover:scale-105 h-full">
            <div className="text-5xl mb-4">✨</div>
            <h2 className="text-2xl font-bold text-green-900 mb-3">Create New Basket</h2>
            <p className="text-green-800 mb-4">
              Start fresh with a new stablecoin basket. Configure name, symbol, and asset composition.
            </p>
            <div className="flex items-center text-green-700 font-semibold">
              <span>Get Started</span>
              <span className="ml-2">→</span>
            </div>
          </div>
        </Link>

        {/* Select Existing Basket */}
        <Link href="/baskets">
          <div className="bg-gradient-to-br from-purple-50 to-purple-100 border-2 border-purple-500 rounded-lg p-8 cursor-pointer hover:shadow-lg transition transform hover:scale-105 h-full">
            <div className="text-5xl mb-4">📋</div>
            <h2 className="text-2xl font-bold text-purple-900 mb-3">View All Baskets</h2>
            <p className="text-purple-800 mb-4">
              Browse existing baskets, check POR status, and proceed to minting. Full dashboard view.
            </p>
            <div className="flex items-center text-purple-700 font-semibold">
              <span>Browse Baskets</span>
              <span className="ml-2">→</span>
            </div>
          </div>
        </Link>
      </div>

      {/* Quick Actions */}
      <section className="bg-gradient-to-r from-indigo-500 to-indigo-700 text-white rounded-lg p-8">
        <h2 className="text-2xl font-bold mb-6">Quick Actions</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Link href="/baskets" className="bg-white/20 hover:bg-white/30 rounded-lg p-4 transition text-center">
            <div className="text-3xl mb-2">🔨</div>
            <h3 className="font-bold mb-1">Create Basket</h3>
            <p className="text-sm text-indigo-100">Auto POR & Mint</p>
          </Link>
          <Link href="/baskets" className="bg-white/20 hover:bg-white/30 rounded-lg p-4 transition text-center">
            <div className="text-3xl mb-2">📍</div>
            <h3 className="font-bold mb-1">Select Basket</h3>
            <p className="text-sm text-indigo-100">Start Minting</p>
          </Link>
          <Link href="/flow" className="bg-white/20 hover:bg-white/30 rounded-lg p-4 transition text-center">
            <div className="text-3xl mb-2">⚡</div>
            <h3 className="font-bold mb-1">Full Flow Demo</h3>
            <p className="text-sm text-indigo-100">Auto-Flow</p>
          </Link>
        </div>
      </section>

      {/* Features */}
      <section>
        <h2 className="text-3xl font-bold mb-8">Key Features</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <FeatureCard
            icon="🔐"
            title="Proof of Reserve"
            description="Cryptographic verification of reserves using Chainlink oracles. Every token is 100% backed."
          />
          <FeatureCard
            icon="🧺"
            title="Flexible Baskets"
            description="Create baskets with multiple asset types and weights. Support for any collateral type."
          />
          <FeatureCard
            icon="⛓️"
            title="Multi-Chain"
            description="Deploy across Ethereum, Polygon, Arbitrum, Optimism, Base, and Avalanche."
          />
          <FeatureCard
            icon="🛡️"
            title="Policy Protected"
            description="ACE-powered compliance and policy enforcement. Blacklist and whitelist support."
          />
          <FeatureCard
            icon="🔄"
            title="CCIP Bridge"
            description="Cross-chain messaging with Chainlink CCIP for seamless asset transfers."
          />
          <FeatureCard
            icon="📊"
            title="Real-Time Status"
            description="Dashboard view of POR status, reserve ratios, and asset composition."
          />
        </div>
      </section>

      {/* Quick Start */}
      <section className="bg-gray-50 rounded-lg p-8">
        <h2 className="text-3xl font-bold mb-6">Getting Started</h2>
        <div className="space-y-4">
          <Step number={1} title="Create a Basket" description="Define your stablecoin's name, symbol, and asset composition." />
          <Step number={2} title="Set Up POR" description="Link your Chainlink POR oracle and set reserve requirements." />
          <Step number={3} title="Mint Tokens" description="Mint stablecoins after POR verification confirms sufficient reserves." />
          <Step number={4} title="Deploy Multi-Chain" description="Extend your basket to other blockchains via CCIP." />
        </div>
      </section>
    </div>
  );
}

function FeatureCard({ icon, title, description }: { icon: string; title: string; description: string }) {
  return (
    <div className="bg-white rounded-lg shadow p-6">
      <div className="text-3xl mb-3">{icon}</div>
      <h3 className="text-lg font-bold mb-2">{title}</h3>
      <p className="text-gray-600">{description}</p>
    </div>
  );
}

function Step({ number, title, description }: { number: number; title: string; description: string }) {
  return (
    <div className="flex gap-4">
      <div className="flex-shrink-0">
        <div className="flex items-center justify-center h-10 w-10 rounded-full bg-primary text-white font-bold">
          {number}
        </div>
      </div>
      <div>
        <h3 className="text-lg font-bold">{title}</h3>
        <p className="text-gray-600">{description}</p>
      </div>
    </div>
  );
}
