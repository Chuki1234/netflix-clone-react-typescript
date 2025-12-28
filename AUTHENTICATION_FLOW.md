# 🔐 Authentication & Subscription Flow Design

## Tổng quan

Flow được thiết kế để xử lý đăng nhập/đăng ký và quản lý subscription plan cho Netflix Clone.

---

## 📋 Flow Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│                        START                                     │
│                     Landing Page                                 │
│                  (Enter Email)                                   │
└────────────────────────┬────────────────────────────────────────┘
                         │
                         ▼
            ┌────────────────────────┐
            │  User có tài khoản?    │
            │  (Check email exists)  │
            └────────┬───────────────┘
                     │
         ┌───────────┴───────────┐
         │                       │
         ▼                       ▼
    ┌─────────┐          ┌─────────────┐
    │   CÓ    │          │    KHÔNG    │
    └────┬────┘          └──────┬──────┘
         │                      │
         ▼                      ▼
┌──────────────┐      ┌──────────────────┐
│  Login Page  │      │  Register Page   │
│  (Password)  │      │  (Name, Password)│
└──────┬───────┘      └────────┬─────────┘
       │                       │
       │                       ▼
       │              ┌──────────────────┐
       │              │  Registration    │
       │              │     Success      │
       │              └────────┬─────────┘
       │                       │
       │                       ▼
       │              ┌──────────────────┐
       │              │  Payment Page    │
       │              │  (Select Plan)   │
       │              └────────┬─────────┘
       │                       │
       │                       ▼
       │              ┌──────────────────┐
       │              │  Payment Process │
       │              │  (Payment Info)  │
       │              └────────┬─────────┘
       │                       │
       │                       ▼
       │              ┌──────────────────┐
       │              │  Pending Status  │
       │              │  (Wait Admin)    │
       │              └────────┬─────────┘
       │                       │
       └───────────────────────┘
                  │
                  ▼
         ┌─────────────────┐
         │   Home Page     │
         │   (Browse)      │
         └────────┬────────┘
                  │
                  ▼
         ┌─────────────────┐
         │  Account Page   │
         │  (View Plan)    │
         └────────┬────────┘
                  │
         ┌────────┴────────┐
         │                 │
         ▼                 ▼
    ┌─────────┐      ┌─────────────┐
    │  Change │      │  Other      │
    │   Plan  │      │  Features   │
    └────┬────┘      └─────────────┘
         │
         ▼
    ┌─────────────┐
    │ Payment Page│
    │ (New Plan)  │
    └──────┬──────┘
           │
           ▼
    ┌─────────────┐
    │  Payment    │
    │  Process    │
    └──────┬──────┘
           │
           ▼
    ┌─────────────┐
    │ Pending     │
    │ (Wait Admin)│
    └─────────────┘
```

---

## 🔄 Chi tiết Flow

### 1. Landing Page → Login/Register

**Bước 1:** User nhập email ở Landing Page
- URL: `/`
- Action: Submit email → Navigate to `/login?email={email}`

**Bước 2:** Check email exists
- Backend check: `GET /api/auth/check-email?email={email}`
- Response: `{ exists: true/false }`

**Bước 3a - Email đã tồn tại:**
- Navigate to: `/login?email={email}`
- Pre-fill email vào Login Page
- User nhập password → Login

**Bước 3b - Email chưa tồn tại:**
- Navigate to: `/register?email={email}`
- Pre-fill email vào Register Page
- User nhập Name và Password → Register

---

### 2. Registration Flow (User mới)

#### 2.1. Register Page
- URL: `/register?email={email}`
- Fields:
  - Email (pre-filled, disabled)
  - Name (required)
  - Password (required)
  - Confirm Password (required)
- Validation:
  - Email format valid
  - Name: min 2 characters
  - Password: min 6 characters
  - Passwords match

#### 2.2. Submit Registration
- API: `POST /api/auth/register`
- Body: `{ name, email, password }`
- Response: `{ _id, name, email, token }`
- **Lưu ý:** Không set subscriptionPlan ngay, để null hoặc "Pending"

#### 2.3. After Registration Success
- Save token và user info vào Redux + localStorage
- Navigate to: `/payment?newUser=true`
- Show message: "Please select a subscription plan to continue"

---

### 3. Payment Flow (User mới)

#### 3.1. Payment Page (First Time)
- URL: `/payment?newUser=true`
- Context: User vừa đăng ký, chưa có plan
- Behavior:
  - All plans available
  - No current plan highlighted
  - Required to select a plan before continuing

#### 3.2. Select Plan
- User click vào một plan card
- Plan được highlight
- "Continue" button enabled

#### 3.3. Payment Information
- After click "Continue":
  - Show Payment Form (Modal hoặc next step)
  - Fields:
    - Card Number
    - Expiry Date
    - CVV
    - Cardholder Name
    - Billing Address (optional)
  - Or: Integrate with payment gateway (Stripe, PayPal, etc.)

#### 3.4. Submit Payment
- API: `POST /api/payment/process`
- Body:
  ```json
  {
    "planId": "Basic|Standard|Premium",
    "paymentMethod": "card|paypal|...",
    "paymentInfo": { ... }
  }
  ```
- Response:
  ```json
  {
    "success": true,
    "subscriptionId": "...",
    "status": "pending",
    "message": "Payment received. Waiting for admin approval."
  }
  ```

#### 3.5. Update User Subscription Status
- Backend update User:
  - `subscriptionPlan`: Selected plan
  - `subscriptionStatus`: "pending"
  - `paymentStatus`: "pending"
  - `paymentDate`: Current date

#### 3.6. Pending Status Page
- Navigate to: `/payment/pending` hoặc show in Account Page
- Display:
  - "Your subscription is pending approval"
  - Selected plan
  - "We will notify you once your subscription is activated"
  - Option to contact support

---

### 4. Admin Approval Flow (Backend)

#### 4.1. Admin Dashboard
- Admin login
- View pending subscriptions
- Approve/Reject subscriptions

#### 4.2. Approve Subscription
- API: `PUT /api/admin/subscriptions/:subscriptionId/approve`
- Backend update:
  - `subscriptionStatus`: "active"
  - `paymentStatus`: "confirmed"
  - `activatedAt`: Current date

#### 4.3. Notify User (Optional)
- Send email notification
- Or: User check Account Page, status changed to "Active"

---

### 5. Login Flow (User đã có tài khoản)

#### 5.1. Login Page
- URL: `/login?email={email}`
- Fields:
  - Email (pre-filled)
  - Password
  - Remember Me (optional)

#### 5.2. Submit Login
- API: `POST /api/auth/login`
- Body: `{ email, password }`
- Response: `{ _id, name, email, token, subscriptionPlan, subscriptionStatus }`

#### 5.3. Check Subscription Status
- If `subscriptionStatus === "pending"`:
  - Navigate to: `/payment/pending` or show warning in Account Page
- If `subscriptionStatus === "active"`:
  - Navigate to: `/browse` (Home Page)

---

### 6. Change Plan Flow (Existing User)

#### 6.1. From Account Page
- User click "Change Plan" button
- Navigate to: `/payment`

#### 6.2. Payment Page (Change Plan)
- URL: `/payment`
- Context: User đã có plan active
- Behavior:
  - Current plan highlighted
  - User can select different plan
  - "Continue" enabled if different plan selected

#### 6.3. Select New Plan
- User click vào plan khác
- Plan được highlight

#### 6.4. Payment Process
- Similar to Registration Payment Flow (steps 3.3-3.5)
- But: Show pro-rated pricing, upgrade/downgrade information

#### 6.5. Submit New Plan
- API: `POST /api/payment/change-plan`
- Body:
  ```json
  {
    "newPlanId": "Basic|Standard|Premium",
    "paymentMethod": "...",
    "paymentInfo": { ... }
  }
  ```
- Backend:
  - Update `subscriptionPlan` to new plan
  - Set `subscriptionStatus`: "pending"
  - Keep old plan active until approval

#### 6.6. Pending Status
- Similar to Registration Pending (step 3.6)
- Show: "Plan change request is pending approval"
- Current plan remains active until admin approves

---

## 📊 Database Schema Updates

### User Model
```javascript
{
  _id: ObjectId,
  name: String,
  email: String (unique),
  password: String (hashed),
  avatar: String (optional),
  
  // Subscription fields
  subscriptionPlan: String (enum: ['Mobile', 'Basic', 'Standard', 'Premium', null]),
  subscriptionStatus: String (enum: ['pending', 'active', 'inactive', 'cancelled']),
  paymentStatus: String (enum: ['pending', 'confirmed', 'failed']),
  paymentDate: Date,
  activatedAt: Date,
  expiresAt: Date,
  
  createdAt: Date,
  updatedAt: Date
}
```

### Subscription/Payment Model (Optional - for history)
```javascript
{
  _id: ObjectId,
  userId: ObjectId (ref: 'User'),
  planId: String,
  amount: Number,
  paymentMethod: String,
  paymentStatus: String,
  subscriptionStatus: String,
  requestedAt: Date,
  approvedAt: Date,
  approvedBy: ObjectId (ref: 'Admin'),
  createdAt: Date,
  updatedAt: Date
}
```

---

## 🔌 API Endpoints Needed

### Authentication
- `GET /api/auth/check-email?email={email}` - Check if email exists
- `POST /api/auth/register` - Register new user (already exists)
- `POST /api/auth/login` - Login (already exists)
- `GET /api/auth/me` - Get current user (already exists, need to include subscription fields)

### Payment/Subscription
- `POST /api/payment/process` - Process new subscription payment
- `POST /api/payment/change-plan` - Change subscription plan
- `GET /api/payment/status` - Get payment/subscription status
- `GET /api/payment/history` - Get payment history (optional)

### Admin (Future)
- `GET /api/admin/subscriptions/pending` - Get pending subscriptions
- `PUT /api/admin/subscriptions/:id/approve` - Approve subscription
- `PUT /api/admin/subscriptions/:id/reject` - Reject subscription

---

## 🎨 UI/UX Considerations

### Registration Flow
1. **Success Message:** "Account created successfully! Please select a subscription plan."
2. **Payment Page (New User):** 
   - Banner: "Welcome! Choose your subscription plan to get started"
   - All plans available
   - No "skip" option (required)

### Login Flow
1. **Pending Status Warning:**
   - Banner on Account Page: "Your subscription is pending approval"
   - Limited access to content until approved

2. **Active Status:**
   - Full access to content
   - Show current plan in Account Page

### Change Plan Flow
1. **Information Display:**
   - Show current plan clearly
   - Highlight new selected plan
   - Show price difference (upgrade/downgrade)

2. **Confirmation:**
   - "Are you sure you want to change your plan?"
   - Show effective date

---

## ✅ Implementation Checklist

### Phase 1: Authentication Flow
- [ ] Add `check-email` API endpoint
- [ ] Update Register Page to navigate to Payment after success
- [ ] Update User model with subscription fields
- [ ] Update Login to handle subscription status

### Phase 2: Payment Flow (New User)
- [ ] Update Payment Page to handle `newUser` parameter
- [ ] Create Payment Form component
- [ ] Create Payment processing API
- [ ] Update User subscription fields after payment

### Phase 3: Change Plan Flow
- [ ] Update Payment Page to handle existing user
- [ ] Create Change Plan API
- [ ] Add pending status UI
- [ ] Update Account Page to show subscription status

### Phase 4: Admin Approval (Future)
- [ ] Create Admin dashboard
- [ ] Create Approval API
- [ ] Add notification system

---

## 🚀 Next Steps

1. **Start with Backend:**
   - Update User model with subscription fields
   - Create `check-email` endpoint
   - Update register/login endpoints to include subscription info

2. **Frontend Updates:**
   - Update Register Page flow
   - Update Payment Page for new users
   - Add Payment Form component

3. **Testing:**
   - Test complete registration flow
   - Test login flow with different subscription statuses
   - Test change plan flow

