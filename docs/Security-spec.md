# Security Specification - Netflix Clone

## Goals
- Bảo vệ tài khoản và dữ liệu người dùng.
- Chỉ user đã đăng nhập mới truy cập API (trừ register/login/check-email).
- Phân quyền user/admin cho các route nhạy cảm.
- Bảo vệ token, mật khẩu, và thông tin thanh toán (giản lược).

## Authentication & Authorization
- **JWT**: cấp token khi login/register; lưu trong `sessionStorage` (per-tab).
- **Headers**: `Authorization: Bearer <token>` cho tất cả API (trừ public).
- **Middleware**:
  - `protect`: xác thực JWT, attach `req.user`.
  - `admin`: kiểm tra `req.user.role === 'admin'`.
- **Expiration**: JWT nên có TTL ngắn (khuyến nghị <24h) + refresh flow (chưa triển khai).

## Passwords
- Hash với **bcrypt** (salt 10).
- Không trả về `password` (select: false).
- Đảm bảo email unique (index).

## Subscription & Access Control
- User chỉ được xem (watch page) khi `subscriptionStatus === "active"`.
- Payment/plan change đặt `subscriptionStatus` về `pending`; admin approve để kích hoạt.
- Role guard cho admin routes: `/api/admin/*`.

## Input Validation & Data Handling
- Kiểm tra đủ trường (name/email/password) khi register; check-email endpoint để pre-fill.
- API preferences/watch-history: yêu cầu movieId + mediaType hợp lệ.
- Sanitize body/params; giới hạn kích thước body (khuyến nghị `express.json({ limit })` nếu cần).

## CORS & Transport
- **CORS**: bật với whitelist origin (khuyến nghị cấu hình thay vì `*` trong production).
- **HTTPS**: bắt buộc trên môi trường production.

## Secrets & Config
- `.env` (backend): `MONGODB_URI`, `JWT_SECRET`, `PORT`, `NODE_ENV`.
- `.env` (frontend): `VITE_APP_TMDB_V3_API_KEY`, `VITE_APP_BACKEND_API_URL`, `VITE_APP_API_ENDPOINT_URL`.
- Không commit secrets; dùng env vars / secret manager.

## Logging & Monitoring (khuyến nghị)
- Log auth failures, admin actions (approve/reject subscription), payment status changes.
- Healthcheck: `/api/health`.

## Rate Limiting & Abuse (khuyến nghị)
- Thêm rate limit cho auth routes (`/api/auth/login`, `/api/auth/register`, `/api/auth/check-email`).
- Thêm throttling cho search TMDB (frontend) để tránh lạm dụng API key.

## Data Protection
- Mongo indices: unique email; compound index watch history `{ userId, movieId, mediaType }`.
- Xóa/ẩn thông tin nhạy cảm trong response (password, internal metadata).

## Notifications
- Notification model chứa type/title/message/metadata, có `isRead`; không chứa thông tin nhạy cảm.

## Testing & Hardening (khuyến nghị)
- Unit test middleware `protect`, `admin`.
- Pen-test auth flows (JWT tampering, role escalation).
- Validate TMDB API key existence (đã có cảnh báo frontend nếu thiếu key).

