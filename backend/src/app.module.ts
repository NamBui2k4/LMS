// src/app.module.ts
import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';

// models - tất cả chung
import { Student } from './models/student.entity';
import { Course } from './models/courses.entity';
import { Category } from './models/categories.entity';
import { Enrollment } from './models/enrollment.entity';
import { Lesson } from './models/lesson.entity';
import { Material } from './models/material.entity';
import { Quiz } from './models/quizzes.entity';
import { Submission } from './models/submission.entity';

// // Controllers - tất cả chung
// import { AuthController } from './controllers/auth.controller';
// import { UsersController } from './controllers/users.controller';
// import { CoursesController } from './controllers/courses.controller';
// import { LessonsController } from './controllers/lessons.controller';
// import { QuizzesController } from './controllers/quizzes.controller';

// // Services - tất cả chung
// import { AuthService } from './services/auth.service';
// import { UsersService } from './services/users.service';
// import { CoursesService } from './services/courses.service';
// import { LessonsService } from './services/lessons.service';
// import { QuizzesService } from './services/quizzes.service';

// // Guards, Strategies...
// import { JwtStrategy } from './common/strategies/jwt.strategy';
// import { RolesGuard } from './common/guards/roles.guard';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => ({
        type: 'postgres' as  const,
        host: process.env.DB_HOST,
        port: configService.get<number>('DB_PORT'),
        username: process.env.DB_USERNAME,
        password: process.env.DB_PASSWORD,
        database: process.env.DB_NAME,
        models: [Student, Course, Category, Enrollment, Lesson, Material, Quiz, Submission],
        synchronize: true, // dev only
        logging: ['error']
      }),
      inject: [ConfigService],
    }),
    // TypeOrmModule.forFeature([User, Course, Category, Enrollment, Lesson, Material, Quiz, Submission]),
    // PassportModule,
    // JwtModule.registerAsync({
    //   imports: [ConfigModule],
    //   useFactory: (configService: ConfigService) => ({
    //     secret: configService.get('JWT_SECRET'),
    //     signOptions: { expiresIn: '15m' },
    //   }),
    //   inject: [ConfigService],
    // }),
  ],
  // controllers: [
  //   AuthController,
  //   UsersController,
  //   CoursesController,
  //   LessonsController,
  //   QuizzesController,
  // ],
  // providers: [
  //   AuthService,
  //   UsersService,
  //   CoursesService,
  //   LessonsService,
  //   QuizzesService,
  //   JwtStrategy,
  //   RolesGuard,
  //   // ... các provider khác
  // ],
})
export class AppModule {}