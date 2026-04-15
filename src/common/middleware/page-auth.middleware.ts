import { Injectable, NestMiddleware } from '@nestjs/common';
import * as jwt from 'jsonwebtoken';

/**
 * PageAuthMiddleware — Bảo vệ các route HTML/UI
 *
 * Quy tắc:
 *  1. Static assets + API routes → luôn cho qua (next())
 *  2. Protected routes (/student/*, /staff/*):
 *       - Chưa login     → redirect về trang đăng nhập tương ứng
 *       - Nhầm portal   → redirect về đúng portal của role
 *  3. Login pages (/login, /login/student, /login/staff):
 *       - Đã login rồi  → redirect về portal đúng (tránh đăng nhập 2 lần)
 *  4. Root '/' (guest homepage):
 *       - Luôn cho qua, không redirect kể cả khi đã login
 */
@Injectable()
export class PageAuthMiddleware implements NestMiddleware {

  use(req: any, res: any, next: () => void) {
    const path: string = req.path || '';

    // ────────────────────────────────────────────────────────────────
    // BƯỚC 1: Bỏ qua hoàn toàn — static assets & API routes
    // ────────────────────────────────────────────────────────────────
    const SKIP_PREFIXES = ['/api/', '/css/', '/js/', '/images/', '/fonts/', '/favicon'];
    if (SKIP_PREFIXES.some(p => path.startsWith(p))) {
      return next();
    }

    // ────────────────────────────────────────────────────────────────
    // BƯỚC 2: Decode token từ httpOnly cookie (không verify, chỉ đọc claim)
    // ────────────────────────────────────────────────────────────────
    const token = req.cookies?.refreshToken as string | undefined;
    let payload: { role?: string; email?: string; sub?: number } | null = null;

    if (token) {
      try {
        const decoded = jwt.decode(token);
        // Chỉ chấp nhận nếu là object hợp lệ và có field role
        if (decoded && typeof decoded === 'object' && decoded['role']) {
          payload = decoded as any;
        }
      } catch {
        // token bị corrupt → coi như chưa login
      }
    }

    // Gắn vào req để controller sử dụng
    req.userPayload = payload;

    // Helper: role có phải staff không
    const isStaffRole = (role?: string) =>
      role === 'LECTURER' || role === 'HEAD_OF_DEPARTMENT' || role === 'ADMIN';

    const isStudentRole = (role?: string) => role === 'STUDENT';

    // ────────────────────────────────────────────────────────────────
    // BƯỚC 3: Phân loại path hiện tại
    // ────────────────────────────────────────────────────────────────
    const isStudentPath = path.startsWith('/student');
    const isStaffPath   = path.startsWith('/staff');
    // Chỉ bao gồm trang đăng nhập, KHÔNG bao gồm '/' (guest homepage)
    const isLoginPage   = path === '/login' ||
                          path.startsWith('/login/student') ||
                          path.startsWith('/login/staff');

    // ────────────────────────────────────────────────────────────────
    // BƯỚC 4: Bảo vệ các route nội bộ
    // ────────────────────────────────────────────────────────────────
    if (isStudentPath || isStaffPath) {
      // 4a. Chưa đăng nhập → đá về trang login tương ứng
      if (!payload) {
        const loginTarget = isStaffPath ? '/login/staff' : '/login/student';
        return res.redirect(loginTarget);
      }

      // 4b. Nhầm portal: STUDENT vào /staff
      if (isStaffPath && isStudentRole(payload.role)) {
        return res.redirect('/student/profile');
      }

      // 4c. Nhầm portal: STAFF vào /student
      if (isStudentPath && isStaffRole(payload.role)) {
        return res.redirect('/staff');
      }

      // 4d. Đúng role → cho qua
      return next();
    }

    // ────────────────────────────────────────────────────────────────
    // BƯỚC 5: Trang login → nếu đã đăng nhập thì giữ tại portal đang dùng
    // ────────────────────────────────────────────────────────────────
    if (isLoginPage && payload) {
      if (isStudentRole(payload.role)) {
        return res.redirect('/student/profile');
      }
      if (isStaffRole(payload.role)) {
        return res.redirect('/staff');
      }
    }

    // ────────────────────────────────────────────────────────────────
    // BƯỚC 6: Mọi path khác (/, /admin/*, ...) → cho qua
    // ────────────────────────────────────────────────────────────────
    return next();
  }
}
