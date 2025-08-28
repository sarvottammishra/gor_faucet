'use client'

import { FC, useState, useEffect } from 'react'
import { PublicKey } from '@solana/web3.js'
import { getClaimHistory, ClaimRecord, clearWalletCache, getExplorerUrl } from '@/lib/faucet'

interface ClaimHistoryProps {
  publicKey: PublicKey
}

export const ClaimHistory: FC<ClaimHistoryProps> = ({ publicKey }) => {
  const [history, setHistory] = useState<ClaimRecord[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [lastFetched, setLastFetched] = useState<string | null>(null)

  useEffect(() => {
    fetchHistory()
  }, [publicKey])

  const fetchHistory = async (forceRefresh = false) => {
    try {
      setIsLoading(true)
      const claims = await getClaimHistory(publicKey.toString(), forceRefresh)
      setHistory(claims)
      setLastFetched(new Date().toLocaleString())
    } catch (error) {
      console.error('Error fetching claim history:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleRefresh = () => {
    // Clear cache and force refresh
    clearWalletCache(publicKey.toString())
    fetchHistory(true)
  }

  return (
    <div className="rounded-xl p-4 bg-gorb-card-background border border-gorb-border">
      <div className="flex justify-between items-center mb-4">
        <h3 className="font-staatliches font-normal text-3xl text-gorb-text-primary leading-tight tracking-tight">
          Claim History
        </h3>
        <button
          onClick={handleRefresh}
          disabled={isLoading}
          className="px-3 py-1 text-sm bg-gorb-accent-primary hover:bg-green-500 text-black font-inter font-semibold rounded-full transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isLoading ? '⟳' : '🔄'}
        </button>
      </div>
      {lastFetched && (
        <p className="text-xs text-gorb-text-muted mb-2">
          Last updated: {lastFetched}
        </p>
      )}

      {isLoading ? (
        <div className="text-center py-4">
          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-gorb-text-primary mx-auto"></div>
        </div>
      ) : history.length === 0 ? (
        <p className="text-center py-4 text-gorb-text-secondary">No claims yet</p>
      ) : (
        <div className="space-y-3 max-h-64 overflow-y-auto">
          {history.map((claim) => (
            <div key={claim.id} className="rounded-lg p-3 bg-black/20">
              <div className="flex justify-between items-start mb-2">
                <span className="font-semibold text-gorb-accent-primary">
                  +{claim.amount} $GOR
                </span>
                <span className="text-sm text-gorb-text-secondary">
                  {new Date(claim.timestamp).toLocaleString()}
                </span>
              </div>
              <div className="text-xs font-ibm-plex-mono break-all text-gorb-text-muted">
                TX:{' '}
                <a
                  href={getExplorerUrl(claim.txHash)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-gorb-accent-primary hover:text-green-400 underline"
                >
                  {claim.txHash}
                </a>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
