# Learning Management System (LMS)

[![NestJS](https://img.shields.io/badge/NestJS-E0234E?style=for-the-badge&logo=nestjs&logoColor=white)](https://nestjs.com/)
[![TypeScript](https://img.shields.io/badge/TypeScript-3178C6?style=for-the-badge&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Vue 3](https://img.shields.io/badge/Vue.js-35495E?style=for-the-badge&logo=vue.js&logoColor=4FC08D)](https://vuejs.org/)
[![Vite](https://img.shields.io/badge/Vite-B73BFE?style=for-the-badge&logo=vite&logoColor=FFD62E)](https://vitejs.dev/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-316192?style=for-the-badge&logo=postgresql&logoColor=white)](https://www.postgresql.org/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

Hệ thống quản lý học tập (Learning Management System - LMS) backend được xây dựng bằng **NestJS** theo kiến trúc **monolithic truyền thống** (layer-based), nhằm hỗ trợ quản lý giảng dạy và học tập trong môi trường đại học.

Dự án được thực hiện trong khuôn khổ đồ án tốt nghiệp / nghiên cứu kiến trúc phần mềm, tập trung vào việc triển khai các chức năng cốt lõi của một LMS hiện đại.

## Mục tiêu dự án

Xây dựng backend hoàn chỉnh cho hệ thống LMS với các chức năng chính:
  - Quản lý người dùng (học viên, giảng viên, trưởng bộ môn, quản trị viên)
  - Quản lý khóa học (tạo, cập nhật, phê duyệt, thay đổi trạng thái)
  - Ghi danh và theo dõi tiến độ học tập
  - Quản lý bài giảng và tài liệu học tập
  - Tạo bài kiểm tra, chấm điểm và xử lý phúc khảo
- Triển khai **backend monolithic truyền thống** để so sánh với các kiến trúc khác trong tương lai
- Frontend hiện đại, responsive, sử dụng Vue 3 Composition API + Pinia + Vue Router
- Đảm bảo tính bảo mật (JWT authentication, RBAC), tính toàn vẹn dữ liệu (foreign key constraints) và dễ bảo trì.

## Công nghệ sử dụng

### Backend
- Framework: NestJS (TypeScript)
- Database: PostgreSQL + TypeORM
- Auth: JWT + Passport + bcrypt
- Validation: class-validator & class-transformer
- API Docs: Swagger
- Cấu trúc: Traditional Monolithic (layer-based)

### Frontend
- Framework: Vue 3 (Composition API)
- Build tool: Vite
- State management: Pinia
- Routing: Vue Router
- HTTP client: Axios
- UI Library: (tùy chọn) Element Plus / Vuetify / Tailwind CSS + Shadcn-vue
- TypeScript: full support

**Tất cả được đóng gói và triển khai bằng**: Docker

## Cấu trúc thư mục (Traditional Monolithic)

```
lms-fullstack/
├── backend/                  # NestJS backend
│   ├── src/
│   │   ├── common/
│   │   ├── config/
│   │   ├── controllers/
│   │   ├── dtos/
│   │   ├── entities/
│   │   ├── services/
│   │   ├── app.module.ts
│   │   └── main.ts
│   ├── .env
│   ├── package.json
│   └── tsconfig.json
├── frontend/                 # Vue 3 + Vite frontend
│   ├── src/
│   │   ├── assets/
│   │   ├── components/
│   │   ├── views/
│   │   ├── stores/           # Pinia stores
│   │   ├── router/
│   │   ├── services/         # api services (axios)
│   │   ├── App.vue
│   │   └── main.ts
│   ├── public/
│   ├── index.html
│   ├── vite.config.ts
│   ├── package.json
│   └── tsconfig.json
├── docker-compose.yml        # (tùy chọn) PostgreSQL + backend + frontend
└── README.md
```


## Các tính năng chính
- **Xác thực người dùng**:
  - Đăng ký / Đăng nhập (email + mật khẩu)
  - Khôi phục mật khẩu (OTP/email)
  - Phân quyền RBAC (STUDENT, INSTRUCTOR, REVIEWER, ADMIN)
- **Quản lý người dùng**:
  - Xem / Cập nhật hồ sơ cá nhân
  - Quản trị viên tạo/gán vai trò/vô hiệu hóa tài khoản
- **Quản lý khóa học**:
  - Giảng viên tạo khóa học (Draft → Pending → Approved/Published/Closed)
  - Trưởng bộ môn / Quản trị viên phê duyệt hoặc từ chối
  - Học viên xem danh sách và chi tiết khóa học
- **Ghi danh & Tiến độ học tập**:
  - Học viên ghi danh khóa học
  - Theo dõi % tiến độ hoàn thành
- **Quản lý nội dung**:
  - Tạo bài giảng + tải lên tài liệu (video, pdf, hình ảnh...)
- **Đánh giá & Chấm điểm**:
  - Giảng viên tạo bài kiểm tra (trắc nghiệm/tự luận)
  - Học viên nộp bài → chấm điểm → yêu cầu phúc khảo

## Cài đặt & Chạy dự án

### Yêu cầu

- Node.js ≥ 18
- PostgreSQL ≥ 14
- npm

### Các bước cài đặt

1. Clone repository
2. Cài đặt dependencies trong backend

```bash
npm install
# hoặc
yarn install
```

3. Tạo file `.env` từ `.env.example`

```bash
cp .env.example .env
```

Chỉnh sửa các biến môi trường (database, jwt secret...).

4. Khởi động database (dùng Docker container)

```bash
docker-compose up -d
```

5. Chạy migration / sync schema (dev mode)

Hiện tại dùng `synchronize: true` → chỉ cần chạy app.

6. Khởi động server

```bash
# Development mode
npm run start:dev

# Production build
npm run build
npm run start:prod
```

7. Truy cập Swagger docs

Mở trình duyệt: http://localhost:3000/api

## Các lệnh hữu ích

```bash
# Chạy test (nếu có)
npm run test

# Lint code
npm run lint

# Format code
npm run format
```

## Hướng phát triển tiếp theo

- Triển khai migration thực tế (TypeORM migrations)
- Thêm upload file (Multer + local/S3)
- Thêm refresh token + logout toàn thiết bị
- So sánh hiệu năng với modular monolith
- Tích hợp frontend (React/Vue/Angular)

## Tác giả

- **Tên**: [Tên của bạn - ví dụ: Nguyễn Văn Phương]
- **Mã sinh viên**: [MSSV]
- **Trường**: [Tên trường đại học]
- **Giảng viên hướng dẫn**: [Tên giảng viên]
- **Thời gian thực hiện**: Tháng 8/2025 – Tháng 5/2026
- **Email**: [email của bạn]

## Giấy phép

Dự án được phát hành dưới giấy phép [MIT License](LICENSE).

---

Cảm ơn bạn đã xem! Nếu bạn muốn đóng góp hoặc báo lỗi, hãy mở issue hoặc pull request nhé.

