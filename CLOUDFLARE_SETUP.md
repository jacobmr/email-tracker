# 🌐 Cloudflare DNS Setup for e.brasilito.org

## 📋 DNS Configuration Steps

### 1. Cloudflare Dashboard Access
- **URL**: https://dash.cloudflare.com
- **Domain**: brasilito.org
- **Zone**: brasilito.org

### 2. DNS Records to Create

#### A. CNAME Record for Tunnel
```
Type: CNAME
Name: e
Target: [your-tunnel-id].cfargotunnel.com
TTL: Auto
Proxy Status: Proxied (orange cloud)
```

#### B. Verify Tunnel ID
```bash
# On server, check tunnel ID
ssh jacob@172.28.108.247 "cloudflared tunnel list"
```

### 3. Cloudflare Tunnel Configuration

#### Current Tunnel Status
```bash
# Check if tunnel is running
ssh jacob@172.28.108.247 "sudo systemctl status cloudflared"

# Check tunnel ID
ssh jacob@172.28.108.247 "cloudflared tunnel list"
```

### 4. DNS Record Setup Commands

#### Option A: Manual via Cloudflare Dashboard
1. Go to Cloudflare → DNS → Add Record
2. **Type**: CNAME
3. **Name**: e
4. **Target**: [tunnel-id].cfargotunnel.com
5. **TTL**: Auto
6. **Proxy**: Enabled

#### Option B: Cloudflare API (if needed)
```bash
# Get zone ID
curl -X GET "https://api.cloudflare.com/client/v4/zones?name=brasilito.org" \
  -H "Authorization: Bearer [API_TOKEN]"

# Create DNS record
curl -X POST "https://api.cloudflare.com/client/v4/zones/[ZONE_ID]/dns_records" \
  -H "Authorization: Bearer [API_TOKEN]" \
  -H "Content-Type: application/json" \
  --data '{
    "type":"CNAME",
    "name":"e",
    "content":"[tunnel-id].cfargotunnel.com",
    "ttl":1,
    "proxied":true
  }'
```

### 5. Verification Commands
```bash
# Test DNS resolution
dig e.brasilito.org

# Test HTTPS endpoint
curl -s https://e.brasilito.org/health

# Check tunnel status
ssh jacob@172.28.108.247 "cloudflared tunnel info"
```

### 6. Cloudflare Zero Trust Access
- Go to Cloudflare → Zero Trust → Access → Applications
- Add Application → Self-hosted
- Domain: e.brasilito.org
- Policy: Allow → Email → jacob@reider.us

### 7. Final Testing
```bash
# Test all endpoints
curl https://e.brasilito.org/health
curl https://e.brasilito.org/api/track/pixel/test-id
curl https://e.brasilito.org/api/track/link/test-id
```

## 🎯 Action Steps
1. **Access Cloudflare Dashboard**: https://dash.cloudflare.com
2. **Add DNS CNAME**: e.brasilito.org → tunnel-id.cfargotunnel.com
3. **Configure Zero Trust**: Add application for e.brasilito.org
4. **Test**: Verify HTTPS endpoints work

## 🔗 URLs After Setup
- **Main**: https://e.brasilito.org
- **Health**: https://e.brasilito.org/health
- **Tracking Pixel**: https://e.brasilito.org/api/track/pixel/:id
- **Link Tracking**: https://e.brasilito.org/api/track/link/:id
