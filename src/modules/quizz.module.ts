// src/modules/quiz/quiz.module.ts

import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

// Entities
import { Quiz } from '../models/quizzes.entity';
import { QuizQuestion } from '../models/quiz-question.entity';
import { Lesson } from '../models/lesson.entity';
import { Submission } from '../models/submission.entity';

// Controllers
import { QuizController } from '../controller/quiz.controller';

// Services
import { QuizService } from '../services/quiz.service';

// Repositories
import { QuizRepository } from '../repository/quiz.repository';
import { CourseModule } from './course.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Quiz, QuizQuestion, Lesson, Submission]),
    CourseModule
  ],
  controllers: [QuizController],
  providers: [QuizService, QuizRepository],
  exports: [QuizService, QuizRepository],
})
export class QuizModule {}