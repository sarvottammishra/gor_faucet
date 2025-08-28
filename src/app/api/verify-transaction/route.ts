import { NextRequest, NextResponse } from 'next/server'
import { Connection } from '@solana/web3.js'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { signature, walletAddress } = body

    if (!signature || !walletAddress) {
      return NextResponse.json(
        { error: 'Signature and wallet address are required' },
        { status: 400 }
      )
    }

    const SOLANA_RPC_URL = process.env.SOLANA_RPC_URL || 'https://rpc.gorbagana.wtf'
    const connection = new Connection(SOLANA_RPC_URL, 'confirmed')

    console.log(`🔍 Verifying transaction: ${signature} for wallet: ${walletAddress}`)

    let verificationResult = {
      signature,
      walletAddress,
      found: false,
      success: false,
      details: null as any,
      method: '',
      attempts: 0
    }

    // Method 1: Direct getTransaction call
    try {
      console.log('Method 1: Direct getTransaction')
      const tx = await connection.getTransaction(signature, {
        commitment: 'confirmed',
        maxSupportedTransactionVersion: 0
      })

      if (tx) {
        const isSuccess = tx.meta && tx.meta.err === null
        const accountKeys = tx.transaction.message.getAccountKeys()
        const isForWallet = accountKeys.staticAccountKeys.some(key =>
          key.toString() === walletAddress
        )

        verificationResult = {
          ...verificationResult,
          found: true,
          success: Boolean(isSuccess && isForWallet),
          details: {
            slot: tx.slot,
            blockTime: tx.blockTime,
            err: tx.meta?.err,
            fee: tx.meta?.fee,
            preBalances: tx.meta?.preBalances,
            postBalances: tx.meta?.postBalances,
            logMessages: tx.meta?.logMessages,
            isForWallet
          },
          method: 'getTransaction',
          attempts: 1
        }

        console.log('Transaction verification result:', verificationResult)
        return NextResponse.json(verificationResult)
      }
    } catch (error) {
      console.log('Method 1 failed:', error instanceof Error ? error.message : String(error))
    }

    // Method 2: JSON RPC API call
    try {
      console.log('Method 2: JSON RPC API')
      const response = await fetch(SOLANA_RPC_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          jsonrpc: '2.0',
          id: 1,
          method: 'getTransaction',
          params: [signature, {
            encoding: 'jsonParsed',
            commitment: 'confirmed',
            maxSupportedTransactionVersion: 0
          }]
        })
      })

      if (response.ok) {
        const data = await response.json()
        if (data.result) {
          const tx = data.result
          const isSuccess = tx.meta && tx.meta.err === null
          const isForWallet = tx.transaction.message.accountKeys.some((key: any) =>
            key.pubkey === walletAddress
          )

          verificationResult = {
            ...verificationResult,
            found: true,
            success: isSuccess && isForWallet,
            details: {
              slot: tx.slot,
              blockTime: tx.blockTime,
              err: tx.meta?.err,
              fee: tx.meta?.fee,
              preBalances: tx.meta?.preBalances,
              postBalances: tx.meta?.postBalances,
              isForWallet
            },
            method: 'JSON-RPC',
            attempts: 2
          }

          console.log('JSON-RPC verification result:', verificationResult)
          return NextResponse.json(verificationResult)
        }
      }
    } catch (error) {
      console.log('Method 2 failed:', error instanceof Error ? error.message : String(error))
    }

    // Method 3: Check recent blockhash and signature status
    try {
      console.log('Method 3: Signature status check')
      const status = await connection.getSignatureStatus(signature)

      verificationResult = {
        ...verificationResult,
        found: status !== null,
        success: status?.value?.err === null && status?.value?.confirmations !== undefined,
        details: status,
        method: 'getSignatureStatus',
        attempts: 3
      }

      console.log('Signature status result:', verificationResult)
      return NextResponse.json(verificationResult)
    } catch (error) {
      console.log('Method 3 failed:', error instanceof Error ? error.message : String(error))
    }

    // If all methods fail
    verificationResult.attempts = 3
    console.log('All verification methods failed:', verificationResult)
    return NextResponse.json(verificationResult)

  } catch (error) {
    console.error('Transaction verification error:', error)
    return NextResponse.json(
      {
        error: 'Failed to verify transaction',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}
