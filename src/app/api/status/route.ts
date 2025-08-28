import { NextRequest, NextResponse } from 'next/server'
import { Connection, PublicKey, Keypair } from '@solana/web3.js'
import bs58 from 'bs58'

export async function GET(request: NextRequest) {
  try {
    const FAUCET_PRIVATE_KEY = process.env.FAUCET_PRIVATE_KEY || ''
    const SOLANA_RPC_URL = process.env.SOLANA_RPC_URL || 'https://rpc.gorbagana.wtf'

    if (!FAUCET_PRIVATE_KEY) {
      return NextResponse.json({
        status: 'error',
        message: 'Faucet private key not configured',
        faucetConfigured: false
      })
    }

    // Create connection
    const connection = new Connection(SOLANA_RPC_URL, 'confirmed')

    // Decode faucet private key to get public key
    let faucetPublicKey: PublicKey
    try {
      const faucetKeypair = Keypair.fromSecretKey(bs58.decode(FAUCET_PRIVATE_KEY))
      faucetPublicKey = faucetKeypair.publicKey
    } catch (error) {
      return NextResponse.json({
        status: 'error',
        message: 'Invalid faucet private key',
        faucetConfigured: false
      })
    }

    // Get faucet balance
    const balance = await connection.getBalance(faucetPublicKey)

    return NextResponse.json({
      status: 'ok',
      message: 'Faucet configured and connected',
      faucetConfigured: true,
      faucetAddress: faucetPublicKey.toString(),
      balance: balance / 1_000_000, // Convert to SOL
      rpcUrl: SOLANA_RPC_URL
    })
  } catch (error) {
    console.error('Status check error:', error)
    return NextResponse.json({
      status: 'error',
      message: 'Failed to connect to blockchain',
      error: error instanceof Error ? error.message : 'Unknown error'
    })
  }
}
