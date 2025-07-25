# 🎯 Tracking Subdomain Setup - Complete Guide

## ✅ Architecture Summary

**track.brasilito.org** → Public tracking endpoints (Zero Trust Skip policy)
**e.brasilito.org** → Protected dashboard (Zero Trust email auth)

## 📋 DNS Configuration

### **1. Add DNS Record**
```
Type: CNAME
Name: track
Target: 6b8d6c2e-70cc-4bcc-8921-f23ab29060b4.cfargotunnel.com
TTL: Auto
Proxy: Orange Cloud (Proxied)
```

### **2. Cloudflare Zero Trust Applications**

**Application 1: Tracking (Public)**
- **Name**: Email Tracker Public
- **Domain**: track.brasilito.org
- **Policy**: Skip
- **Action**: Skip for Everyone

**Application 2: Dashboard (Protected)**
- **Name**: Email Tracker Dashboard
- **Domain**: e.brasilito.org  
- **Policy**: Allow
- **Action**: Require email (jacob@reider.us)

## 🔧 Implementation Steps

### **1. Deploy Updated Tunnel Config**
```bash
# Copy updated config to server
scp cloudflared-config.yml jacob-casa-o:/home/jacob/.cloudflared/

# Restart cloudflared
ssh jacob-casa-o 'sudo systemctl restart cloudflared'
```

### **2. Update Backend URLs**
```javascript
// Update tracking endpoints to use new subdomain
// Old: e.brasilito.org/api/track/pixel/:id
// New: track.brasilito.org/api/track/pixel/:id

// Update tracking pixel URLs in emails
const trackingPixelUrl = `https://track.brasilito.org/api/track/pixel/${emailId}`;
const trackingLinkUrl = `https://track.brasilito.org/api/track/link/${emailId}`;
```

### **3. Cloudflare Zero Trust Setup**

#### **Application 1: track.brasilito.org**
1. **Zero Trust** → **Access** → **Applications**
2. **Add Application** → **Self-hosted**
3. **Application Name**: Email Tracker Public
4. **Domain**: track.brasilito.org
5. **Policy**: Skip
6. **Action**: Skip for Everyone

#### **Application 2: e.brasilito.org**
1. **Zero Trust** → **Access** → **Applications**
2. **Add Application** → **Self-hosted**
3. **Application Name**: Email Tracker Dashboard
4. **Domain**: e.brasilito.org
5. **Policy**: Allow
6. **Action**: Require email (jacob@reider.us)

## ✅ Verification Commands

```bash
# Test public tracking
curl https://track.brasilito.org/api/track/pixel/test

# Test protected dashboard (should redirect to login)
curl https://e.brasilito.org/dashboard

# Test both domains resolve correctly
dig track.brasilito.org
dig e.brasilito.org
```

## 🎯 Final URLs

**Public Tracking Endpoints:**
- `https://track.brasilito.org/api/track/pixel/:id`
- `https://track.brasilito.org/api/track/link/:id`

**Protected Dashboard:**
- `https://e.brasilito.org/dashboard`
- `https://e.brasilito.org/extension`
- `https://e.brasilito.org/admin`

## 📋 Summary Checklist

- [ ] Add DNS CNAME record for track.brasilito.org
- [ ] Update cloudflared-config.yml with new subdomain
- [ ] Deploy updated tunnel config
- [ ] Create Zero Trust Application for track.brasilito.org (Skip policy)
- [ ] Create Zero Trust Application for e.brasilito.org (Allow policy)
- [ ] Update backend tracking URLs to use track.brasilito.org
- [ ] Test all endpoints work correctly

**Ready to implement?**
