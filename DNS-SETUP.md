# DNS Setup for UpshiftAI Domain Migration

**Objective**: Point upshiftai.dev to our new v0.2.1 deployments

---

## 🎯 **Target Configuration**

### **Primary Domain**
- **upshiftai.dev** → Marketing site (static HTML)
- **api.upshiftai.dev** → Platform/Dashboard (Next.js app)

### **Current Vercel URLs**
- **Marketing**: https://site-7czcg8485-jeff-adkins-projects.vercel.app
- **Platform**: https://platform-1vpyqkgst-jeff-adkins-projects.vercel.app

---

## 🔧 **DNS Records Required**

### **At Your DNS Provider (Porkbun)**

```dns
# A Records (IPv4)
upshiftai.dev.     A    76.76.21.21
api.upshiftai.dev. A    76.76.21.21

# CNAME Records (Alternative)
upshiftai.dev.     CNAME  cname.vercel-dns.com.
api.upshiftai.dev. CNAME  cname.vercel-dns.com.
```

### **Vercel Domain Status**
- ✅ **api.upshiftai.dev**: Added to platform project
- ⏳ **upshiftai.dev**: Needs to be transferred from "web" project

---

## 🚀 **Manual Steps Required**

### **1. Remove Domain from Old Project**
```bash
# Complete the removal that's in progress
# Current status: Confirmation pending for alias removal
```

### **2. Add to New Projects**
```bash
# After removal completes:
cd /Users/jeffadkins/CLAWDBOT/upshiftai/site
vercel domains add upshiftai.dev
```

### **3. Configure DNS at Porkbun**
```
Login → upshiftai.dev → DNS Records:
Type: A
Name: @
Value: 76.76.21.21

Type: A  
Name: api
Value: 76.76.21.21
```

### **4. Verify Setup**
```bash
# Check domain status
vercel domains ls

# Test endpoints
curl -I https://upshiftai.dev
curl -I https://api.upshiftai.dev/api/ai/track-usage
```

---

## ⏱️ **Timing**

### **Immediate** 
- Domain removal/transfer (5-10 minutes)
- DNS propagation (15-60 minutes)
- SSL certificate generation (automatic)

### **Full Propagation**
- Global DNS: 2-24 hours
- Search engine indexing: 1-7 days

---

## 🎯 **Expected Result**

### **upshiftai.dev** 
- New v0.2.1 marketing site
- AI-focused messaging and pricing
- Updated CLI documentation

### **api.upshiftai.dev**
- AI usage tracking dashboard
- API key management
- Payment processing

---

## ✅ **Verification Checklist**

- [ ] Domain removed from "web" project
- [ ] Domain added to "site" project  
- [ ] DNS A records updated at Porkbun
- [ ] SSL certificates issued by Vercel
- [ ] Both URLs respond correctly
- [ ] API endpoints functional
- [ ] JARVIS skill updated with new API base URL

---

**Once DNS updates, upshiftai.dev will show our new v0.2.1 platform! 🚀**