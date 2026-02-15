// Lightweight dry-run script to demonstrate amount scaling and fake tx submission
import fs from 'fs'
import path from 'path'
import { loadConfig } from '../src/config-loader'

async function main() {
  const payloadPath = path.join(__dirname, '../http_trigger_payload.json')
  const configPath = path.join(__dirname, '../config.json')

  const payload = JSON.parse(fs.readFileSync(payloadPath, 'utf8'))
  const config = loadConfig(configPath, 'staging-settings')

  console.log('Config loaded successfully. Decimals:', config.decimals)

  for (const asset of payload.assets) {
    const decimals = config.decimals ?? 6
    const scaled = BigInt(asset.amount) * 10n ** BigInt(decimals)
    console.log(`Asset ${asset.symbol} amount=${asset.amount} scaled=${scaled} (decimals=${decimals})`)

    // Simulate tx submit
    const fakeHash = '0x' + Buffer.from(`${asset.symbol}:${Date.now()}`).toString('hex').slice(0, 64)
    console.log(`Simulated tx for ${asset.symbol}: ${fakeHash}`)
  }
}

main().catch(err => {
  console.error(err)
  process.exit(1)
})
