SAD - Netflix Clone (React/TypeScript + Node/Express + MongoDB)

## 1. Introduction
- Mục đích: Mô tả kiến trúc hệ thống Netflix Clone hiện tại: SPA React/TS, backend Express/MongoDB, tích hợp TMDB, subscription/payment pending-admin, My List/Likes, watch history, admin dashboard.
- Phạm vi: Web client + REST API; không stream full nội dung (chỉ trailer/YouTube/HLS mẫu).
- Stakeholders: End-user, Admin, Dev/Ops.

## 2. Architecture Overview
- Kiểu: Layered SPA + REST, stateless JWT; TMDB là nguồn metadata runtime.
- Frontend: React 18 + TS, Vite, MUI, Redux Toolkit + RTK Query, React Router v6 (lazy).
- Backend: Node 18+ (ESM), Express, Mongoose + MongoDB, JWT/bcrypt; routes: auth, preferences, watch-history, payment, admin, notifications.
- External: TMDB v3 API (movies/TV, genres, videos).

## 3. Quality Attributes
- Performance: Lazy routes, RTK Query cache; pagination/infinite scroll; có thể thêm cache server-side (Redis) cho TMDB popular/config/genres.
- Scalability: Stateless API (JWT), frontend static hosting; Mongo có thể dùng Atlas/Replica; dễ containerize.
- Reliability: Health `/api/health`; chưa dùng queue/outbox; có thể bổ sung worker nếu cần.
- Security: JWT, bcrypt, role guard admin, CORS/HTTPS (prod), chặn watch nếu `subscriptionStatus !== "active"`.
- Maintainability: TypeScript, module hóa (slices/controllers), docs bổ sung (system-vision, runbook, consistency).

## 4. C4 (tóm tắt)
- Context: User (Browser) → Frontend (React SPA) → Backend (Express) → MongoDB; TMDB API cung cấp metadata.
- Container:
  - Web SPA: React/TS, RTK Query, Router.
  - API: Express controllers/middleware, JWT auth.
  - MongoDB: users, userpreferences, watchhistories, notifications.
  - (Tùy chọn) Cache/Redis: TMDB popular/config/genres nếu cần.

## 5. Technology Stack
- Frontend: React 18, TypeScript, Vite, MUI, Redux Toolkit/RTK Query, React Router v6.
- Backend: Node/Express (ESM), Mongoose, bcryptjs, jsonwebtoken, dotenv, cors.
- Data: MongoDB (local/Atlas). Chưa dùng migration tool; scripts thủ công nếu cần.
- Build/Dev: npm scripts (`dev`, `build`, `preview`), Dockerfile (frontend build).

## 6. Design Decisions (hiện tại)
- JWT stateless, token/user lưu `sessionStorage` (per-tab).
- TMDB metadata không persist; fetch runtime với RTK Query.
- Subscription: payment giản lược (QR/confirm) → pending → admin approve → active; frontend chặn watch khi chưa active.
- Watch page phát trailer/YouTube/HLS sample (không stream full phim).
- Admin dashboard: quản lý user/subscription, pending payments; movie browse dùng TMDB (chưa có catalog riêng).

## 7. Data Architecture (đang dùng)
- `users`: auth + subscription fields (plan/status/paymentStatus), dates (paymentDate/activatedAt/expiresAt), role, avatar.
- `userpreferences`: userId unique, myList[], likedMovies[] (movieId, mediaType, timestamps).
- `watchhistories`: userId, movieId, mediaType, progress, duration, completed, lastWatchedAt; unique (userId, movieId, mediaType).
- `notifications`: type/title/message/metadata/isRead.
- TMDB data: runtime fetch, không lưu DB.

## 8. Security Architecture
- Auth: `/api/auth/register`, `/api/auth/login`, `/api/auth/me`; bcrypt; JWT Bearer.
- Role: middleware `auth` + `admin` cho `/api/admin/*`.
- Access gating: client kiểm tra subscriptionStatus trước Watch.
- Secrets/env: frontend `.env` (TMDB key, backend URL), backend `.env` (MONGODB_URI, JWT_SECRET, PORT).
- CORS/HTTPS: cần cấu hình whitelist cho production.

## 9. Deployment Architecture
- Frontend: Vite build → static hosting (Vercel/Netlify/S3) hoặc serve qua Node static.
- Backend: Node/Express trên `PORT` (mặc định 5000), host `0.0.0.0`.
- MongoDB: local dev hoặc Atlas (khuyến nghị Atlas cho prod).
- Docker: Dockerfile frontend có sẵn; backend có thể dockerize/compose (backend + mongo).

## 10. Flows chính
- Auth: register/login → JWT → hydrate user.
- Subscription: chọn gói → checkout giản lược → pending → admin approve → active → xem.
- Preferences: toggle My List / Likes.
- Watch history: upsert progress, continue watching, mark complete.
- Admin: login admin; xem users, pending payments; update subscription.

## 11. Risks / Gaps
- Chưa tích hợp payment gateway; manual + admin approve.
- Chưa có queue/outbox; notifications/events ở mức DB.
- Chưa cache TMDB server-side; phụ thuộc quota key.
- Thiếu test/CI; monitoring/logging hạn chế.

## 12. Future Enhancements
- Tích hợp cổng thanh toán + webhook auto-activate.
- Thêm Redis cache cho TMDB popular/config/genres; cache headers CDN.
- Outbox + worker cho notifications/payment events; có thể thêm SAGA/orchestrator cho subscription.
- Tests (unit/e2e), rate-limit auth, audit log admin actions.
- Catalog riêng do admin quản lý, search/filters nâng cao.


2. Architecture Overview
2.1 Architecture Style
Layered Architecture with Event-Driven Components
┌─────────────────────────────────────────────┐
│         Presentation Layer (React)          │
│         - Web UI Components                 │
│         - State Management (Redux)          │
└────────────────┬────────────────────────────┘
                 │ HTTP/REST API
┌────────────────▼────────────────────────────┐
│         API Gateway Layer (Express)         │
│         - Routes & Controllers              │
│         - Authentication Middleware         │
│         - Request Validation                │
└────────────────┬────────────────────────────┘
                 │
┌────────────────▼────────────────────────────┐
│         Application Layer                   │
│         - Business Logic Services           │
│         - Use Case Orchestration            │
│         - Event Publishing                  │
└─────┬──────────────────────────────┬────────┘
      │                              │
┌─────▼─────────┐           ┌────────▼────────┐
│  Domain Layer │           │ Infrastructure  │
│  - Models     │           │  - MongoDB      │
│  - Entities   │           │  - Redis Cache  │
│  - Events     │           │  - Notifications│
└───────────────┘           └─────────────────┘
2.2 Key Architectural Patterns
2.2.1 Layered Architecture

Presentation: React components, routing
API: Express controllers, middleware
Application: Business logic, use cases
Domain: Entities, value objects
Infrastructure: Database, cache, external services

2.2.2 Repository Pattern
Abstracts data access logic:
```
// Example: User Repository
class UserRepository {
  async findById(id) { /* MongoDB query */ }
  async create(user) { /* Insert operation */ }
  async update(id, data) { /* Update operation */ }
}
```
2.2.3 Service Layer Pattern
Encapsulates business logic:

```
// Example: Authentication Service
class AuthService {
  async register(userData) {
    // Validate, hash password, create user
    // Publish UserRegistered event
  }
}
```

2.2.4 Event-Driven Pattern
Asynchronous communication:

Event Publisher: Controllers/Services
Event Bus: In-memory or message queue
Event Consumers: Notification service, analytics

2.2.5 Outbox Pattern
Ensures reliable event publishing:

```
// Transaction: Update DB + Insert Outbox Entry
await session.withTransaction(async () => {
  await User.create(userData);
  await Outbox.create({ event: 'UserRegistered', payload: userData });
});
// Background worker processes outbox entries
```

3. Quality Attributes
3.1 Performance
Requirements

API response time < 200ms (90th percentile)
Cache hit rate > 80% for movie catalog
Support 1000 concurrent users

Strategies

Caching:

Redis for frequently accessed data (movies, genres)
HTTP caching headers (ETag, Cache-Control)
Cache-aside pattern with TTL


Database Optimization:

Indexes on query fields (genre, title, userId)
Pagination for large result sets
Lean queries (projection)


Async Processing:

Non-critical operations (notifications, analytics) async
Event-driven to prevent blocking



Metrics

Response time monitoring
Cache hit/miss ratios
Database query execution times


3.2 Scalability
Requirements

Horizontal scaling capability
Handle 10x user growth
No single point of failure (SPOF)

Strategies

Stateless API Servers:

JWT tokens (no server-side session)
Load balancer compatible
Docker containerization


Database Scaling:

MongoDB replica sets
Read preference to secondaries
Sharding capability (future)


Cache Scaling:

Redis Cluster mode
Distributed caching
Cache partitioning by key


Async Scaling:

Multiple consumer instances
Queue-based work distribution
Auto-scaling workers



Design Decisions

ADR-001: Stateless architecture for horizontal scaling
ADR-002: Event-driven async for long-running tasks


3.3 Reliability
Requirements

99.9% uptime (8.76 hours downtime/year)
Zero data loss
Graceful degradation

Strategies

Outbox Pattern:

Guarantees event delivery
Survives system crashes
Background processor retries failed events


Idempotency:

Duplicate message detection
Idempotency keys for operations
Safe retry mechanisms


Error Handling:

Try-catch blocks with logging
Circuit breaker pattern (future)
Fallback responses


Data Backup:

MongoDB automated backups
Point-in-time recovery
Disaster recovery plan



Monitoring

Health check endpoints (/health)
Error rate tracking
Alert thresholds


3.4 Security
Requirements

Secure authentication
Authorization enforcement
Data protection

Strategies

Authentication:

JWT with HS256 signing
Token expiry (24h default)
Refresh token mechanism (optional)


Authorization:

Role-Based Access Control (RBAC)
Middleware guards on routes
Principle of least privilege


Data Security:

Password hashing (bcrypt, 10 rounds)
Environment variable secrets
Input validation & sanitization


API Security:

Rate limiting (future)
CORS configuration
HTTPS enforcement (production)



Compliance

GDPR considerations (user data deletion)
PCI DSS for payments (simulated)


3.5 Maintainability
Requirements

Code readability
Easy onboarding
Change isolation

Strategies

Modular Architecture:

Separation of concerns
Single Responsibility Principle
Dependency injection


Documentation:

Architecture Decision Records (ADRs)
API documentation (Swagger/OpenAPI)
Code comments for complex logic


Testing:

Unit tests for business logic
Integration tests for API
Test coverage reporting


Code Quality:

ESLint configuration
Consistent naming conventions
Code reviews




4. C4 Model Views
4.1 Context Diagram (Level 1)
                    ┌──────────────┐
                    │   End User   │
                    │  (Browser)   │
                    └───────┬──────┘
                            │ HTTPS
                    ┌───────▼──────────┐
                    │   netflix     │
                    │  Video Streaming │
                    │     Platform     │
                    └───────┬──────────┘
                            │
        ┌───────────────────┼───────────────────┐
        │                   │                   │
┌───────▼────────┐  ┌──────▼──────┐   ┌────────▼────────┐
│   TMDb API     │  │  Payment    │   │  Email Service  │
│ (Movie Data)   │  │   Gateway   │   │ (Notifications) │
└────────────────┘  └─────────────┘   └─────────────────┘
Description:

End User: Interacts via web browser
netflix: Core system boundary
External Systems: TMDb (metadata), Payment (simulated), Email (optional)


4.2 Container Diagram (Level 2)
┌────────────────────────────────────────────────────────────┐
│                     netflix System                       │
│                                                             │
│  ┌──────────────┐         ┌─────────────────┐             │
│  │ Web Frontend │◄────────┤   API Gateway   │             │
│  │   (React)    │  JSON   │   (Express)     │             │
│  │  TypeScript  │         │    Node.js      │             │
│  └──────────────┘         └────────┬────────┘             │
│                                    │                        │
│                    ┌───────────────┼──────────────┐        │
│                    │               │              │        │
│            ┌───────▼──────┐  ┌────▼─────┐  ┌─────▼──────┐ │
│            │   MongoDB    │  │  Redis   │  │  Outbox    │ │
│            │   Database   │  │  Cache   │  │  Worker    │ │
│            │  (NoSQL)     │  │          │  │ (Background)│ │
│            └──────────────┘  └──────────┘  └────────────┘ │
│                                                             │
└────────────────────────────────────────────────────────────┘
Containers:

Web Frontend (React/TypeScript)

Technology: React 18, Redux Toolkit, Material-UI
Responsibilities: UI rendering, state management, client-side routing
Communication: REST API calls to backend


API Gateway (Express/Node.js)

Technology: Express.js, Node.js 18+
Responsibilities:

Route handling
Authentication/Authorization
Business logic execution
Event publishing


Ports: 5000 (HTTP)


MongoDB Database

Technology: MongoDB 6.0+
Responsibilities:

Primary data store
Collections: users, movies, watchHistory, notifications, outbox


Access: Mongoose ODM


Redis Cache

Technology: Redis 7+ (or in-memory cache)
Responsibilities:

Cache frequently accessed data
Session storage (optional)
Reduce database load


TTL: 5-60 minutes depending on data type


Outbox Worker (Background Process)

Technology: Node.js script (cron/interval)
Responsibilities:

Poll outbox table for unprocessed events
Publish events reliably
Mark events as processed


Idempotency: Deduplication logic




4.3 Component Diagram (Level 3) - API Gateway
┌─────────────────────────────────────────────────────────────┐
│                    API Gateway Container                     │
│                                                              │
│  ┌──────────────────────────────────────────────────────┐  │
│  │              Routes & Controllers                     │  │
│  │  ┌──────────┐ ┌───────────┐ ┌─────────────┐         │  │
│  │  │  Auth    │ │   Movie   │ │  WatchList  │   ...   │  │
│  │  │Controller│ │ Controller│ │  Controller │         │  │
│  │  └────┬─────┘ └─────┬─────┘ └──────┬──────┘         │  │
│  └───────┼─────────────┼───────────────┼────────────────┘  │
│          │             │               │                    │
│  ┌───────▼─────────────▼───────────────▼────────────────┐  │
│  │              Middleware Layer                         │  │
│  │  ┌─────────────┐  ┌──────────────┐  ┌────────────┐  │  │
│  │  │    Auth     │  │  Validation  │  │   Error    │  │  │
│  │  │  Middleware │  │  Middleware  │  │  Handler   │  │  │
│  │  └─────────────┘  └──────────────┘  └────────────┘  │  │
│  └──────────────────────────────────────────────────────┘  │
│                          │                                  │
│  ┌───────────────────────▼──────────────────────────────┐  │
│  │              Service Layer                            │  │
│  │  ┌───────────┐  ┌────────────┐  ┌────────────────┐  │  │
│  │  │   Auth    │  │   Movie    │  │  Notification  │  │  │
│  │  │  Service  │  │  Service   │  │    Service     │  │  │
│  │  └─────┬─────┘  └──────┬─────┘  └────────┬───────┘  │  │
│  └────────┼────────────────┼──────────────────┼──────────┘  │
│           │                │                  │             │
│  ┌────────▼────────────────▼──────────────────▼──────────┐  │
│  │              Data Access Layer                        │  │
│  │  ┌───────────┐  ┌────────────┐  ┌────────────────┐  │  │
│  │  │   User    │  │   Movie    │  │    Outbox      │  │  │
│  │  │Repository │  │ Repository │  │   Repository   │  │  │
│  │  └─────┬─────┘  └──────┬─────┘  └────────┬───────┘  │  │
│  └────────┼────────────────┼──────────────────┼──────────┘  │
│           │                │                  │             │
│  ┌────────▼────────────────▼──────────────────▼──────────┐  │
│  │         MongoDB Models (Mongoose Schemas)             │  │
│  │  User │ Movie │ WatchHistory │ Notification │ Outbox  │  │
│  └────────────────────────────────────────────────────────┘  │
│                                                              │
└──────────────────────────────────────────────────────────────┘
Components:

Controllers:

authController.js: Login, register, token validation
adminController.js: Admin CRUD operations
watchHistoryController.js: Track viewing progress
notificationController.js: User notifications
paymentController.js: Subscription handling


Middleware:

auth.js: JWT verification
admin.js: Role authorization
Error handling middleware


Services:

Business logic layer
Orchestrates multiple repositories
Publishes events


Repositories:

Data access abstraction
CRUD operations
Query optimization


Models:

Mongoose schemas
Data validation
Relationships




5. Technology Stack
5.1 Backend

COMPONENT       TECHNOLOGY              JUSTIFICATION
Runtime         Node.js 18+             Non-blocking I/O, event-driven
Framework       Express.js              Lightweight, flexible routing
Database        MongoDB 6.0+            Document model fits video metadata
ODM             Mongoose                Schema validation, middleware
Cache           Redis / In-Memory       High-performance key-value store
Authentication  JWT                     Stateless, scalable auth
Encryption      bcryptjs                Secure password hashing

5.2 Frontend
COMPONENT           TECHNOLOGY                  JUSTIFICATION
Framework           React 18                    Component-based, large ecosystem
Language            TypeScript                  Type safety, better DX
State               Redux Toolkit               Centralized state management
UI Library          Material-UI                 Pre-built components
Build Tool          Vite                        Fast HMR, optimized builds

5.3 DevOps
COMPONENT           TECHNOLOGY                  JUSTIFICATION
Containerization    Docker                      Consistent environments
Version Control     Git                         Industry standard
Environment Config  dotenv                      Secure secret management

6. Design Decisions (ADRs)
ADR-001: Use MongoDB over Relational Database
Status: Accepted
Context:
Need to choose primary database for storing movies, users, and watch history.
Decision:
Use MongoDB (document database) instead of PostgreSQL (relational).
Rationale:

Flexible schema for movie metadata (genres, cast, etc.)
Embedded documents reduce joins (watch history with movie refs)
Horizontal scaling with sharding
Native JSON support matches API responses
Existing team expertise

Consequences:

+ Faster development with schema flexibility
+ Better performance for nested data
- No ACID transactions across collections (mitigated with sessions)
- Must implement referential integrity in application


ADR-002: Implement Outbox Pattern for Event Reliability
Status: Accepted
Context:
Need to ensure critical events (payment confirmed, user registered) are reliably published even if message queue is down.
Decision:
Implement Outbox pattern with a dedicated outbox collection and background worker.
Rationale:

Guarantees event delivery (at-least-once)
Survives system crashes
Decouples event publishing from business transaction
Industry-proven pattern (Microservices Pattern by C. Richardson)

Consequences:

+ Reliable event delivery
+ Transactional consistency (DB + Outbox in same transaction)
- Additional complexity (worker process)
- Eventual consistency (slight delay in event processing)

Implementation:
```
// Outbox Schema
{
  eventType: 'UserRegistered',
  payload: { userId, email },
  status: 'pending', // pending | processed | failed
  createdAt: Date,
  processedAt: Date
}

// Worker polls every 5 seconds
setInterval(async () => {
  const events = await Outbox.find({ status: 'pending' }).limit(100);
  for (const event of events) {
    await processEvent(event);
    await Outbox.updateOne({ _id: event._id }, { status: 'processed' });
  }
}, 5000);
```

ADR-003: Use JWT for Authentication over Sessions
Status: Accepted
Context:
Need authentication mechanism for API.
Decision:
Use JWT (JSON Web Tokens) instead of server-side sessions.
Rationale:

Stateless: No session store required
Scalable: Works across multiple API servers
Mobile-friendly: Easy to store in client
Industry standard for REST APIs

Consequences:

+ Horizontal scaling without session stickiness
+ Reduced server memory (no session storage)
- Cannot invalidate tokens before expiry (mitigation: short TTL + refresh)
- Token size larger than session cookie


ADR-004: Implement Cache-Aside Pattern with Redis
Status: Accepted
Context:
Movie catalog is read-heavy; database queries becoming bottleneck.
Decision:
Implement cache-aside (lazy loading) pattern with Redis.
Rationale:

Only cache what's needed (self-managing)
Stale data acceptable for movies (not real-time)
TTL prevents infinite growth
Industry standard caching pattern

Consequences:

+ 80%+ cache hit rate reduces DB load
+ Faster response times (< 50ms from cache)
- Cache invalidation complexity on updates
- Potential stale data (mitigated with TTL)

Implementation:
```
async getMovieById(id) {
  // 1. Try cache
  const cached = await redis.get(`movie:${id}`);
  if (cached) return JSON.parse(cached);
  
  // 2. Query DB
  const movie = await Movie.findById(id);
  
  // 3. Store in cache (TTL 1 hour)
  await redis.setex(`movie:${id}`, 3600, JSON.stringify(movie));
  
  return movie;
}
```

7. Data Architecture
7.1 Database Schema (MongoDB Collections)
7.1.1 Users Collection

```
{
  _id: ObjectId,
  email: String (unique, indexed),
  password: String (hashed),
  role: String (enum: 'user', 'admin'),
  subscriptionStatus: String (enum: 'active', 'inactive'),
  createdAt: Date,
  updatedAt: Date
}
```

7.1.2 Movies Collection
```
{
  _id: ObjectId,
  tmdbId: Number (unique, indexed),
  title: String (indexed, text search),
  genres: [String] (indexed),
  rating: Number,
  quality: String (enum: '720p', '1080p', '4K'),
  duration: Number (minutes),
  releaseYear: Number,
  posterUrl: String,
  videoUrl: String,
  createdAt: Date
}
```

7.1.3 WatchHistory Collection

```
{
  _id: ObjectId,
  userId: ObjectId (indexed),
  movieId: ObjectId (indexed),
  progress: Number (seconds watched),
  completed: Boolean,
  lastWatchedAt: Date,
  createdAt: Date
}
// Compound index: (userId, movieId)
```

7.1.4 Notifications Collection

```
{
  _id: ObjectId,
  userId: ObjectId (indexed),
  type: String (enum: 'info', 'payment', 'system'),
  title: String,
  message: String,
  read: Boolean,
  createdAt: Date
}
```

7.1.5 Outbox Collection (Event Store)
```
{
  _id: ObjectId,
  eventType: String (indexed),
  aggregateId: String,
  payload: Object,
  status: String (enum: 'pending', 'processed', 'failed'),
  retryCount: Number,
  createdAt: Date,
  processedAt: Date
}
// Index: (status, createdAt)
```

7.2 Data Flow Patterns
7.2.1 Read Path (with Caching)

Client → API → Cache Check → [Hit] → Return
                  ↓
                [Miss]
                  ↓
             Database → Cache Store → Return
7.2.2 Write Path (with Outbox)
Client → API → Transaction Start
                   ↓
              Update Database
                   ↓
              Insert Outbox Entry
                   ↓
              Commit Transaction
                   ↓
              Return Success
                   
[Background Worker]
         ↓
    Poll Outbox (status=pending)
         ↓
    Process Event
         ↓
    Mark as Processed

8. Security Architecture
8.1 Authentication Flow
1. User Login (POST /api/auth/login)
   ├─ Validate credentials
   ├─ Compare hashed password (bcrypt)
   ├─ Generate JWT token (HS256)
   │   Payload: { userId, role, exp }
   └─ Return token

2. Authenticated Request (GET /api/movies)
   ├─ Extract JWT from Authorization header
   ├─ Verify token signature
   ├─ Check expiration
   ├─ Attach user to request object
   └─ Proceed to controller
8.2 Authorization Matrix

    ENDPOINT                         ANONYMOUS         USER         ADMIN
    GET /movies                     yes(limited)       yes           yes
    POST /watchlist                     no             yes           yes
    POST /admin/movies                  no             no            yes
    DELETE /admin/users/:id             no             no            yes

8.3 Security Measures

Input Validation:

Express-validator for request sanitization
Mongoose schema validation


Password Security:

bcrypt with 10 salt rounds
No plain text storage
Password complexity rules (client-side)


Token Security:

JWT secret stored in environment variables
Short expiration (24h default)
HTTPS only in production


CORS Configuration:

Whitelist allowed origins
Credentials support




9. Deployment Architecture
9.1 Docker Composition

```
services:
  backend:
    image: netflix-backend:latest
    ports:
      - "5000:5000"
    environment:
      - MONGODB_URI
      - JWT_SECRET
      - REDIS_URL
    depends_on:
      - mongodb
      - redis

  frontend:
    image: netflix-frontend:latest
    ports:
      - "3000:3000"
    depends_on:
      - backend

  mongodb:
    image: mongo:6.0
    volumes:
      - mongo_data:/data/db

  redis:
    image: redis:7-alpine
    volumes:
      - redis_data:/data

  outbox-worker:
    image: netflix-backend:latest
    command: node worker/outbox-processor.js
    depends_on:
      - mongodb
      - redis
```

9.2 Scaling Strategy

Horizontal Scaling:
                Load Balancer
                      │
        ┌─────────────┼─────────────┐
        │             │             │
   Backend-1     Backend-2     Backend-3
        └─────────────┼─────────────┘
                      │
              MongoDB Replica Set
                      │
                Redis Cluster

10. References

MongoDB Best Practices: docs.mongodb.com
Redis Caching Patterns: redis.io/docs/patterns
Outbox Pattern: Microservices Patterns by Chris Richardson
C4 Model: c4model.com
JWT RFC: RFC 7519