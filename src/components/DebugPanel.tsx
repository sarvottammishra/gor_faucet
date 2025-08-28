'use client'

import { FC, useState } from 'react'
import { useWallet } from '@solana/wallet-adapter-react'
import { getExplorerUrl } from '@/lib/faucet'

export const DebugPanel: FC = () => {
  const { publicKey } = useWallet()
  const [debugInfo, setDebugInfo] = useState<any>(null)
  const [loading, setLoading] = useState(false)
  const [txSignature, setTxSignature] = useState('')

  const checkEligibility = async () => {
    if (!publicKey) return

    setLoading(true)
    try {
      const response = await fetch('/api/test-eligibility', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          walletAddress: publicKey.toString(),
          action: 'check'
        })
      })
      const result = await response.json()
      setDebugInfo(result)
    } catch (error) {
      setDebugInfo({ error: error instanceof Error ? error.message : 'Unknown error' })
    } finally {
      setLoading(false)
    }
  }

  const resetEligibility = async () => {
    if (!publicKey) return

    setLoading(true)
    try {
      const response = await fetch('/api/test-eligibility', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          walletAddress: publicKey.toString(),
          action: 'reset'
        })
      })
      const result = await response.json()
      setDebugInfo(result)
      // Refresh the page to update claim button status
      window.location.reload()
    } catch (error) {
      setDebugInfo({ error: error instanceof Error ? error.message : 'Unknown error' })
    } finally {
      setLoading(false)
    }
  }

  const verifyTransaction = async () => {
    if (!publicKey || !txSignature) return

    setLoading(true)
    try {
      const response = await fetch('/api/verify-transaction', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          signature: txSignature,
          walletAddress: publicKey.toString()
        })
      })
      const result = await response.json()
      setDebugInfo(result)
    } catch (error) {
      setDebugInfo({ error: error instanceof Error ? error.message : 'Unknown error' })
    } finally {
      setLoading(false)
    }
  }

  const verifyAndRecordClaim = async () => {
    if (!publicKey || !txSignature) return

    setLoading(true)
    try {
      // First verify the transaction
      const verifyResponse = await fetch('/api/verify-transaction', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          signature: txSignature,
          walletAddress: publicKey.toString()
        })
      })
      const verifyResult = await verifyResponse.json()

      if (verifyResult.success && verifyResult.found) {
        // Transaction is valid, now record the claim
        const recordResponse = await fetch('/api/test-eligibility', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            walletAddress: publicKey.toString(),
            action: 'verify_and_record',
            signature: txSignature
          })
        })
        const recordResult = await recordResponse.json()
        setDebugInfo({
          verification: verifyResult,
          recording: recordResult
        })
      } else {
        setDebugInfo({
          error: 'Transaction verification failed',
          verification: verifyResult
        })
      }

      // Refresh eligibility status
      setTimeout(() => window.location.reload(), 1000)
    } catch (error) {
      setDebugInfo({ error: error instanceof Error ? error.message : 'Unknown error' })
    } finally {
      setLoading(false)
    }
  }

  const recordTestClaim = async () => {
    if (!publicKey) return

    setLoading(true)
    try {
      const response = await fetch('/api/test-eligibility', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          walletAddress: publicKey.toString(),
          action: 'record_claim',
          signature: txSignature || 'test-signature',
          amount: 500000000
        })
      })
      const result = await response.json()
      setDebugInfo(result)
      // Refresh eligibility status
      setTimeout(() => window.location.reload(), 1000)
    } catch (error) {
      setDebugInfo({ error: error instanceof Error ? error.message : 'Unknown error' })
    } finally {
      setLoading(false)
    }
  }

  const forceRecordClaim = async () => {
    if (!publicKey) return

    setLoading(true)
    try {
      const response = await fetch('/api/test-eligibility', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          walletAddress: publicKey.toString(),
          action: 'force_claim'
        })
      })
      const result = await response.json()
      setDebugInfo(result)
      // Refresh eligibility status
      setTimeout(() => window.location.reload(), 1000)
    } catch (error) {
      setDebugInfo({ error: error instanceof Error ? error.message : 'Unknown error' })
    } finally {
      setLoading(false)
    }
  }

  if (!publicKey) {
    return null
  }

  return (
    <div className="mt-6 p-4 bg-gray-800/50 rounded-xl border border-gray-600">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-white font-semibold">🔧 Debug Panel (24h Cooldown & TX Verification)</h3>
        <div className="flex flex-wrap gap-2">
          <button
            onClick={checkEligibility}
            disabled={loading}
            className="px-3 py-1 bg-blue-500 text-white text-sm rounded hover:bg-blue-600 disabled:opacity-50"
          >
            {loading ? '...' : 'Check Status'}
          </button>
          <button
            onClick={resetEligibility}
            disabled={loading}
            className="px-3 py-1 bg-red-500 text-white text-sm rounded hover:bg-red-600 disabled:opacity-50"
          >
            {loading ? '...' : 'Reset Timer'}
          </button>
          <button
            onClick={verifyAndRecordClaim}
            disabled={loading || !txSignature}
            className="px-3 py-1 bg-green-500 text-white text-sm rounded hover:bg-green-600 disabled:opacity-50"
          >
            {loading ? '...' : 'Verify & Record'}
          </button>
          <button
            onClick={() => recordTestClaim()}
            disabled={loading}
            className="px-3 py-1 bg-purple-500 text-white text-sm rounded hover:bg-purple-600 disabled:opacity-50"
          >
            {loading ? '...' : 'Record Test'}
          </button>
          <button
            onClick={() => forceRecordClaim()}
            disabled={loading}
            className="px-3 py-1 bg-orange-500 text-white text-sm rounded hover:bg-orange-600 disabled:opacity-50"
          >
            {loading ? '...' : 'Force Record'}
          </button>
        </div>
      </div>

      <div className="mb-3">
        <div className="flex gap-2 items-center">
          <input
            type="text"
            value={txSignature}
            onChange={(e) => setTxSignature(e.target.value)}
            placeholder="Enter transaction signature"
            className="flex-1 px-2 py-1 bg-gray-700 text-white text-sm rounded border border-gray-600"
          />
          <button
            onClick={verifyTransaction}
            disabled={loading || !txSignature}
            className="px-3 py-1 bg-purple-500 text-white text-sm rounded hover:bg-purple-600 disabled:opacity-50"
          >
            {loading ? '...' : 'Verify TX'}
          </button>
        </div>
      </div>

      {debugInfo && (
        <div className="bg-gray-900/50 p-3 rounded-lg">
          <pre className="text-sm text-gray-300 whitespace-pre-wrap">
            {JSON.stringify(debugInfo, null, 2)}
          </pre>
          {/* Show explorer links for any transaction signatures found */}
          {(() => {
            const signatures: string[] = []
            const findSignatures = (obj: any): void => {
              if (typeof obj === 'string' && obj.length === 88) {
                // Basic check for Solana signature format (88 chars)
                signatures.push(obj)
              } else if (obj && typeof obj === 'object') {
                Object.values(obj).forEach(findSignatures)
              }
            }
            findSignatures(debugInfo)
            return signatures.length > 0 ? (
              <div className="mt-3 pt-3 border-t border-gray-600">
                <p className="text-sm text-gorb-accent-primary mb-2">🔗 Explorer Links:</p>
                {signatures.map((sig, index) => (
                  <div key={index} className="text-xs text-gorb-text-secondary mb-1">
                    TX {index + 1}:{' '}
                    <a
                      href={getExplorerUrl(sig)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-gorb-accent-primary hover:text-green-400 underline font-mono"
                    >
                      {sig.substring(0, 12)}...{sig.substring(sig.length - 8)}
                    </a>
                  </div>
                ))}
              </div>
            ) : null
          })()}
        </div>
      )}

      <div className="mt-3 text-xs text-gray-400 space-y-1">
        <p>💡 Use &quot;Check Status&quot; to see your 24h cooldown eligibility</p>
        <p>🔍 Use &quot;Verify TX&quot; to check if a transaction exists on the blockchain</p>
        <p>✅ Use &quot;Verify &amp; Record&quot; to verify TX and record claim (for missed claims)</p>
        <p>🧪 Use &quot;Record Test&quot; to record a test claim (for testing only)</p>
        <p>🗑️ Use &quot;Reset Timer&quot; to clear cooldown (for testing only)</p>
        <p>🔒 Remove debug panel before going to production</p>
        <p>📝 Paste any transaction signature to verify it on-chain</p>
      </div>
    </div>
  )
}
