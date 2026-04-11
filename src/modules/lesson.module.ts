// src/modules/lesson/lesson.module.ts

import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

// Entities
import { Lesson } from '../models/lesson.entity';
import { Courses } from '../models/courses.entity';
import { Material } from '../models/material.entity';

// Controllers
import { LessonController } from '../controller/lesson.controller';

// Services
import { LessonService } from '../services/lesson.service';

// Repositories
import { LessonRepository } from '../repository/lesson.repository';
import { CourseModule } from './course.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Lesson, Courses, Material]),
    CourseModule
  ],
  controllers: [LessonController],
  providers: [LessonService, LessonRepository],
  exports: [LessonService, LessonRepository],
})
export class LessonModule {}