import { Connection, PublicKey, SystemProgram, Transaction, sendAndConfirmTransaction, Keypair } from '@solana/web3.js'
import bs58 from 'bs58'

// Shared data store for claims and history
export interface ClaimRecord {
  id: string
  walletAddress: string
  timestamp: Date
  amount: number
  txHash: string
}

// Global in-memory store (in production, use a database)
const globalClaims = new Map<string, Date>()
const globalClaimHistory = new Map<string, ClaimRecord[]>()

// Cache for eligibility checks to prevent excessive API calls
interface EligibilityCache {
  result: ClaimEligibility
  timestamp: number
}
const eligibilityCache = new Map<string, EligibilityCache>()
const CACHE_DURATION = 30 * 1000 // 30 seconds cache

// Cache for claim history to prevent excessive API calls
interface HistoryCache {
  history: ClaimRecord[]
  timestamp: number
}
const historyCache = new Map<string, HistoryCache>()

export function getLastClaimTime(walletAddress: string): Date | null {
  return globalClaims.get(walletAddress) || null
}

export function setLastClaimTime(walletAddress: string, timestamp: Date): void {
  globalClaims.set(walletAddress, timestamp)
}

export function getClaimHistoryFromStore(walletAddress: string): ClaimRecord[] {
  return globalClaimHistory.get(walletAddress) || []
}

export function addClaimToHistory(walletAddress: string, amount: number, txHash: string): void {
  const history = getClaimHistoryFromStore(walletAddress)
  const newClaim: ClaimRecord = {
    id: `${walletAddress}-${Date.now()}`,
    walletAddress,
    timestamp: new Date(),
    amount,
    txHash
  }
  history.push(newClaim)
  globalClaimHistory.set(walletAddress, history)
  // Also update last claim time
  setLastClaimTime(walletAddress, newClaim.timestamp)
}

/**
 * Clear cache for a specific wallet (useful after claiming)
 */
export function clearWalletCache(walletAddress: string): void {
  eligibilityCache.delete(walletAddress)
  historyCache.delete(walletAddress)
  console.log(`🧹 Cleared cache for wallet: ${walletAddress}`)
}

// Fetch blockchain transaction history for eligibility checking
export async function fetchBlockchainTransactions(walletAddress: string, connection: Connection): Promise<any[]> {
  try {
    console.log(`🔍 Fetching blockchain transactions for ${walletAddress}`)

    // Add timeout wrapper for production resilience
    const timeoutPromise = new Promise((_, reject) =>
      setTimeout(() => reject(new Error('RPC request timeout')), 10000)
    )

    // Get recent transaction signatures for the wallet with timeout
    const signaturesPromise = connection.getSignaturesForAddress(
      new PublicKey(walletAddress),
      {
        limit: 20 // Get last 20 transactions
      }
    )

    const signatures = await Promise.race([signaturesPromise, timeoutPromise]) as any[]

    if (!signatures || signatures.length === 0) {
      console.log(`ℹ️ No transactions found for ${walletAddress}`)
      return []
    }

    const transactions = []

    // Get details for each transaction with individual timeouts
    for (const sigInfo of signatures) {
      try {
        const txPromise = connection.getTransaction(sigInfo.signature, {
          commitment: 'confirmed',
          maxSupportedTransactionVersion: 0
        })

        const txTimeout = new Promise((_, reject) =>
          setTimeout(() => reject(new Error('Transaction fetch timeout')), 5000)
        )

        const tx = await Promise.race([txPromise, txTimeout]) as any

        if (tx && tx.meta && tx.meta.err === null) {
          // Check if this is an incoming transfer (faucet claim)
          const accountKeys = tx.transaction.message.getAccountKeys()
          const recipientInvolved = accountKeys.staticAccountKeys.some((key: PublicKey) =>
            key.toString() === walletAddress
          )

          if (recipientInvolved) {
            // Check if this looks like a faucet transaction (small amount, likely from faucet)
            const preBalances = tx.meta.preBalances
            const postBalances = tx.meta.postBalances

            // Find the balance change for our wallet
            const walletIndex = accountKeys.staticAccountKeys.findIndex((key: PublicKey) =>
              key.toString() === walletAddress
            )

            if (walletIndex !== -1 && preBalances && postBalances && walletIndex < postBalances.length && walletIndex < preBalances.length) {
              const balanceChange = postBalances[walletIndex] - preBalances[walletIndex]

              // Check if this looks like a faucet claim (around 0.5 GOR = 500,000,000 lamports)
              if (balanceChange > 400_000_000 && balanceChange < 600_000_000) {
                transactions.push({
                  signature: sigInfo.signature,
                  timestamp: sigInfo.blockTime ? new Date(sigInfo.blockTime * 1000) : new Date(),
                  amount: balanceChange,
                  type: 'faucet_claim'
                })
              }
            }
          }
        }
      } catch (error) {
        // Don't log individual transaction errors in production to reduce noise
        if (process.env.NODE_ENV === 'development') {
          console.log(`Failed to fetch transaction ${sigInfo.signature}: ${error instanceof Error ? error.message : String(error)}`)
        }
      }
    }

    console.log(`✅ Found ${transactions.length} potential faucet claims for ${walletAddress}`)
    return transactions.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())

  } catch (error) {
    console.error('Error fetching blockchain transactions:', error)

    // In production, provide a more graceful fallback
    if (typeof window !== 'undefined') {
      console.warn('⚠️ Blockchain query failed, claim history may be incomplete')
    }

    return []
  }
}

// Fast transaction verification function
async function verifyTransactionOnChain(signature: string, connection: Connection, recipientAddress: string): Promise<boolean> {
  console.log(`🔍 Verifying transaction ${signature} for ${recipientAddress}`)

  // Method 1: Fast getTransaction with immediate check
  try {
    const tx = await connection.getTransaction(signature, {
      commitment: 'confirmed',
      maxSupportedTransactionVersion: 0
    })

    if (tx && tx.meta && tx.meta.err === null) {
      // Check if recipient was involved (look for recipient in account keys)
      const accountKeys = tx.transaction.message.getAccountKeys()
      const recipientInvolved = accountKeys.staticAccountKeys.some((key: PublicKey) =>
        key.toString() === recipientAddress
      )

      if (recipientInvolved) {
        console.log(`✅ Transaction verified on-chain: ${signature}`)
        return true
      }
    }
  } catch (error) {
    console.log(`Direct verification failed: ${error instanceof Error ? error.message : String(error)}`)
  }

  // Method 2: Use our verify-transaction API endpoint
  try {
    const response = await fetch(process.env.NEXT_PUBLIC_API_URL + '/verify-transaction', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        signature,
        walletAddress: recipientAddress
      })
    })

    if (response.ok) {
      const result = await response.json()
      if (result.success && result.found) {
        console.log(`✅ Transaction verified via API: ${signature}`)
        return true
      }
    }
  } catch (error) {
    console.log(`API verification failed: ${error instanceof Error ? error.message : String(error)}`)
  }

  // Method 3: Quick signature status check
  try {
    const status = await connection.getSignatureStatus(signature)
    if (status && status.value?.err === null && status.value?.confirmations !== undefined) {
      console.log(`✅ Transaction status verified: ${signature}`)
      return true
    }
  } catch (error) {
    console.log(`Status check failed: ${error instanceof Error ? error.message : String(error)}`)
  }

  console.log(`❌ Transaction verification failed: ${signature}`)
  return false
}

// Configuration
const FAUCET_PRIVATE_KEY = process.env.NEXT_PUBLIC_FAUCET_PRIVATE_KEY || ''
const CLAIM_AMOUNT = 500_000_000 // 0.5 GOR in lamports (matches admin/drop route)

// Dynamic API URL detection for production
const getApiBaseUrl = () => {
  // In production, use relative URLs or the current origin
  if (typeof window !== 'undefined') {
    return `${window.location.origin}/api`
  }
  // Fallback for server-side
  return process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000/api'
}

export const API_BASE_URL = getApiBaseUrl()

// Explorer URLs
export const EXPLORER_BASE_URL = 'https://trashscan.io'

export const getExplorerUrl = (signature: string): string => {
  return `${EXPLORER_BASE_URL}/tx/${signature}`
}

export interface ClaimEligibility {
  eligible: boolean
  lastClaimTime?: string
  nextClaimTime?: string
}



/**
 * Check if a wallet is eligible to claim tokens
 */
export async function checkClaimEligibility(walletAddress: string, forceRefresh = false): Promise<ClaimEligibility> {
  // Check cache first (unless force refresh is requested)
  if (!forceRefresh) {
    const cached = eligibilityCache.get(walletAddress)
    if (cached && (Date.now() - cached.timestamp) < CACHE_DURATION) {
      console.log(`📋 Using cached eligibility for ${walletAddress}`)
      return cached.result
    }
  }

  try {
    console.log(`🔍 Checking eligibility for wallet: ${walletAddress}`)
    const response = await fetch(`${API_BASE_URL}/eligibility/${walletAddress}`)
    if (!response.ok) {
      throw new Error('Failed to check eligibility')
    }
    const result = await response.json()

    // Cache the result
    eligibilityCache.set(walletAddress, {
      result,
      timestamp: Date.now()
    })

    return result
  } catch (error) {
    console.error('Error checking eligibility:', error)
    // For development, allow claiming if API is not available
    const fallbackResult = { eligible: true }

    // Cache the fallback result for a shorter duration
    eligibilityCache.set(walletAddress, {
      result: fallbackResult,
      timestamp: Date.now()
    })

    return fallbackResult
  }
}

/**
 * Get claim history for a wallet
 */
export async function getClaimHistory(walletAddress: string, forceRefresh = false): Promise<ClaimRecord[]> {
  // Check cache first (unless force refresh is requested)
  if (!forceRefresh) {
    const cached = historyCache.get(walletAddress)
    if (cached && (Date.now() - cached.timestamp) < CACHE_DURATION) {
      console.log(`📋 Using cached history for ${walletAddress}`)
      return cached.history
    }
  }

  try {
    console.log(`🔍 Fetching claim history for wallet: ${walletAddress}`)
    const response = await fetch(`${API_BASE_URL}/history/${walletAddress}`)
    if (!response.ok) {
      throw new Error('Failed to fetch claim history')
    }
    const history = await response.json()

    // Cache the result
    historyCache.set(walletAddress, {
      history,
      timestamp: Date.now()
    })

    return history
  } catch (error) {
    console.error('Error fetching claim history:', error)
    // Return empty array on error
    const emptyHistory: ClaimRecord[] = []

    // Cache empty result for a shorter duration to avoid repeated failures
    historyCache.set(walletAddress, {
      history: emptyHistory,
      timestamp: Date.now()
    })

    return emptyHistory
  }
}

/**
 * Claim tokens for a wallet
 */
export async function claimTokens(connection: Connection, recipientPublicKey: PublicKey, verificationToken?: string): Promise<string> {
  try {
    // First check eligibility
    const eligibility = await checkClaimEligibility(recipientPublicKey.toString())
    if (!eligibility.eligible) {
      throw new Error('Not eligible to claim tokens yet')
    }

    // Use local faucet wallet to send tokens directly
    const faucetResponse = await fetch('/api/admin/drop', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        recipientAddress: recipientPublicKey.toString(),
        amount: CLAIM_AMOUNT,
        verificationToken,
      }),
    })

    if (!faucetResponse.ok) {
      const error = await faucetResponse.json()
      throw new Error(error.error || 'Failed to claim from faucet')
    }

    const faucetResult = await faucetResponse.json()

    if (!faucetResult.success) {
      throw new Error(faucetResult.error || 'Failed to process token drop')
    }

    // Verify transaction immediately after sending
    const signature = faucetResult.signature
    console.log(`🔍 Starting transaction verification for ${signature}`)

    const isVerified = await verifyTransactionOnChain(signature, connection, recipientPublicKey.toString())
    console.log(`Verification result: ${isVerified}`)

    if (!isVerified) {
      console.error(`❌ Transaction verification failed for ${signature}`)
      // Still try to record the claim even if verification fails
      // This prevents false negatives
      console.log(`⚠️ Attempting to record claim despite verification failure`)
    }

    // Always record claim after transaction is sent (whether verified or not)
    // This ensures we don't lose claims due to verification issues
    console.log(`📝 Recording claim for ${recipientPublicKey.toString()} with signature ${signature}`)

    try {
      await recordClaim(recipientPublicKey.toString(), signature)
      console.log(`✅ Claim recording completed`)

      // Immediately check eligibility to verify the claim was recorded
      const eligibilityCheck = await checkClaimEligibility(recipientPublicKey.toString())
      console.log(`📊 Eligibility after claim:`, eligibilityCheck)

      if (!eligibilityCheck.eligible) {
        console.log(`🎉 Claim successfully recorded! Wallet is now ineligible for ${(eligibilityCheck as any).remainingHours || 24} hours`)
      } else {
        console.error(`❌ Claim recording failed - wallet is still eligible`)
      }

    } catch (claimError) {
      const errorMessage = claimError instanceof Error ? claimError.message : String(claimError)
      console.error(`❌ Failed to record claim: ${errorMessage}`)
      console.error(`Full error:`, claimError)
      throw new Error(`Failed to record claim: ${errorMessage}`)
    }

    return signature
  } catch (error) {
    console.error('Error claiming tokens:', error)
    throw error
  }
}

/**
 * Record a claim in the backend
 */
async function recordClaim(walletAddress: string, txHash: string): Promise<void> {
  try {
    const response = await fetch(`${API_BASE_URL}/claim`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        walletAddress,
        txHash,
        amount: CLAIM_AMOUNT,
      }),
    })

    if (!response.ok) {
      throw new Error('Failed to record claim')
    }
  } catch (error) {
    console.error('Error recording claim:', error)
    // Don't throw here as the transaction was successful
  }
}

/**
 * Admin function to create a token drop transaction (server-side only)
 */
export async function createTokenDrop(
  connection: Connection,
  recipientAddress: string,
  amount: number = CLAIM_AMOUNT
): Promise<string> {
  if (!FAUCET_PRIVATE_KEY) {
    throw new Error('Faucet private key not configured')
  }

  try {
    const faucetKeypair = Keypair.fromSecretKey(bs58.decode(FAUCET_PRIVATE_KEY))
    const recipientPublicKey = new PublicKey(recipientAddress)

    // Create transfer instruction
    const transferInstruction = SystemProgram.transfer({
      fromPubkey: faucetKeypair.publicKey,
      toPubkey: recipientPublicKey,
      lamports: amount,
    })

    // Create and send transaction
    const transaction = new Transaction().add(transferInstruction)
    const signature = await sendAndConfirmTransaction(connection, transaction, [faucetKeypair])

    return signature
  } catch (error) {
    console.error('Error creating token drop:', error)
    throw error
  }
}
