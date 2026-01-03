# Netflix Clone – Project Report (Chi tiết)

## 1) Kiến trúc & Công nghệ
- **Frontend stack**: Vite + React 18 + TypeScript; Redux Toolkit + RTK Query cho state/API; MUI (Material UI) cho UI; framer-motion (animation); video.js + plugin YouTube; react-slick (carousel). Điều hướng: `react-router-dom` v6 (lazy components, loaders cho một số trang).
- **Backend stack**: Node/Express, MongoDB (Mongoose), JWT auth. REST API chia theo domains: auth, payment, preferences, watch-history, admin, movies, notifications. Hai worker in-process: **Saga** (orchestration) và **Outbox** (event/notification dispatch).
- **Triển khai**: Dockerfile cho frontend (build & serve). Backend chạy node (có scripts dev/start). Tài liệu setup nhanh (Quick Setup, AUTHENTICATION_FLOW, FLOW_SUMMARY) và bộ tài liệu kiến trúc/phi chức năng (SAD, ADR, caching, security, consistency, runbook). ERD/C4 trong `deliverables/`.

## 2) Luồng Nghiệp Vụ Chính
- **New user**: Landing nhập email → check email → Register → bắt buộc chọn gói → Checkout (QR giả lập) → subscription `pending` → admin duyệt → `active`.
- **Login**: Nếu subscription `pending` hiển thị cảnh báo/giới hạn; `active` thì vào browse/watch.
- **Đổi gói**: Account → Payment → chọn gói → Checkout → trạng thái `pending` → admin duyệt → `active`.
- **Admin**: Đăng nhập admin → dashboard/stats → duyệt pending payments, approve/reject/cancel subscription, quản lý phim (CRUD) → phát thông báo “New movie available”.

## 3) Backend Chi Tiết
- **Routes chính**:
  - `/api/auth`: check-email, register, login, me (JWT protect).
  - `/api/payment`: process (tạo saga), change-plan, status (JWT protect).
  - `/api/preferences`: My List/Likes toggle & check (JWT protect).
  - `/api/watch-history`: lưu/đọc progress, continue watching, complete, delete (JWT protect).
  - `/api/admin`: login admin, stats, list users, get user detail, update subscription, list pending payments (JWT + admin).
  - `/api/admin/movies`: CRUD catalog (JWT + admin).
  - `/api/movies`: public list newest (không cần auth).
  - `/api/notifications`: list/unread/mark read/delete (JWT protect).
- **Models**:
  - `User`: role (user/admin), subscriptionPlan/status/paymentStatus, paymentDate/activatedAt/expiresAt, avatar, timestamps.
  - `Movie`: catalog nội bộ (tmdbId, title, overview, poster/backdrop, mediaType, genres, voteAverage/voteCount, runtime).
  - `Saga`: các bước orchestration (PENDING/RUNNING/COMPLETED/FAILED), context (userId, planId…), retry/backoff.
  - `Outbox`: event queue (PENDING/SENT/FAILED, retries, availableAt) cho event `movie_added`.
  - `Notification`: type (payment_approved, payment_pending, movie_updated, user_registered), title, message, metadata, read.
  - `UserPreferences`: myList, likedMovies (movieId + mediaType), unique per user.
  - `WatchHistory`: progress/duration/lastWatchedAt/completed, unique index per user+movieId+mediaType.
- **Payment & Saga**:
  - `processPayment`: tạo Saga `subscription_activation` với steps `mark_pending` (set plan/pending, paymentDate, expiresAt+30d) và `notify_admins` (gửi notification payment_pending cho admins). Trả về 202 + sagaId.
  - `changePlan`: yêu cầu subscription đang active, nếu trùng gói thì báo lỗi; set plan mới, status/pamentStatus pending, paymentDate, expiresAt+30d. Trả về message pending.
  - `getPaymentStatus`: trả subscriptionPlan/status/paymentStatus, paymentDate/activatedAt/expiresAt.
- **Admin logic**:
  - Approve: set subscriptionStatus=active, paymentStatus=confirmed, activatedAt=now, nếu hết hạn thì cộng 30 ngày; tạo notification payment_approved cho user.
  - Reject: subscriptionStatus=inactive, paymentStatus=failed.
  - Cancel: subscriptionStatus=cancelled.
  - Update thủ công: action=update cho phép set subscriptionStatus/paymentStatus tùy ý.
  - Stats: tổng user, active subscriptions, pending payments, revenue (tính theo plan → số cố định VND), phân bố plan.
  - Pending payments: list user có paymentStatus=pending & subscriptionStatus=pending.
- **Movies & Outbox**:
  - Admin create/update movie: nếu là phim mới → ghi Outbox event `movie_added`, worker Outbox gửi notification “New movie available” cho toàn bộ user (non-admin).
  - Outbox worker: poll theo interval, retry/backoff, mark SENT/FAILED.
- **Middleware**:
  - `protect`: decode JWT, load user, reject nếu không có/không hợp lệ.
  - `admin`: kiểm tra role admin, trả 403 nếu không.

## 4) Frontend Chi Tiết
- **Routing**:
  - Public: Landing (`/`), Login (`/login`), Register (`/register`).
  - MainLayout: Browse/Home (`/browse`), News, Movies, GenreExplore (`/genre/:genreId`), Watch (`/watch/:mediaType/:id`), MyList, Account, Payment, PaymentCheckout.
  - AdminLayout: Admin Dashboard (`/admin/dashboard`), Accounts, Movies.
- **State & API**:
  - RTK Query backend: `authApi`, `paymentApi`, `adminApi`, `notificationApi`, `watchHistoryApi`, `publicMovies`.
  - RTK Query TMDB: `tmdbApi` + `configuration`, `discover` (get genres, discover by genre/custom, videos with append).
  - `authSlice`: lưu token/user vào sessionStorage hoặc localStorage (đã hỗ trợ “Ghi nhớ tôi”). Ưu tiên đọc session → local để khởi tạo state; logout xóa cả hai. `setCredentials` nhận `rememberMe`.
  - `AuthRefresher`: nếu có token → fetch `/auth/me`, cập nhật user + preferences; 401 → logout.
  - `userPreferences`: đọc user từ session/local; lưu My List/Likes theo user vào localStorage (phân biệt userId).
  - API slices lấy token từ session hoặc local (enable remember me).
- **Bảo vệ & flow**:
  - `useSubscriptionCheck`: trả isActive/isPending/hasNoSubscription; `WatchPage` chặn xem nếu không active (redirect browse).
  - Payment flow: `PaymentPage` chọn gói; `PaymentCheckoutPage` gọi `processPayment` (new/no plan) hoặc `changePlan` (đổi gói). Hiển thị QR giả lập, toast pending, auto chuyển Account sau 3s.
- **Watch experience**:
  - `WatchPage`: video.js, trailer YouTube nếu có, fallback HLS sample; overlay controls (play/pause, volume slider, time display, seekbar, fullscreen button placeholder, settings placeholder); auto-hide UI sau 2-3s; on unload/visibilitychange lưu progress; resume từ watch history (seek về progress gần nhất).
- **Nội dung & danh mục**:
  - Home: dùng TMDB để lấy genres + discover; dùng public movies từ backend, đánh dấu `isNew` nếu trong 7 ngày. `HeroSection`, các slider cho Common titles + genres.
  - My List/Likes: toggle local và server (preferences endpoints).
  - Account: hiển thị plan/status/next billing/price; nút “Manage Membership” tới Payment.
- **Admin UI**:
  - Dashboard: cards số liệu (total users, active subs, pending payments, revenue compact), phân bố plan, summary status.
  - Accounts: bảng user, filter search/subscriptionStatus/paymentStatus, pagination; menu actions: approve/reject pending, cancel active.
  - Movies: search TMDB (lazy), import vào catalog, edit/delete; hiển thị poster qua cấu hình TMDB.

## 5) Môi Trường & Chạy Thử (Dev)
- **Frontend .env**:
  - `VITE_APP_TMDB_V3_API_KEY` (bắt buộc, để gọi TMDB)
  - `VITE_APP_API_ENDPOINT_URL=https://api.themoviedb.org/3`
  - `VITE_APP_BACKEND_API_URL=http://localhost:5000/api`
- **Backend .env**:
  - `PORT=5000`
  - `MONGODB_URI=mongodb://localhost:27017/netflix-clone` (hoặc Atlas URI)
  - `JWT_SECRET=<generate>`
  - `JWT_EXPIRE=7d`
  - `OUTBOX_INTERVAL_MS=5000`, `SAGA_INTERVAL_MS=5000` (tùy chọn)
- **Chạy**:
  - Backend: `cd backend && npm install && npm run dev` (cần MongoDB; script generate-jwt-secret).
  - Frontend: `npm install && npm run dev` (Vite trên 5173).
- **Build**: `npm run build` (frontend).
- **Docker frontend**:
  ```
  docker build --build-arg TMDB_V3_API_KEY=<key> -t netflix-clone .
  docker run --rm -d -p 80:80 netflix-clone
  ```
  (Backend cần chạy riêng; nên dùng docker-compose nếu muốn gom FE/BE/Mongo.)
- **Tạo admin**:
  - `cd backend && npm run create-admin` (script prompt email/password) hoặc set role=admin trực tiếp trong DB.

## 6) Rủi Ro / Hạn Chế Hiện Tại
- **Thanh toán**: giả lập QR, chưa tích hợp gateway thực; trạng thái pending phụ thuộc admin duyệt thủ công.
- **Bảo mật**: chưa có refresh token/rotation, chưa dùng HttpOnly cookie; thiếu rate limiting, CSRF defense, password policy mạnh, audit log, MFA admin. JWT trong localStorage (khi remember me) tăng risk nếu XSS.
- **Sẵn sàng**: Saga/Outbox in-process, không có queue/broker; process down có thể mất job; không có worker tách biệt.
- **Nội dung video**: trailer YouTube hoặc sample HLS; chưa có DRM/CDN cho stream thực.
- **Test/QA**: thiếu unit/integration/e2e; chưa có CI pipeline hiển thị.
- **Hiệu năng**: chưa SSR; caching hạn chế (TMDB calls); localStorage/sessionStorage phân tán theo tab; chưa tối ưu bundle chi tiết.

## 7) Cải Tiến Đề Xuất (Ưu tiên)
1) **Bảo mật & Phiên**: Thêm refresh token (rotation, revoke), lưu refresh trong HttpOnly cookie; access token ngắn hạn. Thêm rate limit, helmet/CSP, audit log admin actions, password rules/strength meter, 2FA cho admin.
2) **Thanh toán thực**: Tích hợp gateway (Stripe/PayPal/VNPay/MoMo) + webhook → cập nhật trạng thái tự động, giảm phụ thuộc admin, lưu transaction id/history.
3) **Hàng đợi/bền vững**: Đưa Saga/Outbox lên message queue/job queue (RabbitMQ/Kafka/BullMQ) để tránh mất job khi process chết; thêm retry policy, dead-letter.
4) **Streaming**: Chuẩn hóa nguồn video (CDN), HLS/DASH với DRM nếu cần, hoặc giữ YouTube nhưng có fallback tốt hơn và chuyển chất lượng.
5) **Test & QA**: Unit (slices/hooks/utils), integration (API), e2e (Cypress/Playwright) cho: đăng ký + chọn gói, login pending vs active, đổi gói, admin approve, watch resume progress.
6) **Ops**: docker-compose FE/BE/Mongo, health/readiness, structured logging, alerting; env templates rõ ràng.
7) **UX**: Thông báo pending rõ trên Home/Account, trạng thái thanh toán; validate TMDB key và hiển thị hướng dẫn; optimize image loading (lazy, responsive sizes).

## 8) Thay Đổi Gần Nhất (Remember Me)
- `authSlice`: lưu token/user vào localStorage khi tick “Ghi nhớ tôi”; đọc ưu tiên session → local; logout xóa cả hai.
- `LoginPage`: truyền `rememberMe` vào `setCredentials`.
- Các API slices (api/authApi/paymentApi/adminApi/notificationApi) lấy token từ session hoặc local.
- `userPreferences`: đọc user từ session/local để giữ My List/Likes cho phiên đã nhớ.
