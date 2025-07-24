# Email Tracker Production Deployment Guide

## 🏠 Home Server Deployment

This guide walks through deploying the email tracker to Jacob's home server (jacob-casa-o) using GitHub Actions and PM2.

### 📋 Prerequisites

1. **SSH Access**: Ensure you can SSH to the home server
2. **PM2 Installed**: PM2 for process management
3. **Node.js**: Node.js 18+ installed on the server
4. **Git**: Git installed and configured

### 🚀 Deployment Steps

#### 1. Set up SSH Key for GitHub Actions
```bash
# On your local machine
cd ~/.ssh
ssh-keygen -t ed25519 -C "github-actions-deploy"
# Save as: /Users/jmr/.ssh/github-actions-deploy

# Copy public key to server
ssh-copy-id -i ~/.ssh/github-actions-deploy.pub jacob@172.28.108.247
```

#### 2. Configure GitHub Secrets
In GitHub repository settings → Secrets and variables → Actions:

- `HOME_SERVER_SSH_KEY`: Your private SSH key
- `HOME_SERVER_HOST`: 172.28.108.247
- `HOME_SERVER_USER`: jacob

#### 3. Deploy via GitHub Actions
```bash
# Push to main branch
git push origin main

# Monitor deployment
gh workflow run deploy-home-server.yml
```

#### 4. Manual Deployment (if needed)
```bash
# SSH to server
ssh jacob@172.28.108.247

# Navigate to project
cd /var/www/projects/email-tracker

# Install PM2 globally
npm install -g pm2

# Install dependencies
cd backend
npm install
npm run build

# Start with PM2
pm2 start ecosystem.config.js --env production
pm2 save
```

### 🔧 Service Management

#### PM2 Commands
```bash
# Check status
pm2 status

# View logs
pm2 logs email-tracker

# Restart service
pm2 restart email-tracker

# Stop service
pm2 stop email-tracker

# Save PM2 config
pm2 save
pm2 startup
```

### 🌐 Cloudflare Configuration

#### 1. DNS Setup
```bash
# SSH to server
ssh jacob@172.28.108.247

# Add subdomain to tunnel
sudo nano /etc/cloudflared/config.yml

# Add this line under services:
- hostname: email-tracker.brasilito.org
  service: http://localhost:3001

# Restart tunnel
sudo systemctl restart cloudflared
```

#### 2. Configure Cloudflare Access
1. Go to dash.cloudflare.com → Zero Trust → Access → Applications
2. Add Application → Self-hosted
3. Domain: `email-tracker.brasilito.org`
4. Policy: Allow → Email → `jacob@reider.us`

### 📊 Testing the Deployment

#### 1. Health Check
```bash
# Test locally
curl http://localhost:3001/health

# Test via Cloudflare
curl https://email-tracker.brasilito.org/health
```

#### 2. Tracking Endpoints
```bash
# Test tracking pixel
curl https://email-tracker.brasilito.org/api/track/pixel/test-id

# Test link tracking
curl https://email-tracker.brasilito.org/api/track/link/test-id
```

### 🔍 Monitoring

#### Logs
```bash
# PM2 logs
pm2 logs email-tracker

# System logs
sudo journalctl -u cloudflared -f
```

#### Health Monitoring
```bash
# Check service status
pm2 status
systemctl status cloudflared
```

### 🔄 Updates

#### Automatic Updates
```bash
# Push changes to GitHub
git add .
git commit -m "Update deployment"
git push

# GitHub Actions will automatically deploy
```

#### Manual Updates
```bash
# Pull latest changes
cd /var/www/projects/email-tracker
git pull origin main
cd backend
npm install
npm run build
pm2 restart email-tracker
```

### 🚨 Troubleshooting

#### Common Issues
1. **Port conflicts**: Ensure port 3001 is available
2. **SSH key issues**: Verify GitHub Actions SSH key
3. **Cloudflare tunnel**: Check tunnel status
4. **PM2 issues**: Restart PM2 service

#### Debug Commands
```bash
# Check what's running
sudo netstat -tulpn | grep :3001

# Check PM2 status
pm2 status

# Check tunnel
cloudflared tunnel info dev-server
```

### 📝 Verification Checklist

- [ ] Backend running on port 3001
- [ ] Cloudflare tunnel configured
- [ ] DNS subdomain created
- [ ] Cloudflare Access policy configured
- [ ] HTTPS working
- [ ] Health endpoint accessible
- [ ] Tracking endpoints working
- [ ] GitHub Actions workflow running

### 🎯 Next Steps

1. **Set up SSH key and GitHub secrets**
2. **Configure Cloudflare tunnel**
3. **Test deployment workflow**
4. **Configure environment variables**
5. **Test tracking functionality
