import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { LoggingInterceptor } from './common/interceptors/logging.interceptor';
import { Logger } from '@nestjs/common';

async function bootstrap() {
  // Cấu hình Logger ngay tại đây là đủ, không cần overrideLogger nữa
  const app = await NestFactory.create(AppModule, {
    logger: process.env.NODE_ENV === 'production' 
      ? ['error', 'warn'] // Khi chạy thật (Prod) chỉ hiện lỗi
      : ['log', 'error', 'warn', 'debug', 'verbose'], // Khi Code (Dev) hiện hết
  });
  
  // Kích hoạt Interceptor để log request gọn gàng
  app.useGlobalInterceptors(new LoggingInterceptor());

  const port = process.env.PORT ?? 3000;
  await app.listen(port);
  
  // In một dòng thông báo cuối cùng để biết server đã sẵn sàng
  console.log(`🚀 Application is running on: http://localhost:${port}`);
}
bootstrap();
