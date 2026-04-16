// src/app.module.ts

import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { LoggerModule } from 'nestjs-pino';

// ── Shared/Core Modules ─────────────────────────────────────
import { DatabaseModule } from './modules/database.module';

// ── Feature Modules ─────────────────────────────────────────
import { AuthModule } from './modules/auth.module';
import { UserModule } from './modules/user.module';
import { StudentModule } from './modules/student.module';
import { LecturerModule } from './modules/lecturer.module';
import { CourseModule } from './modules/course.module';
import { CategoryModule } from './modules/category.module';
import { LessonModule } from './modules/lesson.module';
import { MaterialModule } from './modules/material.module';
import { EnrollmentModule } from './modules/enrollment.module';
import { QuizModule } from './modules/quizz.module';
import { SubmissionModule } from './modules/submission.module';
import { DepartmentHeadModule } from './modules/department-head.module';
import { AssignedLecturersModule } from './modules/assigned-lecturers.module';

// ── Controllers ─────────────────────────────────────────────
import { AppController } from './app.controller';

// ── Services ────────────────────────────────────────────────
import { AppService } from './app.service';


@Module({
  imports: [
    // ── Config Module ───────────────────────────────────────
    ConfigModule.forRoot({
      isGlobal: true,
    }),

    // ← Thêm LoggerModule này
    LoggerModule.forRoot({
      pinoHttp: {
        transport: {
          target: 'pino-pretty',
          options: {
            singleLine: true,
            colorize: true,
            levelFirst: true,
            translateTime: 'HH:MM:ss',
            ignore: 'pid,hostname,req,res,responseTime',
            messageFormat: '{msg}',   // tùy chọn
          },
        },
        // Tùy chọn: redact thông tin nhạy cảm
        redact: ['req.headers.authorization', 'password'],
      },
    }),

    // ── Database Module ────────────────────────────────────
    DatabaseModule,

    // ── Feature Modules ────────────────────────────────────
    AuthModule,
    UserModule,
    StudentModule,
    LecturerModule,
    CourseModule,
    CategoryModule,
    LessonModule,
    MaterialModule,
    EnrollmentModule,
    QuizModule,
    SubmissionModule,
    DepartmentHeadModule,
    AssignedLecturersModule,
  ],

  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}  // PageAuthMiddleware đã được đăng ký trong main.ts
