security-spec.md  
Netflix Clone (React/TS + Node/Express + MongoDB)

## 1. Authentication
- JWT Bearer; token + user stored in `sessionStorage` (per-tab).
- Password: bcrypt hash (salt 10).
- Endpoints: `/api/auth/register`, `/api/auth/login`, `/api/auth/me`.
- Token payload: userId, role, exp; short TTL (≤24h recommended).

## 2. Authorization & Access Control
- Roles: `user`, `admin`.
- Middleware: `auth` (JWT verify), `admin` (role check) for `/api/admin/*`.
- Watch gating: block watch if `subscriptionStatus !== "active"` (frontend and backend logic).
- Admin: approve/reject subscriptions, view pending payments, manage users.

## 3. Data Protection
- Passwords hashed, never returned.
- Env secrets: `MONGODB_URI`, `JWT_SECRET`, `PORT`, `VITE_APP_TMDB_V3_API_KEY`, `VITE_APP_BACKEND_API_URL`.
- CORS whitelist for production; HTTPS required on prod.
- Client storage: only JWT/user in sessionStorage (per-tab isolation).

## 4. Input Validation & Errors
- Validate body/query (email/password, movieId/mediaType for preferences/history).
- Generic error messages; do not leak auth logic.
- Consider body size limits; sanitize to avoid NoSQL injection.

## 5. Subscription/Payment Security
- Fields: `subscriptionStatus` (`pending|active|inactive|cancelled`), `paymentStatus` (`pending|confirmed|failed`).
- Only `active` users can watch; enforced by frontend gating and admin updates via `/api/admin/users/:id/subscription`.
- Payment flow is simplified (QR/confirm); if integrating a gateway, use webhook verification and idempotent updates.

## 6. API & Transport
- HTTPS (prod).
- `Authorization: Bearer <token>` header.
- CORS whitelist; avoid `*` in prod.
- Rate-limit auth endpoints (recommended).

## 7. Logging & Monitoring (recommended)
- Log auth failures, admin actions, subscription status changes.
- Health check: `/api/health`.

## 8. Hardening To-Do
- Rate limit login/register/check-email.
- Security headers (helmet) on backend.
- Shorter JWT TTL + refresh flow if needed.
- Backup/monitor Mongo (Atlas).
- 2FA/email verification if higher security needed.
security-spec.md
StreamVerse - Netflix Clone

TABLE OF CONTENTS

Authentication Architecture
Authorization Model
Security Implementation
Protected Routes
Security Best Practices
Threat Model


1. Authentication Architecture
1.1 Authentication Flow

```
mermaidsequenceDiagram
    participant Client
    participant API
    participant AuthService
    participant Database
    
    Client->>API: POST /api/auth/register
    API->>AuthService: validateUser(email, password)
    AuthService->>AuthService: hashPassword(bcrypt)
    AuthService->>Database: createUser()
    Database-->>AuthService: user created
    AuthService-->>API: success
    API-->>Client: 201 Created
    
    Client->>API: POST /api/auth/login
    API->>AuthService: authenticateUser()
    AuthService->>Database: findUser(email)
    Database-->>AuthService: user data
    AuthService->>AuthService: comparePassword()
    AuthService->>AuthService: generateJWT()
    AuthService-->>API: { token, user }
    API-->>Client: 200 OK + JWT token
    
    Client->>API: GET /api/movies (Header: Authorization: Bearer <token>)
    API->>AuthService: verifyToken()
    AuthService->>AuthService: jwt.verify()
    AuthService-->>API: decoded user
    API->>API: attachUserToRequest()
    API-->>Client: 200 OK + movie data
```

1.2 JWT Token Structure

```
json{
  "header": {
    "alg": "HS256",
    "typ": "JWT"
  },
  "payload": {
    "id": "507f1f77bcf86cd799439011",
    "email": "user@example.com",
    "role": "user",
    "iat": 1704067200,
    "exp": 1704153600
  },
  "signature": "HMACSHA256(base64UrlEncode(header) + '.' + base64UrlEncode(payload), secret)"
}
```
--------------------------------------------------------------------------------
Token Properties:

Algorithm: HMAC SHA-256 (symmetric)
Expiration: 24 hours (configurable via JWT_EXPIRE)
Secret: Stored in environment variable JWT_SECRET (minimum 32 characters)
Issuer: netflix-api
Audience: netflix-client

1.3 Authentication Endpoints
1.3.1 User Registration

```
httpPOST /api/auth/register
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "SecurePass123!",
  "confirmPassword": "SecurePass123!"
}
```

Response (201 Created):
```
{
  "success": true,
  "message": "User registered successfully",
  "data": {
    "user": {
      "id": "507f1f77bcf86cd799439011",
      "email": "user@example.com",
      "role": "user",
      "subscriptionStatus": "inactive"
    },
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  }
}
```

--------------------------------------------------------------------------------
Validation Rules:

Email: Valid format, unique in database
Password: Minimum 8 characters, at least 1 uppercase, 1 lowercase, 1 number
Passwords must match

1.3.2 User Login

```
httpPOST /api/auth/login
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "SecurePass123!"
}
```

Response (200 OK):
```
{
  "success": true,
  "data": {
    "user": {
      "id": "507f1f77bcf86cd799439011",
      "email": "user@example.com",
      "role": "user"
    },
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  }
}
```
--------------------------------------------------------------------------------
Error Cases:

401 Unauthorized: Invalid credentials
404 Not Found: User does not exist
500 Internal Server Error: Database connection failure

1.3.3 Token Verification

```
httpGET /api/auth/verify
Authorization: Bearer <token>
Response (200 OK):
json{
  "success": true,
  "data": {
    "user": {
      "id": "507f1f77bcf86cd799439011",
      "email": "user@example.com",
      "role": "user"
    }
  }
}
```

2. Authorization Model
2.1 Role-Based Access Control (RBAC)

Roles Hierarchy:
┌─────────┐
│  Admin  │ (Full system access)
└────┬────┘
     │ inherits
┌────▼────┐
│  User   │ (Authenticated user)
└────┬────┘
     │ inherits
┌────▼─────┐
│Anonymous │ (Public access)
└──────────┘

2.2 Role Permissions

PERMISSION              ANONYMOUS          USER            ADMIN

CONTENT BROWSING
View movie list         yes(limited)       yes              yes
View movie details      yes                yes              yes
Search movies           yes                yes              yes
Filter by genre         yes                yes              yes

USER FEATURES
Watch movies            no                yes               yes
Add to My List          no                yes               yes
Track watch history     no                yes               yes
Update profile          no                yes               yes
View notifications      no                yes               yes

PAYMENT
Subscribe to plan       no                yes               yes
View payment history    no                yes(own)          yes(all)

ADMIN FUNCTION
Manage movies (CRUD)    no                no                yes
Manage users            no                no                yes
View analytics          no                no                yes
Manage categories       no                no                yes
Send notifications      no                no                yes

2.3 Authorization Implementation

Middleware: auth.js

```
const jwt = require('jsonwebtoken');
const User = require('../models/User');

/**
 * Verify JWT token and attach user to request
 */
exports.protect = async (req, res, next) => {
  let token;

  // Extract token from Authorization header
  if (req.headers.authorization && 
      req.headers.authorization.startsWith('Bearer')) {
    token = req.headers.authorization.split(' ')[1];
  }

  // Check if token exists
  if (!token) {
    return res.status(401).json({
      success: false,
      message: 'Not authorized to access this route'
    });
  }

  try {
    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Fetch user from database
    req.user = await User.findById(decoded.id).select('-password');

    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'User no longer exists'
      });
    }

    next();
  } catch (error) {
    return res.status(401).json({
      success: false,
      message: 'Invalid or expired token'
    });
  }
};
```

Middleware: admin.js

```
/**
 * Verify user has admin role
 */
exports.authorize = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Not authenticated'
      });
    }

    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: `User role '${req.user.role}' is not authorized to access this route`
      });
    }

    next();
  };
};
```

Usage Example

```
const { protect } = require('../middleware/auth');
const { authorize } = require('../middleware/admin');

// Public route
router.get('/movies', movieController.getAllMovies);

// User-only route
router.post('/watchlist', protect, watchlistController.addToList);

// Admin-only route
router.post('/admin/movies', protect, authorize('admin'), adminController.createMovie);
```

3. Security Implementation
3.1 Password Security
Hashing Algorithm

Library: bcryptjs
Rounds: 10 (2^10 iterations)
Salt: Auto-generated per password

```
const bcrypt = require('bcryptjs');

// Hashing during registration
const salt = await bcrypt.genSalt(10);
user.password = await bcrypt.hash(password, salt);

// Verification during login
const isMatch = await bcrypt.compare(enteredPassword, user.password);
```
--------------------------------------------------------------------------------
Password Policy (Client-Side)

Minimum length: 8 characters
At least 1 uppercase letter
At least 1 lowercase letter
At least 1 number
Optional: 1 special character

3.2 Token Management
Token Generation

```
const jwt = require('jsonwebtoken');

const generateToken = (id, role) => {
  return jwt.sign(
    { id, role },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRE || '24h' }
  );
};
```
--------------------------------------------------------------------------------
Token Storage (Client-Side)

Recommended: localStorage or secure HTTP-only cookies
Transmission: Always via Authorization: Bearer <token> header
HTTPS Only: In production environments

3.3 Input Validation
Request Validation Example

```
const { body, validationResult } = require('express-validator');

// Validation middleware
exports.validateRegistration = [
  body('email')
    .isEmail()
    .normalizeEmail()
    .withMessage('Please provide a valid email'),
  
  body('password')
    .isLength({ min: 8 })
    .withMessage('Password must be at least 8 characters')
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
    .withMessage('Password must contain uppercase, lowercase, and number'),
  
  (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }
    next();
  }
];
3.4 Error Handling
Principle: Never expose sensitive information in error messages

```
// Good - Generic error
res.status(401).json({ message: 'Invalid credentials' });

// Bad - Exposes user existence
res.status(401).json({ message: 'User not found' });
res.status(401).json({ message: 'Incorrect password' });
```

4. Protected Routes
4.1 Route Protection Matrix

```
// routes/authRoutes.js
router.post('/register', authController.register);           // Public
router.post('/login', authController.login);                 // Public
router.get('/verify', protect, authController.verifyToken);  // Protected

// routes/movieRoutes.js
router.get('/', movieController.getAll);                     // Public
router.get('/:id', movieController.getById);                 // Public
router.post('/', protect, authorize('admin'), movieController.create);  // Admin
router.put('/:id', protect, authorize('admin'), movieController.update); // Admin
router.delete('/:id', protect, authorize('admin'), movieController.delete); // Admin

// routes/watchHistoryRoutes.js
router.get('/', protect, watchHistoryController.getHistory);  // User
router.post('/', protect, watchHistoryController.addEntry);   // User
router.put('/:id', protect, watchHistoryController.update);   // User

// routes/preferencesRoutes.js
router.get('/', protect, preferencesController.get);         // User
router.put('/', protect, preferencesController.update);      // User

// routes/paymentRoutes.js
router.post('/create', protect, paymentController.create);   // User
router.get('/history', protect, paymentController.getHistory); // User

// routes/adminRoutes.js
router.get('/users', protect, authorize('admin'), adminController.getUsers);       // Admin
router.delete('/users/:id', protect, authorize('admin'), adminController.deleteUser); // Admin
router.get('/analytics', protect, authorize('admin'), adminController.getAnalytics); // Admin
```

4.2 Route Documentation

ENDPOINT                  METHOD         AUTH        ROLE      DESCRIPTION
/api/auth/register         POST           no         None      Create new user account
/api/auth/login            POST           no         None      Authenticate user
/api/auth/verify           GET            yes        User      Verify token validity
/api/movies                GET            no         None      List all movies (paginated)
/api/movies/:id            GET            no         None      Get movie details
/api/admin/movies          POST           yes        Admin     Create new movie
/api/admin/movies/:id      PUT            yes        Admin     Update movie
/api/admin/movies/:id      DELETE         yes        Admin     Delete movie
/api/watchhistory          GET            yes        User      Get user's watch history
/api/watchhistory          POST           yes        User      Record watch progress
/api/preferences           GET            yes        User      Get user preferences
/api/preferences/mylist    POST           yes        User      Add to My List
/api/payment/create        POST           yes        User      Process payment
/api/admin/users           GET            yes        Admin     List all users
/api/admin/users/:id       DELETE         yes        Admin     Delete user

5. Security Best Practices
5.1 Environment Configuration

```
# .env file (NEVER public)
NODE_ENV=production
PORT=5000

# Database
MONGODB_URI=mongodb://localhost:27017/netflix-clone

# JWT Configuration
JWT_SECRET=your-super-secure-secret-key-min-32-chars
JWT_EXPIRE=24h

# CORS
ALLOWED_ORIGINS=https://example.com,https://www.example.com

# Rate Limiting (future)
RATE_LIMIT_MAX=100
RATE_LIMIT_WINDOW=15
```

5.2 CORS Configuration

```
const cors = require('cors');

const corsOptions = {
  origin: function (origin, callback) {
    const allowedOrigins = process.env.ALLOWED_ORIGINS.split(',');
    if (!origin || allowedOrigins.indexOf(origin) !== -1) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true, // Allow cookies
  optionsSuccessStatus: 200
};

app.use(cors(corsOptions));
```

5.3 HTTPS Enforcement (Production)
```
// Force HTTPS in production
if (process.env.NODE_ENV === 'production') {
  app.use((req, res, next) => {
    if (req.header('x-forwarded-proto') !== 'https') {
      return res.redirect(`https://${req.header('host')}${req.url}`);
    }
    next();
  });
}
```

5.4 Security Headers

```
const helmet = require('helmet');

app.use(helmet()); // Sets various HTTP headers

// Custom headers
app.use((req, res, next) => {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('X-XSS-Protection', '1; mode=block');
  next();
});
```

5.5 Rate Limiting (Future Enhancement)

```
const rateLimit = require('express-rate-limit');

const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // 5 attempts
  message: 'Too many login attempts, please try again later'
});

app.use('/api/auth/login', loginLimiter);
```

6. Threat Model
6.1 Identified Threats

THREAT                              RISK LEVEL             MITIGATION
Brute Force Attack                     High                Rate limiting, account lockout (future)
SQL/NoSQL Injection                   Medium               Mongoose sanitization, input validation
XSS (Cross-Site Scripting)            Medium               React escaping, Content Security Policy
CSRF (Cross-Site Request Forgery)      Low                 CORS, SameSite cookies
Token Theft                            High                HTTPS, secure storage, short expiry
Man-in-the-Middle (MITM)               High                HTTPS enforcement
Session Hijacking                     Medium               JWT instead of sessions, token rotation
Privilege Escalation                  Medium               Strict role checks, no role in token payload manipulation
Data Breach                            High                Password hashing, encrypted connections

6.2 Security Testing Checklist

 All passwords hashed with bcrypt
 JWT tokens expire within 24 hours
 Protected routes require valid token
 Admin routes verify admin role
 HTTPS enabled in production
 CORS configured for specific origins
 Input validation on all endpoints
 Error messages don't expose sensitive info
 Database credentials in environment variables
 No hardcoded secrets in code
 Rate limiting on auth endpoints (future)
 Security headers configured (helmet)


7. Incident Response
7.1 Token Compromise

Immediate Actions:

1.Rotate JWT secret (invalidates all tokens)
2.Force all users to re-login
3. Audit logs for suspicious activity
4. Notify affected users

Prevention:

1. Short token expiry
2. Token rotation on sensitive actions
3. Monitoring for unusual patterns

7.2 Brute Force Detection
Indicators:

Multiple failed login attempts from same IP
Rapid consecutive requests to auth endpoints

Response:

Temporary IP block (future)
CAPTCHA after 3 failed attempts (future)
Email notification to user


8. Compliance & Standards
8.1 OWASP Top 10 Coverage
+ A01:2021 – Broken Access Control

Role-based authorization implemented
Protected routes verified

+ A02:2021 – Cryptographic Failures

Passwords hashed with bcrypt
HTTPS in production

+ A03:2021 – Injection

Mongoose prevents NoSQL injection
Input validation with express-validator

+ A07:2021 – Identification and Authentication Failures

JWT-based secure authentication
Password complexity requirements

8.2 GDPR Considerations

Data Minimization: Only collect necessary user data
Right to Deletion: User can request account deletion
Data Portability: Export user data (future)
Consent: Clear terms during registration


9. Security Audit Log

Date             Issue                      Severity            Status
2025-12-17       JWT secret too short        Medium             Fixed (32+ chars enforced)
2025-12-21       No rate limiting            Medium             Planned (future)
2025-12-24       Missing security headers     Low               Fixed (helmet added)