import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common'; // ✅ THÊM
import { AppModule } from './app.module';
import cookieParser from 'cookie-parser';
import { Logger } from 'nestjs-pino';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  app.use(cookieParser());
  app.useLogger(app.get(Logger));

  // ✅ THÊM: Bắt buộc để @Transform trong RegisterDto hoạt động
  // transform: true           → @Transform decorator chạy được
  // whitelist: true           → tự động bỏ các field không có trong DTO
  // forbidNonWhitelisted: false → không throw lỗi khi client gửi field thừa
  app.useGlobalPipes(
    new ValidationPipe({
      transform: true,
      whitelist: true,
      forbidNonWhitelisted: false,
    }),
  );

  await app.listen(3000);
}
bootstrap();