/**
 * LMS EJS — Express Server
 * Run: npm install && npm start
 * Then open: http://localhost:3000
 */

const express = require('express');
const path    = require('path');
const os      = require('os');

const app = express();
// Định nghĩa hàm icon dùng toàn cục cho EJS
app.locals.icon = function(name, cls) {
  cls = cls || '';
  const icons = {
    user: `<svg class="${cls}" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>`,
    users: `<svg class="${cls}" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75"/></svg>`,
    dashboard: `<svg class="${cls}" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/></svg>`,
    settings: `<svg class="${cls}" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 1 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 1 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 1 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 1 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg>`,
    bell: `<svg class="${cls}" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/></svg>`,
    // ... thêm các icon khác nếu cần ...
  };
  return icons[name] || '';
};
const PORT = process.env.PORT || 3001;

// ── View engine ────────────────────────────────────────────
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// ── Static files ───────────────────────────────────────────
app.use(express.static(path.join(__dirname, 'public')));

// ── Body parser ────────────────────────────────────────────
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ──────────────────────────────────────────────────────────
//  LOCALHOST GUARD MIDDLEWARE for /admin routes
// ──────────────────────────────────────────────────────────
function localhostOnly(req, res, next) {
  const ip = req.ip || req.connection.remoteAddress || '';
  const isLocal = ip === '127.0.0.1' || ip === '::1' || ip === '::ffff:127.0.0.1';
  if (!isLocal) {
    return res.status(403).send(`
      <div style="font-family:monospace;background:#030712;color:#ef4444;min-height:100vh;display:flex;align-items:center;justify-content:center;text-align:center;padding:2rem;">
        <div>
          <div style="font-size:4rem;margin-bottom:1rem;">🔒</div>
          <h1 style="font-size:1.5rem;font-weight:700;">403 — Forbidden</h1>
          <p style="color:#6b7280;margin-top:.5rem;">Admin portal chỉ được phép truy cập từ localhost.</p>
        </div>
      </div>`);
  }
  next();
}

// ──────────────────────────────────────────────────────────
//  DEFAULT ROUTE
// ──────────────────────────────────────────────────────────
app.get('/', (req, res) => res.redirect('/login'));

// ──────────────────────────────────────────────────────────
//  AUTH / LOGIN ROUTES
// ──────────────────────────────────────────────────────────
// Role selection page
app.get('/login', (req, res) => res.render('login'));

// Role-specific login page
app.get('/login/:roleType', (req, res) => {
  const roleType = req.params.roleType; // 'student' or 'staff'
  if (!['student', 'staff'].includes(roleType)) {
    return res.redirect('/login');
  }
  res.render('login-role', { roleType });
});

// ──────────────────────────────────────────────────────────
//  ADMIN ROUTES (localhost only)
// ──────────────────────────────────────────────────────────
app.get('/admin', localhostOnly, (req, res) => res.render('admin/login'));
app.get('/admin/dashboard', localhostOnly, (req, res) => res.render('admin/dashboard'));
app.get('/admin/users',     localhostOnly, (req, res) => res.render('admin/users'));
app.get('/admin/settings',  localhostOnly, (req, res) => res.render('admin/settings'));

// ──────────────────────────────────────────────────────────
//  STUDENT ROUTES
// ──────────────────────────────────────────────────────────
app.get('/student',             (req, res) => res.redirect('/student/profile'));
app.get('/student/profile',     (req, res) => res.render('student/profile'));
app.get('/student/attendance',  (req, res) => res.render('student/attendance'));
app.get('/student/course',      (req, res) => res.render('student/course-list'));
app.get('/student/course/:id',  (req, res) => res.render('student/course-detail', { courseId: req.params.id }));
app.get('/student/assignments', (req, res) => res.render('student/assignments'));
app.get('/student/assignments/:id', (req, res) => res.render('student/assignment-detail', { assignmentId: req.params.id }));

// ──────────────────────────────────────────────────────────
//  STAFF ROUTES
// ──────────────────────────────────────────────────────────
app.get('/staff',             (req, res) => res.render('staff/index'));
app.get('/staff/course',      (req, res) => res.render('staff/course-list'));
app.get('/staff/course/:id',  (req, res) => res.render('staff/course-detail', { courseId: req.params.id }));
app.get('/staff/grading',     (req, res) => {
  // Pass submissions as a variable for the JSON.stringify in EJS
  const submissions = [
    { id:'sub-1', studentName:'Nguyễn Văn A', quizTitle:'Báo cáo Đồ án giữa kỳ', status:'submitted', submittedAt:'2026-03-29 14:30', score:null, fileUrl:'https://example.com/bao-cao.pdf', feedback:'' },
    { id:'sub-2', studentName:'Trần Thị B', quizTitle:'Bài tập Thực hành React', status:'regrade_requested', submittedAt:'2026-03-28 09:15', score:7.5, fileUrl:null, feedback:'Code chạy ổn nhưng chưa tối ưu Component.\n\n[Yêu cầu chấm lại]: Thầy xem lại giúp em.' },
    { id:'sub-3', studentName:'Lê Hoàng C', quizTitle:'Báo cáo Đồ án giữa kỳ', status:'graded', submittedAt:'2026-03-27 16:45', score:9.0, fileUrl:'https://example.com/source-code.zip', feedback:'Làm bài rất xuất sắc, giao diện đẹp!' },
  ];
  res.render('staff/grading', { submissions });
});

app.get('/staff/question-bank', (req, res) => res.render('staff/question-bank'));
app.get('/staff/reports', (req, res) => res.render('staff/reports'));

// ──────────────────────────────────────────────────────────
//  DEMO API STUBS (replace with real backend calls)
// ──────────────────────────────────────────────────────────
app.post('/api/v1/admin/login', (req, res) => {
  const { email, password } = req.body;
  if (email && password) {
    return res.json({ data: { access_token: 'demo-token', user: { id:'1', email, role:'ADMIN' } } });
  }
  res.status(401).json({ message: 'Sai email hoặc mật khẩu' });
});

app.get('/api/v1/admin/stats', (req, res) => {
  res.json({ data: { totalUsers:1245, totalStudents:1100, totalLecturers:42, totalDepartments:8 } });
});

app.get('/api/v1/admin/list_users', (req, res) => {
  res.json({ data: { users: [], total: 0 } });
});

// ──────────────────────────────────────────────────────────
//  404
// ──────────────────────────────────────────────────────────
app.use((req, res) => {
  res.status(404).send(`
    <div style="font-family:system-ui;background:#0d1117;color:#8b949e;min-height:100vh;display:flex;flex-direction:column;align-items:center;justify-content:center;text-align:center;gap:1rem;">
      <h1 style="font-size:4rem;font-weight:900;color:#fff;">404</h1>
      <p style="font-size:1.125rem;">Trang bạn tìm kiếm không tồn tại.</p>
      <a href="/" style="padding:.5rem 1.5rem;background:#1f6feb;color:#fff;border-radius:6px;text-decoration:none;font-weight:600;">Về trang chủ</a>
    </div>`);
});

// ──────────────────────────────────────────────────────────
//  START
// ──────────────────────────────────────────────────────────
app.listen(PORT, () => {
  const ifaces = os.networkInterfaces();
  let localIp = 'localhost';
  Object.values(ifaces).flat().forEach(iface => {
    if (iface.family === 'IPv4' && !iface.internal) localIp = iface.address;
  });
  console.log('\n🚀 LMS EJS Server started!');
  console.log(`   Local:   http://localhost:${PORT}`);
  console.log(`   Network: http://${localIp}:${PORT}  (Admin NOT accessible from here)\n`);
  console.log('📋 Routes:');
  console.log(`   /login              → Role selection`);
  console.log(`   /login/student      → Student login`);
  console.log(`   /login/staff        → Staff login`);
  console.log(`   /admin              → Admin login (localhost only)`);
  console.log(`   /admin/dashboard    → Admin dashboard`);
  console.log(`   /admin/users        → User management`);
  console.log(`   /admin/settings     → System settings`);
  console.log(`   /student/profile    → Student profile`);
  console.log(`   /student/course     → Course list`);
  console.log(`   /student/assignments→ Assignments`);
  console.log(`   /staff              → Staff home`);
  console.log(`   /staff/course       → Course management`);
  console.log(`   /staff/grading      → Grading\n`);
});
