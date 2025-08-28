import { NextRequest, NextResponse } from 'next/server'
import { fetchBlockchainTransactions } from '@/lib/faucet'
import { Connection } from '@solana/web3.js'

export async function GET(
  request: NextRequest,
  { params }: { params: { wallet: string } }
) {
  try {
    const walletAddress = params.wallet
    console.log(`🔍 Checking eligibility for wallet: ${walletAddress}`)

    // Connect to Gorbagana testnet with fallback RPC endpoints
    const rpcEndpoints = [
      'https://rpc.gorbagana.wtf',
      'https://api.testnet.solana.com', // Fallback to Solana testnet
    ]

    let connection: Connection | null = null
    let blockchainTransactions: any[] = []

    // Try each RPC endpoint until one works
    for (const rpcUrl of rpcEndpoints) {
      try {
        connection = new Connection(rpcUrl, 'confirmed')
        blockchainTransactions = await fetchBlockchainTransactions(walletAddress, connection)
        break // Success, stop trying other endpoints
      } catch (error) {
        console.warn(`RPC endpoint ${rpcUrl} failed:`, error)
        continue
      }
    }

    // If all RPC endpoints failed, return eligible with warning
    if (!connection || blockchainTransactions === null) {
      console.warn('⚠️ All RPC endpoints failed, allowing claim with warning')
      return NextResponse.json({
        eligible: true,
        message: 'Eligibility check failed due to network issues, allowing claim',
        error: 'RPC connection failed',
        rpcStatus: 'unavailable'
      })
    }

    const now = new Date()

    console.log(`Blockchain transactions found: ${blockchainTransactions.length}`)

    // If no transactions found, wallet is eligible
    if (blockchainTransactions.length === 0) {
      console.log(`✅ Wallet ${walletAddress} is eligible (no previous claims)`)
      return NextResponse.json({
        eligible: true,
        message: 'Wallet is eligible to claim tokens',
        lastClaimTime: null,
        nextClaimTime: null,
        transactionCount: 0
      })
    }

    // Get the most recent faucet claim
    const lastClaim = blockchainTransactions[0]
    const lastClaimTime = new Date(lastClaim.timestamp)

    console.log(`Last claim time: ${lastClaimTime.toISOString()}`)
    console.log(`Transaction signature: ${lastClaim.signature}`)

    // Check if 24 hours have passed since the last claim
    const timeDiff = now.getTime() - lastClaimTime.getTime()
    const hours24 = 24 * 60 * 60 * 1000
    const hoursPassed = timeDiff / (1000 * 60 * 60)

    console.log(`Time since last claim: ${hoursPassed.toFixed(2)} hours`)

    if (timeDiff >= hours24) {
      console.log(`✅ Wallet ${walletAddress} is eligible (24+ hours passed)`)
      return NextResponse.json({
        eligible: true,
        message: 'Wallet is eligible to claim tokens',
        lastClaimTime: lastClaimTime.toISOString(),
        nextClaimTime: null,
        transactionCount: blockchainTransactions.length,
        lastTransaction: lastClaim.signature
      })
    } else {
      const nextClaimTime = new Date(lastClaimTime.getTime() + hours24)
      const remainingHours = Math.ceil((nextClaimTime.getTime() - now.getTime()) / (1000 * 60 * 60))

      console.log(`❌ Wallet ${walletAddress} not eligible (${remainingHours} hours remaining)`)
      return NextResponse.json({
        eligible: false,
        lastClaimTime: lastClaimTime.toISOString(),
        nextClaimTime: nextClaimTime.toISOString(),
        message: `Wallet must wait ${remainingHours} hours before claiming again`,
        remainingHours,
        transactionCount: blockchainTransactions.length,
        lastTransaction: lastClaim.signature
      })
    }
  } catch (error) {
    console.error('Error checking eligibility:', error)
    // Fallback to eligible if blockchain check fails
    console.log('⚠️ Blockchain check failed, allowing claim as fallback')
    return NextResponse.json({
      eligible: true,
      message: 'Eligibility check failed, allowing claim as fallback',
      error: error instanceof Error ? error.message : String(error)
    })
  }
}
