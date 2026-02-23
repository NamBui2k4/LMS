// src/app.module.ts
import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';

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
        host: configService.get('DB_HOST'),
        port: +configService.get('DB_PORT'),
        username: configService.get('DB_USER'),
        password: configService.get('DB_PASS'),
        database: configService.get('DB_NAME'),
        entities: [User],
        synchronize: true, // dev only
        logging: ['query', 'error']
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