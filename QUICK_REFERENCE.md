# Quick Reference Card - Solana + x402 Presale

## 📦 Package Installation
```bash
# Windows
setup-solana.bat

# Linux/Mac
chmod +x setup-solana.sh && ./setup-solana.sh
```

## ⚙️ Environment Variables

### Frontend (.env.production)
```env
VITE_API_URL=http://localhost:3001
VITE_SOLANA_NETWORK=devnet
VITE_PRESALE_WALLET_ADDRESS=YOUR_WALLET_HERE
```

### Backend (.env)
```env
PORT=3001
SOLANA_NETWORK=devnet
SOLANA_RPC_URL=https://api.devnet.solana.com
PRESALE_WALLET_ADDRESS=YOUR_WALLET_HERE
PRESALE_TOTAL_SUPPLY=1000
PRESALE_PRICE=0.1
```

## 🔧 Code Changes Required

### 1. App.jsx
```jsx
import SolanaWalletProvider from './components/SolanaWalletProvider'
import PresalePageSolana from './pages/PresalePageSolana'

if (isPresalePage) {
  return (
    <SolanaWalletProvider>
      <PresalePageSolana />
    </SolanaWalletProvider>
  )
}
```

### 2. server.js
```javascript
import presaleSolanaRoutes from './routes/presaleSolana.js'
app.use('/api/presale', presaleSolanaRoutes)
```

## 🚀 Running Locally
```bash
# Terminal 1 - Backend
cd backend && node server.js

# Terminal 2 - Frontend
cd frontend && npm run dev
```

## 🌐 API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/presale/status` | Get presale stats |
| POST | `/api/presale/purchase` | Initiate purchase (returns 402) |
| POST | `/api/presale/verify` | Verify transaction |
| GET | `/api/presale/user/:address` | Get user purchases |

## 🔗 Important Links

| Resource | URL |
|----------|-----|
| Phantom Wallet | https://phantom.app/ |
| Devnet Faucet | https://faucet.solana.com/ |
| Solana Explorer | https://explorer.solana.com/ |
| Helius RPC | https://helius.dev/ |
| Solana Docs | https://docs.solana.com/ |
| x402 Docs | https://x402.gitbook.io/x402 |

## 💰 Solana Networks

| Network | Use Case | Get SOL |
|---------|----------|---------|
| **devnet** | Development | faucet.solana.com |
| **testnet** | Pre-production | faucet.solana.com |
| **mainnet-beta** | Production | Buy from exchange |

## 🔍 Debugging Commands

```bash
# Check Solana version
solana --version

# Get devnet SOL
solana airdrop 2 YOUR_ADDRESS --url devnet

# Check balance
solana balance YOUR_ADDRESS --url devnet

# Get transaction details
solana confirm SIGNATURE --url devnet
```

## 📝 Transaction Flow

1. User clicks "Buy Island"
2. Frontend → `POST /api/presale/purchase`
3. Backend → Returns `402` with payment challenge
4. Frontend → Sends SOL via Solana wallet
5. Frontend → `POST /api/presale/verify` with signature
6. Backend → Verifies on Solana blockchain
7. Backend → Returns success + updates stats

## 🐛 Common Errors

| Error | Solution |
|-------|----------|
| "Transaction not found" | Wait 1-2 seconds for confirmation |
| "Insufficient SOL" | Get more from faucet |
| "Wallet not connecting" | Install Phantom, refresh page |
| "RPC rate limit" | Get paid RPC endpoint |

## 📊 File Structure

```
isloria-proper/
├── frontend/src/
│   ├── config/solana.js              ⭐ NEW
│   ├── hooks/useX402PaymentSolana.js ⭐ NEW
│   ├── pages/PresalePageSolana.jsx   ⭐ NEW
│   └── components/
│       └── SolanaWalletProvider.jsx  ⭐ NEW
├── backend/routes/
│   └── presaleSolana.js              ⭐ NEW
└── docs/
    ├── PRESALE_SOLANA_README.md      ⭐ NEW
    ├── SOLANA_MIGRATION_GUIDE.md     ⭐ NEW
    └── SOLANA_SETUP_COMPLETE.md      ⭐ NEW
```

## ⚡ Production Checklist

- [ ] Install dependencies
- [ ] Update App.jsx and server.js
- [ ] Configure environment variables
- [ ] Test on devnet
- [ ] Get paid RPC endpoint
- [ ] Add database
- [ ] Test on testnet
- [ ] Deploy to mainnet

## 🎯 Key Differences: BSC → Solana

| | BSC | Solana |
|-|-----|--------|
| **Speed** | 3s | 0.4s |
| **Fee** | $0.10 | $0.00025 |
| **Address** | 0x... | base58 |
| **Library** | wagmi | @solana/wallet-adapter |
| **Wallet** | MetaMask | Phantom |

---

**Quick Start:** Run `setup-solana.bat` → Update configs → Test!
