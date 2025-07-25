# 🛡️ Cloudflare Zero Trust Bypass Rules Setup

## 📋 Step-by-Step Guide for Tracking Pixel Bypass

### 1. Access Zero Trust Dashboard
- **URL**: https://dash.cloudflare.com → Zero Trust → Access → Applications
- **Domain**: brasilito.org

### 2. Create New Application
1. Click **"Add an application"**
2. Select **"Self-hosted"**
3. **Application name**: "Email Tracker Service"
4. **Domain**: `e.brasilito.org`
5. **Session duration**: 24 hours (adjust as needed)

### 3. Configure Path-Based Bypass Rules

#### Option A: Skip Policy (Recommended)
1. **Policy name**: "Allow tracking endpoints"
2. **Action**: **"Bypass"** (not "Allow")
3. **Configure the bypass rule**:

```
# Skip Zero Trust for these paths
Path contains: /api/track/pixel
Path contains: /api/track/link
Path contains: /api/track/health
```

#### Option B: Service Token (Alternative)
1. **Policy name**: "Allow tracking endpoints"
2. **Action**: **"Service Auth"**
3. **Configure service token** for tracking endpoints

### 4. Exact Configuration Steps

#### Policy 1: Bypass for Tracking Endpoints
```
Name: "Tracking Endpoints Bypass"
Action: Bypass

Rules:
- Selector: Path
- Operator: contains
- Value: /api/track/pixel

- Selector: Path  
- Operator: contains
- Value: /api/track/link
```

#### Policy 2: Require Authentication for Dashboard
```
Name: "Dashboard Access"
Action: Allow

Rules:
- Selector: Email
- Operator: matches regex
- Value: jacob@reider.us

Apply to: /dashboard/*
```

### 5. Advanced Configuration

#### Service Token Setup (if needed)
1. **Access** → **Service Tokens**
2. **Create Service Token**
3. **Name**: "Email Tracker API"
4. **Use in bypass rules**

#### Skip Rules Configuration
```
# Skip Zero Trust entirely for tracking
Skip policy for:
- e.brasilito.org/api/track/pixel/*
- e.brasilito.org/api/track/link/*
- e.brasilito.org/api/track/health

# Require authentication for:
- e.brasilito.org/dashboard/*
- e.brasilito.org/admin/*
```

### 6. Verification Commands
```bash
# Test tracking endpoints (should work without auth)
curl https://e.brasilito.org/api/track/pixel/test-id
curl https://e.brasilito.org/api/track/link/test-id

# Test dashboard (should require auth)
curl https://e.brasilito.org/dashboard

# Test health endpoint (should work)
curl https://e.brasilito.org/health
```

### 7. Cloudflare Dashboard Navigation

#### Path to Configuration:
1. **Zero Trust** → **Access** → **Applications**
2. **Add Application** → **Self-hosted**
3. **Application Domain**: `e.brasilito.org`
4. **Policies** → **Add Policy**
5. **Policy Type**: **Bypass**
6. **Configure Path Rules**

#### Common Mistakes to Avoid:
- ❌ Don't use "Allow" - use "Bypass" for tracking endpoints
- ❌ Don't include trailing slashes in path rules
- ❌ Don't forget to save the policy
- ✅ Use "contains" instead of "equals" for flexibility
- ✅ Test each endpoint individually

### 8. Final Configuration Checklist

#### Bypass Rules (Public)
- [ ] `/api/track/pixel/*` → Bypass
- [ ] `/api/track/link/*` → Bypass  
- [ ] `/api/track/health` → Bypass
- [ ] `/health` → Bypass

#### Protected Routes (Require Auth)
- [ ] `/dashboard/*` → Require authentication
- [ ] `/admin/*` → Require authentication
- [ ] `/api/admin/*` → Require authentication

### 9. Testing After Setup
```bash
# Test tracking works without auth
curl https://e.brasilito.org/api/track/pixel/test

# Test dashboard requires auth (should redirect to login)
curl https://e.brasilito.org/dashboard

# Test in browser
# Tracking pixel should load in email clients
# Dashboard should prompt for login
```
