runbook.md  
Netflix Clone (React/TypeScript + Node/Express + MongoDB)

## 1. Environments & Prereqs
- Node 18+; npm 9/10.  
- MongoDB (local or Atlas). Redis optional (not required today).  
- Frontend env:  
  - `VITE_APP_API_ENDPOINT_URL=https://api.themoviedb.org/3`  
  - `VITE_APP_TMDB_V3_API_KEY=<tmdb_key>`  
  - `VITE_APP_BACKEND_API_URL=http://localhost:5000/api`  
- Backend env (`backend/.env`):  
  - `MONGODB_URI=...`  
  - `JWT_SECRET=...` (32+ chars)  
  - `PORT=5000`, `NODE_ENV=development|production`

## 2. Setup (local)
- Backend: `cd backend && npm install && cp .env.example .env && npm run dev`
- Frontend: `npm install && cp .env.example .env && npm run dev` (root SPA folder)
- Health check: `GET /api/health`

## 3. Run
- Backend dev: `npm run dev` (watches server).  
- Backend prod: `npm start`.  
- Frontend dev: `npm run dev` (Vite, port 5173).  
- Frontend build/preview: `npm run build && npm run preview`.

## 4. Key Flows
- Auth: register/login → JWT stored in sessionStorage (per tab).  
- Subscription: select plan → checkout (QR/confirm) → `subscriptionStatus=pending` → admin approves → `active` → watch allowed.  
- Watch gating: block watch if subscription not `active`.  
- Preferences: toggle My List / Likes (backend APIs).  
- Watch history: save progress/upsert; continue watching.  
- Admin: login as admin; view users/pending payments; update subscription status.

## 5. Troubleshooting (quick)
- Backend won’t start: check `MONGODB_URI`, port conflict, missing `JWT_SECRET`.  
- TMDB errors: ensure `VITE_APP_TMDB_V3_API_KEY`.  
- Auth errors: token expired/invalid → re-login; ensure Bearer header.  
- CORS: whitelist frontend origins in backend CORS config (prod).  
- Watch blocked: ensure `subscriptionStatus === "active"` in DB/user state.  

## 6. Deployment (high level)
- Frontend: Vite static build → any static host/CDN.  
- Backend: Node/Express on desired `PORT`; set envs; reverse proxy via Nginx/ingress.  
- MongoDB: Atlas or managed instance.  
- Docker: Dockerfile present for frontend; backend can be containerized similarly; docker-compose optional.

## 7. Data & Backups
- Mongo collections: users, userpreferences, watchhistories, notifications.  
- Back up Mongo (mongodump/Atlas backup) before destructive changes.

## 8. Monitoring & Logging (light)
- Health: `/api/health`.  
- Log auth failures, admin actions, subscription status changes (add if not present).  

## 9. Security Reminders
- Always use HTTPS in production.  
- Use strong `JWT_SECRET`; short TTL recommended.  
- Bcrypt for passwords; never return passwords.  
- Rate-limit auth endpoints (if possible).  
- CORS whitelist; avoid `*` in prod.

## 10. Common Commands
- Backend: `npm run dev`, `npm start`, `npm test` (if tests added).  
- Frontend: `npm run dev`, `npm run build`, `npm run preview`.  
- Mongo shell: `mongosh <db>`; backup: `mongodump --db <db>`.  

## 11. Default/Test Accounts (if seeded)
- Admin: `admin@netflix.net` / `Admin123!` (if created).  
- Test user: `test@netflix.net` / `Test123!` (if created).  

## 12. Future Hardening
- Add Redis cache for TMDB popular/config/genres if traffic or quota pressure.  
- Add outbox/worker if introducing async events/notifications.  
- Add CI, tests (unit/e2e), metrics, rate-limits.  
runbook.md
StreamVerse - Netflix Clone

TABLE OF CONTENTS

Prerequisites
Local Development Setup
Running the Application
Testing the System
Common Operations
Troubleshooting
Production Deployment

1. Prerequisites
1.1 System Requirements

COMPONENT               MINIMUM VERSION             RECOMMEND
Node.js                      18.x                   20.x LTS
npm                          9.x                    10.x
MongoDB                      6.0                    7.0
Redis                        7.0                    Latest
Docker                       20.x                   Latest
Git                          2.x                    Latest

1.2 Software Installation
Install Node.js
```
# Using nvm (recommended)
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.0/install.sh | bash
nvm install 20
nvm use 20

# Verify installation
node --version  # Should show v20.x.x
npm --version   # Should show 10.x.x
```

Install MongoDB
Option 1: Local Installation
```
# Ubuntu/Debian
sudo apt-get install mongodb-org

# macOS (Homebrew)
brew tap mongodb/brew
brew install mongodb-community

# Windows
# Download from https://www.mongodb.com/try/download/community
```

Option 2: Docker (Recommended)
```
docker run -d \
  --name mongodb \
  -p 27017:27017 \
  -v mongodb_data:/data/db \
  -e MONGO_INITDB_ROOT_USERNAME=admin \
  -e MONGO_INITDB_ROOT_PASSWORD=password \
  mongo:7.0
```

Option 3: MongoDB Atlas (Cloud)

Visit https://www.mongodb.com/cloud/atlas
Create free cluster
Get connection string

Install Redis (Optional)
```
# Docker (easiest)
docker run -d \
  --name redis \
  -p 6379:6379 \
  redis:7-alpine

# Ubuntu/Debian
sudo apt-get install redis-server

# macOS
brew install redis
```

2. Local Development Setup
2.1 Clone Repository
```
git clone <repository-url>
cd netflix-clone-react-typescript
```

2.2 Project Structure

netflix-clone-react-typescript/
├── backend/                  # Node.js/Express backend
│   ├── src/
│   │   ├── controllers/     # API controllers
│   │   ├── models/          # MongoDB models
│   │   ├── routes/          # API routes
│   │   ├── middleware/      # Auth, validation
│   │   ├── services/        # Business logic
│   │   ├── workers/         # Background workers
│   │   └── server.js        # Entry point
│   ├── .env                 # Environment config
│   └── package.json
│
├── netflix-clone-react-typescript/  # React frontend
│   ├── src/
│   │   ├── components/      # UI components
│   │   ├── pages/           # Page components
│   │   ├── store/           # Redux store
│   │   └── main.tsx         # Entry point
│   └── package.json
│
├── docs/                    # Documentation
│   ├── SAD.md
│   ├── security-spec.md
│   ├── caching-plan.md
│   ├── events.md
│   ├── consistency.md
│   └── runbook.md
│
└── docker-compose.yml       # Docker orchestration

2.3 Backend Setup
```
cd backend

# Install dependencies
npm install

# Create .env file
cp .env.example .env

# Edit .env with your configuration
nano .env
```

Required Environment Variables (.env):
```
# Server Configuration
NODE_ENV=development
PORT=5000

# Database
MONGODB_URI=mongodb://localhost:27017/netflix
# OR for MongoDB Atlas:
# MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/netflix

# JWT Authentication
JWT_SECRET=your-super-secure-secret-key-minimum-32-characters
JWT_EXPIRE=24h

# Redis (optional - for distributed caching)
REDIS_URL=redis://localhost:6379
USE_REDIS=false  # Set to true if using Redis

# CORS
ALLOWED_ORIGINS=http://localhost:3000,http://localhost:5173

# TMDb API (optional - for movie metadata)
TMDB_API_KEY=your_tmdb_api_key_here

# Email (optional - for notifications)
EMAIL_SERVICE=gmail
EMAIL_USER=your-email@gmail.com
EMAIL_PASS=your-app-password
```

2.4 Frontend Setup
```
cd ../netflix-clone-react-typescript

# Install dependencies
npm install

# Create .env file
cp .env.example .env

# Edit .env
nano .env
```

Frontend Environment Variables (.env):
```
VITE_API_URL=http://localhost:5000/api
VITE_TMDB_API_KEY=your_tmdb_api_key_here
```

2.5 Database Initialization
```
cd ../backend

# Option 1: Create admin user
node create-admin.js

# Option 2: Seed sample data (if script exists)
node seed-database.js
```

Manual Admin Creation:
```
# Connect to MongoDB
mongosh

# Use database
use netflix

# Create admin user (password: Admin123!)
db.users.insertOne({
  email: "admin@netflix.net",
  password: "$2a$10$your_bcrypt_hashed_password",
  role: "admin",
  subscriptionStatus: "active",
  createdAt: new Date(),
  updatedAt: new Date()
})
```

3. Running the Application
3.1 Start Backend
```
cd backend

# Development mode (with hot reload)
npm run dev

# Production mode
npm start

# Start outbox worker (in separate terminal)
node workers/outboxProcessor.js
```

Expected Output:
[Server] Starting netflix backend...
[Database] Connected to MongoDB
[Outbox] Processor started
[Server] Listening on port 5000

3.2 Start Frontend
```
cd netflix-clone-react-typescript

# Development mode
npm run dev

# Production build
npm run build
npm run preview
```

Expected Output:

VITE v5.0.0  ready in 500 ms

  ➜  Local:   http://localhost:5173/
  ➜  Network: http://192.168.1.100:5173/

3.3 Docker Compose Setup (Alternative)

```
# Start all services
docker-compose up -d

# View logs
docker-compose logs -f

# Stop services
docker-compose down
docker-compose.yml:
yamlversion: '3.8'

services:
  mongodb:
    image: mongo:7.0
    container_name: netflix-db
    ports:
      - "27017:27017"
    volumes:
      - mongodb_data:/data/db
    environment:
      MONGO_INITDB_DATABASE: netflix

  redis:
    image: redis:7-alpine
    container_name: netflix-cache
    ports:
      - "6379:6379"
    volumes:
      - redis_data:/data

  backend:
    build: ./backend
    container_name: netflix-backend
    ports:
      - "5000:5000"
    environment:
      NODE_ENV: development
      MONGODB_URI: mongodb://mongodb:27017/netflix
      REDIS_URL: redis://redis:6379
      JWT_SECRET: your-secret-key
    depends_on:
      - mongodb
      - redis
    volumes:
      - ./backend:/app
      - /app/node_modules

  frontend:
    build: ./netflix-clone-react-typescript
    container_name: netflix-frontend
    ports:
      - "3000:3000"
    environment:
      VITE_API_URL: http://localhost:5000/api
    depends_on:
      - backend
    volumes:
      - ./netflix-clone-react-typescript:/app
      - /app/node_modules

volumes:
  mongodb_data:
  redis_data:
```

4. Testing the System
4.1 Health Check
```
# Check backend health
curl http://localhost:5000/health

# Expected response
{
  "status": "ok",
  "timestamp": "2025-12-31T12:00:00.000Z",
  "services": {
    "database": "connected",
    "cache": "available"
  }
}
```

4.2 API Testing
Register New User
```
curl -X POST http://localhost:5000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.net",
    "password": "Test123!",
    "confirmPassword": "Test123!"
  }'
```

Login
```
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.net",
    "password": "Test123!"
  }'

# Save the token from response
export TOKEN="your_jwt_token_here"
```

Get Movies (Authenticated)
```
curl http://localhost:5000/api/movies \
  -H "Authorization: Bearer $TOKEN"
```

4.3 Frontend Testing

Open Browser: http://localhost:5173
Register Account: Click "Sign Up"
Login: Use credentials
Browse Movies: Navigate catalog
Watch Movie: Click any movie
Add to My List: Test watchlist feature
Admin Panel: Login as admin (admin@netflix.net)

4.4 Cache Testing
```
# Get movie (first time - cache miss)
time curl http://localhost:5000/api/movies/MOVIE_ID

# Get same movie (second time - cache hit)
time curl http://localhost:5000/api/movies/MOVIE_ID

# Should be significantly faster
```

4.5 Event Processing Testing
```
# 1. Register new user
curl -X POST http://localhost:5000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email": "event-test@example.net", "password": "Test123!"}'

# 2. Check outbox table
mongosh netflix --eval "db.outboxes.find({eventType: 'UserRegistered'}).pretty()"

# 3. Wait 5-10 seconds for worker processing

# 4. Check event was processed
mongosh netflix --eval "db.outboxes.find({status: 'processed'}).pretty()"

# 5. Verify notification was created
mongosh netflix --eval "db.notifications.find({type: 'info'}).pretty()"
```
5. Common Operations
5.1 Database Operations

View Collections
```
mongosh netflix

# List collections
show collections

# Query users
db.users.find().pretty()

# Query movies
db.movies.find().limit(5).pretty()

# Query outbox events
db.outboxes.find({status: 'pending'}).pretty()
Create Indexes
bashmongosh netflix

# Create text index for movie search
db.movies.createIndex({ title: "text", description: "text" })

# Create compound index for watch history
db.watchhistories.createIndex({ userId: 1, movieId: 1 })

# View all indexes
db.movies.getIndexes()
Backup Database
bash# Backup
mongodump --db netflix --out ./backup

# Restore
mongorestore --db netflix ./backup/netflix
```

5.2 Cache Operations

View Cache Stats
```
curl http://localhost:5000/api/monitoring/cache-stats

# Response:
{
  "size": 1247,
  "hits": 8543,
  "misses": 1876,
  "hitRate": "82.01%"
}
```

Clear Cache
```# Clear all cache
curl -X POST http://localhost:5000/api/admin/cache/clear \
  -H "Authorization: Bearer $ADMIN_TOKEN"

# Clear specific pattern
curl -X POST http://localhost:5000/api/admin/cache/clear \
  -H "Authorization: Bearer $ADMIN_TOKEN" \
  -d '{"pattern": "movie:*"}'
```

5.3 Outbox Management
View Outbox Stats
```
curl http://localhost:5000/api/monitoring/outbox-stats

# Response:
{
  "pending": 12,
  "processed": 5432,
  "failed": 3,
  "oldestPending": "2025-12-31T11:55:00.000Z"
}
```

Reprocess Failed Events
```
mongosh netflix

# Reset failed events to pending
db.outboxes.updateMany(
  { status: 'failed' },
  { $set: { status: 'pending', retryCount: 0, error: null } }
)
```

5.4 User Management
Create Admin User
```
curl -X POST http://localhost:5000/api/admin/users \
  -H "Authorization: Bearer $ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "newadmin@netflix.net",
    "password": "SecurePass123!",
    "role": "admin"
  }'
```

Delete User
```
curl -X DELETE http://localhost:5000/api/admin/users/USER_ID \
  -H "Authorization: Bearer $ADMIN_TOKEN"
```

6. Troubleshooting
6.1 Backend Won't Start
Symptom: Server crashes on startup
Possible Causes & Solutions:

Port Already in Use

```
# Find process using port 5000
lsof -ti:5000

# Kill process
kill -9 $(lsof -ti:5000)

# Or use different port
PORT=5001 npm start
```

MongoDB Connection Failed

```
# Check MongoDB is running
mongosh --eval "db.runCommand({ ping: 1 })"

# Verify connection string in .env
echo $MONGODB_URI

# Start MongoDB if not running
brew services start mongodb-community  # macOS
sudo systemctl start mongod            # Linux
```

Missing Environment Variables

```
# Verify .env file exists
ls -la .env
```

# Check required variables
grep -E "JWT_SECRET|MONGODB_URI" .env
6.2 Frontend Not Loading
Symptom: Blank page or 404 errors
Solutions:

Check Backend is Running

```
curl http://localhost:5000/health
```

Verify API URL

```
# Check .env
cat .env | grep VITE_API_URL

# Should be: VITE_API_URL=http://localhost:5000/api
```

Clear Browser Cache


Chrome: Ctrl+Shift+Delete
Firefox: Ctrl+Shift+Del


Rebuild Frontend

```
rm -rf node_modules package-lock.json
npm install
npm run dev
```

6.3 Authentication Errors
Symptom: "Invalid token" or "Unauthorized"
Solutions:

Check JWT Secret

```
# Ensure JWT_SECRET is set and long enough
echo $JWT_SECRET | wc -c  # Should be > 32
```

Token Expired


Login again to get fresh token
Check JWT_EXPIRE setting


CORS Issues

```
# Add frontend URL to ALLOWED_ORIGINS
ALLOWED_ORIGINS=http://localhost:3000,http://localhost:5173
```

6.4 Events Not Processing
Symptom: Outbox events stuck in "pending"
Solutions:

Check Worker is Running

```
ps aux | grep outboxProcessor

# If not running, start it
node workers/outboxProcessor.js
```

View Worker Logs

```
# Look for errors
tail -f logs/outbox-worker.log
```
Manually Process Events

```
mongosh netflix

# Check pending events
db.outboxes.find({status: 'pending'}).count()

# Reset stuck events
db.outboxes.updateMany(
  {status: 'pending', createdAt: {$lt: new Date(Date.now() - 300000)}},
  {$set: {retryCount: 0}}
)
```

6.5 Slow Performance
Symptom: API responses > 1 second
Solutions:

Check Cache Hit Rate

```
curl http://localhost:5000/api/monitoring/cache-stats

# If < 50%, investigate cache invalidation
```

Database Indexes

```
mongosh netflix

# Check slow queries
db.setProfilingLevel(2)
db.system.profile.find().sort({millis: -1}).limit(5)

# Add missing indexes
db.movies.createIndex({title: 1})
```

Enable Redis

```
# In .env
USE_REDIS=true
REDIS_URL=redis://localhost:6379
```

7. Production Deployment
7.1 Pre-Deployment Checklist

 All tests passing
 Environment variables configured
 Database backups enabled
 SSL certificates installed
 CORS properly configured
 JWT secrets rotated
 Monitoring setup
 Error tracking enabled (Sentry, etc.)

7.2 Environment Configuration
```
# Production .env
NODE_ENV=production
PORT=5000

# Use MongoDB Atlas
MONGODB_URI=mongodb+srv://prod_user:password@cluster.mongodb.net/netflix?retryWrites=true&w=majority

# Strong JWT secret (generate new)
JWT_SECRET=$(openssl rand -base64 64)

# Redis Cloud
REDIS_URL=redis://username:password@redis-cloud.com:6379
USE_REDIS=true

# Enable HTTPS
FORCE_HTTPS=true
ALLOWED_ORIGINS=https://netflix.net,https://www.netflix.net
```

7.3 Deployment Steps
Option 1: Traditional Server
```
# 1. SSH to server
ssh user@your-server.net

# 2. Clone repository
git clone <repo-url>
cd netflix

# 3. Install dependencies
npm install --production

# 4. Build frontend
cd netflix-clone-react-typescript
npm run build

# 5. Setup PM2 (process manager)
npm install -g pm2

# 6. Start backend
cd ../backend
pm2 start src/server.js --name netflix-api

# 7. Start worker
pm2 start workers/outboxProcessor.js --name netflix-worker

# 8. Setup Nginx reverse proxy
sudo nano /etc/nginx/sites-available/netflix
Nginx Configuration:
nginxserver {
    listen 80;
    server_name netflix.net www.netflix.net;

    # Redirect to HTTPS
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name netflix.net www.netflix.net;

    ssl_certificate /path/to/cert.pem;
    ssl_certificate_key /path/to/key.pem;

    # Frontend
    location / {
        root /var/www/netflix/frontend/dist;
        try_files $uri $uri/ /index.html;
    }

    # Backend API
    location /api {
        proxy_pass http://localhost:5000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```

Option 2: Docker Deployment
```
# Build images
docker-compose -f docker-compose.prod.yml build

# Start services
docker-compose -f docker-compose.prod.yml up -d

# View logs
docker-compose logs -f backend
```

7.4 Monitoring & Logging
```
# PM2 monitoring
pm2 monit

# View logs
pm2 logs netflix-api
pm2 logs netflix-worker

# Setup log rotation
pm2 install pm2-logrotate
pm2 set pm2-logrotate:max_size 100M
```

8. Quick Reference
8.1 Common Commands
```
# Backend
npm run dev              # Start dev server
npm start                # Start production
npm test                 # Run tests

# Frontend
npm run dev              # Start dev server
npm run build            # Build for production
npm run preview          # Preview build

# Database
mongosh netflix       # Connect to DB
mongodump --db netflix # Backup
mongorestore             # Restore

# Docker
docker-compose up -d     # Start all services
docker-compose down      # Stop all services
docker-compose logs -f   # View logs
```

8.2 Important URLs

SERVICE                  DEVELOPMENT                             PRODUCTION
Frontend                 http://localhost:5173                   https://netflix.net
Backend API              http://localhost:5000                   https://api.netflix.net
Admin Panel              http://localhost:5173/admin             https://netflix.net/admin
Health Check             http://localhost:5000/health            https://api.netflix.net/health

8.3 Default Credentials
Admin Account:
  Email: admin@netflix.net
  Password: Admin123!

Test User:
  Email: test@netflix.net
  Password: Test123!

9. Support & Resources
9.1 Documentation

Architecture Document: docs/SAD.md
Security Spec: docs/security-spec.md
Caching Plan: docs/caching-plan.md
Events Spec: docs/events.md
Consistency: docs/consistency.md

9.2 External Resources

MongoDB Docs: https://docs.mongodb.com
Express.js Guide: https://expressjs.com
React Documentation: https://react.dev
Docker Docs: https://docs.docker.com

9.3 Getting Help
For Development Issues:

Check this runbook first
Review troubleshooting section
Check application logs
Search GitHub issues

For Production Issues:

Check monitoring dashboards
Review error logs (PM2/Docker)
Verify database connectivity
Check outbox processing status