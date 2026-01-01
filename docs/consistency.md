# Consistency Plan - Netflix Clone

## Goals
Đảm bảo dữ liệu và trạng thái người dùng nhất quán giữa frontend, backend, và TMDB (external).

## Consistency Model
- **User-bound data** (auth, subscription, preferences, watch history): strong consistency qua Mongo + REST; mutations cập nhật ngay.
- **TMDB data**: read-through runtime; chấp nhận eventual consistency (dữ liệu TMDB không lưu).
- **Session**: JWT + user lưu trong `sessionStorage` (per-tab) → mỗi tab tách biệt; đồng bộ bằng re-fetch `auth/me` khi cần.

## Data Domains & Strategy
1) **Auth / Subscription**
   - Nguồn sự thật: `users` (Mongo).
   - JWT decode + `auth/me` để hydrate.
   - Subscription gating: frontend chặn xem nếu `subscriptionStatus !== "active"`.
   - Admin approve/update qua REST → client cần re-fetch (invalidate RTK Query) sau hành động.

2) **Preferences (My List / Likes)**
   - Nguồn sự thật: `userpreferences`.
   - Mutations (toggle) trả về trạng thái mới; RTK Query tags invalidates để sync.
   - Local cache (RTK) là tạm thời; không dùng localStorage để tránh sai lệch giữa tabs.

3) **Watch History**
   - Nguồn sự thật: `watchhistories`.
   - Upsert progress; compound unique (userId, movieId, mediaType) bảo vệ trùng lặp.
   - Continue Watching: sort by `lastWatchedAt`.

4) **TMDB Metadata**
   - Không lưu; fetch qua RTK Query, cache ngắn (frontend).
   - Chấp nhận sai lệch nhỏ theo thời gian.

5) **Notifications**
   - Nguồn sự thật: `notifications`.
   - Đọc/đánh dấu isRead qua REST; có thể cache ngắn và invalidate khi mutate.

## Conflict Handling
- Trường hợp hiếm: cùng user mở nhiều tab → sessionStorage tách biệt; mỗi tab có trạng thái riêng. Người dùng cần login lại ở tab khác nếu muốn đồng bộ.
- Mutations backend là nguồn sự thật; frontend luôn tin response từ server và invalidate cache liên quan.

## Freshness & Revalidation
- RTK Query dùng cache + re-fetch trên:
  - Navigate vào màn hình quan trọng (account, payment, admin).
  - Sau mutation (preferences, history, subscription update).
- TMDB calls: re-fetch khi đổi tham số; TTL ngắn nếu thêm caching backend.

## Error Handling & Retries
- Hiển thị trạng thái loading/error ở UI.
- Retry an toàn cho đọc (GET); tránh retry cho mutations trừ khi idempotent (e.g., upsert history).

## Backpressure & Rate Limits
- Thêm rate-limit cho auth endpoints (khuyến nghị).
- TMDB: debounce search; hạn chế spam call.

## Auditing
- Lưu log admin actions (approve/reject), subscription status changes, và watch-history saves (khuyến nghị).

