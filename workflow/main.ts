import { 
	bytesToHex,
	cre,
	getNetwork,
	type HTTPPayload,
	hexToBase64,
	Runner,
	type Runtime,
	type NodeRuntime,
	TxStatus,
	consensusMedianAggregation,
} from '@chainlink/cre-sdk'
import { encodeAbiParameters, parseAbiParameters, encodeFunctionData, decodeFunctionResult, getAddress } from 'viem'
import { z } from 'zod'

// ========================================
// CONFIG SCHEMA - Multi-Chain Enhanced
// ========================================
const configSchema = z.object({
	chains: z.record(z.object({
		rpcUrl: z.string(),
		stablecoinAddress: z.string(),
		mintingConsumerAddress: z.string().optional(),
		chainId: z.number().optional(),
	})),
	porApiUrl: z.string(),
	decimals: z.number().default(6),
})

type Config = z.infer<typeof configSchema>

// ========================================
// PAYLOAD SCHEMA - Multi-Asset Enhanced
// ========================================
const assetPayloadSchema = z.object({
	assetId: z.string(),
	symbol: z.string(),
	type: z.enum(['monetary', 'digital-asset', 'nft', 'physical-backed', 'custom']),
	amount: z.string(),
	contractAddress: z.string(),
	chainId: z.string(),
	metadata: z.record(z.any()).optional(),
})

const chainPayloadSchema = z.object({
	id: z.string(),
	name: z.string(),
	chainId: z.number(),
	rpcUrl: z.string(),
})

const payloadSchema = z.object({
	messageType: z.string(),
	transactionId: z.string(),
	sender: z.object({
		name: z.string(),
		account: z.string(),
		bankCode: z.string(),
	}),
	beneficiary: z.object({
		account: z.string(),
		name: z.string().optional(),
	}),
	amount: z.string(),
	assets: z.array(assetPayloadSchema),
	chain: chainPayloadSchema,
	valueDate: z.string().optional(),
	bankReference: z.string(),
	metadata: z.record(z.any()).optional(),
})

type Payload = z.infer<typeof payloadSchema>
type AssetPayload = z.infer<typeof assetPayloadSchema>

// ========================================
// CONSTANTS
// ========================================
const INSTRUCTION_MINT = 1
const INSTRUCTION_BURN = 2

// StablecoinERC20 ABI
const StablecoinABI = [
	{
		type: 'function',
		name: 'mint',
		inputs: [
			{ name: 'to', type: 'address' },
			{ name: 'amount', type: 'uint256' },
		],
		outputs: [],
		stateMutability: 'nonpayable',
	},
	{
		type: 'function',
		name: 'burn',
		inputs: [
			{ name: 'from', type: 'address' },
			{ name: 'amount', type: 'uint256' },
		],
		outputs: [],
		stateMutability: 'nonpayable',
	},
	{
		type: 'function',
		name: 'totalSupply',
		inputs: [],
		outputs: [{ name: '', type: 'uint256' }],
		stateMutability: 'view',
	},
	{
		type: 'event',
		name: 'Transfer',
		inputs: [
			{ name: 'from', type: 'address', indexed: true },
			{ name: 'to', type: 'address', indexed: true },
			{ name: 'value', type: 'uint256', indexed: false },
		],
	},
] as const

// ========================================
// MAIN WORKFLOW HANDLER
// ========================================
export const onHTTPRequest = cre.http((request, context: { config: Config }) => {
	context.logger.log('Processing HTTP request:', request.body)

	// Parse and validate payload
	const result = payloadSchema.safeParse(request.body)
	if (!result.success) {
		context.logger.error('Invalid payload:', result.error)
		return {
			success: false,
			error: 'INVALID_PAYLOAD',
			details: result.error.errors,
		}
	}

	const payload = result.data

	return {
		success: true,
		transactionId: payload.transactionId,
		chain: payload.chain,
		assets: payload.assets.map(a => ({
			id: a.assetId,
			symbol: a.symbol,
			amount: a.amount,
		})),
		beneficiary: payload.beneficiary.account,
	}
})

// ========================================
// MINTING EXECUTION
// ========================================
export const onMintRequest = cre.transaction(async (request, runtime: Runtime) => {
	const payload = request.body as Payload
	// Normalize runtime config: accept environment-wrapped configs
	const rawConfig = (runtime as any).config as any
	const config: Config = ((): Config => {
		if (!rawConfig) return rawConfig
		if (rawConfig['staging-settings']) return rawConfig['staging-settings']
		if (rawConfig['production-settings']) return rawConfig['production-settings']
		return rawConfig
	})()

	const logger = runtime.logger
	logger.log('🚀 Starting mint execution for:', payload.transactionId)
	logger.log('📦 Assets:', payload.assets.length)
	logger.log('🔗 Chain:', payload.chain.name)

	const chainConfig = config.chains[payload.chain.id]
	if (!chainConfig) {
		throw new Error(`Chain ${payload.chain.id} not configured`)
	}

	const txHashes: { asset: string; txHash: string }[] = []

	// Process each asset
	for (const asset of payload.assets) {
		try {
			logger.log(`\n💰 Minting ${asset.symbol} (${asset.amount})...`)

			// Determine decimals (global default or per-config)
			const decimals = (config.decimals ?? 6)
			const scaledAmount = BigInt(asset.amount) * 10n ** BigInt(decimals)
			logger.log(`Scaled amount for ${asset.symbol}: ${scaledAmount} (decimals=${decimals})`)

			// Build mint transaction with scaled amount
			const mintData = encodeFunctionData({
				abi: StablecoinABI,
				functionName: 'mint',
				args: [
					getAddress(payload.beneficiary.account),
					scaledAmount,
				],
			})

			// Determine gas price: prefer chain config, then provider, otherwise omit
			let gasPriceValue: bigint | undefined = undefined
			if ((chainConfig as any).gasPrice) {
				try { gasPriceValue = BigInt((chainConfig as any).gasPrice) } catch {}
			} else if ((runtime as any).provider && typeof (runtime as any).provider.getGasPrice === 'function') {
				try {
					const gp = await (runtime as any).provider.getGasPrice()
					gasPriceValue = typeof gp === 'bigint' ? gp : BigInt(gp)
				} catch (e) {
					logger.log('Could not query provider gas price, continuing without explicit gasPrice')
				}
			}
			if (gasPriceValue) logger.log(`Using gasPrice: ${gasPriceValue}`)

			// Execute transaction on specified chain
			let txBuilder: any = runtime.transaction
				.to(asset.contractAddress)
				.data(mintData)
				.gasLimit(100000n)

			if (gasPriceValue) txBuilder = txBuilder.gasPrice(gasPriceValue)

			const tx = await txBuilder.submit()

			txHashes.push({
				asset: asset.symbol,
				txHash: tx.hash,
			})

			logger.log(`✅ ${asset.symbol} mint submitted: ${tx.hash}`)
		} catch (error) {
			logger.error(`❌ Failed to mint ${asset.symbol}:`, error)
			throw error
		}
	}

	// Log final state
	logger.log('\n📊 Mint execution complete')
	logger.log('Transactions:', txHashes)

	return {
		success: true,
		transactionId: payload.transactionId,
		beneficiary: payload.beneficiary.account,
		chain: payload.chain.name,
		assets: payload.assets.map(a => a.symbol),
		transactions: txHashes,
		timestamp: new Date().toISOString(),
	}
})

// ========================================
// POR (Proof of Reserve) INTEGRATION
// ========================================
export const onVerifyPOR = cre.observer(async (runtime: Runtime) => {
	const config = runtime.config as Config
	const logger = runtime.logger

	logger.log('🔍 Verifying Proof of Reserve...')

	// Call POR API for verification
	try {
		const response = await fetch(config.porApiUrl, {
			method: 'GET',
			headers: {
				'Content-Type': 'application/json',
			},
		})

		const porData = await response.json()
		logger.log('📋 POR Response:', porData)

		return {
			success: true,
			porVerified: porData.verified || false,
			timestamp: new Date().toISOString(),
			data: porData,
		}
	} catch (error) {
		logger.error('❌ POR verification failed:', error)
		return {
			success: false,
			error: 'POR_VERIFICATION_FAILED',
		}
	}
})

// ========================================
// ACE (Actionable Cryptographic Events) TRIGGER
// ========================================
export const onACETrigger = cre.observer(async (runtime: Runtime) => {
	const logger = runtime.logger
	logger.log('⚡ ACE Trigger Event Received')

	return {
		success: true,
		event: 'ACE_TRIGGERED',
		timestamp: new Date().toISOString(),
	}
})

// ========================================
// CCIP (Cross-Chain Interoperability Protocol) BRIDGE
// ========================================
export const onCCIPMessage = cre.observer(async (request, runtime: Runtime) => {
	const logger = runtime.logger
	logger.log('🌐 CCIP Message Received')

	const message = request.body as {
		sourceChain: string
		destinationChain: string
		payload: Payload
	}

	return {
		success: true,
		message: 'CCIP_MESSAGE_PROCESSED',
		source: message.sourceChain,
		destination: message.destinationChain,
		timestamp: new Date().toISOString(),
	}
})
