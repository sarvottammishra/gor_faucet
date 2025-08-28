import { NextRequest, NextResponse } from 'next/server'

// In a real app, you'd use a database. For now, we'll use a simple in-memory store
// In production, replace this with a proper database like MongoDB, PostgreSQL, etc.
const claims = new Map<string, Date>()

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { walletAddress, action } = body

    if (!walletAddress) {
      return NextResponse.json(
        { error: 'Wallet address is required' },
        { status: 400 }
      )
    }

    const now = new Date()

    if (action === 'check') {
      // Check eligibility
      const lastClaim = claims.get(walletAddress)

      if (!lastClaim) {
        return NextResponse.json({
          eligible: true,
          message: 'Wallet is eligible to claim tokens',
          lastClaimTime: null,
          nextClaimTime: null
        })
      }

      const timeDiff = now.getTime() - lastClaim.getTime()
      const hours24 = 24 * 60 * 60 * 1000

      if (timeDiff >= hours24) {
        return NextResponse.json({
          eligible: true,
          message: 'Wallet is eligible to claim tokens',
          lastClaimTime: lastClaim.toISOString(),
          nextClaimTime: null
        })
      } else {
        const nextClaimTime = new Date(lastClaim.getTime() + hours24)
        const remainingHours = Math.ceil((nextClaimTime.getTime() - now.getTime()) / (1000 * 60 * 60))

        return NextResponse.json({
          eligible: false,
          message: `Wallet must wait ${remainingHours} hours before claiming again`,
          lastClaimTime: lastClaim.toISOString(),
          nextClaimTime: nextClaimTime.toISOString(),
          remainingHours
        })
      }
    } else if (action === 'reset') {
      // Reset claim time for testing (remove in production)
      claims.delete(walletAddress)
      return NextResponse.json({
        success: true,
        message: 'Claim time reset for testing',
        walletAddress
      })
    } else if (action === 'force_claim') {
      // Force record a claim for testing (remove in production)
      claims.set(walletAddress, now)
      return NextResponse.json({
        success: true,
        message: 'Claim recorded for testing',
        walletAddress,
        claimTime: now.toISOString()
      })
    } else if (action === 'record_claim') {
      // Directly record a claim without verification (for testing)
      const { signature = 'test-signature', amount = 500000000 } = body || {}

      try {
        console.log(`🧪 Recording test claim for ${walletAddress}`)

        // Record the claim directly
        claims.set(walletAddress, now)

        // Also add to claim history
        const claimHistory = JSON.parse(localStorage.getItem(`claims_${walletAddress}`) || '[]')
        claimHistory.push({
          id: `${walletAddress}-${Date.now()}`,
          timestamp: now.toISOString(),
          amount: amount,
          txHash: signature
        })
        // Note: This is just for testing, in production use a proper database

        console.log(`✅ Test claim recorded for ${walletAddress}`)

        return NextResponse.json({
          success: true,
          message: 'Test claim recorded successfully',
          walletAddress,
          claimTime: now.toISOString(),
          signature,
          totalClaims: claims.size
        })
      } catch (error) {
        console.error('Error recording test claim:', error)
        return NextResponse.json({
          success: false,
          message: 'Failed to record test claim',
          error: error instanceof Error ? error.message : String(error)
        })
      }
  } else if (action === 'verify_and_record') {
      // Verify a transaction and record claim if valid
      const { signature } = body || {}

      if (!signature) {
        return NextResponse.json(
          { error: 'Signature is required for verification' },
          { status: 400 }
        )
      }

      try {
        // Call the transaction verification endpoint
        const verifyResponse = await fetch('http://localhost:3000/api/verify-transaction', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            signature,
            walletAddress
          })
        })

        if (verifyResponse.ok) {
          const verifyResult = await verifyResponse.json()

          if (verifyResult.success && verifyResult.found) {
            // Transaction is valid, record the claim
            claims.set(walletAddress, now)
            return NextResponse.json({
              success: true,
              message: 'Transaction verified and claim recorded',
              signature,
              walletAddress,
              claimTime: now.toISOString(),
              verification: verifyResult
            })
          } else {
            return NextResponse.json({
              success: false,
              message: 'Transaction verification failed',
              verification: verifyResult
            })
          }
        } else {
          return NextResponse.json({
            success: false,
            message: 'Failed to verify transaction'
          })
        }
      } catch (error) {
        return NextResponse.json({
          success: false,
          message: 'Error verifying transaction',
          error: error instanceof Error ? error.message : String(error)
        })
      }
    }

    return NextResponse.json(
      { error: 'Invalid action. Use: check, reset, force_claim, record_claim, or verify_and_record' },
      { status: 400 }
    )
  } catch (error) {
    console.error('Test eligibility error:', error)
    return NextResponse.json(
      { error: 'Failed to test eligibility' },
      { status: 500 }
    )
  }
}
