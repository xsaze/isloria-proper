# Isloria Private Island Presale

A complete presale implementation using the x402 internet-native payment protocol on BSC (Binance Smart Chain).

## What Was Built

### Frontend (`island.binaria.fun`)
- **Presale landing page** with modern Tailwind UI
- **Wallet connection** via RainbowKit (MetaMask, WalletConnect, etc.)
- **x402 payment flow** client implementation
- **Subdomain-based routing** (same app, different pages based on domain)
- **Real-time presale stats** (sold/supply, progress bar)
- **Transaction tracking** with BscScan links

### Backend API
- **Full x402 protocol** server implementation
- **HTTP 402 responses** with payment challenges
- **Payment verification** endpoint
- **Presale status tracking** (in-memory, ready for database)
- **CORS configured** for multiple domains
- **RESTful API** endpoints:
  - `GET /api/presale/status` - Presale stats
  - `POST /api/presale/purchase` - Initiate purchase (returns 402)
  - `POST /api/presale/verify` - Verify payment
  - `GET /api/presale/user/:address` - User purchase history

## File Structure

```
isloria-proper/
├── frontend/src/
│   ├── pages/
│   │   ├── GamePage.jsx          # Main game (existing code wrapped)
│   │   └── PresalePage.jsx        # NEW: Presale page
│   ├── hooks/
│   │   └── useX402Payment.js      # NEW: x402 payment hook
│   ├── config/
│   │   └── wagmi.js               # NEW: Web3 config (BSC)
│   ├── App.jsx                    # UPDATED: Subdomain routing
│   └── .env.production            # UPDATED: Added presale env vars
├── backend/
│   ├── routes/
│   │   └── presale.js             # NEW: Presale API routes
│   ├── server.js                  # UPDATED: Added presale routes + CORS
│   └── .env                       # UPDATED: Presale configuration
├── nginx.conf.example             # NEW: Nginx subdomain config
├── DEPLOYMENT.md                  # NEW: Full deployment guide
└── PRESALE_README.md              # This file
```

## Key Features

### x402 Protocol Implementation
The presale follows the official x402 specification:

1. **Client requests purchase** → `POST /api/presale/purchase`
2. **Server returns 402** → With `X-PAYMENT` header containing:
   ```json
   {
     "challenge_id": "uuid",
     "amount": "100",
     "currency": "ISLORIA",
     "chain": "bsc",
     "payment_address": "0x...",
     "expires_at": timestamp
   }
   ```
3. **Client executes payment** → Token transfer via wagmi/viem
4. **Client submits proof** → `POST /api/presale/verify` with tx hash
5. **Server verifies & settles** → Checks on-chain + x402 facilitator

### Subdomain Routing
Single build serves both sites:
- Detects hostname in `App.jsx`
- Shows GamePage for `binaria.fun`
- Shows PresalePage for `island.binaria.fun`
- No React Router needed - simple conditional rendering

### Web3 Integration
- **Wagmi + Viem** for modern Web3 interactions
- **RainbowKit** for beautiful wallet connection UI
- **BSC network** configured (Chain ID: 56)
- **ERC-20 token transfers** ready to go

## Configuration Required

### Before Deploying

1. **Get WalletConnect Project ID**
   - Visit https://cloud.walletconnect.com/
   - Create a project
   - Copy Project ID to `VITE_WALLETCONNECT_PROJECT_ID`

2. **Deploy Your Token Contract** (when ready)
   - Update `VITE_TOKEN_ADDRESS` in frontend
   - Update `TOKEN_SYMBOL` in backend

3. **Set Receiving Wallet**
   - Update `PRESALE_WALLET_ADDRESS` in backend
   - This wallet will receive presale payments

4. **Configure x402 Facilitator**
   - Register with x402 service (see x402 docs)
   - Update `X402_FACILITATOR_URL` in backend

### Optional Enhancements

- **Database integration** - Replace in-memory storage
- **Smart contract** - Deploy presale contract for automated allocation
- **Email notifications** - Send purchase confirmations
- **Admin dashboard** - View all purchases and stats
- **Whitelist system** - Restrict purchases to approved addresses
- **Purchase limits** - Max purchases per address

## Testing Locally

### 1. Update hosts file
Add to your hosts file:
```
127.0.0.1 island.localhost
```

### 2. Start dev servers
```bash
# Terminal 1 - Backend
cd backend
npm install
node server.js

# Terminal 2 - Frontend
cd frontend
npm install
npm run dev
```

### 3. Visit URLs
- Main game: `http://localhost:5173`
- Presale: `http://island.localhost:5173`

## Production Deployment

See [DEPLOYMENT.md](./DEPLOYMENT.md) for full deployment instructions.

Quick steps:
1. Configure environment variables
2. Build frontend: `npm run build`
3. Setup nginx with subdomain config
4. Configure DNS (A records for both domains)
5. Get SSL certificates via certbot
6. Start backend with PM2

## API Examples

### Get Presale Status
```bash
curl https://binaria.fun/api/presale/status
```

Response:
```json
{
  "sold": 150,
  "supply": 5000,
  "price": 100,
  "remaining": 4850,
  "progress": 3
}
```

### Get User Purchases
```bash
curl https://binaria.fun/api/presale/user/0x1234...
```

Response:
```json
{
  "address": "0x1234...",
  "totalPurchased": 5,
  "purchases": [
    {
      "quantity": 5,
      "txHash": "0xabc...",
      "timestamp": 1234567890
    }
  ]
}
```

## Security Notes

### Current Implementation
- Payment verification is **simulated** in demo mode
- **No database** - purchases stored in memory (resets on restart)
- **No admin authentication** on purchase history endpoint

### Production Requirements
- **Implement on-chain verification** (uncomment code in presale.js)
- **Add database** (PostgreSQL, MongoDB, etc.)
- **Secure admin endpoints** with authentication
- **Add rate limiting** to prevent spam
- **Implement proper x402 facilitator** integration
- **Test on BSC testnet** before mainnet
- **Audit smart contracts** if using presale contract

## x402 Resources

- **Official Docs**: https://x402.gitbook.io/x402
- **Protocol Spec**: Check docs for latest headers and flow
- **Facilitator Setup**: Contact x402 team for facilitator registration
- **Community**: Join x402 Discord for support

## Tech Stack

- **Frontend**: React 19, Vite 7, Tailwind CSS 4
- **Web3**: Wagmi, Viem, RainbowKit
- **Backend**: Node.js, Express, Socket.IO
- **Blockchain**: BSC (Binance Smart Chain)
- **Payment Protocol**: x402
- **Deployment**: Nginx, PM2, Let's Encrypt SSL

## Next Steps

1. **Deploy token contract** on BSC
2. **Get WalletConnect Project ID**
3. **Configure environment variables**
4. **Test on BSC testnet**
5. **Deploy to production VPS**
6. **Set up x402 facilitator**
7. **Test full payment flow**
8. **Launch presale!** 🚀

## Support

Questions? Check the [DEPLOYMENT.md](./DEPLOYMENT.md) guide or x402 documentation.

Happy launching! 🏝️
