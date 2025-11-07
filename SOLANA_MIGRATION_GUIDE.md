# Quick Migration Guide: BSC → Solana

This guide helps you quickly migrate from the BSC presale to Solana presale.

## TL;DR - Quick Steps

1. **Install Solana packages** (frontend + backend)
2. **Update App.jsx** to use SolanaWalletProvider
3. **Update server.js** to use presaleSolana routes
4. **Update environment variables**
5. **Test on devnet**

---

## Step-by-Step Migration

### 1. Install Dependencies

#### Frontend
```bash
cd frontend
npm install @solana/wallet-adapter-base \
            @solana/wallet-adapter-react \
            @solana/wallet-adapter-react-ui \
            @solana/wallet-adapter-wallets \
            @solana/web3.js
```

#### Backend
```bash
cd backend
npm install @solana/web3.js
```

---

### 2. Update App.jsx

Replace the wagmi provider with Solana wallet provider for presale:

```jsx
import SolanaWalletProvider from './components/SolanaWalletProvider'
import PresalePageSolana from './pages/PresalePageSolana'
import GamePage from './pages/GamePage'

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

  // Main game page
  return <GamePage />
}

export default App
```

---

### 3. Update server.js

Replace the BSC presale routes with Solana routes:

**Old:**
```javascript
import presaleRoutes from './routes/presale.js'
app.use('/api/presale', presaleRoutes)
```

**New:**
```javascript
import presaleSolanaRoutes from './routes/presaleSolana.js'
app.use('/api/presale', presaleSolanaRoutes)
```

---

### 4. Update Environment Variables

#### Frontend (.env.production)

**Remove:**
```env
VITE_WALLETCONNECT_PROJECT_ID=...
VITE_TOKEN_ADDRESS=...
```

**Add:**
```env
VITE_API_URL=https://binaria.fun
VITE_SOLANA_NETWORK=devnet
VITE_PRESALE_WALLET_ADDRESS=YOUR_SOLANA_WALLET_HERE
```

#### Backend (.env)

**Remove:**
```env
BSC_RPC_URL=...
```

**Update:**
```env
PORT=3001
NODE_ENV=production

# Solana Configuration
SOLANA_NETWORK=devnet
SOLANA_RPC_URL=https://api.devnet.solana.com

# Presale Configuration
PRESALE_WALLET_ADDRESS=YOUR_SOLANA_WALLET_HERE
PRESALE_TOTAL_SUPPLY=1000
PRESALE_PRICE=0.1
```

---

### 5. Get Your Solana Wallet

1. Install **Phantom**: https://phantom.app/
2. Create or import wallet
3. Copy your address (e.g., `7xKXtg2CW87d97TXJSDpbD5jBkheTqA83TZRuJosgAsU`)
4. Get free devnet SOL: https://faucet.solana.com/
5. Use this address in `PRESALE_WALLET_ADDRESS`

---

### 6. Test Locally

```bash
# Terminal 1 - Backend
cd backend
node server.js

# Terminal 2 - Frontend
cd frontend
npm run dev
```

Visit: `http://island.localhost:5173`

1. Connect Phantom wallet
2. Switch to **Devnet** in wallet settings
3. Try purchasing an island!

---

## Key Differences: BSC vs Solana

| Feature | BSC | Solana |
|---------|-----|--------|
| **Currency** | BNB/tBNB | SOL |
| **Block Time** | ~3 seconds | ~400ms |
| **Transaction Fee** | ~$0.10 | ~$0.00025 |
| **Address Format** | `0x1234...` (40 hex) | `7xKXtg...` (base58) |
| **Wallet Libraries** | wagmi, viem | @solana/wallet-adapter |
| **Explorer** | bscscan.com | explorer.solana.com |
| **RPC Providers** | BSC nodes | Helius, QuickNode |

---

## File Comparison

### Replaced Files

| Old (BSC) | New (Solana) |
|-----------|--------------|
| `frontend/src/config/wagmi.js` | `frontend/src/config/solana.js` |
| `frontend/src/hooks/useX402Payment.js` | `frontend/src/hooks/useX402PaymentSolana.js` |
| `frontend/src/pages/PresalePage.jsx` | `frontend/src/pages/PresalePageSolana.jsx` |
| `backend/routes/presale.js` | `backend/routes/presaleSolana.js` |

### New Files

- `frontend/src/components/SolanaWalletProvider.jsx` (replaces RainbowKit setup)
- `PRESALE_SOLANA_README.md`
- `SOLANA_MIGRATION_GUIDE.md` (this file)

---

## Common Issues & Solutions

### ❌ "wallet-adapter not found"
```bash
npm install @solana/wallet-adapter-react @solana/wallet-adapter-react-ui
```

### ❌ "Transaction not found"
Wait 1-2 seconds for Solana confirmation, then check explorer

### ❌ "Insufficient SOL"
Get devnet SOL from https://faucet.solana.com/

### ❌ Wallet not connecting
1. Install Phantom wallet
2. Unlock wallet
3. Refresh page

---

## Production Checklist

Before going to mainnet:

- [ ] Test all flows on **devnet** thoroughly
- [ ] Get **paid RPC endpoint** (Helius/QuickNode)
- [ ] Update to `mainnet-beta` in env vars
- [ ] Implement **database** (replace in-memory storage)
- [ ] Add **rate limiting** to API
- [ ] Set up **monitoring** and alerts
- [ ] Test with small amount first
- [ ] Have customer support ready

---

## Need Help?

- **Solana Docs**: https://docs.solana.com/
- **x402 Docs**: https://x402.gitbook.io/x402
- **Phantom Support**: https://help.phantom.app/

Ready to launch! 🚀
