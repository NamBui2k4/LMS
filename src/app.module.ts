// src/app.module.ts

import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { LoggerModule } from 'nestjs-pino';

// ── Entities ────────────────────────────────────────────────
import { User } from './models/user.entity';
import { Student } from './models/student.entity';
import { Lecturer } from './models/lecturers.entity';
import { Admin } from './models/admins.entity';
import { Enrollment } from './models/enrollment.entity';
import { Submission } from './models/submission.entity';
import { DepartmentHead } from './models/department-heads.entity';
import { Courses } from './models/courses.entity';
import { Category } from './models/categories.entity';
import { Lesson } from './models/lesson.entity';
import { Material } from './models/material.entity';
import { Quiz } from './models/quizzes.entity';
import { QuizQuestion } from './models/quiz-question.entity';
import { AssignedLecturers } from './models/assigned-lecturers.entity';

// ── Controllers (đã implement) ──────────────────────────────
import { UserController } from './controller/user.controller';
import { AuthController } from './controller/auth.controller';

// ── Services (đã implement) ─────────────────────────────────
import { UserService } from './services/user.service';
import { AuthService } from './services/auth.service';

// ── Services (TODO: tạo file khi implement feature) ─────────
import { StudentService }    from './services/student.service';
import { LecturerService }   from './services/lecturer.service';
import { CourseService }     from './services/course.service';
import { CategoryService }   from './services/categories.service';
import { LessonService }     from './services/lesson.service';
import { MaterialService }   from './services/material.service';
import { EnrollmentService } from './services/enrollment.service';
import { QuizService }       from './services/quiz.service';
import { SubmissionService } from './services/submissions.service';

// ── Repositories (đã implement) ─────────────────────────────
import { UserRepository } from './repository/user.repository';

// ── Repositories (TODO: tạo file khi implement feature) ─────
import { StudentRepository }    from './repository/student.repository';
import { LecturerRepository }   from './repository/lecturer.repository';
import { CourseRepository }     from './repository/course.repository';
import { CategoryRepository }   from './repository/categories.repository';
import { LessonRepository }     from './repository/lesson.repository';
import { MaterialRepository }   from './repository/material.repository';
import { EnrollmentRepository } from './repository/enrollment.repository';
import { QuizRepository }       from './repository/quiz.repository';
import { SubmissionRepository } from './repository/submissions.repository';

// ── Auth ────────────────────────────────────────────────────
import { RolesGuard } from './auth/guard/roles.guard';
import { JwtAuthGuard } from './auth/guard/jwt-auth.guard';
import { JwtStrategy } from './auth/strategies/jwt.strategy';
import { StudentController } from './controller/student.controller';
import { LecturerController } from './controller/lecturer.controller';
import { CourseController } from './controller/course.controller';
import { CategoryController } from './controller/categories.controller';
import { LessonController } from './controller/lesson.controller';
import { MaterialController } from './controller/material.controller';
import { EnrollmentController } from './controller/enrollment.controller';
import { QuizController } from './controller/quiz.controller';
import { SubmissionController } from './controller/submissions.controller';

// ── All entities array (dùng cho TypeORM) ───────────────────
const allEntities = [
  User,
  Student,
  Lecturer,
  Admin,
  Enrollment,
  Submission,
  DepartmentHead,
  Courses,
  Category,
  Lesson,
  Material,
  Quiz,
  QuizQuestion,
  AssignedLecturers,
];

@Module({
  imports: [
    // ── Logger ──────────────────────────────────────────────
    LoggerModule.forRoot({
      pinoHttp: {
        transport: {
          target: 'pino-pretty',
          options: {
            singleLine: true,
            colorize: true,
            levelFirst: true,
            translateTime: 'HH:MM:ss',
            ignore: 'req,res,responseTime',
          },
        },
        serializers: {
          req: () => undefined,
          res: () => undefined,
        },
      },
    }),

    // ── Config (global) ─────────────────────────────────────
    ConfigModule.forRoot({
      isGlobal: true,
    }),

    // ── Database ────────────────────────────────────────────
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        type: 'postgres',
        host: configService.get<string>('DB_HOST'),
        port: Number(configService.get('DB_PORT')),
        username: configService.get<string>('DB_USERNAME'),
        password: configService.get<string>('DB_PASSWORD'),
        database: configService.get<string>('DB_NAME'),
        entities: allEntities,
        synchronize: true, // dev only — tắt khi production
        logging: true,
      }),
    }),

    // ── Feature repositories ────────────────────────────────
    TypeOrmModule.forFeature(allEntities),

    // ── Auth ────────────────────────────────────────────────
    PassportModule,
    JwtModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        secret: configService.get<string>('JWT_SECRET'),
        signOptions: {
          expiresIn: '15m',
        },
      }),
    }),
  ],

  // ── Controllers ─────────────────────────────────────────────
  // Thêm controller mới vào đây sau khi tạo file tương ứng
  controllers: [
    UserController,
    AuthController,
    StudentController,
    LecturerController,
    CourseController,
    CategoryController,
    LessonController,
    MaterialController,
    EnrollmentController,
    QuizController,
    SubmissionController,
  ],

  // ── Providers ───────────────────────────────────────────────
  // Thêm service + repository mới vào đây sau khi tạo file tương ứng
  providers: [
    // Auth
    JwtAuthGuard,
    RolesGuard,
    JwtStrategy,

    // User
    UserService,
    UserRepository,

    // Auth
    AuthService,

    // TODO: uncomment từng nhóm khi implement xong feature
    StudentService,
    StudentRepository,

    LecturerService,
    LecturerRepository,

    CourseService,
    CourseRepository,

    CategoryService,
    CategoryRepository,

    LessonService,
    LessonRepository,

    MaterialService,
    MaterialRepository,

    EnrollmentService,
    EnrollmentRepository,

    QuizService,
    QuizRepository,

    SubmissionService,
    SubmissionRepository,
  ],
})
export class AppModule {}