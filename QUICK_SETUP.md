# Hướng dẫn nhanh: Setup JWT Secret và MongoDB

## 1. Tạo JWT Secret Key

Chạy lệnh này để tạo JWT secret ngẫu nhiên:

```bash
node -e "const crypto = require('crypto'); console.log(crypto.randomBytes(64).toString('hex'))"
```

Hoặc vào terminal và chạy:
```bash
cd backend
node generate-jwt-secret.js
```

**Copy kết quả và lưu lại** - bạn sẽ cần nó cho file .env

## 2. Setup MongoDB

### Chọn một trong hai cách:

#### **Cách A: MongoDB Local (Đơn giản cho development)**

1. Cài MongoDB:
   ```bash
   # macOS
   brew install mongodb-community
   brew services start mongodb-community
   ```

2. Connection string:
   ```
   mongodb://localhost:27017/netflix-clone
   ```

#### **Cách B: MongoDB Atlas (Miễn phí, cloud)**

1. Đăng ký tại: https://www.mongodb.com/cloud/atlas/register
2. Tạo cluster FREE
3. Tạo database user (username + password)
4. Whitelist IP: Click "Allow Access from Anywhere" (0.0.0.0/0)
5. Lấy connection string: Database → Connect → Connect your application
   - Sẽ có dạng: `mongodb+srv://username:password@cluster0.xxxxx.mongodb.net/netflix-clone`

## 3. Tạo file .env

Trong thư mục `backend/`, tạo file `.env`:

```bash
cd backend
cp .env.example .env
# Hoặc tạo file mới
```

Mở file `.env` và điền:

```env
PORT=5000
MONGODB_URI=mongodb://localhost:27017/netflix-clone
# HOẶC nếu dùng Atlas:
# MONGODB_URI=mongodb+srv://username:password@cluster0.xxxxx.mongodb.net/netflix-clone

JWT_SECRET=<paste-jwt-secret-đã-tạo-ở-bước-1>
JWT_EXPIRE=7d
NODE_ENV=development
```

## 4. Chạy Backend

```bash
cd backend
npm install
npm run dev
```

Nếu thấy: `MongoDB Connected: ...` → ✅ Thành công!

## 5. Test

Mở trình duyệt hoặc Postman, gọi:
```
POST http://localhost:5000/api/auth/register
Body (JSON):
{
  "name": "Test User",
  "email": "test@example.com",
  "password": "password123"
}
```

Xem chi tiết đầy đủ trong file `SETUP_MONGODB.md`

