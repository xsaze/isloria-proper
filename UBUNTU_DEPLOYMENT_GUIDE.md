# Ubuntu VPS Deployment Guide - Solana Presale

Complete guide to deploy your Solana presale on an Ubuntu VPS with mainnet configuration.

---

## Prerequisites

- Ubuntu 20.04+ VPS
- Domain name (binaria.fun) pointing to your VPS IP
- Subdomain (island.binaria.fun) pointing to same IP
- Root or sudo access
- At least 2GB RAM recommended

---

## Step 1: Initial Server Setup

### Update System

```bash
sudo apt update && sudo apt upgrade -y
```

### Install Node.js 20+ (required)

```bash
# Install nvm (Node Version Manager)
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.7/install.sh | bash

# Reload shell configuration
source ~/.bashrc

# Install Node.js 20
nvm install 20
nvm use 20
nvm alias default 20

# Verify installation
node --version  # Should show v20.x.x
npm --version   # Should show 10.x.x
```

### Install PM2 (Process Manager)

```bash
npm install -g pm2
```

### Install Nginx (Web Server)

```bash
sudo apt install nginx -y
sudo systemctl enable nginx
sudo systemctl start nginx
```

---

## Step 2: Clone and Setup Your Project

### Clone Repository

```bash
cd ~
git clone https://github.com/YOUR_USERNAME/isloria-proper.git
cd isloria-proper
```

### Install Dependencies

```bash
# Run the Solana setup script
chmod +x setup-solana.sh
./setup-solana.sh

# Or manually:
cd frontend && npm install
cd ../backend && npm install
```

---

## Step 3: Configure Environment Variables

### Backend Configuration

```bash
cd ~/isloria-proper/backend
nano .env
```

Update with your mainnet settings:

```env
PORT=3001
NODE_ENV=production

# Your existing API keys (keep these)
BIRDSEYE_API_KEY=your_key_here
MORALIS_API_KEY=your_key_here
BITQUERY_API_KEY=your_key_here

DEFAULT_TOKEN_ADDRESS=coming soon
CORS_ORIGIN=https://binaria.fun
AUTO_START_PRICE_POLLING=false

# ========================================
# SOLANA PRESALE CONFIGURATION (PRIMARY)
# ========================================

SOLANA_NETWORK=mainnet-beta
SOLANA_RPC_URL=https://api.mainnet-beta.solana.com

# Presale Configuration
PRESALE_TOTAL_SUPPLY=1000
PRESALE_PRICE=0.01
TOKEN_SYMBOL=SOL

# TEST WALLET - Change after testing!
PRESALE_WALLET_ADDRESS=2AGnpightTepD5Wn7u4Zx2EUgkFrbydNaeNWNPCxG8dt

# Your SPL Token
TOKEN_MINT_ADDRESS=GasvKRubiw4Zum57uTWDeadMxQKNpHfJACqevmhrdBW2
TOKENS_PER_ISLAND=200000

X402_FACILITATOR_URL=https://facilitator.x402.org

# BSC BACKUP
BSC_RPC_URL=https://data-seed-prebsc-1-s1.binance.org:8545
BSC_CHAIN_ID=97
BSC_PRESALE_WALLET_ADDRESS=0x8a32c173cba9cd1af48850e655d698c5a6fe4da6
```

Save: `Ctrl+X`, `Y`, `Enter`

### Frontend Configuration

```bash
cd ~/isloria-proper/frontend
nano .env.production
```

```env
VITE_API_URL=https://binaria.fun
VITE_PRESALE_SUBDOMAIN=https://island.binaria.fun

# BSC Backup
VITE_BSC_RPC_URL=https://bsc-dataseed.binance.org
VITE_TOKEN_ADDRESS=0x0000000000000000000000000000000000000000
VITE_PRESALE_CONTRACT_ADDRESS=0x0000000000000000000000000000000000000000
VITE_WALLETCONNECT_PROJECT_ID=YOUR_PROJECT_ID

# ========================================
# SOLANA CONFIGURATION (PRIMARY)
# ========================================

VITE_SOLANA_NETWORK=mainnet-beta
VITE_SOLANA_RPC_URL=https://api.mainnet-beta.solana.com

# TEST WALLET - Change after testing!
VITE_PRESALE_WALLET_ADDRESS=2AGnpightTepD5Wn7u4Zx2EUgkFrbydNaeNWNPCxG8dt

VITE_TOKEN_MINT_ADDRESS=GasvKRubiw4Zum57uTWDeadMxQKNpHfJACqevmhrdBW2
VITE_TOKENS_PER_ISLAND=200000
```

Save: `Ctrl+X`, `Y`, `Enter`

---

## Step 4: Build Frontend

```bash
cd ~/isloria-proper/frontend
npm run build

# Verify dist folder was created
ls -la dist/
```

---

## Step 5: Configure Nginx

### Create Nginx Configuration

```bash
sudo nano /etc/nginx/sites-available/binaria
```

Paste this configuration:

```nginx
# Main domain - Game
server {
    listen 80;
    server_name binaria.fun www.binaria.fun;

    root /home/YOUR_USERNAME/isloria-proper/frontend/dist;
    index index.html;

    # Serve static files
    location / {
        try_files $uri $uri/ /index.html;
    }

    # Proxy API requests to backend
    location /api/ {
        proxy_pass http://localhost:3001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }

    # WebSocket for Socket.IO
    location /socket.io/ {
        proxy_pass http://localhost:3001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}

# Presale subdomain - Solana Presale
server {
    listen 80;
    server_name island.binaria.fun;

    root /home/YOUR_USERNAME/isloria-proper/frontend/dist;
    index index.html;

    # Serve static files
    location / {
        try_files $uri $uri/ /index.html;
    }

    # Proxy API requests to backend
    location /api/ {
        proxy_pass http://localhost:3001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
}
```

**IMPORTANT:** Replace `YOUR_USERNAME` with your actual Ubuntu username!

Save: `Ctrl+X`, `Y`, `Enter`

### Enable Site

```bash
# Create symbolic link
sudo ln -s /etc/nginx/sites-available/binaria /etc/nginx/sites-enabled/

# Remove default site
sudo rm /etc/nginx/sites-enabled/default

# Test configuration
sudo nginx -t

# Restart Nginx
sudo systemctl restart nginx
```

---

## Step 6: Setup SSL with Let's Encrypt

### Install Certbot

```bash
sudo apt install certbot python3-certbot-nginx -y
```

### Get SSL Certificates

```bash
# Get certificates for both domains
sudo certbot --nginx -d binaria.fun -d www.binaria.fun -d island.binaria.fun

# Follow prompts:
# - Enter your email
# - Agree to terms
# - Choose to redirect HTTP to HTTPS (option 2)
```

### Auto-renewal Setup

```bash
# Test renewal
sudo certbot renew --dry-run

# Certbot automatically sets up auto-renewal via systemd timer
```

---

## Step 7: Start Backend with PM2

### Create PM2 Ecosystem File

```bash
cd ~/isloria-proper
nano ecosystem.config.js
```

```javascript
module.exports = {
  apps: [{
    name: 'binaria-backend',
    script: './backend/server.js',
    instances: 1,
    exec_mode: 'fork',
    watch: false,
    env: {
      NODE_ENV: 'production',
      PORT: 3001
    },
    error_file: './logs/err.log',
    out_file: './logs/out.log',
    log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
    merge_logs: true
  }]
}
```

Save: `Ctrl+X`, `Y`, `Enter`

### Create Logs Directory

```bash
mkdir -p ~/isloria-proper/logs
```

### Start Application

```bash
cd ~/isloria-proper
pm2 start ecosystem.config.js

# View logs
pm2 logs binaria-backend

# Check status
pm2 status

# Setup PM2 to start on boot
pm2 startup
pm2 save
```

---

## Step 8: Verify Deployment

### Check Backend

```bash
# Check if backend is running
pm2 status

# View recent logs
pm2 logs binaria-backend --lines 50

# Test API endpoint
curl http://localhost:3001/api/presale/status
```

### Check Nginx

```bash
# Check Nginx status
sudo systemctl status nginx

# View Nginx error logs if needed
sudo tail -f /var/log/nginx/error.log
```

### Test URLs

Visit these URLs in your browser:
- https://binaria.fun (Main game)
- https://island.binaria.fun (Presale page)

---

## Step 9: Testing the Presale

### Test Purchase Flow

1. Visit https://island.binaria.fun
2. Connect Phantom wallet (make sure it's on **mainnet**)
3. Try purchasing 1 island (0.01 SOL)
4. Verify transaction on Solana Explorer
5. Check that payment was received in your test wallet

### Monitor Transactions

```bash
# Watch backend logs in real-time
pm2 logs binaria-backend

# Check purchase records via API
curl https://binaria.fun/api/presale/purchases
```

---

## Step 10: Production Readiness

### Before Going Live

- [ ] **Change payment wallet** from test wallet to secure production wallet
- [ ] **Update price** from 0.01 SOL to final price
- [ ] **Get premium RPC** (Helius, QuickNode, or Alchemy)
- [ ] **Add database** (replace in-memory storage)
- [ ] **Setup monitoring** (Uptime robot, etc.)
- [ ] **Test token distribution** mechanism
- [ ] **Backup your .env files** securely

### Update Production Wallet

```bash
# Backend
cd ~/isloria-proper/backend
nano .env
# Change PRESALE_WALLET_ADDRESS to your secure wallet

# Frontend - rebuild after changes
cd ~/isloria-proper/frontend
nano .env.production
# Change VITE_PRESALE_WALLET_ADDRESS
npm run build

# Restart services
pm2 restart binaria-backend
```

---

## Common PM2 Commands

```bash
# View all processes
pm2 list

# Restart application
pm2 restart binaria-backend

# Stop application
pm2 stop binaria-backend

# View logs
pm2 logs binaria-backend

# Monitor in real-time
pm2 monit

# Clear logs
pm2 flush

# Delete process
pm2 delete binaria-backend
```

---

## Updating Your Application

```bash
# Pull latest code
cd ~/isloria-proper
git pull

# Install any new dependencies
cd backend && npm install
cd ../frontend && npm install

# Rebuild frontend
cd frontend
npm run build

# Restart backend
pm2 restart binaria-backend

# Clear Nginx cache if needed
sudo systemctl restart nginx
```

---

## Firewall Setup (Optional but Recommended)

```bash
# Install UFW (Uncomplicated Firewall)
sudo apt install ufw -y

# Allow SSH
sudo ufw allow 22/tcp

# Allow HTTP and HTTPS
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp

# Enable firewall
sudo ufw enable

# Check status
sudo ufw status
```

---

## Troubleshooting

### Backend Not Starting

```bash
# Check logs
pm2 logs binaria-backend --err

# Check if port 3001 is in use
sudo lsof -i :3001

# Manually test backend
cd ~/isloria-proper/backend
node server.js
```

### Nginx 502 Bad Gateway

```bash
# Check if backend is running
pm2 status

# Check Nginx error logs
sudo tail -f /var/log/nginx/error.log

# Restart both services
pm2 restart binaria-backend
sudo systemctl restart nginx
```

### SSL Certificate Issues

```bash
# Renew certificates
sudo certbot renew

# Check certificate status
sudo certbot certificates

# Restart Nginx
sudo systemctl restart nginx
```

### Can't Connect Wallet

- Make sure wallet is on **mainnet**
- Check browser console for errors
- Verify CORS settings in backend .env
- Clear browser cache

---

## Monitoring & Maintenance

### Setup Log Rotation

```bash
# PM2 handles log rotation automatically
pm2 install pm2-logrotate

# Configure max size (100MB)
pm2 set pm2-logrotate:max_size 100M

# Keep logs for 30 days
pm2 set pm2-logrotate:retain 30
```

### Monitor Disk Space

```bash
# Check disk usage
df -h

# Check largest directories
du -sh ~/isloria-proper/*
```

### Database Backup (When Implemented)

```bash
# Add to crontab for daily backups
crontab -e

# Add this line (adjust path):
# 0 2 * * * pg_dump your_database > /home/YOUR_USERNAME/backups/db_$(date +\%Y\%m\%d).sql
```

---

## Security Checklist

- [ ] **Never commit** .env files to git
- [ ] **Never share** your private keys or seed phrases
- [ ] **Use strong passwords** for server access
- [ ] **Enable SSH key authentication** and disable password auth
- [ ] **Keep system updated** with `sudo apt update && sudo apt upgrade`
- [ ] **Setup fail2ban** to prevent brute force attacks
- [ ] **Monitor server resources** regularly
- [ ] **Backup your data** regularly

---

## Getting Help

- **PM2 Docs**: https://pm2.keymetrics.io/
- **Nginx Docs**: https://nginx.org/en/docs/
- **Certbot Docs**: https://certbot.eff.org/
- **Solana Docs**: https://docs.solana.com/

---

## Quick Reference

```bash
# Restart everything
pm2 restart binaria-backend && sudo systemctl restart nginx

# View logs
pm2 logs binaria-backend --lines 100

# Check status
pm2 status && sudo systemctl status nginx

# Update app
cd ~/isloria-proper && git pull && cd frontend && npm run build && pm2 restart binaria-backend
```

---

**Your Solana presale is now live on Ubuntu VPS!** 🚀

Remember to:
1. Test with small amounts first (0.01 SOL)
2. Monitor logs during initial testing
3. Update to production wallet after successful tests
4. Get premium RPC for better reliability
