# Software Architecture Document (SAD)

## 1. Overview
- **Product**: Netflix Clone (React + TypeScript frontend, Node.js/Express + MongoDB backend)
- **Purpose**: Streaming-like experience using TMDB data, with authentication, subscription/payment flow, watch history, preferences, and admin dashboard.
- **Scope**: Web client, backend API, data storage (MongoDB), integration with TMDB API.

## 2. Stakeholders & Roles
- **End Users**: Browse and watch trailers, manage My List/Likes, track watch history.
- **Admins**: Manage users/subscriptions/notifications; view pending payments.
- **Developers/Ops**: Maintain codebase, CI/build, env configuration.

## 3. Architecture Style
- **Frontend**: SPA with React 18 + Vite, TypeScript, MUI, Redux Toolkit + RTK Query, React Router v6 (lazy routes).
- **Backend**: RESTful APIs on Express, Node.js (ESM), JWT auth, Mongoose for MongoDB.
- **Integration**: TMDB v3 API for movie/TV metadata; internal backend API for auth, preferences, watch history, payment flow.
- **Deployment**: Frontend Vite build (dist) suitable for static hosting; backend runs on Node (PORT env).

## 4. Runtime View (Key Flows)
- **Authentication**: `/api/auth/register`, `/api/auth/login`, JWT stored in sessionStorage; `auth/me` to hydrate user.
- **Subscription/Payment**: User selects plan on Payment page → `/api/payment/process` or `/api/payment/change-plan` → status `pending` until admin approval via `/api/admin/users/:id/subscription`.
- **Access Control**: Frontend blocks watch if `subscriptionStatus !== active`; roles: `user` vs `admin`.
- **Preferences**: My List & Likes via `/api/preferences/*`.
- **Watch History**: Progress/continue watching via `/api/watch-history/*`.
- **Admin**: Stats, users, pending payments via `/api/admin/*`.
- **Content Source**: TMDB API (`/discover`, `/movie/:id`, `/tv/:id`, search) via RTK Query slice `tmdbApi`.

## 5. Logical View
- **Frontend modules**:
  - `pages/` (Landing, Home, Genre, Watch, MyList, Account, Payment, Admin*)
  - `components/` (Hero, Video sliders, DetailModal, PlayButton, Watch player controls, layout components)
  - `store/` Redux slices: `auth`, `userPreferences`, `discover`, `genre`, RTK Query APIs (`tmdbApi`, `authApi`, `paymentApi`, `adminApi`, `notificationApi`).
  - `providers/` DetailModal, Portal.
  - `layouts/` MainLayout, AdminLayout.
- **Backend modules**:
  - `routes/`: `authRoutes`, `preferencesRoutes`, `watchHistoryRoutes`, `paymentRoutes`, `adminRoutes`, `notificationRoutes`.
  - `controllers/`: auth, preferences, watchHistory, payment, admin, notification.
  - `models/`: User, UserPreferences, WatchHistory, Notification.
  - `middleware/`: `auth` (JWT protect), `admin` (role guard).

## 6. Data View
- **User**: name, email, password (bcrypt), role, subscriptionPlan, subscriptionStatus (`pending|active|inactive|cancelled`), paymentStatus, dates (paymentDate, activatedAt, expiresAt), avatar.
- **UserPreferences**: userId (unique), `myList[]` (movieId, mediaType, addedAt), `likedMovies[]`.
- **WatchHistory**: userId, movieId, mediaType, progress, duration, completed, lastWatchedAt (compound unique on user+movie+mediaType).
- **Notification**: userId, type (`payment_approved`, etc.), title, message, metadata, read flag.
- **External**: TMDB movie/TV schema consumed at runtime (not persisted).

## 7. Deployment View
- **Frontend**: Vite static build (dist); can deploy to Vercel/Netlify/S3+CDN.
- **Backend**: Node process (PORT, HOST `0.0.0.0`), connects to MongoDB (local or Atlas).
- **Env Vars**:
  - Frontend: `VITE_APP_API_ENDPOINT_URL`, `VITE_APP_TMDB_V3_API_KEY`, `VITE_APP_BACKEND_API_URL`.
  - Backend: `MONGODB_URI`, `JWT_SECRET`, `PORT`, `NODE_ENV`.

## 8. Quality Attributes
- **Security**: JWT auth, role-based admin routes, password hashing (bcrypt), CORS configured.
- **Availability/Resilience**: Mongo connection with fail-fast; health check `/api/health`.
- **Performance**: Lazy routes, RTK Query caching, code-splitting; potential re-render optimizations (noted in README).
- **Scalability**: Stateless backend (JWT), MongoDB for persistence; frontend static hosting.
- **Maintainability**: Typed with TypeScript, modular slices/controllers, documented flows (AUTHENTICATION_FLOW.md, DATABASE_DESIGN.md).
- **UX**: Loading states, error states, infinite scroll, video player controls, subscription gating.

## 9. Constraints & Assumptions
- TMDB API key required for content; no proprietary video assets—trailers/YouTube links used.
- Playback of full movies is not provided; watch page plays trailer/fallback stream.
- Subscription payment flow is simplified (QR/confirm + admin approval), not integrated with a payment gateway.
- Session stored in `sessionStorage` (per-tab).

## 10. Risks & Gaps
- Payment gateway not integrated; manual approval flow.
- Admin movie management currently relies on TMDB search; no persisted custom catalog without further backend work.
- Some performance concerns with context/re-renders (noted in README).
- Notification delivery channel not implemented beyond API.

## 11. Future Work
- Integrate real payment provider (Stripe/PayPal), webhooks to auto-activate subscriptions.
- Persist curated movie catalog for admin (CRUD) instead of TMDB-only runtime fetch.
- Add tests (unit/e2e), monitoring, and CI.
- Improve accessibility and performance profiling.
- Add email/push notifications for subscription status changes.

## 12. References
- `README.md`, `AUTHENTICATION_FLOW.md`, `FLOW_SUMMARY.md`
- `DATABASE_DESIGN.md`, `API_DOCUMENTATION.md`
- Frontend entry: `src/main.tsx`, router `src/routes/index.tsx`
- Backend entry: `backend/src/server.js`

