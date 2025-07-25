# 🛡️ Correct Zero Trust Architecture

## ✅ **Realistic Cloudflare Zero Trust Setup**

### **Problem Solved**
Cloudflare Zero Trust UI **does NOT support** per-path bypass rules. Path-based policies are not available.

### **✅ Correct Architecture**

#### **Option 1: Subdomain Separation (Recommended)**

**Public Tracking Subdomain:**
- **Domain**: `track.brasilito.org`
- **Purpose**: All tracking endpoints (`/api/track/pixel/*`, `/api/track/link/*`)
- **Policy**: Skip (public, no authentication required)

**Protected Dashboard Subdomain:**
- **Domain**: `e.brasilito.org`  
- **Purpose**: Dashboard, admin, Chrome extension
- **Policy**: Require email authentication

#### **Option 2: Port Separation**
- **Port 3001**: Tracking endpoints (public)
- **Port 3002**: Dashboard (protected)

### **✅ Implementation Plan**

#### **1. Add New Subdomain**
```bash
# Add to Cloudflare Tunnel config
tunnel: 6b8d6c2e-70cc-4bcc-8921-f23ab29060b4
ingress:
  - hostname: track.brasilito.org
    service: http://localhost:3001
  - hostname: e.brasilito.org  
    service: http://localhost:3001
  - hostname: frigate.brasilito.org
    service: http://localhost:5000
```

#### **2. DNS Configuration**
```
CNAME: track.brasilito.org → 6b8d6c2e-70cc-4bcc-8921-f23ab29060b4.cfargotunnel.com
CNAME: e.brasilito.org → 6b8d6c2e-70cc-4bcc-8921-f23ab29060b4.cfargotunnel.com
```

#### **3. Zero Trust Applications**

**Application 1: Tracking (Public)**
```
Name: Email Tracker Public
Domain: track.brasilito.org
Policy: Skip (no authentication)
```

**Application 2: Dashboard (Protected)**
```
Name: Email Tracker Dashboard  
Domain: e.brasilito.org
Policy: Require email authentication (jacob@reider.us)
```

#### **4. Backend Updates**
```javascript
// Update tracking endpoints to use new subdomain
// track.brasilito.org/api/track/pixel/:id
// track.brasilito.org/api/track/link/:id

// e.brasilito.org/dashboard
// e.brasilito.org/admin
```

### **✅ Final URLs**
- **Tracking**: `https://track.brasilito.org/api/track/pixel/:id` (public)
- **Links**: `https://track.brasilito.org/api/track/link/:id` (public)
- **Dashboard**: `https://e.brasilito.org/dashboard` (protected)
- **Extension**: `https://e.brasilito.org/extension` (protected)

### **✅ Verification Commands**
```bash
# Test public tracking
curl https://track.brasilito.org/api/track/pixel/test

# Test protected dashboard (should require login)
curl https://e.brasilito.org/dashboard
```

### **✅ Cloudflare Setup Steps**

#### **1. Add DNS Records**
```
Type: CNAME
Name: track
Target: 6b8d6c2e-70cc-4bcc-8921-f23ab29060b4.cfargotunnel.com
```

#### **2. Configure Applications**
1. **Zero Trust** → **Access** → **Applications**
2. **Application 1**: track.brasilito.org → **Skip** policy
3. **Application 2**: e.brasilito.org → **Require email** policy

#### **3. Update Backend**
- Serve tracking endpoints on track.brasilito.org
- Serve dashboard on e.brasilito.org
- Update tracking pixel URLs to use track.brasilito.org

This is the **only practical solution** that works with Cloudflare's current UI limitations!
