# Dự án Airbnb Capstone

<div align="center">
  <img src="https://upload.wikimedia.org/wikipedia/commons/6/69/Airbnb_Logo_B%C3%A9lo.svg" alt="Airbnb Logo" width="180"/>
  
  <p align="center">
    <strong>Nền tảng cho thuê nhà nghỉ dưỡng cấp doanh nghiệp được xây dựng với công nghệ hiện đại</strong>
  </p>
  
  <p align="center">
    <img src="https://img.shields.io/badge/NestJS-E0234E?style=flat&logo=nestjs&logoColor=white" alt="NestJS"/>
    <img src="https://img.shields.io/badge/TypeScript-007ACC?style=flat&logo=typescript&logoColor=white" alt="TypeScript"/>
    <img src="https://img.shields.io/badge/MySQL-4479A1?style=flat&logo=mysql&logoColor=white" alt="MySQL"/>
    <img src="https://img.shields.io/badge/Prisma-2D3748?style=flat&logo=prisma&logoColor=white" alt="Prisma"/>
    <img src="https://img.shields.io/badge/JWT-000000?style=flat&logo=jsonwebtokens&logoColor=white" alt="JWT"/>
  </p>
</div>

---

## Tổng quan

Hệ thống cho thuê nhà nghỉ dưỡng đầy đủ tính năng hỗ trợ ba vai trò người dùng: **Quản trị viên**, **Chủ nhà**, và **Khách thuê**. Được xây dựng với kiến trúc có thể mở rộng và thực hành phát triển hiện đại.

### Tính năng chính

🔐 **Xác thực & Phân quyền** - JWT với kiểm soát truy cập dựa trên vai trò  
🏠 **Quản lý bất động sản** - Thao tác CRUD hoàn chỉnh với tải lên hình ảnh  
📍 **Quản lý vị trí** - Dữ liệu địa lý với khả năng tìm kiếm  
📅 **Hệ thống đặt phòng** - Kiểm tra tình trạng thời gian thực với ngăn chặn xung đột  
💬 **Hệ thống đánh giá** - Chức năng xếp hạng và bình luận  
👤 **Hồ sơ người dùng** - Quản lý hồ sơ với tải lên avatar  
🔍 **Tìm kiếm nâng cao** - Lọc, phân trang và sắp xếp  
🗂️ **Xóa mềm** - Bảo tồn dữ liệu với tùy chọn khôi phục

---

## Công nghệ sử dụng

| Danh mục | Công nghệ |
|----------|-----------|
| **Backend** | NestJS, TypeScript, Node.js |
| **Cơ sở dữ liệu** | MySQL, Prisma ORM |
| **Xác thực** | JWT, Passport.js, bcrypt |
| **Lưu trữ file** | Cloudinary |
| **Validation** | class-validator, class-transformer |
| **Tài liệu** | Swagger/OpenAPI |
| **Phát triển** | ESLint, Prettier, Nodemon |

---

## Bắt đầu nhanh

### Yêu cầu hệ thống
- Node.js 18+
- MySQL 8.0+
- npm hoặc yarn

### Cài đặt

```bash
# Clone repository
git clone <repository-url>
cd airbnb_capstone

# Cài đặt dependencies
npm install

# Thiết lập môi trường
cp .env.example .env
# Cấu hình file .env của bạn

# Thiết lập cơ sở dữ liệu
npx prisma generate
npx prisma migrate dev
npx prisma db seed

# Chạy server phát triển
npm run start:dev
```

### Cấu hình môi trường

```env
DATABASE_URL="mysql://username:password@localhost:3306/airbnb_db"

ACCESS_TOKEN_SECRET="your-access-token-secret"
ACCESS_TOKEN_EXPIRES="15m"
REFRESH_TOKEN_SECRET="your-refresh-token-secret"
REFRESH_TOKEN_EXPIRES="7d"

CLOUDINARY_CLOUD_NAME="your-cloud-name"
CLOUDINARY_API_KEY="your-api-key"
CLOUDINARY_API_SECRET="your-api-secret"

PORT=3000
```

---

## Tài liệu API

### Tài liệu API tương tác
Truy cập `/api-docs` sau khi khởi động server để xem tài liệu Swagger đầy đủ.

### Endpoints chính

#### Xác thực
```http
POST   /api/auth/login              # Đăng nhập
POST   /api/auth/register           # Đăng ký tài khoản
POST   /api/auth/refresh-token      # Làm mới token
```

#### Quản lý người dùng
```http
GET    /api/users                   # Danh sách người dùng (Admin)
GET    /api/users/pagination-search # Tìm kiếm người dùng (Admin)
PATCH  /api/users/me                # Cập nhật hồ sơ
POST   /api/users/upload-avatar     # Tải lên avatar
```

#### Quản lý bất động sản
```http
GET    /api/rooms                   # Danh sách bất động sản
GET    /api/rooms/pagination-search # Tìm kiếm bất động sản
POST   /api/rooms                   # Tạo bất động sản (Chủ nhà)
PUT    /api/rooms/:id               # Cập nhật bất động sản (Chủ nhà/Admin)
DELETE /api/rooms/:id               # Xóa bất động sản (Chủ nhà/Admin)
```

#### Hệ thống đặt phòng
```http
GET    /api/book-room               # Danh sách đặt phòng
POST   /api/book-room               # Tạo đặt phòng
PUT    /api/book-room/:id           # Cập nhật đặt phòng
DELETE /api/book-room/:id           # Hủy đặt phòng
POST   /api/book-room/confirm/:id   # Xác nhận đặt phòng (Chủ nhà)
```

#### Đánh giá & Bình luận
```http
GET    /api/comment/by-room/:roomId # Lấy đánh giá phòng
POST   /api/comment                # Tạo đánh giá
PUT    /api/comment/:id             # Cập nhật đánh giá
DELETE /api/comment/:id             # Xóa đánh giá
```

### Định dạng phản hồi

```json
{
  "statusCode": 200,
  "message": "Thành công",
  "data": { /* dữ liệu phản hồi */ },
  "pagination": { /* thông tin phân trang (nếu có) */ },
  "timestamp": "2024-01-01T00:00:00.000Z"
}
```

---

## Kiến trúc

### Cấu trúc dự án
```
src/
├── common/              # Tiện ích & decorators chung
├── modules/
│   ├── auth/           # Xác thực & phân quyền
│   ├── user/           # Quản lý người dùng
│   ├── room/           # Quản lý bất động sản
│   ├── location/       # Dịch vụ vị trí
│   ├── book-room/      # Hệ thống đặt phòng
│   ├── comment/        # Hệ thống đánh giá
│   └── prisma/         # Dịch vụ cơ sở dữ liệu
└── main.ts             # Điểm vào ứng dụng
```

### Vai trò người dùng & Quyền hạn

| Vai trò | ID | Quyền hạn |
|---------|----|-----------| 
| **Admin** | 1 | Truy cập toàn hệ thống, quản lý người dùng |
| **User** | 2 | Đặt phòng, đánh giá, quản lý hồ sơ |
| **Host** | 3 | Quản lý bất động sản, xác nhận đặt phòng |

---

## Kiểm thử

### Tài khoản test
```json
{
  "admin": { "email": "admin@airbnb.com", "password": "admin123" },
  "host": { "email": "host@airbnb.com", "password": "host123" },
  "user": { "email": "user@airbnb.com", "password": "user123" }
}
```

### Postman Collection
Import `postman/Airbnb_Capstone.postman_collection.json` để kiểm thử API toàn diện.

---

## Scripts phát triển

```bash
npm run start:dev      # Server phát triển với hot reload
npm run build          # Build production
npm run start:prod     # Server production
npm run lint           # Kiểm tra code
npm run format         # Định dạng code
```

---

## Đóng góp

1. Fork repository
2. Tạo feature branch (`git checkout -b feature/TinhNangMoi`)
3. Commit thay đổi (`git commit -m 'Thêm TinhNangMoi'`)
4. Push lên branch (`git push origin feature/TinhNangMoi`)
5. Mở Pull Request

---

## Giấy phép

Dự án này được cấp phép theo Giấy phép MIT - xem file [LICENSE](LICENSE) để biết chi tiết.

---

<div align="center">
  <p><strong>Được xây dựng với ❤️ sử dụng NestJS</strong></p>
  <p>
    <a href="mailto:tuananh@gmail.com">Liên hệ Developer</a> •
    <a href="https://github.com/tuananhhdev">GitHub Profile</a>
  </p>
</div>