// src/modules/submission/submission.module.ts

import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

// Entities
import { Submission } from '../models/submission.entity';
import { Student } from '../models/student.entity';
import { Lesson } from '../models/lesson.entity';

// Controllers
import { SubmissionController } from '../controller/submissions.controller';

// Services
import { SubmissionService } from '../services/submissions.service';

// Repositories
import { SubmissionRepository } from '../repository/submissions.repository';
import { QuizModule } from './quizz.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Submission, Student, Lesson]),
    QuizModule
  ],
  controllers: [SubmissionController],
  providers: [SubmissionService, SubmissionRepository],
  exports: [SubmissionService, SubmissionRepository],
})
export class SubmissionModule {}