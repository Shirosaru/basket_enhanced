'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useContractRead } from 'wagmi';
import { CONTRACTS, STABLECOIN_ABI } from '@/config/contracts';
import { PORVerificationSchema } from '@/lib/schemas';
import { useBasketFlow } from '@/lib/store';
import type { PORVerificationData } from '@/lib/schemas';

export function PORVerificationComponent({ stablecoinAddress }: { stablecoinAddress: string }) {
  const [formData, setFormData] = useState<PORVerificationData>({
    porHash: '0x' + '0'.repeat(64),
    reserveBalance: '1000000000000',
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const router = useRouter();
  const { setPORInfo, setFlowStep } = useBasketFlow();

  // Read current POR status
  const { data: lastPORHash } = useContractRead({
    address: stablecoinAddress as `0x${string}`,
    abi: STABLECOIN_ABI,
    functionName: 'lastPORHash',
  }) as { data: string | undefined };

  const { data: lastPORTimestamp } = useContractRead({
    address: stablecoinAddress as `0x${string}`,
    abi: STABLECOIN_ABI,
    functionName: 'lastPORTimestamp',
  }) as { data: bigint | undefined };

  const { data: reserveBalance } = useContractRead({
    address: stablecoinAddress as `0x${string}`,
    abi: STABLECOIN_ABI,
    functionName: 'reserveBalance',
  }) as { data: bigint | undefined };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(false);
    setLoading(true);

    try {
      const validated = PORVerificationSchema.parse(formData);
      
      // Store POR info in flow state
      setPORInfo(validated.porHash, Date.now(), true);
      
      // Move to next step
      setFlowStep('mint');
      setSuccess(true);
      
      // Navigate to mint page after 1 second
      setTimeout(() => {
        router.push('/mint');
      }, 1000);
    } catch (err: any) {
      setError(err.message || 'Validation failed');
    } finally {
      setLoading(false);
    }
  };

  const lastPORTime = lastPORTimestamp ? new Date(Number(lastPORTimestamp) * 1000) : null;
  const isExpired = lastPORTime && Date.now() - lastPORTime.getTime() > 3600000; // 1 hour

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <h2 className="text-2xl font-bold mb-6">Proof of Reserve (POR)</h2>

      {/* Current Status */}
      <div className="bg-gray-50 rounded p-4 mb-6 space-y-2">
        <div>
          <span className="text-sm text-gray-600">Latest POR Hash:</span>
          <p className="font-mono text-sm break-all">{lastPORHash || 'Not set'}</p>
        </div>
        <div>
          <span className="text-sm text-gray-600">Last Verified:</span>
          <p className="text-sm">{lastPORTime?.toLocaleString() || 'Never'}</p>
        </div>
        <div>
          <span className="text-sm text-gray-600">Current Reserve Balance:</span>
          <p className="text-sm">{reserveBalance?.toString() || '0'}</p>
        </div>
        {isExpired && (
          <div className="bg-yellow-50 border border-yellow-200 rounded p-2 text-yellow-700 text-sm">
            ⚠️ POR verification expired. Please renew to continue minting.
          </div>
        )}
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            POR Hash (Keccak256)
          </label>
          <input
            type="text"
            name="porHash"
            value={formData.porHash}
            onChange={handleInputChange}
            className="w-full px-3 py-2 border border-gray-300 rounded-md font-mono text-sm"
            placeholder="0x..."
          />
          <p className="text-xs text-gray-500 mt-1">Hash from Chainlink POR oracle</p>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Reserve Balance (smallest units)
          </label>
          <input
            type="text"
            name="reserveBalance"
            value={formData.reserveBalance}
            onChange={handleInputChange}
            className="w-full px-3 py-2 border border-gray-300 rounded-md font-mono text-sm"
            placeholder="1000000000000"
          />
          <p className="text-xs text-gray-500 mt-1">Total reserves backing issued tokens</p>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 rounded p-3 text-red-700 text-sm">
            {error}
          </div>
        )}

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-primary text-white py-2 rounded font-semibold hover:bg-blue-600 disabled:bg-gray-400"
        >
          {loading ? 'Verifying...' : 'Update POR'}
        </button>
      </form>

      <div className="mt-6 pt-6 border-t">
        <h3 className="font-semibold text-sm mb-2">What is POR?</h3>
        <p className="text-xs text-gray-600">
          Proof of Reserve (POR) uses Chainlink's oracle to cryptographically verify that the issuer
          maintains sufficient reserves to back all issued tokens. This ensures every token is fully collateralized.
        </p>
      </div>
    </div>
  );
}
