import { Faucet } from '@/components/Faucet'
import Navbar from '@/components/Navbar'
import Image from 'next/image'

export default function Home() {
  return (
    <>
      <Navbar />

      {/* Hero Section */}
      <section className="min-h-screen flex flex-col justify-between items-center px-5 pt-24 pb-8 md:pt-32 md:pb-16">
        <div className="text-center max-w-4xl mx-auto">
          <h1 className="font-staatliches text-7xl md:text-9xl font-normal text-gorb-text-primary leading-tight tracking-tight mb-8">
            Claim your trash <br />start exploring
          </h1>
          <div className="flex flex-col items-center gap-6">
            <Faucet />
            <p className="font-inter text-xl text-gorb-text-secondary max-w-md">
              You will receive 5 Testnet $GOR
            </p>
          </div>
        </div>
        <Image
          src="/oscar-bling.avif"
          alt="Oscar Bling"
          width={600}
          height={400}
          className="w-full max-w-lg h-auto opacity-80 mt-8"
          priority
        />
      </section>
    </>
  )
}
