# Caching Plan - Netflix Clone

## Goals
- Giảm latency khi duyệt nội dung TMDB.
- Tránh gọi lặp TMDB/Backend không cần thiết.
- Giữ UI phản hồi nhanh, dữ liệu đồng bộ đủ mức cần thiết.

## Frontend Caching
- **RTK Query** (tmdbApi, authApi, paymentApi, adminApi, notificationApi):
  - Mặc định memoize & cache responses.
  - `keepUnusedDataFor`: dùng mặc định (có thể tăng cho TMDB queries).
  - `refetchOnMountOrArgChange`: giữ giá trị false/`'always'` tùy màn.
- **Session storage**:
  - Auth token + user trong `sessionStorage` (per tab).
  - Không dùng localStorage để tránh cross-tab bleed.
- **Component-level**:
  - DetailModal, Video sliders sử dụng dữ liệu TMDB đã cache.
  - Pagination (withPagination) chỉ load tiếp trang khi cần.

## Backend Caching (chưa triển khai, đề xuất)
- **In-memory / Redis (khuyến nghị)**:
  - Cache TMDB responses phổ biến: config, genres, popular lists.
  - TTL ngắn (vài phút) để giảm hit TMDB.
  - Key: `tmdb:{endpoint}:{args}`.
- **HTTP cache headers**:
  - Cho TMDB proxy (nếu làm gateway): `Cache-Control: public, max-age=300`.
  - Cho static assets (frontend build) nên đặt `max-age` lớn + `immutable` (thường do hosting/CDN).

## CDN / Static
- Frontend build (Vite `dist/`) phục vụ qua CDN hoặc hosting tĩnh -> leverage browser cache + immutable assets (hash).

## Data Freshness Strategy
- TMDB nội dung không cần real-time; TTL ngắn (5-15 phút) đủ.
- User data (auth, preferences, history): không cache dài; rely on RTK Query + revalidation khi mutate.
- Admin stats/pending payments: có thể cache vài chục giây nếu cần giảm tải, nhưng ưu tiên dữ liệu mới.

## Invalidations
- TMDB cache: TTL-based; clear on param change.
- User-bound data: RTK Query invalidates on mutation (preferences, watch-history, payment, admin update).

## Performance Notes
- Lazy routes + code-splitting giảm bundle tải ban đầu.
- Tránh over-fetch: reuse cached RTK Query selectors; sử dụng `skip` khi thiếu arg.
- Nếu thêm Redis: cần Docker/ENV `REDIS_URL`, wrap fetch TMDB với cache-get/set.

## What’s Out of Scope
- Không cache nội dung video; hiện chỉ trailer/YouTube hoặc sample HLS.
- Không lưu offline; không cache sensitive user data ngoài sessionStorage.

