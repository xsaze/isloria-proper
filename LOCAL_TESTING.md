# Local Testing Guide - Presale Subdomain

Quick guide to test the presale page locally before deploying.

## Method 1: Using localhost subdomain (Recommended)

### Windows

1. **Edit hosts file** (as Administrator)
   ```
   C:\Windows\System32\drivers\etc\hosts
   ```

   Add this line:
   ```
   127.0.0.1 island.localhost
   ```

2. **Start backend**
   ```bash
   cd backend
   npm install
   node server.js
   ```

3. **Start frontend** (in new terminal)
   ```bash
   cd frontend
   npm install
   npm run dev
   ```

4. **Visit URLs**
   - Main game: http://localhost:5173
   - Presale: http://island.localhost:5173

### Linux/Mac

1. **Edit hosts file**
   ```bash
   sudo nano /etc/hosts
   ```

   Add this line:
   ```
   127.0.0.1 island.localhost
   ```

2. **Start servers** (same as Windows above)

---

## Method 2: Using URL parameter (Quick test)

If you don't want to edit hosts file:

1. **Add dev check to App.jsx**

   Update line 17 in `frontend/src/App.jsx`:
   ```jsx
   const isPresale = subdomain === 'island' ||
                     hostname === 'island.binaria.fun' ||
                     new URLSearchParams(window.location.search).get('presale') === 'true'
   ```

2. **Visit with parameter**
   - Main game: http://localhost:5173
   - Presale: http://localhost:5173?presale=true

---

## Testing Checklist

### Visual Tests
- [ ] Presale page loads at subdomain
- [ ] Main game still works on main domain
- [ ] Wallet connect button visible
- [ ] Progress bar displays correctly
- [ ] Buy buttons are visible and styled properly
- [ ] Responsive design works on mobile

### API Tests

```bash
# Test presale status endpoint
curl http://localhost:3001/api/presale/status

# Should return:
# {"sold":0,"supply":5000,"price":100,"remaining":5000,"progress":0}
```

### Web3 Tests (Requires MetaMask + BSC Testnet)

1. **Connect wallet**
   - Click "Connect Wallet" button
   - Select MetaMask
   - Approve connection

2. **Test purchase flow** (will fail without real token)
   - Click "Buy 1 Island"
   - Should see "Please confirm transaction in your wallet"
   - Expected to fail (token not deployed yet - this is normal!)

---

## Common Issues

### "island.localhost" not working
- **Solution**: Make sure hosts file was edited correctly
- **Windows**: Must run notepad as Administrator
- **Linux/Mac**: Must use `sudo` to edit

### Backend not starting
- **Error**: "Cannot find module"
  - Run `npm install` in backend directory
- **Error**: "Port 3001 in use"
  - Kill process: `npx kill-port 3001` or change PORT in .env

### Frontend not building
- **Error**: "Cannot find module '@rainbow-me/rainbowkit'"
  - Ensure npm install completed successfully
  - Check the background install finished
- **Error**: RainbowKit styles not loading
  - Verify `import '@rainbow-me/rainbowkit/styles.css'` in App.jsx

### CORS errors
- Make sure backend CORS allows `http://localhost:5173`
- Already configured in `backend/server.js`

### Presale page shows game instead
- Check subdomain detection in App.jsx
- Verify hostname is exactly `island.localhost`
- Try Method 2 (URL parameter) instead

---

## Environment Variables for Local Testing

### Frontend `.env` (development)
Create `frontend/.env` (not .env.production):

```env
VITE_API_URL=http://localhost:3001
VITE_PRESALE_SUBDOMAIN=island.localhost
VITE_BSC_RPC_URL=https://bsc-dataseed.binance.org
VITE_TOKEN_ADDRESS=0x0000000000000000000000000000000000000000
VITE_WALLETCONNECT_PROJECT_ID=YOUR_PROJECT_ID
```

### Backend `.env`
Already configured - no changes needed for local testing.

---

## Next Steps After Local Testing

1. ✅ Verify subdomain routing works
2. ✅ Test wallet connection UI
3. ✅ Check API endpoints respond
4. ✅ Verify responsive design
5. 🚀 Deploy to production (see DEPLOYMENT.md)

---

## Quick Start (TL;DR)

```bash
# Add to hosts file:
echo "127.0.0.1 island.localhost" | sudo tee -a /etc/hosts  # Linux/Mac
# Or manually edit C:\Windows\System32\drivers\etc\hosts on Windows

# Start backend
cd backend && npm install && node server.js &

# Start frontend
cd frontend && npm install && npm run dev

# Open browser:
# Main: http://localhost:5173
# Presale: http://island.localhost:5173
```

Done! 🎉
