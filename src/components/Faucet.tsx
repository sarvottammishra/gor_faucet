'use client'

import { FC, useState, useEffect } from 'react'
import { useWallet } from '@solana/wallet-adapter-react'
import { WalletMultiButton } from '@solana/wallet-adapter-react-ui'
import { Connection, PublicKey, LAMPORTS_PER_SOL } from '@solana/web3.js'
import { ClaimButton } from './ClaimButton'
import { ClaimHistory } from './ClaimHistory'

export const Faucet: FC = () => {
  const { publicKey, connected } = useWallet()
  const [balance, setBalance] = useState<number | null>(null)
  const [isLoading, setIsLoading] = useState(false)

  // Gorbagana testnet connection
  const connection = new Connection('https://rpc.gorbagana.wtf', 'confirmed')

  useEffect(() => {
    if (connected && publicKey) {
      fetchBalance()
    }
  }, [connected, publicKey])

  const fetchBalance = async () => {
    if (!publicKey) return

    try {
      setIsLoading(true)
      const balance = await connection.getBalance(publicKey)
      setBalance(balance / LAMPORTS_PER_SOL)
    } catch (error) {
      console.error('Error fetching balance:', error)
    } finally {
      setIsLoading(false)
    }
  }

  if (!connected) {
    return (
      <div className="text-center">
        <p className="font-inter text-lg text-gorb-text-secondary">
          Connect your wallet from the top right to get started
        </p>
      </div>
    )
  }

  return (
    <div className="w-full max-w-md mx-auto space-y-6">
      <ClaimButton connection={connection} publicKey={publicKey!} />
      <ClaimHistory publicKey={publicKey!} />
    </div>
  )
}
