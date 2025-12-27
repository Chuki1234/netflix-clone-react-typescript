# Hướng dẫn Setup MongoDB Database

## Database sẽ tự động được tạo

Khi bạn chạy backend server lần đầu và kết nối thành công, MongoDB sẽ tự động:
- ✅ Tạo database `netflix-clone` (theo tên trong connection string)
- ✅ Tạo collection `users` khi có user đầu tiên được đăng ký

Bạn **KHÔNG CẦN** tạo database thủ công!

## Bước 1: Chọn phương án MongoDB

### Option A: MongoDB Atlas (Cloud - Khuyến nghị, MIỄN PHÍ)

1. **Đăng ký tài khoản:**
   - Truy cập: https://www.mongodb.com/cloud/atlas/register
   - Đăng ký với email (hoặc Google/GitHub)
   - Chọn FREE tier

2. **Tạo Cluster:**
   - Click "Build a Database"
   - Chọn **FREE** (M0 Sandbox)
   - Chọn Cloud Provider và Region (chọn gần bạn nhất, ví dụ: AWS, ap-southeast-1 - Singapore)
   - Click "Create"

3. **Tạo Database User:**
   - Vào menu "Database Access" (bên trái)
   - Click "Add New Database User"
   - Chọn "Password" authentication
   - Username: `netflix-admin` (hoặc tên bạn muốn)
   - Password: Tạo password mạnh (ví dụ: `Netflix123!@#`)
   - **Lưu lại username và password!**
   - Database User Privileges: Chọn "Atlas admin"
   - Click "Add User"

4. **Setup Network Access:**
   - Vào menu "Network Access" (bên trái)
   - Click "Add IP Address"
   - Chọn "Allow Access from Anywhere" (0.0.0.0/0)
     - ⚠️ Lưu ý: Cho development OK, nhưng production nên whitelist IP cụ thể
   - Click "Confirm"

5. **Lấy Connection String:**
   - Vào menu "Database" (bên trái)
   - Click "Connect" trên cluster của bạn
   - Chọn "Connect your application"
   - Copy connection string, ví dụ:
     ```
     mongodb+srv://netflix-admin:<password>@cluster0.xxxxx.mongodb.net/?retryWrites=true&w=majority
     ```
   - **Thay `<password>`** bằng password bạn đã tạo ở bước 3
   - **Thêm database name** vào cuối: `/netflix-clone`
   - Kết quả:
     ```
     mongodb+srv://netflix-admin:Netflix123!@#@cluster0.xxxxx.mongodb.net/netflix-clone?retryWrites=true&w=majority
     ```

### Option B: MongoDB Local

1. **Cài MongoDB:**
   ```bash
   # macOS với Homebrew
   brew tap mongodb/brew
   brew install mongodb-community
   ```

2. **Khởi động MongoDB:**
   ```bash
   brew services start mongodb-community
   ```

3. **Connection String:**
   ```
   mongodb://localhost:27017/netflix-clone
   ```

## Bước 2: Update file .env

Mở file `backend/.env` và cập nhật `MONGODB_URI`:

**Nếu dùng MongoDB Atlas:**
```env
PORT=5001
MONGODB_URI=mongodb+srv://netflix-admin:Netflix123!@#@cluster0.xxxxx.mongodb.net/netflix-clone?retryWrites=true&w=majority
JWT_SECRET=97d2d644fddebaaad39cc1f14b1cbd6061c9e470a5eb5b233f644814c324cacc4bbfd6781001fa41b7626c20829dddedc28e1ada30ef52df5231d27226beb33c
JWT_EXPIRE=7d
NODE_ENV=development
```

**Nếu dùng MongoDB Local:**
```env
PORT=5001
MONGODB_URI=mongodb://localhost:27017/netflix-clone
JWT_SECRET=97d2d644fddebaaad39cc1f14b1cbd6061c9e470a5eb5b233f644814c324cacc4bbfd6781001fa41b7626c20829dddedc28e1ada30ef52df5231d27226beb33c
JWT_EXPIRE=7d
NODE_ENV=development
```

⚠️ **Lưu ý:** 
- Thay `cluster0.xxxxx` bằng cluster name của bạn từ MongoDB Atlas
- Thay password bằng password thực tế của bạn
- Nếu password có ký tự đặc biệt, cần URL encode (ví dụ: `!` → `%21`, `@` → `%40`)

## Bước 3: Chạy Backend và Test

1. **Chạy backend:**
   ```bash
   cd backend
   npm run dev
   ```

2. **Kiểm tra kết nối:**
   - Nếu thấy: `MongoDB Connected: cluster0.xxxxx.mongodb.net` → ✅ Thành công!
   - Nếu thấy error → Xem phần Troubleshooting

3. **Test đăng ký user:**
   ```bash
   curl -X POST http://localhost:5001/api/auth/register \
     -H "Content-Type: application/json" \
     -d '{
       "name": "Test User",
       "email": "test@example.com",
       "password": "password123"
     }'
   ```
   
   Response sẽ có:
   ```json
   {
     "_id": "...",
     "name": "Test User",
     "email": "test@example.com",
     "token": "..."
   }
   ```

4. **Kiểm tra database:**
   - Vào MongoDB Atlas → Database → Browse Collections
   - Bạn sẽ thấy database `netflix-clone` và collection `users`
   - Collection `users` sẽ chứa user vừa đăng ký

## Cấu trúc Database

### Database: `netflix-clone`

### Collection: `users`

Mỗi document trong collection `users` có cấu trúc:

```json
{
  "_id": ObjectId("..."),
  "name": "Test User",
  "email": "test@example.com",
  "password": "$2a$10$...", // Đã được hash bằng bcrypt
  "createdAt": ISODate("2024-01-01T00:00:00.000Z"),
  "updatedAt": ISODate("2024-01-01T00:00:00.000Z")
}
```

**Lưu ý:** Password được hash tự động trước khi lưu vào database (an toàn).

## Troubleshooting

### Lỗi "Authentication failed"
- Kiểm tra username và password trong connection string đúng chưa
- Đảm bảo database user có quyền "Atlas admin"

### Lỗi "IP not whitelisted"
- Vào Network Access và thêm IP của bạn
- Hoặc chọn "Allow Access from Anywhere" (0.0.0.0/0)

### Lỗi "connection timeout"
- Kiểm tra internet connection
- Kiểm tra firewall không block port MongoDB

### Lỗi "password contains illegal characters"
- URL encode password nếu có ký tự đặc biệt
- Hoặc tạo password không có ký tự đặc biệt

## Bước tiếp theo

Sau khi database setup thành công:
1. ✅ User có thể đăng ký tài khoản
2. ✅ User có thể đăng nhập
3. ✅ Password được hash an toàn
4. ✅ JWT token được tạo và trả về cho frontend
5. ✅ Frontend có thể lưu token và sử dụng cho các request tiếp theo

