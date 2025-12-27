# 🚀 Hướng dẫn Setup MongoDB Atlas (Chi tiết từng bước)

## Bước 1: Đăng ký tài khoản MongoDB Atlas

1. Truy cập: https://www.mongodb.com/cloud/atlas/register
2. Click "Try Free" hoặc "Sign Up"
3. Đăng ký bằng:
   - Email và password, HOẶC
   - Google account, HOẶC  
   - GitHub account
4. Xác nhận email (nếu dùng email)

## Bước 2: Tạo Cluster (FREE)

1. Sau khi đăng nhập, bạn sẽ thấy trang "Deploy a cloud database"
2. Click "Build a Database"
3. Chọn **FREE** (M0 Sandbox) - Miễn phí mãi mãi
4. Chọn Cloud Provider:
   - **AWS** (khuyến nghị) hoặc Azure, Google Cloud
5. Chọn Region:
   - Chọn region gần bạn nhất (ví dụ: `ap-southeast-1` - Singapore, hoặc `us-east-1`)
6. Đặt tên cluster (tùy chọn, hoặc giữ nguyên `Cluster0`)
7. Click **"Create"**
8. Đợi cluster được tạo (khoảng 3-5 phút)

## Bước 3: Tạo Database User

1. Sau khi cluster được tạo, sẽ có popup "Create Database User"
2. Nếu không có popup, vào menu bên trái → "Database Access"
3. Click "Add New Database User"
4. Chọn Authentication Method: **"Password"**
5. Điền thông tin:
   - **Username**: `netflix-admin` (hoặc tên bạn muốn)
   - **Password**: Click "Autogenerate Secure Password" HOẶC tạo password mạnh
     - Ví dụ: `Netflix2024!@#`
     - ⚠️ **LƯU LẠI PASSWORD NÀY!** Bạn sẽ cần nó để update .env
6. Database User Privileges: Chọn **"Atlas admin"**
7. Click **"Add User"**

## Bước 4: Setup Network Access (Whitelist IP)

1. Sẽ có popup "Add IP Address"
2. Nếu không có, vào menu bên trái → "Network Access"
3. Click "Add IP Address"
4. Chọn **"Allow Access from Anywhere"** (0.0.0.0/0)
   - ⚠️ Lưu ý: Cho development OK, production nên whitelist IP cụ thể
5. Click "Confirm"

## Bước 5: Lấy Connection String

1. Vào menu bên trái → "Database"
2. Click nút **"Connect"** trên cluster của bạn
3. Chọn **"Connect your application"**
4. Driver: **Node.js**, Version: **5.5 or later** (hoặc mới nhất)
5. Bạn sẽ thấy connection string, ví dụ:
   ```
   mongodb+srv://netflix-admin:<password>@cluster0.xxxxx.mongodb.net/?retryWrites=true&w=majority
   ```
6. **Copy connection string này**

## Bước 6: Tạo Connection String đúng format

Connection string bạn vừa copy cần được chỉnh sửa:

**Cách 1: Thay thế trong string**
- Thay `<password>` bằng password bạn đã tạo ở Bước 3
- Thêm `/netflix-clone` vào trước `?` để chỉ định database name

**Ví dụ:**
```
mongodb+srv://netflix-admin:Netflix2024!@#@cluster0.xxxxx.mongodb.net/netflix-clone?retryWrites=true&w=majority
```

**Cách 2: Nếu password có ký tự đặc biệt, cần URL encode:**
- `@` → `%40`
- `!` → `%21`
- `#` → `%23`
- `$` → `%24`
- `%` → `%25`

**Ví dụ nếu password là `Netflix2024!@#`:**
```
mongodb+srv://netflix-admin:Netflix2024%21%40%23@cluster0.xxxxx.mongodb.net/netflix-clone?retryWrites=true&w=majority
```

## Bước 7: Update file .env

1. Mở file `backend/.env`
2. Thay dòng `MONGODB_URI` bằng connection string bạn vừa tạo

**Ví dụ:**
```env
PORT=5001
MONGODB_URI=mongodb+srv://netflix-admin:Netflix2024!@#@cluster0.xxxxx.mongodb.net/netflix-clone?retryWrites=true&w=majority
JWT_SECRET=97d2d644fddebaaad39cc1f14b1cbd6061c9e470a5eb5b233f644814c324cacc4bbfd6781001fa41b7626c20829dddedc28e1ada30ef52df5231d27226beb33c
JWT_EXPIRE=7d
NODE_ENV=development
```

⚠️ **Lưu ý:**
- Thay `cluster0.xxxxx` bằng cluster name thực tế của bạn
- Thay password bằng password bạn đã tạo
- Nếu password có ký tự đặc biệt, có thể cần URL encode

## Bước 8: Test Connection

1. Chạy backend:
   ```bash
   cd backend
   npm run dev
   ```

2. Kiểm tra log:
   - ✅ Nếu thấy: `MongoDB Connected: cluster0.xxxxx.mongodb.net` → **Thành công!**
   - ❌ Nếu thấy error → Xem phần Troubleshooting

3. Test đăng ký user:
   ```bash
   curl -X POST http://localhost:5001/api/auth/register \
     -H "Content-Type: application/json" \
     -d '{
       "name": "Test User",
       "email": "test@example.com",
       "password": "password123"
     }'
   ```

4. Kiểm tra database trên Atlas:
   - Vào MongoDB Atlas → Database → Browse Collections
   - Bạn sẽ thấy database `netflix-clone` và collection `users`
   - Collection `users` sẽ có user vừa đăng ký

## Troubleshooting

### ❌ Error: "Authentication failed"
- Kiểm tra username và password trong connection string đúng chưa
- Đảm bảo database user có role "Atlas admin"

### ❌ Error: "IP not whitelisted"
- Vào Network Access và kiểm tra đã thêm 0.0.0.0/0 chưa
- Có thể cần đợi vài phút để thay đổi có hiệu lực

### ❌ Error: "connection timeout"
- Kiểm tra internet connection
- Kiểm tra firewall không block MongoDB

### ❌ Error: "password contains illegal characters"
- URL encode các ký tự đặc biệt trong password
- Hoặc tạo password mới không có ký tự đặc biệt

### ❌ Error: "ENOTFOUND"
- Kiểm tra connection string có đúng format không
- Kiểm tra cluster name đúng chưa

## ✅ Hoàn thành!

Sau khi setup xong, bạn có thể:
- ✅ Đăng ký user mới → Lưu vào database
- ✅ Đăng nhập → Verify từ database
- ✅ Password được hash an toàn
- ✅ JWT token được tạo và trả về

