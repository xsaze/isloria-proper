# Helius RPC Setup Guide

## ✅ Configuration Complete!

I've updated your environment files to use Helius RPC. Now you just need to add your API key.

---

## 🔑 Add Your Helius API Key

### Step 1: Get Your API Key

1. Visit https://dashboard.helius.dev/dashboard
2. Copy your API key (starts with a long string)

### Step 2: Update Environment Files

Replace `YOUR_HELIUS_API_KEY` with your actual key in these files:

**Frontend Development:**
```bash
File: frontend/.env
Line 29: VITE_SOLANA_RPC_URL=https://mainnet.helius-rpc.com/?api-key=YOUR_HELIUS_API_KEY
```

**Frontend Production:**
```bash
File: frontend/.env.production
Line 29: VITE_SOLANA_RPC_URL=https://mainnet.helius-rpc.com/?api-key=YOUR_HELIUS_API_KEY
```

**Backend:**
```bash
File: backend/.env
Line 23: SOLANA_RPC_URL=https://mainnet.helius-rpc.com/?api-key=YOUR_HELIUS_API_KEY
```

### Example:
```env
# Before
VITE_SOLANA_RPC_URL=https://mainnet.helius-rpc.com/?api-key=YOUR_HELIUS_API_KEY

# After (with your key)
VITE_SOLANA_RPC_URL=https://mainnet.helius-rpc.com/?api-key=9fcd700d-91ca-434e-9a69-1e967bb76934
```

---

## 🚀 Helius Features Configured

### ✅ RPC Endpoint
- **URL**: `https://mainnet.helius-rpc.com/?api-key=YOUR_KEY`
- **Purpose**: Transaction verification, account queries
- **Speed**: Ultra-fast with geo-routing
- **Cost**: Based on your Helius plan

### ✅ Sender Endpoint (Optional - FREE!)
- **URL**: `https://sender.helius-rpc.com/fast`
- **Purpose**: Transaction submission (presale purchases)
- **Speed**: Dual-routing (validators + Jito)
- **Cost**: **FREE** - 0 credits consumed!
- **Rate Limit**: 15 TPS baseline (request more if needed)

---

## 💡 Helius Sender Benefits

The Sender endpoint is already configured in `backend/.env` for optional use:

```env
HELIUS_SENDER_URL=https://sender.helius-rpc.com/fast
```

### Why Use Sender?

1. **FREE Transaction Submission**
   - No credits consumed for sending transactions
   - Only verification/queries use credits

2. **Better Transaction Landing**
   - Dual-routing to validators + Jito
   - Multiple pathways for inclusion
   - Higher success rate

3. **Ultra-Low Latency**
   - Geo-distributed endpoints
   - Optimized for speed
   - 15 TPS baseline (more on request)

### Requirements for Sender:

When using Sender, transactions must include:
- ✅ Skip preflight (`skipPreflight: true`)
- ✅ Jito tip (0.001 SOL minimum)
- ✅ Priority fees (ComputeBudgetProgram)

**Note:** Users pay the tip + fees, not you!

---

## 📊 Your Helius Plan

Check your plan limits at: https://dashboard.helius.dev/dashboard

| Plan | Monthly Credits | RPC Rate Limit | Cost |
|------|-----------------|----------------|------|
| Free | 1M | 10 req/s | $0 |
| Developer | 10M | 50 req/s | $49 |
| Business | 100M | 200 req/s | $499 |
| Professional | 200M | 500 req/s | $999 |

### Credit Costs:
- Standard RPC calls: **1 credit**
- Enhanced APIs: 100 credits
- Historical queries: 10 credits
- **Sender submissions: 0 credits** ✨

---

## 🔒 Security Best Practices

### DO:
✅ Keep API key in environment variables
✅ Use separate keys for dev/staging/production
✅ Enable "Encrypt" option in dashboard
✅ Configure IP allowlists if possible
✅ Monitor usage in dashboard

### DON'T:
❌ Commit API keys to git
❌ Share API keys publicly
❌ Use production keys for testing
❌ Hardcode keys in source code

---

## 🧪 Testing Your Setup

### 1. Test Backend RPC
```bash
cd backend
node -e "import('dotenv/config'); import('@solana/web3.js').then(({Connection})=>{const c=new Connection(process.env.SOLANA_RPC_URL);c.getVersion().then(v=>console.log('✅ Helius RPC working:',v))})"
```

### 2. Start Backend
```bash
cd backend
npm start
```

### 3. Test Frontend
```bash
cd frontend
npm run dev
```

Visit: http://island.localhost:5173

---

## 📈 Monitor Usage

Track your API usage:
- **Dashboard**: https://dashboard.helius.dev/dashboard
- **Credits Used**: Check monthly consumption
- **Rate Limits**: Monitor response headers:
  - `X-RateLimit-Limit`
  - `X-RateLimit-Remaining`
  - `X-RateLimit-Reset`

---

## 🆘 Troubleshooting

### "Invalid API key" error
- Check you copied the full key
- Verify no extra spaces in .env file
- Make sure key is not expired

### Rate limit errors (HTTP 429)
- Check your plan limits
- Consider upgrading plan
- Use `Retry-After` header value

### Slow responses
- Verify you're using Helius URL (not public RPC)
- Check dashboard for any service issues
- Consider regional endpoints for backend

---

## 📚 Additional Resources

- **Helius Dashboard**: https://dashboard.helius.dev
- **Documentation**: https://docs.helius.dev
- **Sender Docs**: https://www.helius.dev/docs/sending-transactions/sender
- **API Reference**: https://docs.helius.dev/api-reference

---

## ✅ Next Steps

1. **Add your API key** to all 3 env files
2. **Test locally** with `npm run dev`
3. **Monitor usage** in Helius dashboard
4. **Deploy to production** with confidence!

---

**Your Helius RPC is ready to use!** 🎉

Just add your API key and you'll have:
- ⚡ Ultra-fast RPC
- 🔒 Reliable mainnet access
- 💰 FREE transaction sending via Sender
- 📊 Usage monitoring dashboard
