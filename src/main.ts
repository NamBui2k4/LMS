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
  const port = process.env.PORT || 3001;

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