# Hướng dẫn tạo Admin User

## Cách 1: Sử dụng script (Khuyến nghị)

Chạy script để tạo admin user:

```bash
cd backend
npm run create-admin
```

Hoặc với thông tin tùy chỉnh:

```bash
npm run create-admin email@example.com password123 "Admin Name"
```

**Mặc định:**
- Email: `admin@netflix.com`
- Password: `admin123`
- Name: `Admin User`

## Cách 2: Update user hiện có thành admin

Nếu bạn đã có user và muốn update thành admin, chạy:

```bash
npm run create-admin your-email@example.com your-password "Your Name"
```

Script sẽ tự động update user đó thành admin.

## Sau khi tạo admin

1. Truy cập: `http://localhost:5173/admin/login`
2. Đăng nhập với email và password vừa tạo
3. Bạn sẽ được chuyển đến Admin Dashboard

## Admin Dashboard Features

- Xem thống kê tổng quan (Total Users, Active Subscriptions, Pending Payments, Revenue)
- Tìm kiếm và lọc users
- Approve/Reject payments
- Cancel subscriptions
- Xem danh sách users với pagination

