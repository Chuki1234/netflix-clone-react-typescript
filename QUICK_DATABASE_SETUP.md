# 🚀 Quick Setup MongoDB Database

## Cách nhanh nhất: MongoDB Atlas (5 phút)

1. **Đăng ký:** https://www.mongodb.com/cloud/atlas/register

2. **Tạo Cluster FREE:**
   - Click "Build a Database"
   - Chọn FREE (M0)
   - Chọn region (Singapore hoặc gần bạn)
   - Click "Create"

3. **Tạo User:**
   - Menu "Database Access" → "Add New Database User"
   - Username: `netflix-admin`
   - Password: Tạo password (lưu lại!)
   - Role: "Atlas admin"
   - Click "Add User"

4. **Allow IP:**
   - Menu "Network Access" → "Add IP Address"
   - Chọn "Allow Access from Anywhere" (0.0.0.0/0)
   - Click "Confirm"

5. **Lấy Connection String:**
   - Menu "Database" → "Connect" → "Connect your application"
   - Copy connection string
   - Thay `<password>` bằng password bạn đã tạo
   - Thêm `/netflix-clone` vào cuối (trước `?`)

   Ví dụ:
   ```
   mongodb+srv://netflix-admin:yourpassword@cluster0.xxxxx.mongodb.net/netflix-clone?retryWrites=true&w=majority
   ```

6. **Update `backend/.env`:**
   ```env
   MONGODB_URI=mongodb+srv://netflix-admin:yourpassword@cluster0.xxxxx.mongodb.net/netflix-clone?retryWrites=true&w=majority
   ```

7. **Chạy backend:**
   ```bash
   cd backend
   npm run dev
   ```

   Nếu thấy: `MongoDB Connected: ...` → ✅ **Thành công!**

## Database sẽ tự động được tạo

✅ Database `netflix-clone` - tự động tạo khi kết nối
✅ Collection `users` - tự động tạo khi có user đầu tiên

**Bạn KHÔNG cần tạo thủ công!**

## Test đăng ký user

```bash
curl -X POST http://localhost:5001/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"name":"Test User","email":"test@example.com","password":"password123"}'
```

Xem file `SETUP_DATABASE.md` để biết chi tiết đầy đủ.

