# 🔧 Cách Update Connection String vào .env

## Connection string bạn có:

```
mongodb+srv://ntloc124_db_user:<db_password>@cluster0.l3yy8at.mongodb.net/?appName=Cluster0
```

## Bước 1: Thay `<db_password>` bằng password thực tế

Bạn cần thay `<db_password>` bằng password bạn đã tạo khi tạo database user trong MongoDB Atlas.

**Ví dụ:**
- Nếu password là: `MyPassword123`
- Thì connection string sẽ là:
  ```
  mongodb+srv://ntloc124_db_user:MyPassword123@cluster0.l3yy8at.mongodb.net/?appName=Cluster0
  ```

⚠️ **Lưu ý:** Nếu password có ký tự đặc biệt, cần URL encode (xem bên dưới)

## Bước 2: Thêm database name

Thêm `/netflix-clone` vào trước dấu `?` để chỉ định database name:

**Trước:**
```
mongodb+srv://ntloc124_db_user:MyPassword123@cluster0.l3yy8at.mongodb.net/?appName=Cluster0
```

**Sau (thêm `/netflix-clone` trước `?`):**
```
mongodb+srv://ntloc124_db_user:MyPassword123@cluster0.l3yy8at.mongodb.net/netflix-clone?appName=Cluster0
```

## Bước 3: Update file backend/.env

Mở file `backend/.env` và tìm dòng `MONGODB_URI`, thay thế bằng connection string đã chỉnh sửa.

**File .env sẽ trông như thế này:**
```env
PORT=5001
MONGODB_URI=mongodb+srv://ntloc124_db_user:MyPassword123@cluster0.l3yy8at.mongodb.net/netflix-clone?appName=Cluster0
JWT_SECRET=97d2d644fddebaaad39cc1f14b1cbd6061c9e470a5eb5b233f644814c324cacc4bbfd6781001fa41b7626c20829dddedc28e1ada30ef52df5231d27226beb33c
JWT_EXPIRE=7d
NODE_ENV=development
```

## URL Encode Password (nếu cần)

Nếu password có ký tự đặc biệt, cần URL encode:

| Ký tự | URL Encoded |
|-------|-------------|
| `@` | `%40` |
| `!` | `%21` |
| `#` | `%23` |
| `$` | `%24` |
| `%` | `%25` |
| `&` | `%26` |

**Ví dụ:**
- Password: `MyPass!@#`
- URL Encoded: `MyPass%21%40%23`
- Connection string: `mongodb+srv://ntloc124_db_user:MyPass%21%40%23@cluster0.l3yy8at.mongodb.net/netflix-clone?appName=Cluster0`

## Bước 4: Test Connection

Sau khi update, test lại:

```bash
cd backend
npm run test-connection
```

Nếu thấy "MongoDB Connected successfully!" → ✅ Thành công!

