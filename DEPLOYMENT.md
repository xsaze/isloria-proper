# Isloria Presale Deployment Guide

This guide explains how to deploy the Isloria presale page on subdomain `island.binaria.fun`.

## Overview

The presale is integrated into the main frontend using React Router and subdomain detection:
- **binaria.fun** → Main game (GamePage)
- **island.binaria.fun** → Presale page (PresalePage)

Both use the **same build** - the app detects the subdomain and shows the appropriate page.

---

## Prerequisites

1. VPS with Ubuntu/Debian
2. Node.js 18+ installed
3. Nginx installed
4. Domain DNS configured (A records for both domains pointing to VPS IP)
5. SSL certificate (via Certbot/Let's Encrypt)

---

## Step 1: Configure Environment Variables

### Frontend Environment Variables

Update `frontend/.env.production`:

```bash
VITE_API_URL=https://binaria.fun
VITE_PRESALE_SUBDOMAIN=island.binaria.fun
VITE_BSC_RPC_URL=https://bsc-dataseed.binance.org

# Update these when your token is deployed:
VITE_TOKEN_ADDRESS=0x... (your token contract address)
VITE_PRESALE_CONTRACT_ADDRESS=0x... (optional)

# Get from https://cloud.walletconnect.com/
VITE_WALLETCONNECT_PROJECT_ID=your_project_id
```

### Backend Environment Variables

Update `backend/.env`:

```bash
PORT=3001
NODE_ENV=production
CORS_ORIGIN=https://binaria.fun

# Presale Configuration
PRESALE_TOTAL_SUPPLY=5000
PRESALE_PRICE=100
TOKEN_SYMBOL=ISLORIA

# IMPORTANT: Set this to your wallet address to receive payments
PRESALE_WALLET_ADDRESS=0x... (your BSC wallet address)

# x402 Facilitator (check x402 docs for actual URL)
X402_FACILITATOR_URL=https://facilitator.x402.org

# BSC RPC for on-chain verification
BSC_RPC_URL=https://bsc-dataseed.binance.org
```

---

## Step 2: Build Frontend

```bash
cd /var/www/isloria-proper/frontend
npm install
npm run build
```

This creates `frontend/dist/` with the bundled app.

---

## Step 3: Setup DNS

Add these DNS records in your domain registrar:

```
Type: A
Name: @
Value: YOUR_VPS_IP

Type: A
Name: island
Value: YOUR_VPS_IP
```

Wait for DNS propagation (usually 5-30 minutes).

---

## Step 4: Configure Nginx

Copy the example config:

```bash
sudo cp /var/www/isloria-proper/nginx.conf.example /etc/nginx/sites-available/isloria
```

Edit if needed:

```bash
sudo nano /etc/nginx/sites-available/isloria
```

Enable the site:

```bash
sudo ln -s /etc/nginx/sites-available/isloria /etc/nginx/sites-enabled/
```

Test configuration:

```bash
sudo nginx -t
```

Reload nginx:

```bash
sudo systemctl reload nginx
```

---

## Step 5: Setup SSL (HTTPS)

Install Certbot:

```bash
sudo apt update
sudo apt install certbot python3-certbot-nginx
```

Get SSL certificates:

```bash
sudo certbot --nginx -d binaria.fun -d www.binaria.fun -d island.binaria.fun
```

Certbot will:
1. Obtain SSL certificates
2. Automatically update nginx config for HTTPS
3. Setup auto-renewal

---

## Step 6: Start Backend

Using PM2 (recommended):

```bash
cd /var/www/isloria-proper/backend
npm install -g pm2
pm2 start server.js --name "isloria-backend"
pm2 save
pm2 startup  # Follow instructions to enable auto-start
```

Check status:

```bash
pm2 status
pm2 logs isloria-backend
```

---

## Step 7: Test Deployment

### Test Main Game
Visit: `https://binaria.fun`
- Should show the main game

### Test Presale
Visit: `https://island.binaria.fun`
- Should show the presale page
- Connect wallet button should work
- Purchase buttons should be visible

### Test API
```bash
curl https://binaria.fun/api/presale/status
```

Should return:
```json
{
  "sold": 0,
  "supply": 5000,
  "price": 100,
  "remaining": 5000,
  "progress": 0
}
```

---

## Step 8: Update Token Contract (When Deployed)

Once your token is deployed on BSC:

1. Update `frontend/.env.production`:
   ```bash
   VITE_TOKEN_ADDRESS=0x... (actual token address)
   ```

2. Update `backend/.env`:
   ```bash
   PRESALE_WALLET_ADDRESS=0x... (your receiving wallet)
   TOKEN_SYMBOL=ISLORIA  # or actual symbol
   ```

3. Rebuild frontend:
   ```bash
   cd /var/www/isloria-proper/frontend
   npm run build
   ```

4. Restart backend:
   ```bash
   pm2 restart isloria-backend
   ```

---

## Local Development

To test subdomain routing locally:

### Option 1: Edit hosts file

Add to `/etc/hosts` (Linux/Mac) or `C:\Windows\System32\drivers\etc\hosts` (Windows):

```
127.0.0.1 localhost
127.0.0.1 island.localhost
```

Then visit:
- `http://localhost:5173` → Main game
- `http://island.localhost:5173` → Presale page

### Option 2: Use URL parameter

Add a dev mode check in `App.jsx`:

```jsx
const isPresale = subdomain === 'island' ||
                  hostname === 'island.binaria.fun' ||
                  new URLSearchParams(window.location.search).get('presale') === 'true'
```

Then visit: `http://localhost:5173?presale=true`

---

## Monitoring

### Check Backend Logs
```bash
pm2 logs isloria-backend
```

### Check Nginx Logs
```bash
sudo tail -f /var/log/nginx/access.log
sudo tail -f /var/log/nginx/error.log
```

### Check Presale Stats
```bash
curl https://binaria.fun/api/presale/status
curl https://binaria.fun/api/presale/purchases  # All purchases
```

---

## Security Checklist

- [ ] SSL certificates installed and auto-renewing
- [ ] `PRESALE_WALLET_ADDRESS` set to secure wallet
- [ ] Backend environment variables secured (not in git)
- [ ] CORS configured correctly
- [ ] Firewall rules set (allow 80, 443, 22 only)
- [ ] x402 facilitator integrated for payment verification
- [ ] Rate limiting added to API endpoints (optional but recommended)

---

## x402 Integration

The presale uses the x402 protocol for payments. Here's how it works:

1. **User initiates purchase** → Frontend calls `POST /api/presale/purchase`
2. **Server returns 402** → With `X-PAYMENT` header containing challenge
3. **Frontend executes payment** → User sends tokens via MetaMask
4. **Frontend submits proof** → Calls `POST /api/presale/verify` with tx hash
5. **Server verifies** → Checks transaction on-chain + calls x402 facilitator
6. **Purchase complete** → User receives their Private Island access

### Production x402 Setup

To enable full x402 verification:

1. Register with x402 facilitator (check x402.gitbook.io for details)
2. Update `X402_FACILITATOR_URL` in backend `.env`
3. Implement on-chain verification in `backend/routes/presale.js`:
   - Uncomment the viem/ethers verification code
   - Verify transaction amount, recipient, and token
4. Test thoroughly on BSC testnet first

---

## Troubleshooting

### Presale page not showing
- Check nginx config is correct
- Verify DNS records propagate: `dig island.binaria.fun`
- Check browser console for errors
- Verify subdomain detection in App.jsx

### Wallet connection fails
- Get WalletConnect Project ID from https://cloud.walletconnect.com/
- Update `VITE_WALLETCONNECT_PROJECT_ID` in frontend env
- Rebuild frontend

### API requests fail
- Check backend is running: `pm2 status`
- Verify CORS allows subdomain
- Check nginx proxy config
- Test API directly: `curl https://binaria.fun/api/presale/status`

### Transactions not verifying
- Ensure `PRESALE_WALLET_ADDRESS` matches receiving address
- Check `TOKEN_ADDRESS` is correct
- Verify BSC RPC is responding
- Check backend logs for errors

---

## Support

For x402 protocol questions: https://x402.gitbook.io/x402
For deployment issues: Check nginx and PM2 logs

Good luck with your presale! 🏝️
