#!/usr/bin/env node

/**
 * GOR Faucet Setup Script
 * Helps users configure their faucet wallet and environment
 */

const fs = require('fs')
const path = require('path')
const readline = require('readline')

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
})

function question(prompt) {
  return new Promise((resolve) => {
    rl.question(prompt, resolve)
  })
}

async function setup() {
  console.log('🚀 GOR Faucet Setup')
  console.log('==================\n')

  // Check if .env.local already exists
  const envPath = path.join(__dirname, '.env.local')
  if (fs.existsSync(envPath)) {
    const overwrite = await question('.env.local already exists. Overwrite? (y/N): ')
    if (overwrite.toLowerCase() !== 'y') {
      console.log('Setup cancelled.')
      rl.close()
      return
    }
  }

  console.log('📝 Please provide the following information:\n')

  // Get faucet private key
  const faucetPrivateKey = await question('Faucet wallet private key (base58): ')
  if (!faucetPrivateKey) {
    console.log('❌ Faucet private key is required.')
    rl.close()
    return
  }

  // Get Solana RPC URL
  const rpcUrl = await question('Solana RPC URL (default: https://api.devnet.solana.com): ')
  const solanaRpcUrl = rpcUrl || 'https://api.devnet.solana.com'

  // Get API URL
  const apiUrl = await question('API base URL (default: http://localhost:3000/api): ')
  const nextPublicApiUrl = apiUrl || 'http://localhost:3000/api'

  // Create .env.local content
  const envContent = `# Faucet Configuration
FAUCET_PRIVATE_KEY=${faucetPrivateKey}
SOLANA_RPC_URL=${solanaRpcUrl}
NEXT_PUBLIC_API_URL=${nextPublicApiUrl}
SOLANA_CLUSTER=devnet
`

  // Write .env.local
  fs.writeFileSync(envPath, envContent)

  console.log('\n✅ Setup complete!')
  console.log(`📄 Created .env.local with your configuration`)
  console.log('\n🔐 IMPORTANT SECURITY NOTES:')
  console.log('   - Never commit .env.local to version control')
  console.log('   - Keep your faucet wallet private key secure')
  console.log('   - Fund your faucet wallet with devnet SOL before use')
  console.log('\n🚀 Run "npm run dev" to start the faucet!')

  rl.close()
}

setup().catch(console.error)
