# Binaria Private Island Presale - Solana Edition

A complete presale implementation using the **x402 internet-native payment protocol** on **Solana blockchain**.

## What Was Built

### Frontend
- **Presale landing page** with modern Tailwind UI
- **Solana wallet connection** via @solana/wallet-adapter (Phantom, Solflare, Torus, Ledger, etc.)
- **x402 payment flow** client implementation
- **Subdomain-based routing** (same app, different pages based on domain)
- **Real-time presale stats** (sold/supply, progress bar)
- **Transaction tracking** with Solana Explorer links

### Backend API
- **Full x402 protocol** server implementation
- **HTTP 402 responses** with payment challenges
- **Payment verification** endpoint with Solana RPC
- **Presale status tracking** (in-memory, ready for database)
- **CORS configured** for multiple domains
- **RESTful API** endpoints:
  - `GET /api/presale/status` - Presale stats
  - `POST /api/presale/purchase` - Initiate purchase (returns 402)
  - `POST /api/presale/verify` - Verify payment on Solana
  - `GET /api/presale/user/:address` - User purchase history

## File Structure

```
isloria-proper/
├── frontend/src/
│   ├── pages/
│   │   ├── GamePage.jsx              # Main game (existing)
│   │   └── PresalePageSolana.jsx     # NEW: Solana presale page
│   ├── hooks/
│   │   └── useX402PaymentSolana.js   # NEW: x402 Solana payment hook
│   ├── components/
│   │   └── SolanaWalletProvider.jsx  # NEW: Wallet adapter wrapper
│   ├── config/
│   │   └── solana.js                 # NEW: Solana config
│   └── App.jsx                       # UPDATED: Subdomain routing
├── backend/
│   ├── routes/
│   │   └── presaleSolana.js          # NEW: Solana presale routes
│   └── server.js                     # UPDATED: Added presale routes
└── PRESALE_SOLANA_README.md          # This file
```

## Key Features

### x402 Protocol Implementation
The presale follows the official x402 specification:

1. **Client requests purchase** → `POST /api/presale/purchase`
2. **Server returns 402** → With `X-PAYMENT` header containing:
   ```json
   {
     "challenge_id": "uuid",
     "amount": "0.1",
     "currency": "SOL",
     "chain": "devnet",
     "payment_address": "your_solana_wallet...",
     "expires_at": timestamp
   }
   ```
3. **Client executes payment** → SOL transfer via Solana Web3.js
4. **Client submits proof** → `POST /api/presale/verify` with tx signature
5. **Server verifies & settles** → Checks on-chain via Solana RPC

### Solana Integration
- **@solana/wallet-adapter** for wallet connections
- **@solana/web3.js** for blockchain interactions
- **Native SOL payments** (no tokens required)
- **Devnet/Testnet/Mainnet** support
- **Transaction verification** using Solana RPC

### Wallet Support
The presale supports all major Solana wallets:
- **Phantom** (most popular)
- **Solflare**
- **Torus**
- **Ledger**
- And more via wallet adapter

## Installation

### 1. Install Frontend Dependencies

```bash
cd frontend
npm install @solana/wallet-adapter-base \
            @solana/wallet-adapter-react \
            @solana/wallet-adapter-react-ui \
            @solana/wallet-adapter-wallets \
            @solana/web3.js
```

### 2. Install Backend Dependencies

```bash
cd backend
npm install @solana/web3.js
```

## Configuration

### Frontend Environment Variables

Create/update `frontend/.env.production`:

```env
# API Backend URL
VITE_API_URL=https://binaria.fun

# Solana Network (devnet | testnet | mainnet-beta)
VITE_SOLANA_NETWORK=devnet

# Optional: Custom RPC URL (leave blank to use default)
VITE_SOLANA_RPC_URL=

# Presale wallet address (where payments are sent)
VITE_PRESALE_WALLET_ADDRESS=YOUR_SOLANA_WALLET_ADDRESS_HERE

# Optional: Token mint address (if using SPL tokens)
VITE_TOKEN_MINT_ADDRESS=
```

### Backend Environment Variables

Create/update `backend/.env`:

```env
# Server Configuration
PORT=3001
NODE_ENV=production

# Solana Configuration
SOLANA_NETWORK=devnet
SOLANA_RPC_URL=https://api.devnet.solana.com

# Presale Configuration
PRESALE_WALLET_ADDRESS=YOUR_SOLANA_WALLET_ADDRESS_HERE
PRESALE_TOTAL_SUPPLY=1000
PRESALE_PRICE=0.1

# x402 Configuration (optional)
X402_FACILITATOR_URL=https://x402-facilitator.example.com
```

## Getting Your Solana Wallet Address

1. **Install Phantom Wallet**: https://phantom.app/
2. **Create a wallet** or import existing one
3. **Copy your wallet address** (starts with a string like `7xKX...`)
4. **Get devnet SOL** from https://faucet.solana.com/ (for testing)
5. Use this address as `PRESALE_WALLET_ADDRESS`

## Testing Locally

### 1. Update hosts file (for subdomain testing)
Add to your hosts file:
```
127.0.0.1 island.localhost
```

### 2. Start backend
```bash
cd backend
npm install
node server.js
```

### 3. Start frontend
```bash
cd frontend
npm install
npm run dev
```

### 4. Visit URLs
- Main game: `http://localhost:5173`
- Presale: `http://island.localhost:5173`

### 5. Test with Phantom Wallet
1. Connect your Phantom wallet
2. Make sure you're on **Devnet** in Phantom settings
3. Get free devnet SOL from https://faucet.solana.com/
4. Try purchasing an island!

## Updating Your App.jsx

You need to wrap your presale page with the Solana wallet provider:

```jsx
import SolanaWalletProvider from './components/SolanaWalletProvider'
import PresalePageSolana from './pages/PresalePageSolana'

function App() {
  const hostname = window.location.hostname
  const isPresalePage = hostname.includes('island.')

  if (isPresalePage) {
    return (
      <SolanaWalletProvider>
        <PresalePageSolana />
      </SolanaWalletProvider>
    )
  }

  return <GamePage />
}
```

## Updating server.js

Import and use the Solana presale routes:

```javascript
import presaleSolanaRoutes from './routes/presaleSolana.js'

// Add to your server
app.use('/api/presale', presaleSolanaRoutes)
```

## Production Deployment

### 1. Deploy to Mainnet

Update environment variables:
```env
VITE_SOLANA_NETWORK=mainnet-beta
SOLANA_NETWORK=mainnet-beta
```

### 2. Use Production RPC (Recommended)

For better performance, use a dedicated RPC provider:
- **Helius**: https://helius.dev/ (Recommended)
- **QuickNode**: https://quicknode.com/
- **Alchemy**: https://alchemy.com/

Example with Helius:
```env
VITE_SOLANA_RPC_URL=https://mainnet.helius-rpc.com/?api-key=YOUR_KEY
SOLANA_RPC_URL=https://mainnet.helius-rpc.com/?api-key=YOUR_KEY
```

### 3. Security Checklist

- [ ] Use **dedicated RPC endpoint** with rate limiting
- [ ] Implement **database** (replace in-memory storage)
- [ ] Add **rate limiting** to API endpoints
- [ ] Secure **admin endpoints** with authentication
- [ ] Test thoroughly on **devnet** before mainnet
- [ ] Monitor transactions with **error alerts**
- [ ] Set up **transaction logging**

## API Examples

### Get Presale Status
```bash
curl https://binaria.fun/api/presale/status
```

Response:
```json
{
  "sold": 150,
  "supply": 1000,
  "price": 0.1,
  "remaining": 850,
  "progress": 15
}
```

### Get User Purchases
```bash
curl https://binaria.fun/api/presale/user/7xKXtg2CW87d97TXJSDpbD5jBkheTqA83TZRuJosgAsU
```

Response:
```json
{
  "address": "7xKXtg2CW87d97TXJSDpbD5jBkheTqA83TZRuJosgAsU",
  "totalPurchased": 5,
  "purchases": [
    {
      "quantity": 5,
      "txSignature": "5J8...",
      "timestamp": 1234567890
    }
  ]
}
```

## Why Solana + x402?

### Solana Benefits:
- **Fast**: ~400ms block times
- **Cheap**: $0.00025 per transaction
- **Scalable**: 65,000+ TPS
- **Growing ecosystem**: Perfect for gaming

### x402 Benefits:
- **Internet-native**: Payments over HTTP
- **Simple integration**: Standard protocol
- **Instant settlement**: No waiting for confirmations
- **Blockchain agnostic**: Works with any chain

## Troubleshooting

### "Transaction not found"
- Wait a few seconds for Solana confirmation
- Check transaction on Solana Explorer
- Ensure you're on the correct network (devnet/mainnet)

### "Insufficient payment amount"
- Check wallet has enough SOL for payment + fees
- Solana transactions require ~0.000005 SOL for fees

### "Wallet not connecting"
- Install Phantom or Solflare wallet
- Refresh the page
- Check wallet is unlocked

### RPC errors
- Free RPC endpoints have rate limits
- Consider using paid RPC provider for production
- Implement retry logic in your code

## Next Steps

1. **Test on devnet** thoroughly
2. **Get dedicated RPC** endpoint (Helius recommended)
3. **Add database** (PostgreSQL, MongoDB)
4. **Deploy token** (optional - if using SPL tokens)
5. **Set up monitoring** and alerts
6. **Launch on mainnet** 🚀

## Resources

### Solana
- **Docs**: https://docs.solana.com/
- **Devnet Faucet**: https://faucet.solana.com/
- **Explorer**: https://explorer.solana.com/

### x402
- **Official Docs**: https://x402.gitbook.io/x402
- **Protocol Spec**: Check docs for latest headers and flow
- **Community**: Join x402 Discord for support

### Wallets
- **Phantom**: https://phantom.app/
- **Solflare**: https://solflare.com/

## Support

Questions? Check:
- Solana documentation: https://docs.solana.com/
- x402 documentation: https://x402.gitbook.io/x402
- Create an issue in your repo

Happy launching on Solana! 🚀🏝️
