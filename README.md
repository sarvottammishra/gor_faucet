# Gorbagana GOR Faucet

A Next.js-based faucet for **Gorbagana Testnet v1** that allows users to claim **0.5 GOR tokens** with a 24-hour cooldown period per wallet.

> **🚀 Powered by Gorbagana** - Single validator network with fast confirmations and minimal fees

## Features

- 🔗 **Wallet Integration**: Phantom, Solflare, Backpack*, and other Solana-compatible wallets
- ⏰ **24-hour Cooldown**: One claim per wallet every 24 hours
- 📊 **Claim History**: Complete transaction tracking
- 🎨 **Modern UI**: Responsive design with real-time feedback
- 🔒 **Secure Distribution**: Blockchain-verified token transfers
- 🚀 **Fast Confirmations**: Optimized for Gorbagana single-validator network

*Backpack wallet supported through browser extension auto-detection

## Gorbagana Network

This faucet is optimized for **[Gorbagana Testnet v1](https://docs.gorbagana.wtf/)**:

- **Single Validator**: Fast transaction confirmations
- **Low Block Times**: Sub-second finality
- **Minimal Fees**: Cost-effective transactions
- **SPL Compatible**: Works with Solana Program Library
- **Community Driven**: Transparent and fair distribution

## Prerequisites

- Node.js 18+ and npm
- A funded Gorbagana testnet wallet for the faucet (with GOR tokens)
- Backpack wallet extension (recommended)
- Access to Gorbagana Testnet v1 RPC: `https://rpc.gorbagana.wtf`
- Basic understanding of [Gorbagana Network](https://docs.gorbagana.wtf/)

## Setup

1. **Clone and install dependencies:**
   ```bash
   npm install
   ```

2. **Configure environment variables:**

   Copy `.env.example` to `.env.local`:
   ```bash
   cp .env.example .env.local
   ```

   Edit `.env.local` with your configuration:
   ```env
   # Faucet wallet private key (base58 encoded)
   FAUCET_PRIVATE_KEY=your_faucet_wallet_private_key_here

   # Solana RPC endpoint (devnet by default)
   SOLANA_RPC_URL=https://api.devnet.solana.com

   # Next.js public URL for API calls
   NEXT_PUBLIC_API_URL=http://localhost:3000/api
   ```

3. **Set up the faucet wallet:**

   - Create a new Solana-compatible wallet or use an existing one
   - Fund it with **GOR tokens** from the [Gorbagana Faucet](https://faucet.gorbagana.wtf)
   - Export the private key and convert it to base58 format
   - Add the private key to your `.env.local` file

   **Note**: The faucet wallet needs sufficient GOR tokens to distribute 0.5 GOR per claim

4. **Run the development server:**
   ```bash
   npm run dev
   ```

   Open [http://localhost:3000](http://localhost:3000) in your browser.

## Usage

1. **Connect Wallet:**
   - Click the "Connect Wallet" button
   - Select your preferred Solana wallet (Phantom, Solflare, Backpack*, or others)
   - Approve the connection

   *Backpack: If you have the Backpack browser extension installed, it will be automatically detected when you click "Connect Wallet"

2. **Claim Tokens:**
   - Once connected, you'll see your wallet balance
   - Click "Claim 1 Test Token" if eligible
   - Wait for the transaction to complete
   - Tokens will be sent to your connected wallet

3. **Claim Cooldown:**
   - Each wallet can only claim once every 24 hours
   - The UI shows a countdown until the next eligible claim time
   - Claim history is displayed below the claim button

## API Endpoints

- `GET /api/eligibility/[wallet]` - Check claim eligibility
- `GET /api/history/[wallet]` - Get claim history
- `POST /api/claim` - Record a claim
- `POST /api/admin/drop` - Admin endpoint for token drops

## Development

### Project Structure

```
src/
├── app/                 # Next.js app router
│   ├── api/            # API routes
│   ├── globals.css     # Global styles
│   └── layout.tsx      # Root layout
├── components/         # React components
│   ├── Faucet.tsx     # Main faucet component
│   ├── ClaimButton.tsx # Claim button with rate limiting
│   ├── ClaimHistory.tsx # Claim history display
│   └── WalletProvider.tsx # Solana wallet provider
└── lib/               # Utility functions
    └── faucet.ts      # Faucet logic and API calls
```

### Adding New Features

- Components are in `src/components/`
- API routes follow Next.js 13+ app router conventions
- Styles use Tailwind CSS classes

## Security Notes

⚠️ **Important Security Considerations:**

1. **Private Key Security:**
   - Never commit private keys to version control
   - Use environment variables for sensitive configuration
   - Consider using a hardware wallet for production

2. **Rate Limiting:**
   - The current implementation uses in-memory storage
   - For production, implement proper database storage
   - Consider adding additional rate limiting measures

3. **Production Deployment:**
   - Use a proper database (MongoDB, PostgreSQL, etc.)
   - Implement proper error handling and logging
   - Add authentication for admin endpoints
   - Use HTTPS in production

## Troubleshooting

### Common Issues

1. **"Faucet not configured" error:**
   - Ensure `FAUCET_PRIVATE_KEY` is set in `.env.local`
   - Verify the private key is valid base58

2. **"Insufficient faucet balance" error:**
   - Fund your faucet wallet with devnet SOL
   - Check the faucet wallet balance

3. **Wallet connection issues:**
   - Ensure you have a Solana wallet extension installed
   - Try refreshing the page and reconnecting

### Getting Gorbagana Testnet SOL

- Visit https://faucet.gorbagana.wtf
- Request SOL for your faucet wallet address
- The faucet distributes tokens according to Gorbagana testnet rules

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## License

This project is open source and available under the [MIT License](LICENSE).
