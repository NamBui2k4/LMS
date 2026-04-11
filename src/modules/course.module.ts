// src/modules/course/course.module.ts

import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

// Entities
import { Courses } from '../models/courses.entity';
import { Category } from '../models/categories.entity';
import { Lesson } from '../models/lesson.entity';
import { Enrollment } from '../models/enrollment.entity';
import { AssignedLecturers } from '../models/assigned-lecturers.entity';

// Controllers
import { CourseController } from '../controller/course.controller';

// Services
import { CourseService } from '../services/course.service';

// Repositories
import { CourseRepository } from '../repository/course.repository';
import { LecturerModule } from './lecturer.module';
import { DepartmentHeadModule } from './department-head.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Courses, Category, Lesson, Enrollment, AssignedLecturers]),
    DepartmentHeadModule,
    LecturerModule
],
  controllers: [CourseController],
  providers: [CourseService, CourseRepository],
  exports: [CourseService, CourseRepository],
})
export class CourseModule {}