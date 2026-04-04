// src/main.ts
import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { AppModule } from './app.module';
import cookieParser from 'cookie-parser';
import { Logger } from 'nestjs-pino';
import { NestExpressApplication } from '@nestjs/platform-express';
import { join } from 'path';

import { icon } from './views/helpers/icon';   // ← quan trọng: phải khớp tên file

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);

  const isProd = process.env.NODE_ENV === 'production';

  const viewsPath = isProd
    ? join(process.cwd(), 'dist', 'views')
    : join(process.cwd(), 'src', 'views');

  const publicPath = isProd
    ? join(process.cwd(), 'dist', 'views', 'public')
    : join(process.cwd(), 'src', 'views', 'public');

  app.useStaticAssets(publicPath);
  app.setBaseViewsDir(viewsPath);
  app.setViewEngine('ejs');

  // ✅ Đăng ký icon helper globally cho tất cả EJS
  app.use((req, res, next) => {
    res.locals.icon = icon;
    next();
  });

  app.use(cookieParser());
  app.useLogger(app.get(Logger));

  app.useGlobalPipes(
    new ValidationPipe({
      transform: true,
      whitelist: true,
      forbidNonWhitelisted: false,
    }),
  );

  await app.listen(3001, '0.0.0.0');
  console.log(`🚀 Application is running on: http://localhost:3001`);
}

bootstrap();