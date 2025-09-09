'use client'
// @ts-nocheck

import { FC, useEffect, useState } from 'react'
import { useWallet } from '@solana/wallet-adapter-react'

interface TwitterVerificationProps {
  onVerificationComplete: (tweetUrl: string, verificationToken: string) => void
  onCancel: () => void
}

export const TwitterVerification: FC<TwitterVerificationProps> = ({
  onVerificationComplete,
  onCancel
}) => {
  const { publicKey } = useWallet()
  const [tweetUrl, setTweetUrl] = useState('')
  const [isVerifying, setIsVerifying] = useState(false)
  const [error, setError] = useState('')
  const [step, setStep] = useState<'tweet' | 'verify'>('tweet')

  // Persist state to survive iOS return from Twitter
  useEffect(() => {
    try {
      const persisted = window.localStorage.getItem('gor_tweet_verification_state')
      if (persisted) {
        const parsed = JSON.parse(persisted) as { step?: 'tweet' | 'verify'; tweetUrl?: string }
        if (parsed.step) setStep(parsed.step)
        if (parsed.tweetUrl) setTweetUrl(parsed.tweetUrl)
      }
    } catch {}
  }, [])

  useEffect(() => {
    try {
      const payload = JSON.stringify({ step, tweetUrl })
      window.localStorage.setItem('gor_tweet_verification_state', payload)
    } catch {}
  }, [step, tweetUrl])

  // Create Twitter Web Intent URL
  const createTwitterIntent = () => {
    const walletAddress = publicKey?.toString()
    console.log('Creating Twitter intent with wallet address:', walletAddress)
    const tweetText = encodeURIComponent(
      `Just claimed my testnet $GOR tokens from the Gorbagana testnet Faucet 💪🗑️\n\n` +
      `Wallet: ${walletAddress?.slice(0, 8)}...${walletAddress?.slice(-8)}\n\n` +
      `Gorbagio @gorbagana_chain\n\n` +
      `Get your testnet tokens here: https://faucet.gorbagana.wtf 🚀🗑️`
    )

    return `https://twitter.com/intent/tweet?text=${tweetText}`
  }

  const handleTweet = () => {
    const twitterUrl = createTwitterIntent()
    window.open(twitterUrl, '_blank', 'width=600,height=400')
    setStep('verify')
  }

  const handleVerifyTweet = async () => {
    if (!tweetUrl.trim()) {
      setError('Please enter the tweet URL')
      return
    }

    // Frontend tweet URL validation
    const isValidTweetUrl = /^https?:\/\/(www\.)?(twitter\.com|x\.com)\/[^\/]+\/status\/\d+/.test(tweetUrl.trim())
    if (!isValidTweetUrl) {
      setError('Invalid tweet URL format. Please use: https://x.com/username/status/123 or https://twitter.com/username/status/123')
      return
    }

    const walletAddress = publicKey?.toString()
    if (!walletAddress) {
      setError('Wallet not connected')
      return
    }

    // Frontend validation
    const isValidWalletAddress = /^[1-9A-HJ-NP-Za-km-z]{32,44}$/.test(walletAddress)
    if (!isValidWalletAddress) {
      setError(`Invalid wallet address format (length: ${walletAddress.length}, expected 32-44 characters)`)
      console.log('Frontend validation failed:', walletAddress)
      return
    }

    setIsVerifying(true)
    setError('')

    try {
      console.log('Sending wallet address:', walletAddress)
      console.log('Wallet address length:', walletAddress.length)
      console.log('Tweet URL being validated:', tweetUrl.trim())

      const response = await fetch('/api/verify-tweet', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tweetUrl: tweetUrl.trim(),
          walletAddress: walletAddress
        })
      })

      const result = await response.json()

      if (result.success && result.verificationToken) {
        onVerificationComplete(tweetUrl, result.verificationToken)
      } else {
        let errorMessage = result.error || 'Tweet verification failed'
        if (result.details) {
          errorMessage += `: ${result.details}`
        }
        setError(errorMessage)
        console.log('Verification failed:', result)
      }
    } catch (error) {
      setError('Failed to verify tweet. Please try again.')
    } finally {
      setIsVerifying(false)
    }
  }

  const resetFlow = () => {
    setStep('tweet')
    setTweetUrl('')
    setError('')
    setIsVerifying(false)
    try { window.localStorage.removeItem('gor_tweet_verification_state') } catch {}
  }

  return (
    <div className="bg-gorb-card-background border border-gorb-border rounded-xl p-6 max-w-md mx-auto">
      <div className="text-center mb-6">
        <h3 className="font-staatliches text-2xl text-gorb-text-primary mb-2">
          Tweet to Claim
        </h3>
        <p className="font-inter text-sm text-gorb-text-secondary">
          Post a tweet to verify and claim your GOR tokens
        </p>
      </div>

      {step === 'tweet' && (
        <div className="space-y-4">
          <div className="bg-black/20 p-4 rounded-lg">
            <p className="font-inter text-sm text-gorb-text-primary mb-3">
              Your tweet will include:
            </p>
            <div className="bg-black/40 p-3 rounded text-xs text-gorb-text-secondary font-mono">
              Just claimed my testnet $GOR tokens from the Gorbagana testnet Faucet 💪🗑️<br/>
              Wallet: {publicKey?.toString().slice(0, 8)}...{publicKey?.toString().slice(-8)}<br/>
              Gorbagio @gorbagana_chain<br/>
              Get your testnet tokens here: https://faucet.gorbagana.wtf 🚀🗑️
            </div>
            <div className="mt-3 text-xs text-gorb-text-muted">
              Full address: {publicKey?.toString()} (length: {publicKey?.toString().length})
            </div>
          </div>

          <button
            onClick={handleTweet}
            className="w-full bg-blue-500 hover:bg-blue-600 text-white font-inter font-semibold py-3 px-6 rounded-full transition-all duration-300 transform hover:-translate-y-1"
          >
            🐦 Tweet to Claim
          </button>
        </div>
      )}

      {step === 'verify' && (
        <div className="space-y-4">
          <div className="text-center">
            <p className="font-inter text-sm text-gorb-text-secondary mb-3">
              Paste your tweet URL here to verify:
            </p>
          </div>

          <input
            type="url"
            value={tweetUrl}
            onChange={(e) => setTweetUrl(e.target.value)}
            placeholder="https://x.com/username/status/... or https://twitter.com/username/status/..."
            className="w-full px-3 py-2 bg-black/40 border border-gorb-border rounded-lg text-gorb-text-primary placeholder-gorb-text-muted focus:border-gorb-accent-primary focus:outline-none"
          />

          {error && (
            <div className="bg-red-500/20 border border-red-500/30 rounded-lg p-3">
              <p className="text-red-400 text-sm">{error}</p>
            </div>
          )}

          <div className="flex gap-3">
            <button
              onClick={resetFlow}
              className="flex-1 bg-gray-600 hover:bg-gray-700 text-white font-inter font-semibold py-2 px-4 rounded-lg transition-colors"
            >
              Back
            </button>
            <button
              onClick={handleVerifyTweet}
              disabled={isVerifying || !tweetUrl.trim()}
              className="flex-1 bg-gorb-accent-primary hover:bg-green-500 text-black font-inter font-semibold py-2 px-4 rounded-lg transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isVerifying ? 'Verifying...' : 'Verify Tweet'}
            </button>
          </div>
        </div>
      )}

      <div className="mt-6 text-center">
        <button
          onClick={onCancel}
          className="text-gorb-text-secondary hover:text-gorb-text-primary transition-colors text-sm"
        >
          Skip for now
        </button>
      </div>
    </div>
  )
}
