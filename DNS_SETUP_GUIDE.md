# 🌐 DNS Setup for e.brasilito.org

## 📋 DNS Configuration Steps (Manual Setup)

### 1. Cloudflare Dashboard
- **URL**: https://dash.cloudflare.com → brasilito.org → DNS

### 2. DNS Record to Create
```
Type: CNAME
Name: e
Target: 6b8d6c2e-70cc-4bcc-8921-f23ab29060b4.cfargotunnel.com
TTL: Auto
Proxy Status: Proxied (orange cloud)
```

### 3. Tunnel Configuration (Already Done)
```yaml
# /etc/cloudflared/config.yml
tunnel: 6b8d6c2e-70cc-4bcc-8921-f23ab29060b4
credentials-file: /home/jacob/.cloudflared/6b8d6c2e-70cc-4bcc-8921-f23ab29060b4.json
ingress:
  - hostname: e.brasilito.org
    service: http://localhost:3001
  - hostname: frigate.brasilito.org
    service: http://localhost:5000
  - hostname: dev.brasilito.org
    service: http://localhost:80
  - service: http_status:404
```

### 4. After DNS Setup
```bash
# Test DNS resolution
dig e.brasilito.org

# Test HTTPS endpoint
curl https://e.brasilito.org/health

# Test tracking endpoints
curl https://e.brasilito.org/api/track/pixel/test-id
curl https://e.brasilito.org/api/track/link/test-id
```

### 5. Cloudflare Zero Trust (Next Step)
- Go to Cloudflare → Zero Trust → Access → Applications
- Add Application → Self-hosted
- Domain: e.brasilito.org
- Policy: Allow → Email → jacob@reider.us

## 🎯 Ready for DNS Setup
- **Tunnel**: ✅ Configured and running
- **Backend**: ✅ Running on port 3001
- **Config**: ✅ Updated with e.brasilito.org
- **DNS**: ⏳ Waiting for you to add the CNAME record

## 🔗 Final URLs After DNS
- **Main**: https://e.brasilito.org
- **Health**: https://e.brasilito.org/health
- **Tracking Pixel**: https://e.brasilito.org/api/track/pixel/:id
- **Link Tracking**: https://e.brasilito.org/api/track/link/:id

Take your time setting up the DNS - everything else is ready!
