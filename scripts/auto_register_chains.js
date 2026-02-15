#!/usr/bin/env node
/**
 * Auto-register common chains (Ethereum, Polygon) with the backend.
 *
 * Usage:
 *   node scripts/auto_register_chains.js
 * or
 *   node -r dotenv/config scripts/auto_register_chains.js
 *
 * Environment vars (from .env or shell):
 *   BACKEND_URL (default: http://localhost:3001)
 *   BACKEND_API_KEY or VALID_API_KEYS (required for protected endpoints)
 *   ALCHEMY_API_KEY (required to construct RPC URLs)
 */

import fs from 'fs'
import path from 'path'

// Try to load .env if present
try {
  const dotenvPath = path.join(process.cwd(), '.env')
  if (fs.existsSync(dotenvPath)) {
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    require('dotenv').config({ path: dotenvPath })
  }
} catch (e) {
  // ignore
}

const BACKEND_URL = process.env.BACKEND_URL || 'http://localhost:3001'
// If VALID_API_KEYS is a comma-separated list, take the first key for requests
const rawApiKeys = process.env.BACKEND_API_KEY || process.env.VALID_API_KEYS || process.env.BACKEND_API || ''
const API_KEY = rawApiKeys.split(',').map(k => k.trim()).filter(Boolean)[0] || 'my-demo-key'
const ALCHEMY_KEY = process.env.ALCHEMY_API_KEY || process.env.ALCHEMY_KEY || ''

if (!ALCHEMY_KEY) {
  console.error('ALCHEMY_API_KEY not found in environment. Set ALCHEMY_API_KEY in .env or env vars.')
  process.exit(1)
}

const chains = [
  {
    id: 'ethereum-mainnet',
    name: 'ethereum',
    displayName: 'Ethereum Mainnet',
    chainId: 1,
    rpcUrl: `https://eth-mainnet.g.alchemy.com/v2/${ALCHEMY_KEY}`,
    explorerUrl: 'https://etherscan.io',
    isTestnet: false,
    nativeCurrency: { name: 'Ether', symbol: 'ETH', decimals: 18 },
  },
  {
    id: 'polygon-mainnet',
    name: 'polygon',
    displayName: 'Polygon Mainnet',
    chainId: 137,
    rpcUrl: `https://polygon-mainnet.g.alchemy.com/v2/${ALCHEMY_KEY}`,
    explorerUrl: 'https://polygonscan.com',
    isTestnet: false,
    nativeCurrency: { name: 'Matic', symbol: 'MATIC', decimals: 18 },
  },
]

async function registerChain(chain) {
  const url = `${BACKEND_URL.replace(/\/$/, '')}/chains/register`
  console.log(`Registering ${chain.id} -> ${url}`)

  try {
    const res = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-API-Key': API_KEY,
      },
      body: JSON.stringify(chain),
    })

    const text = await res.text()
    let json
    try { json = JSON.parse(text) } catch { json = text }

    if (!res.ok) {
      console.error(`Failed to register ${chain.id}:`, res.status, json)
      return { ok: false, status: res.status, body: json }
    }

    console.log(`Registered ${chain.id}:`, json)
    return { ok: true, status: res.status, body: json }
  } catch (err) {
    console.error(`Error registering ${chain.id}:`, err)
    return { ok: false, error: String(err) }
  }
}

async function main() {
  console.log('Auto-register chains using backend:', BACKEND_URL)
  console.log('Using API key from env (X-API-Key).')

  for (const c of chains) {
    // Check if already registered by querying it
    try {
      const getUrl = `${BACKEND_URL.replace(/\/$/, '')}/chains/${c.id}`
      const getRes = await fetch(getUrl, { headers: { 'X-API-Key': API_KEY } })
      if (getRes.ok) {
        const existing = await getRes.json()
        console.log(`Already registered: ${c.id}`, existing)
        continue
      }
    } catch (e) {
      // ignore and continue to register
    }

    await registerChain(c)
  }

  console.log('Done')
}

main().catch((e) => { console.error(e); process.exit(1) })
