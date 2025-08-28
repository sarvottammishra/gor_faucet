import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { tweetUrl, walletAddress } = body

    if (!tweetUrl || !walletAddress) {
      return NextResponse.json(
        { error: 'Missing tweetUrl or walletAddress' },
        { status: 400 }
      )
    }

    // Extract tweet ID from URL
    const tweetIdMatch = tweetUrl.match(/status\/(\d+)/)
    if (!tweetIdMatch) {
      return NextResponse.json(
        { error: 'Invalid tweet URL format' },
        { status: 400 }
      )
    }

    const tweetId = tweetIdMatch[1]

    console.log('Processing verification for:')
    console.log('- Tweet URL:', tweetUrl)
    console.log('- Tweet ID:', tweetId)
    console.log('- Wallet Address:', walletAddress)
    console.log('- Wallet Address Length:', walletAddress?.length)
    console.log('- Tweet URL validation regex test:', /^https?:\/\/(www\.)?(twitter\.com|x\.com)\/[^\/]+\/status\/\d+/.test(tweetUrl))

    // For now, we'll do a basic verification
    // In production, you might want to use Twitter API v2 to fetch the actual tweet content
    // For this demo, we'll verify the tweet URL structure and wallet address format

    // Basic validations - More flexible Solana address validation
    const isValidWalletAddress = walletAddress && /^[1-9A-HJ-NP-Za-km-z]{32,44}$/.test(walletAddress)
    const isValidTweetUrl = /^https?:\/\/(www\.)?(twitter\.com|x\.com)\/[^\/]+\/status\/\d+/.test(tweetUrl)

    console.log('Validation results:')
    console.log('- Wallet address valid:', isValidWalletAddress)
    console.log('- Tweet URL valid:', isValidTweetUrl)

    if (!isValidWalletAddress) {
      const length = walletAddress?.length || 0
      console.log('Wallet address failed validation. Length:', length, 'Address:', walletAddress)
      return NextResponse.json(
        {
          error: 'Invalid wallet address format',
          details: `Expected Solana address format (32-44 characters, base58). Received: ${length} characters`
        },
        { status: 400 }
      )
    }

    if (!isValidTweetUrl) {
      console.log('Tweet URL failed validation:', tweetUrl)
      return NextResponse.json(
        {
          error: 'Invalid tweet URL format',
          details: 'Please use a valid Twitter/X URL format: https://twitter.com/username/status/123 or https://x.com/username/status/123'
        },
        { status: 400 }
      )
    }

    // Check if this wallet has already been verified recently
    // In a real app, you'd store this in a database
    const verificationKey = `tweet_verification_${walletAddress}`
    const lastVerification = await getLastVerification(walletAddress)

    if (lastVerification) {
      const timeDiff = Date.now() - lastVerification.timestamp
      const twentyFourHours = 24 * 60 * 60 * 1000

      if (timeDiff < twentyFourHours) {
        const remainingHours = Math.ceil((twentyFourHours - timeDiff) / (1000 * 60 * 60))
        return NextResponse.json(
          { error: `Already verified recently. Try again in ${remainingHours} hours.` },
          { status: 429 }
        )
      }
    }

    // Store the verification (in production, use a database)
    await storeVerification(walletAddress, tweetUrl, tweetId)

    return NextResponse.json({
      success: true,
      message: 'Tweet verified successfully!',
      tweetId,
      walletAddress,
      verifiedAt: new Date().toISOString()
    })

  } catch (error) {
    console.error('Tweet verification error:', error)
    return NextResponse.json(
      { error: 'Failed to verify tweet' },
      { status: 500 }
    )
  }
}

// Temporary in-memory storage (replace with database in production)
const verifications = new Map<string, { tweetUrl: string; tweetId: string; timestamp: number }>()

async function getLastVerification(walletAddress: string) {
  return verifications.get(walletAddress)
}

async function storeVerification(walletAddress: string, tweetUrl: string, tweetId: string) {
  verifications.set(walletAddress, {
    tweetUrl,
    tweetId,
    timestamp: Date.now()
  })
}
