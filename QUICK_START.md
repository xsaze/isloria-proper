# Quick Start Guide - Isloria Presale

Ultra-quick reference for getting the presale up and running.

## 🚀 5-Minute Local Test

```bash
# 1. Install dependencies (if not done)
cd frontend && npm install
cd ../backend && npm install

# 2. Add to hosts file (Windows: run notepad as Admin)
# C:\Windows\System32\drivers\etc\hosts
127.0.0.1 island.localhost

# 3. Start backend
cd backend
node server.js

# 4. Start frontend (new terminal)
cd frontend
npm run dev

# 5. Visit
# Main game: http://localhost:5173
# Presale: http://island.localhost:5173
```

---

## 📋 Before Production Deployment

### Must Update These Variables

**Frontend (`.env.production`):**
```bash
VITE_TOKEN_ADDRESS=0x...  # Your BSC token address
VITE_WALLETCONNECT_PROJECT_ID=...  # From cloud.walletconnect.com
```

**Backend (`.env`):**
```bash
PRESALE_WALLET_ADDRESS=0x...  # Your receiving wallet
TOKEN_SYMBOL=ISLORIA  # Your token symbol
```

---

## 🌐 Production Deployment (VPS)

```bash
# 1. Configure DNS
# Add A records for:
# - binaria.fun → YOUR_VPS_IP
# - island.binaria.fun → YOUR_VPS_IP

# 2. Build frontend
cd frontend
npm run build

# 3. Setup nginx
sudo cp nginx.conf.example /etc/nginx/sites-available/isloria
sudo ln -s /etc/nginx/sites-available/isloria /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx

# 4. Get SSL
sudo certbot --nginx -d binaria.fun -d island.binaria.fun

# 5. Start backend
cd backend
npm install -g pm2
pm2 start server.js --name isloria-backend
pm2 save

# 6. Done!
# Visit: https://island.binaria.fun
```

---

## 🧪 Test Checklist

- [ ] Backend starts: `node server.js`
- [ ] API works: `curl http://localhost:3001/api/presale/status`
- [ ] Presale page loads at subdomain
- [ ] Wallet connect button visible
- [ ] Progress bar displays
- [ ] Buy buttons work (will fail without token - OK for testing)

---

## 📁 Key Files

| File | Purpose |
|------|---------|
| `frontend/src/App.jsx` | Subdomain routing logic |
| `frontend/src/pages/PresalePage.jsx` | Presale UI |
| `frontend/src/hooks/useX402Payment.js` | Payment flow |
| `backend/routes/presale.js` | API endpoints |
| `backend/server.js` | Server with presale routes |
| `nginx.conf.example` | Nginx subdomain config |

---

## 🔧 Common Issues

### Subdomain not working locally
```bash
# Windows (as Admin):
notepad C:\Windows\System32\drivers\etc\hosts

# Add:
127.0.0.1 island.localhost
```

### Backend won't start
```bash
# Kill port 3001
npx kill-port 3001

# Try again
cd backend && node server.js
```

### Frontend build errors
```bash
# Reinstall dependencies
cd frontend
rm -rf node_modules package-lock.json
npm install
npm run build
```

### CORS errors
Already configured! Both domains allowed in `backend/server.js`.

---

## 📖 Full Documentation

- **Detailed deployment**: [DEPLOYMENT.md](./DEPLOYMENT.md)
- **Feature overview**: [PRESALE_README.md](./PRESALE_README.md)
- **Local testing**: [LOCAL_TESTING.md](./LOCAL_TESTING.md)
- **Implementation details**: [IMPLEMENTATION_SUMMARY.md](./IMPLEMENTATION_SUMMARY.md)

---

## ⚡ TL;DR

1. **Update env vars** (token address, wallet address)
2. **Build frontend**: `npm run build`
3. **Setup nginx** with subdomain
4. **Get SSL** with certbot
5. **Start backend** with PM2
6. **Launch!** 🚀

That's it! You now have a working x402-powered presale on a subdomain.

Need help? Check the full docs or x402.gitbook.io for protocol details.
