# 📋 Solana Mainnet Deployment Checklist

Use this checklist to deploy your presale safely and successfully.

---

## Phase 1: Pre-Deployment Setup ✅

- [x] Solana mainnet configuration complete
- [x] Environment variables configured
- [x] App.jsx updated for Solana
- [x] server.js updated with Solana routes
- [x] Token rewards logic implemented
- [ ] Dependencies installed (`setup-solana.bat`)
- [ ] Phantom wallet installed
- [ ] Test wallet funded with SOL

---

## Phase 2: Local Testing

### Setup
- [ ] Run `setup-solana.bat` (Windows) or `setup-solana.sh` (Linux)
- [ ] Verify Node.js 20+ installed: `node --version`
- [ ] Verify npm packages installed
- [ ] Check `.env` files configured correctly

### Backend Testing
- [ ] Start backend: `cd backend && node server.js`
- [ ] Backend starts without errors
- [ ] Check API status: `curl http://localhost:3001/api/presale/status`
- [ ] Verify response includes Solana mainnet config
- [ ] Check logs for any errors

### Frontend Testing
- [ ] Start frontend: `cd frontend && npm run dev`
- [ ] Frontend builds without errors
- [ ] Visit http://island.localhost:5173
- [ ] Presale page loads correctly
- [ ] Network indicator shows "Solana Mainnet"

### Wallet Connection
- [ ] Connect Phantom wallet
- [ ] Wallet is on **mainnet** (not devnet/testnet)
- [ ] Address displays correctly
- [ ] Wallet connection works smoothly

### Purchase Flow Test
- [ ] Click "Buy 1 Island" button
- [ ] Wallet prompts for 0.01 SOL transaction
- [ ] Approve transaction
- [ ] Transaction broadcasts to Solana
- [ ] Wait for confirmation (~1-2 seconds)
- [ ] Success message appears
- [ ] Transaction link works
- [ ] Verify on Solana Explorer: https://explorer.solana.com/
- [ ] Check test wallet received 0.01 SOL
- [ ] API shows updated stats (sold count increased)

### Verify Token Tracking
- [ ] Check purchase record via API
- [ ] Verify `tokensEarned` field is correct (200,000)
- [ ] Token mint address is correct
- [ ] Purchase history displays correctly

---

## Phase 3: VPS Deployment

### Server Setup
- [ ] Ubuntu 20.04+ VPS ready
- [ ] Domain DNS configured (A records)
- [ ] SSH access working
- [ ] Root or sudo access confirmed

### Install Dependencies
- [ ] Node.js 20+ installed via nvm
- [ ] PM2 installed globally: `npm install -g pm2`
- [ ] Nginx installed: `sudo apt install nginx`
- [ ] Git installed: `sudo apt install git`

### Clone & Configure
- [ ] Repository cloned to VPS
- [ ] Backend .env configured with mainnet settings
- [ ] Frontend .env.production configured
- [ ] Dependencies installed (frontend + backend)
- [ ] Frontend built: `npm run build`

### Nginx Configuration
- [ ] Nginx config file created at `/etc/nginx/sites-available/binaria`
- [ ] Symbolic link created: `/etc/nginx/sites-enabled/binaria`
- [ ] Replace `YOUR_USERNAME` with actual username
- [ ] Nginx config tested: `sudo nginx -t`
- [ ] Nginx restarted: `sudo systemctl restart nginx`

### SSL Setup
- [ ] Certbot installed
- [ ] SSL certificates obtained for:
  - [ ] binaria.fun
  - [ ] www.binaria.fun
  - [ ] island.binaria.fun
- [ ] HTTPS redirect configured
- [ ] Auto-renewal tested: `sudo certbot renew --dry-run`

### PM2 Setup
- [ ] ecosystem.config.js created
- [ ] Logs directory created
- [ ] Backend started: `pm2 start ecosystem.config.js`
- [ ] Backend status green: `pm2 status`
- [ ] Logs look healthy: `pm2 logs binaria-backend`
- [ ] PM2 startup configured: `pm2 startup`
- [ ] PM2 config saved: `pm2 save`

### Domain Testing
- [ ] Visit https://binaria.fun (main game loads)
- [ ] Visit https://island.binaria.fun (presale loads)
- [ ] Both use HTTPS (lock icon in browser)
- [ ] No certificate warnings
- [ ] API calls work from frontend
- [ ] WebSocket connection works (for game)

---

## Phase 4: Production Testing

### Test Purchase on VPS
- [ ] Visit https://island.binaria.fun
- [ ] Connect Phantom wallet (mainnet!)
- [ ] Buy 1 island with 0.01 SOL
- [ ] Transaction confirms successfully
- [ ] Payment received in test wallet
- [ ] Transaction visible on Explorer
- [ ] Stats update correctly
- [ ] Tokens earned tracked correctly

### API Testing
- [ ] GET /api/presale/status works
- [ ] GET /api/presale/user/:address works
- [ ] GET /api/presale/purchases works
- [ ] Response includes token information
- [ ] All responses properly formatted

### Multiple Purchase Test
- [ ] Try buying 5 islands
- [ ] Correct amount charged (0.05 SOL)
- [ ] Correct tokens earned (1,000,000)
- [ ] Purchase history shows multiple purchases
- [ ] Total purchased count correct

### Error Handling
- [ ] Try purchasing without wallet connected (shows error)
- [ ] Try with insufficient SOL (wallet rejects)
- [ ] Test network disconnection handling
- [ ] Verify error messages are user-friendly

---

## Phase 5: Production Launch Prep

### Update Production Settings

**CRITICAL: Change these after testing!**

- [ ] Backend .env:
  - [ ] `PRESALE_PRICE=YOUR_FINAL_PRICE` (update from 0.01)
  - [ ] `PRESALE_WALLET_ADDRESS=YOUR_SECURE_WALLET` (change from test)
- [ ] Frontend .env.production:
  - [ ] `VITE_PRESALE_WALLET_ADDRESS=YOUR_SECURE_WALLET`
- [ ] Rebuild frontend: `cd frontend && npm run build`
- [ ] Restart backend: `pm2 restart binaria-backend`
- [ ] Test with updated settings

### Premium RPC (Recommended)

- [ ] Sign up for RPC provider (Helius/QuickNode/Alchemy)
- [ ] Get API key
- [ ] Update both .env files with new RPC URL
- [ ] Test connection
- [ ] Rebuild and restart

### Security Audit

- [ ] .env files NOT committed to git
- [ ] Private keys NOT in code
- [ ] API keys secured
- [ ] Firewall configured (UFW)
- [ ] SSH key auth enabled
- [ ] Password auth disabled (optional but recommended)
- [ ] fail2ban installed (optional)

### Monitoring Setup

- [ ] PM2 monitoring active: `pm2 monit`
- [ ] Nginx logs monitored
- [ ] Disk space checked: `df -h`
- [ ] Uptime monitoring configured (UptimeRobot, etc.)
- [ ] Error alerts configured

### Backup Plan

- [ ] .env files backed up securely offline
- [ ] Wallet seed phrases backed up
- [ ] Database backup plan (when implemented)
- [ ] Code repository up to date
- [ ] Documentation accessible

---

## Phase 6: Token Distribution Plan

Choose your distribution method:

### Option 1: Manual Distribution ✅ (Simplest for testing)
- [ ] Export purchase records via API
- [ ] Create spreadsheet of addresses + amounts
- [ ] Use SPL Token CLI or script to send tokens
- [ ] Track distributions manually

### Option 2: Automated Backend Service ⭐ (Recommended)
- [ ] Implement token distribution service
- [ ] Use `@solana/spl-token` package
- [ ] Store sender wallet private key securely
- [ ] Add distribution endpoint
- [ ] Test thoroughly on devnet first

### Option 3: Smart Contract 🏆 (Most secure)
- [ ] Develop Solana presale program
- [ ] Audit smart contract
- [ ] Deploy to mainnet
- [ ] Test with small amounts
- [ ] Update frontend to use program

**Current Status:** Purchases tracked, distribution manual

---

## Phase 7: Launch! 🚀

### Pre-Launch Final Checks

- [ ] All tests passed
- [ ] Production wallet configured
- [ ] Final price set
- [ ] Token distribution plan ready
- [ ] Monitoring active
- [ ] Support plan ready
- [ ] Announcement prepared

### Launch Day

- [ ] Announce presale
- [ ] Monitor first purchases closely
- [ ] Watch logs in real-time: `pm2 logs binaria-backend`
- [ ] Check server resources: `pm2 monit`
- [ ] Verify all transactions
- [ ] Respond to user questions quickly
- [ ] Track sales in real-time

### Post-Launch

- [ ] Monitor for 24 hours continuously
- [ ] Handle any issues immediately
- [ ] Distribute tokens as promised
- [ ] Collect user feedback
- [ ] Document any issues
- [ ] Plan improvements

---

## Emergency Contacts & Resources

### Quick Commands

```bash
# Check status
pm2 status && sudo systemctl status nginx

# Restart everything
pm2 restart binaria-backend && sudo systemctl restart nginx

# View logs
pm2 logs binaria-backend --lines 100

# Check disk space
df -h

# Check server load
htop
```

### Important URLs

- **Presale**: https://island.binaria.fun
- **API**: https://binaria.fun/api/presale/status
- **Solana Explorer**: https://explorer.solana.com/
- **Phantom Wallet**: https://phantom.app/

### Documentation

- [UBUNTU_DEPLOYMENT_GUIDE.md](UBUNTU_DEPLOYMENT_GUIDE.md)
- [MAINNET_DEPLOYMENT_COMPLETE.md](MAINNET_DEPLOYMENT_COMPLETE.md)
- [PRESALE_SOLANA_README.md](PRESALE_SOLANA_README.md)

---

## 📊 Success Criteria

Your presale is successful when:

✅ All checklist items completed
✅ Test purchases work perfectly
✅ Production settings configured
✅ Monitoring active
✅ Token distribution plan ready
✅ Users can buy islands smoothly
✅ Transactions verify correctly
✅ Payment wallet receives funds
✅ Stats update in real-time
✅ No critical errors in logs

---

## 🎯 Current Progress

**Phase 1: Pre-Deployment Setup** ✅ COMPLETE
**Phase 2: Local Testing** 🔄 IN PROGRESS
**Phase 3: VPS Deployment** ⏳ PENDING
**Phase 4: Production Testing** ⏳ PENDING
**Phase 5: Production Launch Prep** ⏳ PENDING
**Phase 6: Token Distribution Plan** ⏳ PENDING
**Phase 7: Launch!** ⏳ PENDING

---

**Next Step:** Install dependencies and start local testing!

```cmd
setup-solana.bat
```

Good luck! 🚀🏝️
