# Database Schema - Netflix Clone

## Overview
- **DB**: MongoDB (local or Atlas), Mongoose models.
- **Collections**: `users`, `userpreferences`, `watchhistories`, `notifications` (optional feature), (future: payment/subscription history).
- **Auth**: JWT; passwords hashed with bcrypt.

## Collections

### users
- `_id: ObjectId`
- `name: string` (required)
- `email: string` (required, unique, lowercase)
- `password: string` (hashed, select: false)
- `avatar: string | null`
- `role: "user" | "admin"` (default: user)
- `subscriptionPlan: "Mobile" | "Basic" | "Standard" | "Premium" | null`
- `subscriptionStatus: "pending" | "active" | "inactive" | "cancelled" | null`
- `paymentStatus: "pending" | "confirmed" | "failed" | null`
- `paymentDate: Date | null`
- `activatedAt: Date | null`
- `expiresAt: Date | null`
- `createdAt, updatedAt: Date`
- **Indexes**: unique on `email`.

### userpreferences
- `_id: ObjectId`
- `userId: ObjectId` (ref: users, unique)
- `myList: [{ movieId: number, mediaType: "movie" | "tv", addedAt: Date }]`
- `likedMovies: [{ movieId: number, mediaType: "movie" | "tv", likedAt: Date }]`
- `createdAt, updatedAt: Date`
- **Indexes**: unique on `userId`; secondary on `myList.movieId`, `likedMovies.movieId`.

### watchhistories
- `_id: ObjectId`
- `userId: ObjectId` (ref: users, required)
- `movieId: number` (required)
- `mediaType: "movie" | "tv"` (required)
- `progress: number` (seconds watched, default 0)
- `duration: number` (total seconds, default 0)
- `lastWatchedAt: Date` (default: now)
- `completed: boolean` (default: false)
- `createdAt, updatedAt: Date`
- **Indexes**:
  - Compound unique `{ userId, movieId, mediaType }`
  - `{ userId, lastWatchedAt: -1 }` for sorting.

### notifications (optional, used by admin actions)
- `_id: ObjectId`
- `userId: ObjectId` (ref: users)
- `type: string` (e.g., `payment_approved`, `movie_updated`)
- `title: string`
- `message: string`
- `metadata: object`
- `isRead: boolean` (default: false)
- `createdAt, updatedAt: Date`
- **Indexes**: `{ userId, isRead }`.

## Relationships
- `users (1) ── (1) userpreferences`
- `users (1) ── (N) watchhistories`
- `users (1) ── (N) notifications`
- Movies/TV data are fetched from TMDB at runtime; not persisted locally.

## Typical Queries
- Preferences:
  - Get by user: `UserPreferences.findOne({ userId })`
  - Toggle My List / Likes: update arrays with movieId + mediaType
- Watch history:
  - Continue watching: `find({ userId, progress: { $gt: 0 }, completed: false }).sort({ lastWatchedAt: -1 }).limit(n)`
  - Upsert progress: `updateOne({ userId, movieId, mediaType }, { $set: {...} }, { upsert: true })`
- Notifications:
  - Unread: `find({ userId, isRead: false })`

## Environment & Connection
- Env: `MONGODB_URI` (e.g., Atlas or local), set in `backend/.env`.
- Connection: `backend/src/config/database.js` with `mongoose.connect(process.env.MONGODB_URI)`.

## Future Extensions
- Payment/Subscription history collection (planId, amount, method, status, requestedAt/approvedAt).
- Index tuning for high-volume history/preferences.
- Soft-delete flags if needed for auditing.

