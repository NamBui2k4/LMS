import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import cookieParser from 'cookie-parser'; // 1. Import mặc định
import { Logger } from 'nestjs-pino';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.use(cookieParser()); // 2. Sử dụng middleware
  app.useLogger(app.get(Logger));
  await app.listen(3000);
}
bootstrap();