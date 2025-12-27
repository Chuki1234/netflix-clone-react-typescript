# 📊 Database Design - Netflix Clone

## Tổng quan

Database được thiết kế với MongoDB, gồm các collections chính:

1. **users** - Thông tin người dùng
2. **userpreferences** - Preferences của user (My List, Likes)
3. **watchhistory** - Lịch sử xem phim
4. **reviews** (Optional) - Đánh giá phim

## Collections và Schema

### 1. Collection: `users`

**Mục đích:** Lưu thông tin người dùng, authentication

**Schema:**
```javascript
{
  _id: ObjectId,
  name: String (required),
  email: String (required, unique, lowercase),
  password: String (required, hashed),
  avatar: String (optional, URL),
  createdAt: Date,
  updatedAt: Date
}
```

**Indexes:**
- `email`: Unique index

---

### 2. Collection: `userpreferences`

**Mục đích:** Lưu My List và Likes của user

**Schema:**
```javascript
{
  _id: ObjectId,
  userId: ObjectId (ref: 'User', required, unique),
  myList: [
    {
      movieId: Number (required),
      mediaType: String (required, enum: ['movie', 'tv']),
      addedAt: Date
    }
  ],
  likedMovies: [
    {
      movieId: Number (required),
      mediaType: String (required, enum: ['movie', 'tv']),
      likedAt: Date
    }
  ],
  createdAt: Date,
  updatedAt: Date
}
```

**Indexes:**
- `userId`: Unique index
- `myList.movieId`: Index for faster queries
- `likedMovies.movieId`: Index for faster queries

---

### 3. Collection: `watchhistory`

**Mục đích:** Lưu lịch sử xem phim, tiếp tục xem

**Schema:**
```javascript
{
  _id: ObjectId,
  userId: ObjectId (ref: 'User', required),
  movieId: Number (required),
  mediaType: String (required, enum: ['movie', 'tv']),
  progress: Number (seconds watched),
  duration: Number (total duration in seconds),
  lastWatchedAt: Date,
  completed: Boolean (default: false),
  createdAt: Date,
  updatedAt: Date
}
```

**Indexes:**
- `userId`: Index
- `userId + movieId + mediaType`: Compound unique index
- `lastWatchedAt`: Index for sorting

---

### 4. Collection: `reviews` (Optional - cho tương lai)

**Mục đích:** Đánh giá và review phim

**Schema:**
```javascript
{
  _id: ObjectId,
  userId: ObjectId (ref: 'User', required),
  movieId: Number (required),
  mediaType: String (required, enum: ['movie', 'tv']),
  rating: Number (1-5),
  comment: String (optional),
  createdAt: Date,
  updatedAt: Date
}
```

**Indexes:**
- `userId + movieId + mediaType`: Compound unique index
- `movieId + mediaType`: Index for movie reviews

---

## Relationships

```
User (1) ──── (1) UserPreferences
User (1) ──── (N) WatchHistory
User (1) ──── (N) Reviews (optional)
```

## Queries thường dùng

### 1. Get user's my list
```javascript
UserPreferences.findOne({ userId }).populate('userId')
```

### 2. Get user's watch history (sorted by last watched)
```javascript
WatchHistory.find({ userId }).sort({ lastWatchedAt: -1 })
```

### 3. Get continue watching (progress > 0, not completed)
```javascript
WatchHistory.find({ 
  userId, 
  progress: { $gt: 0 }, 
  completed: false 
}).sort({ lastWatchedAt: -1 }).limit(20)
```

### 4. Check if movie is in my list
```javascript
UserPreferences.findOne({ 
  userId, 
  'myList.movieId': movieId, 
  'myList.mediaType': mediaType 
})
```

## Migration từ localStorage

Hiện tại frontend đang dùng localStorage cho:
- `netflix_liked_movies`
- `netflix_my_list`

Sau khi implement database, cần:
1. Tạo API endpoints để sync data
2. Migrate data từ localStorage lên database khi user login
3. Keep localStorage as cache/sync with database

