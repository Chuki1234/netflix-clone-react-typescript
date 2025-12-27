# 📚 API Documentation

## Base URL
```
http://localhost:5001/api
```

## Authentication

Tất cả các endpoints (trừ `/api/auth/register` và `/api/auth/login`) đều yêu cầu authentication.

**Header:**
```
Authorization: Bearer <token>
```

---

## Authentication Endpoints

### Register User
```http
POST /api/auth/register
Content-Type: application/json

{
  "name": "John Doe",
  "email": "john@example.com",
  "password": "password123"
}
```

**Response:**
```json
{
  "_id": "...",
  "name": "John Doe",
  "email": "john@example.com",
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

### Login User
```http
POST /api/auth/login
Content-Type: application/json

{
  "email": "john@example.com",
  "password": "password123"
}
```

**Response:**
```json
{
  "_id": "...",
  "name": "John Doe",
  "email": "john@example.com",
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

### Get Current User
```http
GET /api/auth/me
Authorization: Bearer <token>
```

**Response:**
```json
{
  "_id": "...",
  "name": "John Doe",
  "email": "john@example.com"
}
```

---

## Preferences Endpoints

### Get User Preferences
```http
GET /api/preferences
Authorization: Bearer <token>
```

**Response:**
```json
{
  "myList": [
    {
      "movieId": 550,
      "mediaType": "movie",
      "addedAt": "2024-01-15T10:00:00.000Z"
    }
  ],
  "likedMovies": [
    {
      "movieId": 550,
      "mediaType": "movie",
      "likedAt": "2024-01-15T10:05:00.000Z"
    }
  ]
}
```

### Toggle My List
```http
POST /api/preferences/my-list
Authorization: Bearer <token>
Content-Type: application/json

{
  "movieId": 550,
  "mediaType": "movie"
}
```

**Response (Added):**
```json
{
  "message": "Added to My List",
  "inMyList": true,
  "myList": [...]
}
```

**Response (Removed):**
```json
{
  "message": "Removed from My List",
  "inMyList": false,
  "myList": [...]
}
```

### Toggle Like
```http
POST /api/preferences/likes
Authorization: Bearer <token>
Content-Type: application/json

{
  "movieId": 550,
  "mediaType": "movie"
}
```

**Response (Liked):**
```json
{
  "message": "Liked",
  "isLiked": true,
  "likedMovies": [...]
}
```

**Response (Unliked):**
```json
{
  "message": "Unliked",
  "isLiked": false,
  "likedMovies": [...]
}
```

### Check if in My List
```http
GET /api/preferences/my-list/:movieId/:mediaType
Authorization: Bearer <token>
```

**Example:**
```
GET /api/preferences/my-list/550/movie
```

**Response:**
```json
{
  "inMyList": true
}
```

### Check if Liked
```http
GET /api/preferences/likes/:movieId/:mediaType
Authorization: Bearer <token>
```

**Example:**
```
GET /api/preferences/likes/550/movie
```

**Response:**
```json
{
  "isLiked": true
}
```

---

## Watch History Endpoints

### Get Watch History
```http
GET /api/watch-history
Authorization: Bearer <token>
```

**Response:**
```json
[
  {
    "_id": "...",
    "userId": "...",
    "movieId": 550,
    "mediaType": "movie",
    "progress": 3600,
    "duration": 7200,
    "lastWatchedAt": "2024-01-15T10:30:00.000Z",
    "completed": false,
    "createdAt": "2024-01-15T10:00:00.000Z",
    "updatedAt": "2024-01-15T10:30:00.000Z"
  }
]
```

### Get Continue Watching
```http
GET /api/watch-history/continue
Authorization: Bearer <token>
```

**Response:** (Similar to watch history, but only movies with progress > 0 and not completed)

### Get Movie Watch History
```http
GET /api/watch-history/:movieId/:mediaType
Authorization: Bearer <token>
```

**Example:**
```
GET /api/watch-history/550/movie
```

**Response:**
```json
{
  "_id": "...",
  "userId": "...",
  "movieId": 550,
  "mediaType": "movie",
  "progress": 3600,
  "duration": 7200,
  "lastWatchedAt": "2024-01-15T10:30:00.000Z",
  "completed": false
}
```

### Save/Update Watch History
```http
POST /api/watch-history
Authorization: Bearer <token>
Content-Type: application/json

{
  "movieId": 550,
  "mediaType": "movie",
  "progress": 3600,
  "duration": 7200,
  "completed": false
}
```

**Response:**
```json
{
  "_id": "...",
  "userId": "...",
  "movieId": 550,
  "mediaType": "movie",
  "progress": 3600,
  "duration": 7200,
  "lastWatchedAt": "2024-01-15T10:30:00.000Z",
  "completed": false
}
```

### Mark as Completed
```http
PUT /api/watch-history/:movieId/:mediaType/complete
Authorization: Bearer <token>
```

**Example:**
```
PUT /api/watch-history/550/movie/complete
```

**Response:**
```json
{
  "_id": "...",
  "movieId": 550,
  "mediaType": "movie",
  "completed": true,
  ...
}
```

### Delete Watch History
```http
DELETE /api/watch-history/:movieId/:mediaType
Authorization: Bearer <token>
```

**Example:**
```
DELETE /api/watch-history/550/movie
```

**Response:**
```json
{
  "message": "Watch history deleted"
}
```

---

## Error Responses

### 400 Bad Request
```json
{
  "message": "Please provide movieId and mediaType"
}
```

### 401 Unauthorized
```json
{
  "message": "Not authorized, no token"
}
```

### 500 Server Error
```json
{
  "message": "Server error"
}
```

---

## Testing với cURL

### Register
```bash
curl -X POST http://localhost:5001/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"name":"Test User","email":"test@example.com","password":"password123"}'
```

### Login
```bash
curl -X POST http://localhost:5001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"password123"}'
```

### Toggle My List (với token)
```bash
curl -X POST http://localhost:5001/api/preferences/my-list \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN_HERE" \
  -d '{"movieId":550,"mediaType":"movie"}'
```

### Save Watch History
```bash
curl -X POST http://localhost:5001/api/watch-history \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN_HERE" \
  -d '{"movieId":550,"mediaType":"movie","progress":3600,"duration":7200}'
```

