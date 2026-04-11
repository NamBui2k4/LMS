// src/modules/enrollment/enrollment.module.ts

import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

// Entities
import { Enrollment } from '../models/enrollment.entity';
import { Student } from '../models/student.entity';
import { Courses } from '../models/courses.entity';

// Controllers
import { EnrollmentController } from '../controller/enrollment.controller';

// Services
import { EnrollmentService } from '../services/enrollment.service';

// Repositories
import { EnrollmentRepository } from '../repository/enrollment.repository';
import { CourseModule } from './course.module';
import { StudentModule } from './student.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Enrollment, Student, Courses]),
    CourseModule,
    StudentModule
  ],
  controllers: [EnrollmentController],
  providers: [EnrollmentService, EnrollmentRepository],
  exports: [EnrollmentService, EnrollmentRepository],
})
export class EnrollmentModule {}