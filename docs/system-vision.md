# System Vision - Netflix Clone

## 1. Problem Statement
Người dùng cần một trải nghiệm xem nội dung tương tự Netflix: khám phá phim/TV, xem trailer, quản lý danh sách yêu thích, và theo dõi tiến độ xem. Chủ sản phẩm cần quy trình đăng ký/đăng nhập, quản lý gói subscription, và có dashboard admin để duyệt thanh toán/subscription.

## 2. High-Level Goals
- Cung cấp trải nghiệm duyệt và xem trailer phim/TV mượt mà.
- Đăng ký/đăng nhập an toàn (JWT), phân quyền user/admin.
- Quản lý subscription: chọn gói, thanh toán (giản lược), chờ duyệt admin, kích hoạt quyền xem.
- Đồng bộ sở thích (My List/Likes) và lịch sử xem (Continue Watching).
- Admin dashboard: xem user, duyệt subscription/pending payments, thống kê.

## 3. Users & Needs
- **Viewer/User**: Duyệt nội dung, xem trailer, quản lý My List/Likes, tiếp tục xem, thanh toán gói và chờ duyệt.
- **Admin**: Đăng nhập admin, xem user, duyệt/reject/cancel subscription, xem pending payments, xem thống kê.

## 4. Scope (In / Out)
**In scope**
- Web app (React/TS) với TMDB API để lấy dữ liệu phim/TV.
- Auth & session JWT, role-based (user/admin).
- Payment flow giản lược + trạng thái pending → admin duyệt.
- Preferences (My List/Likes), watch history.
- Admin dashboard (stats, users, pending payments).

**Out of scope / Future**
- Streaming full nội dung (hiện chỉ trailer/fallback HLS demo).
- Tích hợp cổng thanh toán thật (Stripe/PayPal) và webhook tự động.
- Push/email notifications sản xuất.
- Native mobile app.

## 5. Success Criteria
- Người dùng đăng ký/đăng nhập thành công và chọn gói; trạng thái `pending` được chặn xem cho tới khi admin duyệt.
- Người dùng xem trailer/chi tiết, thêm vào My List/Likes, lưu lịch sử xem.
- Admin duyệt subscription và thay đổi trạng thái; pending payments hiển thị đúng.
- UI phản hồi: loading/error states, chặn xem khi chưa active.

## 6. High-Level Solution
- **Frontend**: React 18 + TS, Vite, MUI, Redux Toolkit + RTK Query, React Router v6 (lazy). Session lưu trong `sessionStorage`. Gọi TMDB và backend API.
- **Backend**: Node.js/Express (ESM), JWT auth, Mongoose + MongoDB. Routes cho auth, preferences, watch-history, payment, admin, notifications.
- **Integrations**: TMDB v3 API cho metadata; payment flow hiện là QR/confirm + admin approve.
- **Deployment**: Frontend static build; backend Node service; MongoDB (local/Atlas). Env vars cho API keys/URIs/JWT.

## 7. Key Flows
- **Auth**: register/login → JWT → `/auth/me`.
- **Subscription**: chọn plan → process payment → status `pending` → admin approve → `active` → được xem.
- **Watch Access Control**: chặn xem khi subscriptionStatus ≠ `active`.
- **Preferences**: My List/Likes CRUD qua backend.
- **Watch History**: lưu progress/duration, continue watching.
- **Admin**: login admin → stats, users, pending payments, approve/reject subscription.

## 8. Risks & Mitigations
- **Payment chưa thật**: Hiện thủ công; cần tích hợp gateway + webhook (future).
- **TMDB dependency**: Cần API key; thêm trạng thái lỗi khi thiếu key.
- **Hiệu năng render**: Đã dùng lazy routes, RTK Query cache; có thể tối ưu thêm context re-renders.
- **Bảo mật**: JWT + bcrypt, role guard; cần cấu hình CORS và bảo vệ secret đúng cách.

## 9. Future Enhancements
- Tích hợp thanh toán thực và tự động kích hoạt subscription.
- Notification qua email/push khi duyệt thanh toán.
- Test coverage (unit/e2e), monitoring, CI.
- Bộ lọc/tìm kiếm nâng cao, bộ sưu tập phim do admin quản lý (persisted catalog).


