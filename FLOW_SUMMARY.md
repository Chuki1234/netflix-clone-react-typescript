# 📝 Flow Summary - Quick Reference

## 🆕 New User Registration Flow

```
Landing Page (Enter Email)
    ↓
Check Email (Backend)
    ↓
Register Page (Name + Password)
    ↓
Register API → Success
    ↓
Payment Page (Select Plan) ← NEW USER REQUIRED
    ↓
Payment Form (Card Info)
    ↓
Process Payment → Status: "pending"
    ↓
Pending Status Page / Account Page
    ↓
Wait for Admin Approval
    ↓
Admin Approves → Status: "active"
    ↓
Home Page (Full Access)
```

## 🔐 Existing User Login Flow

```
Landing Page (Enter Email)
    ↓
Check Email (Backend)
    ↓
Login Page (Password)
    ↓
Login API → Success
    ↓
Check Subscription Status
    ↓
┌─────────────────┬──────────────────┐
│   Status:       │   Status:        │
│   "active"      │   "pending"      │
└────────┬────────┘   └──────┬───────┘
         │                   │
         ▼                   ▼
    Home Page         Pending Warning
    (Full Access)     (Limited Access)
```

## 🔄 Change Plan Flow

```
Account Page
    ↓
Click "Change Plan"
    ↓
Payment Page (Select New Plan)
    ↓
Payment Form
    ↓
Change Plan API → Status: "pending"
    ↓
Current Plan Still Active
    ↓
Wait for Admin Approval
    ↓
Admin Approves → New Plan Active
```

## 📋 Key Points

1. **New User:** Must select plan immediately after registration
2. **Pending Status:** Limited access until admin approval
3. **Active Status:** Full access to content
4. **Change Plan:** Requires admin approval, old plan stays active during pending

