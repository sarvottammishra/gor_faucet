#!/usr/bin/env node

/**
 * GOR Faucet Setup Checker
 * Verifies that the faucet is properly configured
 */

const fs = require('fs')
const path = require('path')

function checkFile(filePath, description) {
  const exists = fs.existsSync(filePath)
  console.log(`${exists ? '✅' : '❌'} ${description}: ${exists ? 'Found' : 'Missing'}`)
  return exists
}

function checkEnvVar(varName, value) {
  const isSet = value && value !== `your_${varName.toLowerCase()}_here`
  console.log(`${isSet ? '✅' : '❌'} ${varName}: ${isSet ? 'Set' : 'Not set'}`)
  return isSet
}

async function checkSetup() {
  console.log('🔍 GOR Faucet Setup Check')
  console.log('=========================\n')

  let allGood = true

  // Check required files
  console.log('📁 Required Files:')
  allGood &= checkFile('package.json', 'Package configuration')
  allGood &= checkFile('next.config.js', 'Next.js configuration')
  allGood &= checkFile('tailwind.config.js', 'Tailwind CSS configuration')
  allGood &= checkFile('src/app/page.tsx', 'Main page component')
  allGood &= checkFile('src/components/Faucet.tsx', 'Faucet component')

  // Check environment variables
  console.log('\n🔧 Environment Variables:')
  const envPath = path.join(__dirname, '.env.local')
  if (fs.existsSync(envPath)) {
    const envContent = fs.readFileSync(envPath, 'utf8')
    const envVars = {}

    envContent.split('\n').forEach(line => {
      if (line.includes('=')) {
        const [key, ...valueParts] = line.split('=')
        envVars[key.trim()] = valueParts.join('=').trim()
      }
    })

    allGood &= checkEnvVar('FAUCET_PRIVATE_KEY', envVars.FAUCET_PRIVATE_KEY)
    allGood &= checkEnvVar('SOLANA_RPC_URL', envVars.SOLANA_RPC_URL)
    allGood &= checkEnvVar('NEXT_PUBLIC_API_URL', envVars.NEXT_PUBLIC_API_URL)
  } else {
    console.log('❌ .env.local: Missing (run setup.js first)')
    allGood = false
  }

  // Check node_modules
  console.log('\n📦 Dependencies:')
  allGood &= checkFile('node_modules', 'Node modules installed')

  // Summary
  console.log('\n📊 Summary:')
  if (allGood) {
    console.log('✅ Setup looks good! You can run "npm run dev" to start the faucet.')
  } else {
    console.log('❌ Some issues found. Please fix them before running the faucet.')
    console.log('\n💡 Quick fixes:')
    console.log('   - Run "node setup.js" to configure environment variables')
    console.log('   - Run "npm install" to install dependencies')
  }

  console.log('\n🔗 Useful links:')
  console.log('   - Get devnet SOL: https://faucet.solana.com/')
  console.log('   - Backpack wallet: https://www.backpack.app/')
  console.log('   - Solana docs: https://docs.solana.com/')
}

checkSetup().catch(console.error)
