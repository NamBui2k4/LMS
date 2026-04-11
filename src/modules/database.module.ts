// src/database/database.module.ts

import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';

// ── Entities ────────────────────────────────────────────────
import { User } from '../models/user.entity';
import { Student } from '../models/student.entity';
import { Lecturer } from '../models/lecturers.entity';
import { Admin } from '../models/admins.entity';
import { Enrollment } from '../models/enrollment.entity';
import { Submission } from '../models/submission.entity';
import { DepartmentHead } from '../models/department-heads.entity';
import { Courses } from '../models/courses.entity';
import { Category } from '../models/categories.entity';
import { Lesson } from '../models/lesson.entity';
import { Material } from '../models/material.entity';
import { Quiz } from '../models/quizzes.entity';
import { QuizQuestion } from '../models/quiz-question.entity';
import { AssignedLecturers } from '../models/assigned-lecturers.entity';

// ── All entities array ──────────────────────────────────────
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
        synchronize: false,
        logging: true,
        dropSchema: false,
      }),
    }),

    // ── Feature repositories ────────────────────────────────
    TypeOrmModule.forFeature(allEntities),
  ],
})
export class DatabaseModule {}