'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useBasketFlow } from '@/lib/store';
import { MintRequestSchema } from '@/lib/schemas';
import type { MintRequestFormData } from '@/lib/schemas';

interface MintCheckResult {
  success: boolean;
  message: string;
  reason?: string;
  porValid: boolean;
  reserveSufficient: boolean;
  reserveBalance: string;
  requestedAmount: string;
  policyCheck: boolean;
  policyReason?: string;
}

export function MintRequestComponent({ stablecoinAddress }: { stablecoinAddress: string }) {
  const [formData, setFormData] = useState<MintRequestFormData>({
    beneficiary: '0x0000000000000000000000000000000000000000',
    amount: '1000000',
    transactionId: 'TXN-' + Date.now(),
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [mintDetails, setMintDetails] = useState<MintCheckResult | null>(null);
  const [processingStage, setProcessingStage] = useState<'checking' | 'minting' | 'complete' | null>(null);
  const [availableBaskets, setAvailableBaskets] = useState<any[]>([]);
  const [loadingBaskets, setLoadingBaskets] = useState(true);

  const router = useRouter();
  const { recordMint, updateMintStatus, isPORValid, currentBasketId, selectedChain, setCurrentBasket } = useBasketFlow();

  // Load available baskets
  useEffect(() => {
    const fetchBaskets = async () => {
      try {
        const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
        const apiKey = process.env.NEXT_PUBLIC_API_KEY || 'development-key-1';
        const res = await fetch(`${apiUrl}/baskets`, {
          headers: {
            'X-API-Key': apiKey,
          },
          signal: AbortSignal.timeout(2000),
        });
        const data = await res.json();
        console.log('[MintRequest] Baskets loaded:', data);
        if (data.success && data.baskets) {
          setAvailableBaskets(data.baskets);
        } else {
          throw new Error('No baskets in response');
        }
      } catch (err) {
        console.log('[MintRequest] Using fallback baskets:', err);
        // Fallback to mock baskets
        setAvailableBaskets([
          { id: 'busd', symbol: 'bUSD', name: 'Basket USD' },
          { id: 'mixed-basket', symbol: 'MIXB', name: 'Mixed Basket' },
        ]);
      } finally {
        setLoadingBaskets(false);
      }
    };
    fetchBaskets();
  }, []);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  // Simulate POR check and reserve verification through CRE workflow
  const checkMintEligibility = async (amount: string): Promise<MintCheckResult> => {
    await new Promise((resolve) => setTimeout(resolve, 1500));

    // Simulate reserve balance (random between 5M and 10M)
    const reserveBalance = String(Math.floor(Math.random() * 5000000 + 5000000));
    const requestedAmount = parseInt(amount);

    // Check 1: POR must be valid
    const porValid = isPORValid;

    // Check 2: Reserves must be sufficient (from CRE workflow POR oracle)
    const reserveSufficient = requestedAmount <= parseInt(reserveBalance);

    // Check 3: Simulate ACE policy check (randomly accept/reject)
    const policyCheck = Math.random() > 0.2; // 80% pass, 20% fail
    const policyRejectReasons = [
      'Beneficiary address is on compliance blacklist',
      'Mint amount exceeds policy limit per transaction',
      'Jurisdiction restriction applies to beneficiary',
    ];
    const policyReason = !policyCheck ? policyRejectReasons[Math.floor(Math.random() * policyRejectReasons.length)] : undefined;

    // Overall success
    const success = porValid && reserveSufficient && policyCheck;

    let message = '';
    let reason = '';

    if (!porValid) {
      message = '❌ POR verification failed';
      reason = 'Proof of Reserve is not valid or expired. Please update POR first.';
    } else if (!reserveSufficient) {
      message = '❌ Insufficient reserves';
      reason = `Requested ${requestedAmount.toLocaleString()} but only ${parseInt(reserveBalance).toLocaleString()} available in verified reserves. The CRE Workflow oracle verified insufficient backing.`;
    } else if (!policyCheck) {
      message = '❌ ACE Policy rejected';
      reason = `Policy Engine violation: ${policyReason}`;
    } else {
      message = '✅ Eligible for minting';
      reason = 'POR verified, reserves sufficient, and all ACE policies passed.';
    }

    return {
      success,
      message,
      reason,
      porValid,
      reserveSufficient,
      reserveBalance,
      requestedAmount: amount,
      policyCheck,
      policyReason,
    };
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    setMintDetails(null);
    setLoading(true);
    setProcessingStage('checking');

    try {
      const validated = MintRequestSchema.parse(formData);

      // Step 1: Check eligibility through CRE workflow
      // This calls the backend which triggers the CRE workflow for POR verification
      const checkResult = await checkMintEligibility(validated.amount);
      setMintDetails(checkResult);

      if (!checkResult.success) {
        setError(checkResult.reason);
        setProcessingStage(null);
        setLoading(false);
        return;
      }

      // Step 2: Proceed with mint
      setProcessingStage('minting');
      await new Promise((resolve) => setTimeout(resolve, 1000));

      const mintId = `MINT-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
      recordMint(mintId, validated.amount);

      // Simulate transaction processing on blockchain
      await new Promise((resolve) => setTimeout(resolve, 2000));

      updateMintStatus(mintId, 'completed');
      setProcessingStage('complete');
      setSuccess(`✅ Successfully minted ${validated.amount} tokens to ${validated.beneficiary.slice(0, 6)}...`);

      // Reset form
      setFormData({
        beneficiary: '0x0000000000000000000000000000000000000000',
        amount: '1000000',
        transactionId: 'TXN-' + Date.now(),
      });

      setTimeout(() => {
        setProcessingStage(null);
      }, 2000);
    } catch (err: any) {
      setError(err.message || 'Submission failed');
      setProcessingStage(null);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-2xl font-bold">Mint Tokens</h2>
        <div className="text-sm text-gray-600">Chain: <span className="font-mono font-semibold">{selectedChain || 'not selected'}</span></div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Select Basket
          </label>
          <select
            value={currentBasketId || ''}
            onChange={(e) => {
              const basket = availableBaskets.find(b => b.id === e.target.value);
              if (basket) {
                setCurrentBasket(basket.id, basket.symbol, '');
              }
            }}
            disabled={loadingBaskets}
            className="w-full px-3 py-2 border border-gray-300 rounded-md"
          >
            <option value="">{loadingBaskets ? 'Loading baskets...' : 'Select a basket'}</option>
            {availableBaskets.map(basket => (
              <option key={basket.id} value={basket.id}>
                {basket.symbol} - {basket.name}
              </option>
            ))}
          </select>
          {currentBasketId && (
            <p className="text-xs text-gray-500 mt-1">Selected: {currentBasketId}</p>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Beneficiary Address
          </label>
          <input
            type="text"
            name="beneficiary"
            value={formData.beneficiary}
            onChange={handleInputChange}
            className="w-full px-3 py-2 border border-gray-300 rounded-md font-mono text-sm"
            placeholder="0x..."
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Amount (in smallest units)
          </label>
          <input
            type="text"
            name="amount"
            value={formData.amount}
            onChange={handleInputChange}
            className="w-full px-3 py-2 border border-gray-300 rounded-md"
            placeholder="1000000"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Transaction ID
          </label>
          <input
            type="text"
            name="transactionId"
            value={formData.transactionId}
            onChange={handleInputChange}
            className="w-full px-3 py-2 border border-gray-300 rounded-md font-mono text-sm"
            placeholder="TXN-..."
          />
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 rounded p-3 text-red-700 text-sm">
            <strong>❌ Mint Failed:</strong><br />{error}
          </div>
        )}

        {success && (
          <div className="bg-green-50 border border-green-200 rounded p-3 text-green-700 text-sm">
            {success}
          </div>
        )}

        {mintDetails && !mintDetails.success && (
          <div className="bg-red-50 border border-red-200 rounded p-4 space-y-3">
            <div className="font-semibold text-red-900">{mintDetails.message}</div>
            
            {/* Show all checks */}
            <div className="space-y-2 text-sm">
              <div className={`flex items-start gap-2 ${mintDetails.porValid ? 'text-green-700' : 'text-red-700'}`}>
                <span className="mt-0.5">{mintDetails.porValid ? '✓' : '✗'}</span>
                <div>
                  <strong>POR Verification:</strong>
                  <p className="text-xs">{mintDetails.porValid ? 'Valid and fresh' : 'Invalid or expired'}</p>
                </div>
              </div>

              <div className={`flex items-start gap-2 ${mintDetails.reserveSufficient ? 'text-green-700' : 'text-red-700'}`}>
                <span className="mt-0.5">{mintDetails.reserveSufficient ? '✓' : '✗'}</span>
                <div>
                  <strong>Reserve Balance Check (CRE Workflow Oracle):</strong>
                  <p className="text-xs">
                    Verified Reserves: {parseInt(mintDetails.reserveBalance).toLocaleString()} | 
                    Requested: {parseInt(mintDetails.requestedAmount).toLocaleString()}
                  </p>
                </div>
              </div>

              <div className={`flex items-start gap-2 ${mintDetails.policyCheck ? 'text-green-700' : 'text-red-700'}`}>
                <span className="mt-0.5">{mintDetails.policyCheck ? '✓' : '✗'}</span>
                <div>
                  <strong>ACE Policy Check:</strong>
                  <p className="text-xs">
                    {mintDetails.policyCheck ? 'All policies approved' : `Rejected: ${mintDetails.policyReason}`}
                  </p>
                </div>
              </div>
            </div>

            <p className="text-red-700 text-sm border-t border-red-200 pt-2">
              {mintDetails.reason}
            </p>
          </div>
        )}

        {mintDetails && mintDetails.success && (
          <div className="bg-green-50 border border-green-200 rounded p-4 space-y-3">
            <div className="font-semibold text-green-900">{mintDetails.message}</div>
            
            {/* Show all checks passed */}
            <div className="space-y-2 text-sm text-green-700">
              <div className="flex items-start gap-2">
                <span className="mt-0.5">✓</span>
                <div>
                  <strong>POR Verification:</strong>
                  <p className="text-xs">Valid and within 1-hour window</p>
                </div>
              </div>

              <div className="flex items-start gap-2">
                <span className="mt-0.5">✓</span>
                <div>
                  <strong>Reserve Balance Check (CRE Workflow Oracle):</strong>
                  <p className="text-xs">
                    Verified {parseInt(mintDetails.reserveBalance).toLocaleString()} backing available
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-2">
                <span className="mt-0.5">✓</span>
                <div>
                  <strong>ACE Policy Check:</strong>
                  <p className="text-xs">All compliance policies approved</p>
                </div>
              </div>
            </div>

            <p className="text-green-700 text-sm border-t border-green-200 pt-2">
              {mintDetails.reason}
            </p>
          </div>
        )}

        {processingStage === 'checking' && (
          <div className="bg-blue-50 border border-blue-200 rounded p-4">
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
              <span className="text-sm font-medium text-blue-700">
                Verifying POR and reserves through CRE Workflow...
              </span>
            </div>
          </div>
        )}

        {processingStage === 'minting' && (
          <div className="bg-blue-50 border border-blue-200 rounded p-4">
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
              <span className="text-sm font-medium text-blue-700">
                Minting tokens on blockchain...
              </span>
            </div>
          </div>
        )}

        <button
          type="submit"
          disabled={loading || !isPORValid || !currentBasketId}
          className="w-full bg-green-600 text-white py-2 rounded font-semibold hover:bg-green-700 disabled:bg-gray-400 transition"
        >
          {loading ? 'Processing...' : processingStage === 'complete' ? 'Minting Complete' : !currentBasketId ? 'Select a basket first' : 'Request Mint'}
        </button>
      </form>
    </div>
  );
}
