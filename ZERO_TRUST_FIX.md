# 🛡️ Zero Trust Path-Based Bypass - Correct Setup

## ❌ **Current Issue**
You're looking at **Access Groups** or **Service Auth**, but you need **Access Policies** with **Skip** rules.

## ✅ **Correct Path**

### **Step 1: Create Application with Skip Policy**
1. **Zero Trust** → **Access** → **Applications**
2. **Add Application** → **Self-hosted**
3. **Application Settings**:
   - **Name**: "Email Tracker Service"
   - **Domain**: `e.brasilito.org`

### **Step 2: Configure Skip Policy (Path-based)**
1. **In the application setup**, look for **"Policies"**
2. **Add Policy** → **"Skip"** (not "Allow")
3. **Policy Configuration**:

```
Policy Name: "Skip tracking endpoints"
Action: Skip

Condition:
- Selector: **"Path"** 
- Operator: **"contains"**
- Value: **"/api/track/pixel"**

Add another condition:
- Selector: **"Path"**
- Operator: **"contains"** 
- Value: **"/api/track/link"**

Add another condition:
- Selector: **"Path"**
- Operator: **"contains"**
- Value: **"/health"**
```

### **Step 3: Dashboard Policy (Separate)**
1. **Add another policy**
2. **Policy Name**: "Dashboard Access"
3. **Action**: Allow
4. **Condition**:
   - Selector: **"Email"**
   - Operator: **"matches"**
   - Value: **jacob@reider.us**
   - Apply to: **/dashboard/***

## 🔍 **Where to Find Path Selector**

### **Visual Navigation**:
1. **Zero Trust** → **Access** → **Applications**
2. **Add Application** → **Self-hosted**
3. **During application setup**, you'll see **"Policies"** section
4. **Add Policy** → **"Skip"** → **"Path"** selector will appear

### **Alternative: Use Cloudflare Rules**
1. **Zero Trust** → **Access** → **Applications**
2. **Create application** with **"Skip"** action
3. **Configure path-based rules**

## 🎯 **Exact Configuration**

### **Skip Policy Setup**:
```
Application: e.brasilito.org
Policy 1: Skip
- Path contains: /api/track/pixel
- Path contains: /api/track/link  
- Path contains: /health

Policy 2: Allow (Dashboard)
- Path contains: /dashboard
- Email: jacob@reider.us
```

## 🔧 **If Path Selector Not Available**

### **Alternative: Use Cloudflare Access with Service Tokens**
1. **Create Service Token** for tracking endpoints
2. **Use Service Auth** instead of Skip
3. **Configure token-based bypass**

### **Test Commands**:
```bash
# Tracking should work without auth
curl https://e.brasilito.org/api/track/pixel/test

# Dashboard should require auth
curl https://e.brasilito.org/dashboard
```

## 🚨 **Critical Fix**
You need **Access Policies** with **Skip** action, not Access Groups or Service Auth. The **"Path"** selector appears in **Access Policies** during application setup!
