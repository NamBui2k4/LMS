// src/main.ts
import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { AppModule } from './app.module';
import cookieParser from 'cookie-parser';
import { Logger } from 'nestjs-pino';
import { NestExpressApplication } from '@nestjs/platform-express';
import { join } from 'path';
import chalk from 'chalk';

import { icon } from './views/helpers/icon';

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule, {
    bufferLogs: true,
  });

  const logger = app.get(Logger);
  app.useLogger(logger);        // ← Kích hoạt Pino logger

  const isProd = process.env.NODE_ENV === 'production';
  const port = process.env.PORT || 3004;

  // Cấu hình Assets & Views
  const viewsPath = isProd
    ? join(process.cwd(), 'dist', 'views')
    : join(process.cwd(), 'src', 'views');

  const publicPath = isProd
    ? join(process.cwd(), 'dist', 'views', 'public')
    : join(process.cwd(), 'src', 'views', 'public');

  app.useStaticAssets(publicPath);
  app.setBaseViewsDir(viewsPath);
  app.setViewEngine('ejs');

  app.use((req, res, next) => {
    res.locals.icon = icon;
    next();
  });

  app.use(cookieParser());

  // ============================================================
  // PAGE AUTH MIDDLEWARE — Bảo vệ route UI (staff, student, admin)
  // Phải đặt SAU cookieParser để req.cookies có sẵn
  // ============================================================
  app.use((req: any, res: any, next: any) => {
    const path: string = req.path || '';

    // Bỏ qua: static assets & API routes (API tự có JWT guard riêng)
    const SKIP_PREFIXES = ['/api/', '/css/', '/js/', '/images/', '/fonts/', '/favicon'];
    if (SKIP_PREFIXES.some(p => path.startsWith(p))) {
      return next();
    }

    // Decode refreshToken cookie (không verify — chỉ đọc claim role)
    let payload: any = null;
    const token = req.cookies?.refreshToken;
    if (token) {
      try {
        const parts = token.split('.');
        if (parts.length === 3) {
          // Decode Base64url phần payload của JWT (không cần verify ở đây)
          const base64 = parts[1].replace(/-/g, '+').replace(/_/g, '/');
          const json = Buffer.from(base64, 'base64').toString('utf8');
          const decoded = JSON.parse(json);
          if (decoded && decoded.role) {
            payload = decoded;
            // Gắn vào res.locals để View render mượt mà
            res.locals.userPayload = payload;
            res.locals.userRole = payload.role;
          }
        }
      } catch { /* token lỗi → coi như chưa login */ }
    }

    // Gắn vào req để controller dùng
    req.userPayload = payload;

    // Helper phân loại role
    const isStudentRole = (r?: string) => r === 'STUDENT';
    const isStaffRole   = (r?: string) => r === 'LECTURER' || r === 'HEAD_OF_DEPARTMENT';
    const isAdminRole   = (r?: string) => r === 'ADMIN';

    const isStudentPath = path.startsWith('/student');
    const isStaffPath   = path.startsWith('/staff');
    const isAdminPath   = path.startsWith('/admin') && path !== '/admin/login';
    // Trang login (không bao gồm '/' guest homepage)
    const isLoginPage   = path === '/login' || path.startsWith('/login/');

    // 1. Bảo vệ /student/* — chỉ STUDENT được vào
    if (isStudentPath) {
      if (!payload)                     return res.redirect('/login/student');
      if (!isStudentRole(payload.role)) return res.redirect(isStaffRole(payload.role) ? '/staff' : '/login');
      return next();
    }

    // 2. Bảo vệ /staff/* — chỉ LECTURER / HEAD_OF_DEPARTMENT được vào
    if (isStaffPath) {
      if (!payload)                   return res.redirect('/login/staff');
      if (!isStaffRole(payload.role)) return res.redirect(isStudentRole(payload.role) ? '/student/profile' : '/login');
      return next();
    }

    // 3. Bảo vệ /admin/* (trừ /admin/login) — chỉ ADMIN được vào
    if (isAdminPath) {
      if (!payload)                  return res.redirect('/admin/login');
      if (!isAdminRole(payload.role)) return res.redirect('/login');
      return next();
    }

    // 4. Nếu đã login mà vào lại trang login → giữ chân tại portal tương ứng
    if (isLoginPage && payload) {
      if (isStudentRole(payload.role)) return res.redirect('/student/profile');
      if (isStaffRole(payload.role))   return res.redirect('/staff');
      if (isAdminRole(payload.role))   return res.redirect('/admin');
    }

    // Mọi path khác (/, /admin/login, ...) → cho qua
    return next();
  });

  app.useGlobalPipes(
    new ValidationPipe({
      transform: true,
      whitelist: true,
      forbidNonWhitelisted: false,
    }),
  );

  await app.listen(port, '0.0.0.0');


  // ====================== LOG KHỞI ĐỘNG ĐẸP ======================
  logger.log(`🚀 LMS MONOLITHIC SERVICE IS RUNNING on http://localhost:${port}`);

  console.log(`
${chalk.cyan('##########################################################')}
${chalk.cyan('#')}
${chalk.cyan('#')}  🚀 ${chalk.yellowBright('LMS MONOLITHIC SERVICE IS RUNNING')}
${chalk.cyan('#')}
${chalk.cyan('#')}  📂 ${chalk.white('Environment:')}  ${chalk.magentaBright(process.env.NODE_ENV || 'development')}
${chalk.cyan('#')}  🔗 ${chalk.white('Local URL:')}    ${chalk.blueBright(`http://localhost:${port}`)}
${chalk.cyan('#')}  🏠 ${chalk.white('Views Path:')}   ${chalk.gray(viewsPath)}
${chalk.cyan('#')}
${chalk.cyan('##########################################################')}
  `);
}

bootstrap();