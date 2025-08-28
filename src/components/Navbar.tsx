'use client'

import { WalletMultiButton } from '@solana/wallet-adapter-react-ui'
import Image from 'next/image'

export default function Navbar() {
  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-gorb-background/80 backdrop-blur-md border-b border-gorb-border">
      <div className="max-w-7xl mx-auto px-3 md:px-5 py-3 md:py-4">
        {/* Desktop Layout */}
        <div className="hidden md:flex justify-between items-center">
          {/* Logo Section */}
          <a href="/" className="flex items-center gap-3 text-decoration-none">
            <Image
              src="/gorb-logo_1gorb-logo.avif"
              alt="Gorbagana Logo"
              width={40}
              height={40}
              className="h-10 w-auto"
            />
            <p className="font-staatliches text-xl text-gorb-text-primary m-0">Gorbagana faucet</p>
          </a>

          {/* Navigation Links */}
          <div className="flex items-center gap-8">
            <a href="#" className="text-gorb-text-primary hover:text-gorb-accent-primary transition-colors font-inter">
              Back home
            </a>
          </div>

          {/* Wallet Connect Button */}
          <div className="flex items-center">
            <WalletMultiButton className="!bg-gorb-accent-secondary !text-black !font-inter !font-semibold !px-4 !py-2 !rounded-full !hover:bg-green-400 !transition-all !duration-300 !transform !hover:-translate-y-1 !text-sm" />
          </div>
        </div>

        {/* Mobile Layout */}
        <div className="flex md:hidden justify-between items-center">
          {/* Logo Section - Compact */}
          <a href="/" className="flex items-center gap-2 text-decoration-none">
            <Image
              src="/gorb-logo_1gorb-logo.avif"
              alt="Gorbagana Logo"
              width={32}
              height={32}
              className="h-8 w-auto"
            />
            <p className="font-staatliches text-sm text-gorb-text-primary m-0">Gorbagana</p>
          </a>

          {/* Wallet Connect Button - Mobile */}
          <div className="flex items-center">
            <WalletMultiButton className="!bg-gorb-accent-secondary !text-black !font-inter !font-semibold !px-3 !py-2 !rounded-full !hover:bg-green-400 !transition-all !duration-300 !transform !hover:-translate-y-1 !text-xs" />
          </div>
        </div>
      </div>
    </nav>
  )
}
