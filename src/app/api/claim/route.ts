import { NextRequest, NextResponse } from 'next/server'
import { getLastClaimTime, addClaimToHistory, getClaimHistoryFromStore, API_BASE_URL } from '@/lib/faucet'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { walletAddress, txHash, amount } = body

    console.log(`📝 Recording claim for ${walletAddress}:`, { txHash, amount })

    if (!walletAddress || !txHash || !amount) {
      return NextResponse.json(
        { error: 'Missing required fields: walletAddress, txHash, amount' },
        { status: 400 }
      )
    }

    // Check eligibility using blockchain data
    const eligibilityCheck = await fetch(`${API_BASE_URL}/eligibility/${walletAddress}`)
    if (!eligibilityCheck.ok) {
      throw new Error('Failed to check eligibility')
    }
    const eligibility = await eligibilityCheck.json()

    console.log(`Eligibility check result:`, eligibility)

    if (!eligibility.eligible) {
      console.log(`❌ Claim blocked - ${eligibility.message}`)
      return NextResponse.json(
        { error: eligibility.message },
        { status: 429 }
      )
    }

    // Record the claim using shared data store
    addClaimToHistory(walletAddress, amount, txHash)

    const now = new Date()
    console.log(`✅ Claim recorded for ${walletAddress} at ${now.toISOString()}`)

    const history = getClaimHistoryFromStore(walletAddress)
    console.log(`Claim history for ${walletAddress}: ${history.length} claims`)

    return NextResponse.json({
      success: true,
      message: 'Claim recorded successfully',
      claimTime: now.toISOString(),
      walletAddress,
      txHash,
      totalClaims: history.length
    })
  } catch (error) {
    console.error('Error recording claim:', error)
    return NextResponse.json(
      { error: 'Failed to record claim' },
      { status: 500 }
    )
  }
}
