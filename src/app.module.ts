// src/app.module.ts
import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { LoggerModule } from 'nestjs-pino';

// Entities - tất cả chung
import { User } from './models/user.entity';
// import { Course } from './entities/course.entity';
// import { Category } from './entities/category.entity';
// import { Enrollment } from './entities/enrollment.entity';
// import { Lesson } from './entities/lesson.entity';
// import { Material } from './entities/material.entity';
// import { Quiz } from './entities/quiz.entity';
// import { Submission } from './entities/submission.entity';

// // Controllers - tất cả chung
// import { AuthController } from './controllers/auth.controller';
import { UserController } from './controller/user.controller';
// import { CoursesController } from './controllers/courses.controller';
// import { LessonsController } from './controllers/lessons.controller';
// import { QuizzesController } from './controllers/quizzes.controller';
import { AuthController } from './controller/auth.controller';

// // Services - tất cả chung
// import { AuthService } from './services/auth.service';
import { UserService } from './services/user.service';
// import { CoursesService } from './services/courses.service';
// import { LessonsService } from './services/lessons.service';
// import { QuizzesService } from './services/quizzes.service';
import { AuthService } from './services/auth.service';

// // Guards, Strategies...
import { RolesGuard } from './auth/guard/roles.guard';
import { JwtAuthGuard } from './auth/guard/jwt-auth.guard';
import { JwtStrategy } from './auth/strategies/jwt.strategy';

// repository
import { UserRepository } from './repository/user.repository';

@Module({
  imports: [
    LoggerModule.forRoot({
      pinoHttp: {
        transport: {
          target: 'pino-pretty',
          options: {
            singleLine: true,
            colorize: true,
            levelFirst: true,
            translateTime: 'HH:MM:ss',
            ignore: 'req,res,responseTime'
          },
        },
        serializers: {
          req: () => undefined,
          res: () => undefined,
        },
        customSuccessMessage: (req, res, responseTime) => {
          return `${req.method} ${req.url} - Status: ${res.statusCode} - ${responseTime}ms`;
        },
        customErrorMessage: (req, res, err) => {
          return `FAILED: ${req.method} ${req.url} - Error: ${err.message}`;
        },
      },

    }),
    ConfigModule.forRoot({ isGlobal: true }),
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => ({
        type: 'postgres',
        host: configService.get<string>('DB_HOST'),
        port: configService.get<number>('DB_PORT'),
        username: configService.get<string>('DB_USERNAME'),
        password: configService.get<string>('DB_PASSWORD'),
        database: configService.get<string>('DB_NAME'), // Ép kiểu string ở đây
        entities: [User],
        synchronize: true, // Lưu ý: Chỉ dùng true khi đang phát triển (dev)
        logging: true,              // Bật ghi log SQL
        logger: 'advanced-console'
      }),
      inject: [ConfigService],
    }),
    TypeOrmModule.forFeature([
      User,
      // Course,
      // Category,
      // Enrollment,
      // Lesson,
      // Material,
      // Quiz,
      // Submission
    ]),
    PassportModule,
    JwtModule.registerAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => ({
        secret: configService.get('JWT_SECRET'),
        signOptions: { expiresIn: '15m' },
      }),
      inject: [ConfigService],
    }),
  ],

  controllers: [
    // AuthController,
    UserController,
    AuthController,
    // CoursesController,
    // LessonsController,
    // QuizzesController,
  ],
  providers: [
    // AuthService,
    UserService,
    UserRepository,
    // CoursesService,
    // LessonsService,
    // QuizzesService,
    AuthService,
    JwtAuthGuard,
    RolesGuard,
    JwtStrategy
    // ... các provider khác
  ],
})
export class AppModule { }