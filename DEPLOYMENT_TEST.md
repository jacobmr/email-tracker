# 🧪 Complete End-to-End Testing Guide

## ✅ Production Testing Checklist

### **1. DNS & Tunnel Verification**
```bash
# Test DNS resolution
dig track.brasilito.org
dig e.brasilito.org

# Test tunnel connectivity
curl https://track.brasilito.org/health
curl https://e.brasilito.org/health
```

### **2. Tracking Endpoints Test**
```bash
# Test tracking pixel (should work without auth)
curl https://track.brasilito.org/api/track/pixel/test-id

# Test link tracking (should work without auth)
curl https://track.brasilito.org/api/track/link/test-id?url=https://example.com

# Test dashboard (should require auth)
curl https://e.brasilito.org/dashboard
```

### **3. Zero Trust Verification**
```bash
# Test public tracking endpoints
curl -I https://track.brasilito.org/api/track/pixel/test
# Should return 200 OK

# Test protected dashboard
curl -I https://e.brasilito.org/dashboard
# Should return 302 redirect to login
```

### **4. Email Tracking End-to-End Test**

#### **Test Email Template**
```html
<!-- Test email with tracking -->
<html>
<body>
    <h1>Test Email</h1>
    <p>This is a test email with tracking.</p>
    
    <!-- Tracking pixel -->
    <img src="https://track.brasilito.org/api/track/pixel/test-email-123" width="1" height="1" />
    
    <!-- Tracked link -->
    <a href="https://track.brasilito.org/api/track/link/test-link-123?url=https://example.com">Click here</a>
</body>
</html>
```

#### **Manual Test Steps**
1. **Send test email** with tracking pixel
2. **Open email** in Gmail/Outlook
3. **Check server logs** for tracking events
4. **Click tracked link** and verify redirect
5. **Check dashboard** for email status updates

### **5. Dashboard Testing**

#### **Test URLs**
```bash
# Test dashboard API
curl https://e.brasilito.org/api/emails/recent
curl https://e.brasilito.org/api/stats

# Test dashboard UI
open https://e.brasilito.org/dashboard
```

#### **Test Chrome Extension**
```bash
# Test extension page
open https://e.brasilito.org/extension
```

### **6. API Testing**
```bash
# Test recent emails endpoint
curl https://e.brasilito.org/api/emails/recent

# Test stats endpoint
curl https://e.brasilito.org/api/stats
```

### **7. Production Verification**

#### **Test Commands**
```bash
# Test HTTPS certificates
openssl s_client -connect track.brasilito.org:443
openssl s_client -connect e.brasilito.org:443

# Test SSL grade
nmap --script ssl-enum-ciphers -p 443 track.brasilito.org
nmap --script ssl-enum-ciphers -p 443 e.brasilito.org
```

#### **Performance Test**
```bash
# Test response times
curl -w "@curl-format.txt" https://track.brasilito.org/api/track/pixel/test
curl -w "@curl-format.txt" https://e.brasilito.org/dashboard
```

### **8. Final Verification**

#### **Complete Test Sequence**
1. **✅ DNS resolves correctly** for both subdomains
2. **✅ HTTPS certificates** are valid
3. **✅ Tracking endpoints** work on track.brasilito.org
4. **✅ Dashboard** requires auth on e.brasilito.org
5. **✅ API endpoints** return correct data
6. **✅ Chrome extension** page loads correctly
7. **✅ Email tracking** works end-to-end

### **9. Monitoring Setup**

#### **Health Checks**
```bash
# Create monitoring script
#!/bin/bash
# health-check.sh

echo "Testing tracking endpoints..."
curl -s https://track.brasilito.org/health | jq .

echo "Testing dashboard..."
curl -s https://e.brasilito.org/health | jq .

echo "Testing API endpoints..."
curl -s https://e.brasilito.org/api/emails/recent | jq .
```

### **10. Success Criteria**

#### **✅ All Tests Pass**
- [ ] DNS resolves for both subdomains
- [ ] HTTPS certificates valid
- [ ] Tracking endpoints work without auth
- [ ] Dashboard requires authentication
- [ ] API endpoints return data
- [ ] Email tracking works end-to-end
- [ ] Chrome extension page loads

#### **✅ Production Ready**
- [ ] All endpoints responding
- [ ] Zero Trust policies working
- [ ] SSL certificates valid
- [ ] Performance acceptable
- [ ] Monitoring in place

**Ready to run complete end-to-end tests?**
