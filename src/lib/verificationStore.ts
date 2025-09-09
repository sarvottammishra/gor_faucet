// Simple in-memory verification store shared across API routes

export interface VerificationTokenRecord {
  token: string
  walletAddress: string
  tweetId: string
  createdAt: number
  used: boolean
  usedAt?: number
}

export interface TweetUsageRecord {
  used: boolean
  usedByToken?: string
  usedByWallet?: string
  usedAt?: number
}

const tokenStore = new Map<string, VerificationTokenRecord>()
const tweetUsage = new Map<string, TweetUsageRecord>()

export function createVerificationToken(walletAddress: string, tweetId: string): VerificationTokenRecord {
  const token = generateToken()
  const record: VerificationTokenRecord = {
    token,
    walletAddress,
    tweetId,
    createdAt: Date.now(),
    used: false,
  }
  tokenStore.set(token, record)
  return record
}

export function getVerificationToken(token: string): VerificationTokenRecord | undefined {
  return tokenStore.get(token)
}

export function markTokenUsed(token: string): void {
  const record = tokenStore.get(token)
  if (record) {
    record.used = true
    record.usedAt = Date.now()
    tokenStore.set(token, record)
  }
}

export function isTweetAlreadyUsed(tweetId: string): boolean {
  const rec = tweetUsage.get(tweetId)
  return !!rec?.used
}

export function markTweetUsed(tweetId: string, token: string, walletAddress: string): void {
  tweetUsage.set(tweetId, {
    used: true,
    usedByToken: token,
    usedByWallet: walletAddress,
    usedAt: Date.now(),
  })
}

function generateToken(): string {
  // Use crypto.randomUUID when available, fallback otherwise
  try {
    // @ts-ignore
    if (typeof crypto !== 'undefined' && crypto.randomUUID) {
      // @ts-ignore
      return crypto.randomUUID()
    }
  } catch {}
  return `tok_${Math.random().toString(36).slice(2)}_${Date.now().toString(36)}`
}

// Optional helpers for tests or diagnostics
export function __debugSnapshot() {
  return {
    tokens: Array.from(tokenStore.values()),
    tweets: Array.from(tweetUsage.entries()),
  }
}


