# Events & Domain Actions - Netflix Clone

## Overview
Hệ thống chủ yếu là synchronous REST, nhưng các hành động chính có thể coi như “event” để audit/notify:
- Auth & user lifecycle
- Subscription/payment lifecycle
- Preferences (My List/Likes)
- Watch history (progress/complete)
- Notifications
- Admin approvals

## Event Catalogue (conceptual)

### Auth
- `user.registered`  
  Payload: `{ userId, email, name, role }`
- `user.logged_in`  
  Payload: `{ userId, email }`

### Subscription / Payment
- `subscription.payment_submitted` (status: pending)  
  Payload: `{ userId, planId, paymentStatus: "pending", subscriptionStatus: "pending" }`
- `subscription.approved` (admin)  
  Payload: `{ userId, planId, subscriptionStatus: "active", paymentStatus: "confirmed", activatedAt, expiresAt }`
- `subscription.rejected`  
  Payload: `{ userId, planId, subscriptionStatus: "inactive", paymentStatus: "failed" }`
- `subscription.cancelled`  
  Payload: `{ userId, planId, subscriptionStatus: "cancelled" }`
- `subscription.changed_plan`  
  Payload: `{ userId, oldPlan, newPlan, status: "pending" }`

### Preferences
- `preferences.mylist_toggled`  
  Payload: `{ userId, movieId, mediaType, inMyList }`
- `preferences.like_toggled`  
  Payload: `{ userId, movieId, mediaType, isLiked }`

### Watch History
- `watch.progress_saved`  
  Payload: `{ userId, movieId, mediaType, progress, duration, completed }`
- `watch.completed`  
  Payload: `{ userId, movieId, mediaType }`
- `watch.deleted`  
  Payload: `{ userId, movieId, mediaType }`

### Notifications
- `notification.created`  
  Payload: `{ userId, type, title, message, metadata }`
- `notification.read`  
  Payload: `{ userId, notificationId }`

### Admin
- `admin.login`  
  Payload: `{ adminId, email }`
- `admin.subscription_action` (approve/reject/cancel/update)  
  Payload: `{ adminId, userId, action, subscriptionStatus, paymentStatus }`

## Current Implementation Notes
- Hiện tại các event trên được thực hiện qua REST; chưa có message queue.  
- Notifications được ghi vào collection `notifications` (type/title/message/metadata/isRead).
- Admin approval tạo notification “payment_approved” cho user.
- Watch history/preferences mutations là synchronous Mongo updates.

## If Introducing Messaging (future)
- Khuyến nghị dùng một topic/bus (Kafka/RabbitMQ) cho các event trên, đặc biệt:
  - `subscription.*` để kích hoạt email/push và cập nhật analytics.
  - `watch.progress_saved` cho recommendation/analytics.
  - `notification.created` để đẩy real-time.
- Mẫu payload giữ nguyên như trên; cần thêm `eventId`, `timestamp`, `source`.

