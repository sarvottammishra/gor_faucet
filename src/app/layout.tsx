import type { Metadata } from 'next'
import localFont from 'next/font/local'
import './globals.css'
import { WalletProvider } from '@/components/WalletProvider'

const staatliches = localFont({
  src: '../../public/Staatliches-Regular.ttf',
  variable: '--font-staatliches',
  display: 'swap',
})

const ibmPlexMono = localFont({
  src: '../../public/IBMPlexMono-Medium.ttf',
  variable: '--font-ibm-plex-mono',
  display: 'swap',
})

const inter = localFont({
  src: '../../public/Inter-VariableFont_opszwght.ttf',
  variable: '--font-inter',
  display: 'swap',
})

export const metadata: Metadata = {
  title: 'Gorbagana Faucet - Claim Testnet $GOR',
  description: 'Initially started from a series of tweets, to now powering a high-performance L1 chain, used as gas fee.',
  openGraph: {
    title: 'Gorbagana Faucet - Claim Testnet $GOR',
    description: 'Initially started from a series of tweets, to now powering a high-performance L1 chain, used as gas fee.',
    images: ['/faucet.png'],
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Gorbagana Faucet - Claim Testnet $GOR',
    description: 'Initially started from a series of tweets, to now powering a high-performance L1 chain, used as gas fee.',
    images: ['/faucet.png'],
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className={`${staatliches.variable} ${ibmPlexMono.variable} ${inter.variable} font-inter`}>
        <WalletProvider>
          {children}
        </WalletProvider>
      </body>
    </html>
  )
}
