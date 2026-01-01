# Runbook - Netflix Clone

## 1. Environment & Setup
- **Frontend**: Vite + React/TS
  - `.env`:
    - `VITE_APP_API_ENDPOINT_URL=https://api.themoviedb.org/3`
    - `VITE_APP_TMDB_V3_API_KEY=<your_tmdb_key>`
    - `VITE_APP_BACKEND_API_URL=http://localhost:5000/api` (hoặc endpoint deploy)
  - Start dev: `npm install` → `npm run dev` (port 5173)
- **Backend**: Node/Express + MongoDB
  - `.env`:
    - `MONGODB_URI=mongodb://localhost:27017/netflix-clone` (hoặc Atlas URI)
    - `JWT_SECRET=<strong_secret>`
    - `PORT=5000`
    - `NODE_ENV=development`
  - Start dev: `cd backend && npm install && npm run dev`
  - Health check: `GET /api/health`
- **Database**: MongoDB local hoặc Atlas; xem `QUICK_DATABASE_SETUP.md`.

## 2. Common Operations
- **Generate JWT secret**: `cd backend && npm run generate-secret`
- **Test DB connection**: `cd backend && npm run test-connection`
- **Create admin user**: `cd backend && node backend/create-admin.js` (xem `CREATE_ADMIN.md`)
- **Frontend build**: `npm run build` (tsc + vite build)
- **Backend start prod**: `cd backend && npm start`

## 3. Debugging Checklist
- **Frontend**:
  - Missing TMDB key → HomePage hiển thị cảnh báo.
  - Network errors → kiểm tra `VITE_APP_BACKEND_API_URL`.
  - Auth issues → check `sessionStorage` token, re-login.
  - Chặn xem phim → kiểm tra `subscriptionStatus === "active"`.
- **Backend**:
  - JWT errors → header `Authorization: Bearer <token>`, `JWT_SECRET`.
  - Mongo errors → `MONGODB_URI`, mongod/Atlas network rules.
  - CORS → đảm bảo origin được allow (prod: whitelist).
  - Admin routes 401/403 → cần token admin + middleware `admin`.
- **TMDB**:
  - 401/403 → kiểm tra `VITE_APP_TMDB_V3_API_KEY`.
  - Rate limit → debounce search, tránh spam.

## 4. Subscription/Payment Flow
- User register/login → chọn gói → payment (giản lược) → `subscriptionStatus` = `pending`.
- Admin duyệt: `PUT /api/admin/users/:id/subscription` với action `approve` → set `active`/`confirmed`.
- Frontend chặn watch khi chưa `active`.

## 5. Preferences & Watch History
- Preferences routes: `/api/preferences/*` (myList, likes).
- Watch history: `/api/watch-history/*` (progress, continue watching, complete, delete).
- Lưu ý: các mutation invalidates cache; nếu thấy dữ liệu cũ → re-fetch hoặc hard reload.

## 6. Notifications
- Model `notifications`; types ví dụ `payment_approved`.
- API `/api/notifications/*` (xem controller/routes).
- Hiện không gửi email/push; chỉ lưu DB.

## 7. Admin
- Login: `/api/admin/login`
- Xem users: `/api/admin/users`
- Pending payments: `/api/admin/payments/pending`
- Approve/reject/cancel subscription: `/api/admin/users/:id/subscription`
- Stats: `/api/admin/stats`

## 8. Production Hardening (khuyến nghị)
- Bắt buộc HTTPS; cấu hình CORS whitelist.
- Rate-limit auth endpoints.
- Use env secrets via secret manager.
- Add monitoring/logging (health, errors, admin actions).
- Add backup/retention cho Mongo (Atlas backup).

## 9. Incident Playbook (ngắn)
- **Backend down**: check logs, restart process, verify `MONGODB_URI` & network; hit `/api/health`.
- **Auth failures**: verify `JWT_SECRET`, token format, clock skew.
- **TMDB failures**: check API key, network; degrade gracefully (hiển thị lỗi UI).
- **Payment stuck pending**: admin manually approve/reject via API/dashboard.
- **Data inconsistency**: re-fetch on frontend; check Mongo records; rerun mutation if idempotent.

