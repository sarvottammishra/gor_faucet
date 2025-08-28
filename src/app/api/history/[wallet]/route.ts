import { NextRequest, NextResponse } from 'next/server'
import { fetchBlockchainTransactions } from '@/lib/faucet'
import { Connection } from '@solana/web3.js'

export async function GET(
  request: NextRequest,
  { params }: { params: { wallet: string } }
) {
  try {
    const walletAddress = params.wallet
    console.log(`🔍 Fetching claim history for wallet: ${walletAddress}`)

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

    // If all RPC endpoints failed, return empty history with warning
    if (!connection || blockchainTransactions === null) {
      console.warn('⚠️ All RPC endpoints failed for history fetch')
      return NextResponse.json([], {
        status: 206, // Partial content
        headers: {
          'X-RPC-Status': 'unavailable'
        }
      })
    }

    // Convert to API response format
    const response = blockchainTransactions.map((tx, index) => ({
      id: `blockchain-${index}`,
      timestamp: new Date(tx.timestamp).toISOString(),
      amount: tx.amount / 1_000_000_000, // Convert lamports to GOR
      txHash: tx.signature
    })).sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())

    console.log(`✅ Returning ${response.length} blockchain transactions for ${walletAddress}`)
    return NextResponse.json(response)
  } catch (error) {
    console.error('Error fetching claim history:', error)
    return NextResponse.json(
      { error: 'Failed to fetch claim history' },
      { status: 500 }
    )
  }
}
