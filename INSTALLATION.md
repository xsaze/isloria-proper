# Installation Guide

## Quick Install

Solana dependencies are now included in `package.json` files. Simply run:

### Option 1: Use Setup Script (Recommended)

**Windows:**
```cmd
setup-solana.bat
```

**Linux/Mac:**
```bash
chmod +x setup-solana.sh
./setup-solana.sh
```

### Option 2: Manual Installation

**Frontend:**
```bash
cd frontend
npm install
```

**Backend:**
```bash
cd backend
npm install
```

---

## Dependencies Included

### Frontend (package.json)
- `@solana/wallet-adapter-base` - Core wallet adapter
- `@solana/wallet-adapter-react` - React hooks for Solana wallets
- `@solana/wallet-adapter-react-ui` - Pre-built UI components
- `@solana/wallet-adapter-wallets` - Wallet adapters (Phantom, Solflare, etc.)
- `@solana/web3.js` - Solana JavaScript SDK

### Backend (package.json)
- `@solana/web3.js` - Solana JavaScript SDK for transaction verification

---

## After Installation

1. **Configure Environment Variables**
   - Update `frontend/.env` and `frontend/.env.production`
   - Update `backend/.env`
   - See [MAINNET_DEPLOYMENT_COMPLETE.md](MAINNET_DEPLOYMENT_COMPLETE.md) for details

2. **Start Development**
   ```bash
   # Terminal 1 - Backend
   cd backend
   npm start

   # Terminal 2 - Frontend
   cd frontend
   npm run dev
   ```

3. **Test Locally**
   - Visit http://island.localhost:5173
   - Connect Phantom wallet
   - Test purchase flow

---

## Deployment

For Ubuntu VPS deployment, see: **[UBUNTU_DEPLOYMENT_GUIDE.md](UBUNTU_DEPLOYMENT_GUIDE.md)**

For complete setup checklist, see: **[DEPLOYMENT_CHECKLIST.md](DEPLOYMENT_CHECKLIST.md)**

---

## Troubleshooting

### npm install fails
- Make sure Node.js 20+ is installed: `node --version`
- Clear npm cache: `npm cache clean --force`
- Delete `node_modules` and `package-lock.json`, then try again

### Dependencies not found after install
- Verify packages are in `node_modules` folder
- Check `package.json` has Solana dependencies listed
- Try `npm install` again

### Build errors
- Make sure all dependencies installed successfully
- Check console for specific error messages
- Verify environment variables are set correctly

---

## What Gets Installed

**Total Dependencies:**
- Frontend: ~5 new Solana packages
- Backend: 1 new Solana package

**Install Time:**
- First install: ~2-3 minutes (depending on internet speed)
- Subsequent installs: ~30 seconds (with cache)

---

Need more help? Check:
- [MAINNET_DEPLOYMENT_COMPLETE.md](MAINNET_DEPLOYMENT_COMPLETE.md)
- [SOLANA_MIGRATION_GUIDE.md](SOLANA_MIGRATION_GUIDE.md)
- [PRESALE_SOLANA_README.md](PRESALE_SOLANA_README.md)
