'use client'

import { FC, useState, useEffect } from 'react'
import { Connection, PublicKey } from '@solana/web3.js'
import { checkClaimEligibility, claimTokens, clearWalletCache, getExplorerUrl } from '@/lib/faucet'
import { TwitterVerification } from './TwitterVerification'

interface ClaimButtonProps {
  connection: Connection
  publicKey: PublicKey
}

export const ClaimButton: FC<ClaimButtonProps> = ({ connection, publicKey }) => {
  const [isEligible, setIsEligible] = useState(false)
  const [timeUntilEligible, setTimeUntilEligible] = useState<number>(0)
  const [isClaiming, setIsClaiming] = useState(false)
  const [lastClaimTime, setLastClaimTime] = useState<Date | null>(null)
  const [successMessage, setSuccessMessage] = useState<string>('')
  const [verificationMessage, setVerificationMessage] = useState<string>('')
  const [showTwitterVerification, setShowTwitterVerification] = useState(false)
  const [tweetVerified, setTweetVerified] = useState(false)
  const [txSignature, setTxSignature] = useState<string>('')
  const [tweetUrl, setTweetUrl] = useState<string>('')
  const [verificationToken, setVerificationToken] = useState<string>('')

  // Restore verification view if user returns from Twitter (iOS reload/rerender)
  useEffect(() => {
    try {
      const persisted = window.localStorage.getItem('gor_tweet_verification_state')
      if (persisted) {
        const parsed = JSON.parse(persisted) as { step?: 'tweet' | 'verify'; tweetUrl?: string }
        if (parsed.step === 'verify') {
          setShowTwitterVerification(true)
          if (parsed.tweetUrl) setTweetUrl(parsed.tweetUrl)
        }
      }
    } catch {}
  }, [])

  useEffect(() => {
    checkEligibility()

    // Update countdown every second (but don't re-check eligibility constantly)
    const interval = setInterval(() => {
      if (lastClaimTime) {
        const now = new Date()
        const timeDiff = now.getTime() - lastClaimTime.getTime()
        const hours24 = 24 * 60 * 60 * 1000
        const remaining = hours24 - timeDiff

        if (remaining <= 0) {
          setIsEligible(true)
          setTimeUntilEligible(0)
        } else {
          setTimeUntilEligible(remaining)
        }
      }
    }, 1000)

    return () => clearInterval(interval)
  }, [lastClaimTime])

  // Separate effect for initial eligibility check
  useEffect(() => {
    checkEligibility()
  }, [publicKey]) // Only re-check when publicKey changes

  const checkEligibility = async () => {
    try {
      const result = await checkClaimEligibility(publicKey.toString())
      setIsEligible(result.eligible)
      if (result.lastClaimTime) {
        setLastClaimTime(new Date(result.lastClaimTime))
      }
    } catch (error) {
      console.error('Error checking eligibility:', error)
    }
  }

  const handleClaim = async () => {
    try {
      setIsClaiming(true)

      // Use cached eligibility check (force refresh to get latest status)
      const eligibilityCheck = await checkClaimEligibility(publicKey.toString(), true)
      if (!eligibilityCheck.eligible) {
        alert(`You can claim again in ${Math.ceil((new Date(eligibilityCheck.nextClaimTime!).getTime() - Date.now()) / (1000 * 60 * 60))} hours`)
        return
      }

      // Show Twitter verification step instead of direct claiming
      setShowTwitterVerification(true)
    } catch (error) {
      console.error('Error checking eligibility:', error)
      alert('Failed to check eligibility. Please try again.')
    } finally {
      setIsClaiming(false)
    }
  }

  const handleTwitterVerificationComplete = async (tweetUrlParam: string, verificationTokenParam: string) => {
    try {
      setTweetUrl(tweetUrlParam)
      setVerificationToken(verificationTokenParam)
      setIsClaiming(true)
      setShowTwitterVerification(false)
      setTweetVerified(true)
      try { window.localStorage.removeItem('gor_tweet_verification_state') } catch {}

      // Show verification message optimized for Gorbagana
      setVerificationMessage('🔍 Verifying transaction on Gorbagana Testnet v1...')

      const signature = await claimTokens(connection, publicKey, verificationTokenParam)
      setTxSignature(signature)

      // Clear verification message and show success
      setVerificationMessage('')

      // Clear cache and force refresh eligibility after claiming
      clearWalletCache(publicKey.toString())
      await checkEligibility() // Refresh eligibility after claiming

      // Show success message with Gorbagana branding
      setSuccessMessage(`✅ Successfully claimed 5 GOR tokens on Gorbagana Testnet v1! TX: ${signature.substring(0, 8)}...\n🐦 Tweet verified: ${tweetUrl}`)

      // Clear success message after 15 seconds
      setTimeout(() => {
        setSuccessMessage('')
        setTweetVerified(false)
      }, 15000)
    } catch (error) {
      console.error('Error claiming tokens:', error)
      setVerificationMessage('') // Clear verification message on error
      alert('Failed to claim tokens. Please try again.')
    } finally {
      setIsClaiming(false)
    }
  }

  const handleTwitterVerificationCancel = () => {
    setShowTwitterVerification(false)
    setTweetVerified(false)
  }

  const formatTime = (milliseconds: number) => {
    const hours = Math.floor(milliseconds / (1000 * 60 * 60))
    const minutes = Math.floor((milliseconds % (1000 * 60 * 60)) / (1000 * 60))
    const seconds = Math.floor((milliseconds % (1000 * 60)) / 1000)
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`
  }

  // Show Twitter verification if triggered
  if (showTwitterVerification) {
    return (
      <TwitterVerification
        onVerificationComplete={handleTwitterVerificationComplete}
        onCancel={handleTwitterVerificationCancel}
      />
    )
  }

  return (
    <div className="space-y-4">
      <button
        onClick={handleClaim}
        disabled={!isEligible || isClaiming}
        className={`bg-gorb-accent-primary hover:bg-green-500 text-black font-inter font-semibold px-6 py-3 rounded-full transition-all duration-300 transform hover:-translate-y-1 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none ${!isEligible || isClaiming ? 'opacity-50 cursor-not-allowed' : ''}`}
      >
        {isClaiming ? (
          <span className="flex items-center justify-center">
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-black mr-2"></div>
            Checking...
          </span>
        ) : isEligible ? (
          '🐦 Tweet & Claim $GOR'
        ) : (
          'Claim Not Available'
        )}
      </button>

      {!isEligible && timeUntilEligible > 0 && (
        <div className="text-center p-4 rounded-xl bg-gorb-card-background border border-gorb-border">
          <p className="font-semibold mb-2 text-gorb-text-primary">Next claim available in:</p>
          <p className="text-2xl font-mono mb-2 text-gorb-text-primary">{formatTime(timeUntilEligible)}</p>
          {lastClaimTime && (
            <div className="text-sm mt-2 space-y-1 text-gorb-text-secondary">
              <p>Last claimed: {lastClaimTime.toLocaleString()}</p>
              <p>Next claim: {new Date(lastClaimTime.getTime() + 24 * 60 * 60 * 1000).toLocaleString()}</p>
            </div>
          )}
          <div className="mt-3 text-xs text-gorb-text-muted">
            <p>💡 24-hour cooldown is enforced per wallet</p>
            <p>🔒 You can only claim once every 24 hours</p>
          </div>
        </div>
      )}

      {verificationMessage && (
        <div className="text-center p-4 rounded-xl mt-4 bg-gorb-card-background border border-gorb-border">
          <p className="font-semibold text-gorb-text-primary">{verificationMessage}</p>
          <p className="text-sm mt-2 text-gorb-text-secondary">
            Fast confirmation on Gorbagana single-validator network...
          </p>
        </div>
      )}

      {successMessage && txSignature && (
        <div className="text-center p-4 rounded-xl mt-4 bg-gorb-card-background border border-gorb-border">
          <div className="font-semibold text-gorb-text-primary mb-2">
            ✅ Successfully claimed 5 GOR tokens on Gorbagana Testnet v1!
          </div>
          <div className="text-sm text-gorb-text-secondary mb-2">
            TX:{' '}
            <a
              href={getExplorerUrl(txSignature)}
              target="_blank"
              rel="noopener noreferrer"
              className="text-gorb-accent-primary hover:text-green-400 underline font-mono"
            >
              {txSignature.substring(0, 12)}...{txSignature.substring(txSignature.length - 8)}
            </a>
          </div>
          {tweetUrl && (
            <div className="text-sm text-gorb-text-secondary mb-2">
              🐦 Tweet verified:{' '}
              <a
                href={tweetUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="text-gorb-accent-primary hover:text-green-400 underline"
              >
                View Tweet
              </a>
            </div>
          )}
          <p className="text-sm mt-3 text-gorb-text-secondary">
            ⏰ You can claim again in 24 hours
          </p>
        </div>
      )}
    </div>
  )
}
