// Lightweight HMAC-signed token utilities for stateless verification
// Token format: base64(jsonPayload).hex(hmac)

type TokenPayload = {
  walletAddress: string
  tweetId: string
  iat: number
}

function getSecret(): string {
  return process.env.VERIFICATION_SECRET || 'dev-verification-secret'
}

function toBase64(input: string): string {
  return Buffer.from(input, 'utf8').toString('base64url')
}

function fromBase64(input: string): string {
  return Buffer.from(input, 'base64url').toString('utf8')
}

function hmac(input: string, secret: string): string {
  const crypto = require('crypto')
  return crypto.createHmac('sha256', secret).update(input).digest('hex')
}

export function issueVerificationToken(walletAddress: string, tweetId: string): string {
  const payload: TokenPayload = { walletAddress, tweetId, iat: Date.now() }
  const payloadStr = JSON.stringify(payload)
  const payloadB64 = toBase64(payloadStr)
  const sig = hmac(payloadB64, getSecret())
  return `${payloadB64}.${sig}`
}

export function verifyVerificationToken(token: string): TokenPayload | null {
  try {
    const [payloadB64, sig] = token.split('.')
    if (!payloadB64 || !sig) return null
    const expected = hmac(payloadB64, getSecret())
    if (expected !== sig) return null
    const payload = JSON.parse(fromBase64(payloadB64)) as TokenPayload
    return payload
  } catch {
    return null
  }
}


