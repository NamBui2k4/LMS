# LMS EJS Frontend

Giao diện frontend cho hệ thống **Learning Management System (LMS)** — xây dựng bằng **EJS + Express.js** với dark theme chuẩn GitHub.

## Cài đặt & Chạy

```bash
npm install
npm start
# Hoặc dùng nodemon (hot-reload):
npm run dev
```

Mở trình duyệt: **http://localhost:3000**

---

## Cấu trúc thư mục

```
lms-ejs/
├── server.js               # Express entry point + all routes
├── package.json
├── public/
│   ├── css/style.css       # Global styles (dark theme)
│   ├── js/main.js          # Interactive JS (modals, tabs, countdown...)
│   └── images/             # Đặt logo.png, Lecturer.png, StudentGraduation.png vào đây
└── views/
    ├── login.ejs            # /login — role selection page
    ├── login-role.ejs       # /login/:roleType — student/staff login
    ├── partials/
    │   ├── icons.ejs        # SVG icon helper
    │   ├── admin-topbar.ejs
    │   ├── admin-sidebar.ejs
    │   ├── student-topbar.ejs
    │   ├── student-sidebar.ejs
    │   ├── staff-topbar.ejs
    │   └── staff-sidebar.ejs
    ├── admin/
    │   ├── login.ejs        # /admin
    │   ├── dashboard.ejs    # /admin/dashboard
    │   ├── users.ejs        # /admin/users
    │   └── settings.ejs     # /admin/settings
    ├── student/
    │   ├── profile.ejs      # /student/profile
    │   ├── attendance.ejs   # /student/attendance
    │   ├── course-list.ejs  # /student/course
    │   ├── course-detail.ejs # /student/course/:id
    │   ├── assignments.ejs  # /student/assignments
    │   └── assignment-detail.ejs # /student/assignments/:id
    └── staff/
        ├── index.ejs        # /staff (dashboard)
        ├── course-list.ejs  # /staff/course
        ├── course-detail.ejs # /staff/course/:id
        └── grading.ejs      # /staff/grading
```

---

## Tất cả Routes

| Route | Mô tả |
|-------|-------|
| `GET /` | Redirect về `/login` |
| `GET /login` | Trang chọn đối tượng (Giảng viên / Người học) |
| `GET /login/student` | Form đăng nhập Sinh viên |
| `GET /login/staff` | Form đăng nhập Giảng viên |
| `GET /admin` | Admin login **(localhost only)** |
| `GET /admin/dashboard` | Dashboard thống kê **(localhost only)** |
| `GET /admin/users` | Quản lý user **(localhost only)** |
| `GET /admin/settings` | Cài đặt hệ thống **(localhost only)** |
| `GET /student/profile` | Hồ sơ cá nhân |
| `GET /student/attendance` | Điểm danh |
| `GET /student/course` | Danh sách khóa học |
| `GET /student/course/:id` | Chi tiết khóa học |
| `GET /student/assignments` | Bài tập tổng hợp |
| `GET /student/assignments/:id` | Chi tiết bài tập + countdown |
| `GET /staff` | Tổng quan giảng dạy |
| `GET /staff/course` | Quản lý lớp học |
| `GET /staff/course/:id` | Chi tiết khóa học staff |
| `GET /staff/grading` | Chấm bài & Phản hồi |

---

## Tính năng nổi bật

- **Localhost guard**: `/admin` chỉ truy cập được từ `localhost` / `127.0.0.1`
- **Dark theme**: màu chuẩn GitHub (`#0d1117`, `#161b22`, `#30363d`)
- **Countdown timer**: đếm ngược thời gian nộp bài, tự khóa khi hết giờ
- **Modals**: phân quyền, khóa tài khoản, xóa user, thêm bài giảng
- **Tabs**: bài tập (Cần làm / Đã nộp / Quá hạn)
- **Grading panel**: chọn bài nộp từ list, chấm điểm inline
- **Role-based sidebar**: student (xanh dương), staff (xanh lá)
- **Skeleton loading** cho dashboard stats
- **Toast notifications** cho các action

---

## Thêm logo/hình ảnh

Đặt các file sau vào `public/images/`:
- `logo.png` — Logo TDTU (hiển thị trên topbar và login)
- `Lecturer.png` — Hình giảng viên (trang chọn đối tượng)
- `StudentGraduation.png` — Hình sinh viên (trang chọn đối tượng)

---

## Tích hợp với NestJS Backend

Thay đổi base URL trong `server.js`:
```js
// Proxy API calls to NestJS
const BACKEND = process.env.BACKEND_URL || 'http://localhost:8080';
```

Hoặc dùng `http-proxy-middleware` để forward `/api/*` sang NestJS.
