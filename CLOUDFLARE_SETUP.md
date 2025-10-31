# Cloudflare + NGINX Setup Guide for binaria.fun

Complete deployment guide for setting up your game on binaria.fun with island.binaria.fun subdomain.

## Prerequisites

- Ubuntu VPS with SSH access
- Domain: binaria.fun (already registered)
- Cloudflare account (already set up)
- Node.js installed on server

---

## Part 1: Cloudflare DNS Configuration

### Step 1: Add DNS Records

In your Cloudflare dashboard for **binaria.fun**, add these DNS records:

| Type | Name | Content | Proxy Status | TTL |
|------|------|---------|--------------|-----|
| A | @ | YOUR_VPS_IP | Proxied (orange cloud) | Auto |
| A | island | YOUR_VPS_IP | Proxied (orange cloud) | Auto |
| CNAME | www | binaria.fun | Proxied (orange cloud) | Auto |

**Important:** Make sure the orange cloud is ON (Proxied) for all records.

### Step 2: Configure SSL/TLS Settings

1. Go to **SSL/TLS** → **Overview**
2. Set encryption mode to: **Full** or **Full (Strict)**
   - **Full**: Works immediately (Cloudflare validates your self-signed cert)
   - **Full (Strict)**: Requires valid SSL cert on server (use certbot)

**Recommended:** Use **Full** mode since NGINX will handle SSL through Cloudflare's proxy.

### Step 3: Configure Page Rules (Optional but Recommended)

Go to **Rules** → **Page Rules** and add:

**Rule 1: Force HTTPS**
- URL: `http://*binaria.fun/*`
- Setting: Always Use HTTPS

**Rule 2: Cache Everything for Static Assets**
- URL: `*binaria.fun/*.js`
- Settings: Cache Level = Cache Everything, Edge Cache TTL = 1 month

**Rule 3: Bypass Cache for API**
- URL: `*binaria.fun/api/*`
- Setting: Cache Level = Bypass

### Step 4: Security Settings (Recommended)

1. **Security** → **Settings**
   - Security Level: Medium or High
   - Challenge Passage: 30 minutes
   - Browser Integrity Check: ON

2. **Security** → **Bots**
   - Bot Fight Mode: ON (helps protect presale from bots)

3. **Speed** → **Optimization**
   - Auto Minify: Enable all (JavaScript, CSS, HTML)
   - Brotli: ON

---

## Part 2: Server Deployment

### Step 1: Upload Code to Server

```bash
# On your local machine
cd c:\Users\G\Documents\GitHub\isloria-proper

# Build frontend
cd frontend
npm install
npm run build

# Upload to server (replace YOUR_SERVER with your VPS IP)
scp -r frontend/dist root@YOUR_VPS_IP:/var/www/isloria-proper/frontend/
scp -r backend root@YOUR_VPS_IP:/var/www/isloria-proper/
scp nginx.conf root@YOUR_VPS_IP:/tmp/
```

**Alternative:** Use Git to clone the repo on the server directly:
```bash
# On server
cd /var/www
git clone https://github.com/YOUR_USERNAME/isloria-proper.git
cd isloria-proper/frontend
npm install
npm run build
```

### Step 2: Install NGINX on Server

SSH into your server and run:

```bash
# SSH to server
ssh root@YOUR_VPS_IP

# Update system
sudo apt update && sudo apt upgrade -y

# Install NGINX
sudo apt install nginx -y

# Check NGINX status
sudo systemctl status nginx
```

### Step 3: Configure NGINX

```bash
# Copy the nginx.conf file to sites-available
sudo cp /tmp/nginx.conf /etc/nginx/sites-available/binaria

# Remove default config if exists
sudo rm /etc/nginx/sites-enabled/default

# Create symlink to enable the site
sudo ln -s /etc/nginx/sites-available/binaria /etc/nginx/sites-enabled/

# Test NGINX configuration
sudo nginx -t

# If test passes, reload NGINX
sudo systemctl reload nginx

# Enable NGINX to start on boot
sudo systemctl enable nginx
```

### Step 4: Install and Start Backend

```bash
# Navigate to backend directory
cd /var/www/isloria-proper/backend

# Install dependencies
npm install

# Install PM2 for process management
sudo npm install -g pm2

# Start backend with PM2
pm2 start server.js --name isloria-backend

# Save PM2 configuration
pm2 save

# Enable PM2 to start on boot
pm2 startup
# Follow the command output instructions
```

### Step 5: Verify Backend is Running

```bash
# Check PM2 status
pm2 status

# Check backend logs
pm2 logs isloria-backend

# Test backend locally
curl http://localhost:3001/api/presale/status

# Should return JSON with presale data
```

---

## Part 3: Verification and Testing

### Step 1: DNS Propagation Check

Wait 5-10 minutes for DNS to propagate, then test:

```bash
# Check DNS resolution
nslookup binaria.fun
nslookup island.binaria.fun
nslookup www.binaria.fun
```

All should point to your VPS IP.

### Step 2: Test Main Domain

Open browser and visit:
- `https://binaria.fun` → Should show game page
- `https://www.binaria.fun` → Should redirect to binaria.fun

Check browser console for errors.

### Step 3: Test Subdomain

Open browser and visit:
- `https://island.binaria.fun` → Should show presale page with wallet connect

### Step 4: Test API Endpoints

```bash
# Test main API
curl https://binaria.fun/api/presale/status

# Test presale API
curl https://island.binaria.fun/api/presale/status
```

Both should return JSON data.

### Step 5: Test WebSocket Connection

1. Open `https://binaria.fun`
2. Open browser DevTools → Network → WS tab
3. Should see WebSocket connection to `/socket.io/`
4. Status should be "101 Switching Protocols"

---

## Part 4: Troubleshooting

### Issue: "502 Bad Gateway"

**Cause:** Backend is not running or NGINX can't connect.

**Fix:**
```bash
# Check backend status
pm2 status

# If not running, restart
pm2 restart isloria-backend

# Check backend logs
pm2 logs isloria-backend

# Verify backend is listening on port 3001
netstat -tlnp | grep 3001
```

### Issue: "SSL Certificate Error"

**Cause:** Cloudflare SSL mode mismatch.

**Fix:**
1. Go to Cloudflare → SSL/TLS → Overview
2. Change to "Full" mode (NOT Flexible)
3. Wait 1-2 minutes for changes to apply

### Issue: "CORS Error in Browser Console"

**Cause:** Backend not allowing domain.

**Fix:**
```bash
# Edit backend .env file
cd /var/www/isloria-proper/backend
nano .env

# Verify CORS_ORIGIN is set:
CORS_ORIGIN=https://binaria.fun

# Save and restart backend
pm2 restart isloria-backend
```

### Issue: "Presale Page Not Loading"

**Cause:** Frontend environment variables incorrect.

**Fix:**
```bash
# Check frontend .env.production before build
cd /var/www/isloria-proper/frontend
cat .env.production

# Should show:
# VITE_API_URL=https://binaria.fun
# VITE_PRESALE_SUBDOMAIN=https://island.binaria.fun

# If incorrect, fix and rebuild:
nano .env.production
npm run build

# Then reload NGINX
sudo systemctl reload nginx
```

### Issue: WebSocket Connection Fails

**Cause:** Cloudflare WebSocket not enabled.

**Fix:**
1. Cloudflare → Network
2. Enable "WebSockets"
3. Wait 1-2 minutes

### Issue: Assets Not Loading (404 errors)

**Cause:** File permissions incorrect.

**Fix:**
```bash
# Set correct permissions
sudo chown -R www-data:www-data /var/www/isloria-proper/frontend/dist
sudo chmod -R 755 /var/www/isloria-proper/frontend/dist
```

---

## Part 5: Useful Commands

### NGINX Commands
```bash
# Test configuration
sudo nginx -t

# Reload (apply config changes without downtime)
sudo systemctl reload nginx

# Restart (full restart)
sudo systemctl restart nginx

# Check status
sudo systemctl status nginx

# View error logs
sudo tail -f /var/log/nginx/error.log

# View access logs
sudo tail -f /var/log/nginx/access.log
```

### PM2 Commands
```bash
# List all processes
pm2 list

# View logs
pm2 logs isloria-backend

# Restart backend
pm2 restart isloria-backend

# Stop backend
pm2 stop isloria-backend

# Monitor (real-time)
pm2 monit

# Save current process list
pm2 save
```

### Backend Management
```bash
# View backend environment
cd /var/www/isloria-proper/backend
cat .env

# Check if backend is listening
netstat -tlnp | grep 3001

# Test backend directly
curl http://localhost:3001/api/presale/status
```

### Frontend Rebuild
```bash
# Rebuild frontend after code changes
cd /var/www/isloria-proper/frontend
npm run build

# Reload NGINX to serve new files
sudo systemctl reload nginx
```

---

## Part 6: Cloudflare Performance Optimization

### Enable HTTP/3
1. Cloudflare → Network
2. Enable "HTTP/3 (with QUIC)"

### Configure Caching
1. Cloudflare → Caching → Configuration
2. Caching Level: Standard
3. Browser Cache TTL: 4 hours

### Enable Argo Smart Routing (Optional, Paid)
- Speeds up routing between Cloudflare and your server
- Recommended if you notice latency issues

---

## Security Checklist

- [ ] Cloudflare SSL set to "Full" or "Full (Strict)"
- [ ] HTTPS enforcement enabled (Page Rule)
- [ ] Bot Fight Mode enabled
- [ ] Security Level set to Medium or High
- [ ] Challenge Passage configured
- [ ] API endpoints rate-limited (via Cloudflare Rate Limiting)
- [ ] Backend `.env` file contains no hardcoded secrets in git
- [ ] SSH key authentication enabled (disable password auth)
- [ ] UFW firewall configured:
  ```bash
  sudo ufw allow 22      # SSH
  sudo ufw allow 80      # HTTP
  sudo ufw allow 443     # HTTPS
  sudo ufw enable
  ```

---

## Expected Architecture

```
User's Browser
      |
      | HTTPS (443)
      v
Cloudflare (Proxy + SSL + CDN)
      |
      | HTTP (80) - Cloudflare handles SSL
      v
Your VPS (NGINX)
      |
      ├─> Static Files (/var/www/isloria-proper/frontend/dist)
      |
      └─> Backend (localhost:3001)
            |
            ├─> Express API
            ├─> Socket.io (WebSockets)
            └─> Game Logic
```

**Key Points:**
- Cloudflare terminates SSL (user sees HTTPS)
- Cloudflare proxies to your server via HTTP (port 80)
- NGINX serves static files and proxies API/WebSocket to backend
- Backend runs on localhost:3001 (not exposed to internet)

---

## Maintenance

### Update Application
```bash
# Pull latest code
cd /var/www/isloria-proper
git pull

# Rebuild frontend
cd frontend
npm install
npm run build

# Update backend dependencies
cd ../backend
npm install

# Restart backend
pm2 restart isloria-backend

# Reload NGINX
sudo systemctl reload nginx
```

### Monitor Logs
```bash
# Backend logs
pm2 logs isloria-backend --lines 100

# NGINX error logs
sudo tail -f /var/log/nginx/error.log

# NGINX access logs
sudo tail -f /var/log/nginx/access.log
```

### Backup Presale Data

Since you're using in-memory storage, presale data is lost on restart. If you need persistence:

```bash
# PM2 will keep the process running
# But on server reboot, data is lost
# Consider implementing file-based or database storage

# Check uptime
pm2 status
```

---

## Final Verification Checklist

Before going live:

- [ ] DNS records added in Cloudflare (binaria.fun, island, www)
- [ ] All DNS records proxied (orange cloud ON)
- [ ] SSL/TLS mode set to "Full"
- [ ] NGINX installed and running
- [ ] NGINX config deployed to `/etc/nginx/sites-available/binaria`
- [ ] Backend running via PM2
- [ ] Backend listening on port 3001
- [ ] Frontend built and in `/var/www/isloria-proper/frontend/dist`
- [ ] `https://binaria.fun` loads game page
- [ ] `https://island.binaria.fun` loads presale page
- [ ] `https://www.binaria.fun` redirects to `binaria.fun`
- [ ] API calls work (check browser DevTools → Network)
- [ ] WebSocket connects (check browser DevTools → WS tab)
- [ ] Wallet connection works on presale page
- [ ] PM2 configured to start on boot
- [ ] NGINX configured to start on boot

---

## Need Help?

Common issues are covered in the Troubleshooting section above. If you encounter other issues:

1. Check NGINX logs: `sudo tail -f /var/log/nginx/error.log`
2. Check backend logs: `pm2 logs isloria-backend`
3. Check Cloudflare Analytics for request errors
4. Verify DNS with: `nslookup binaria.fun`
5. Test backend directly: `curl http://localhost:3001/api/presale/status`

---

**You're all set!** Your game and presale site should now be live on binaria.fun and island.binaria.fun with Cloudflare's SSL, CDN, and security features enabled.
