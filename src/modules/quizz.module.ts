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
import { QuizQuestionController } from '../controller/quiz-question.controller';

// Services
import { QuizService } from '../services/quiz.service';
import { QuizQuestionService } from '../services/quiz-question.service';

// Repositories
import { QuizRepository } from '../repository/quiz.repository';
import { QuizQuestionRepository } from '../repository/quiz-question.repository';
import { CourseModule } from './course.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Quiz, QuizQuestion, Lesson, Submission]),
    CourseModule
  ],
  controllers: [QuizController, QuizQuestionController],
  providers: [QuizService, QuizRepository, QuizQuestionService, QuizQuestionRepository],
  exports: [QuizService, QuizRepository, QuizQuestionService, QuizQuestionRepository],
})
export class QuizModule {}