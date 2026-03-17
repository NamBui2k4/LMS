import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  ParseIntPipe,
  UseGuards,
  Request,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { QuizQuestionService } from '../services/quiz-question.service';
import {
  CreateQuizQuestionDto,
  UpdateQuizQuestionDto,
  QuizQuestionResponseDto,
} from '../dto/quiz-question.dto';

// ✅ FIX: đường dẫn đúng theo cấu trúc thư mục thực tế của project
//   ❌ SAI CŨ: '../common/guards/jwt-auth.guard'
//   ✅ ĐÚNG:   '../auth/guard/jwt-auth.guard'
import { JwtAuthGuard } from '../auth/guard/jwt-auth.guard';
import { RolesGuard }   from '../auth/guard/roles.guard';
import { Roles }        from '../auth/decorators/roles.decorator';
import { UserRole }     from '../common/enums/role.enum';

/**
 * Controller quản lý câu hỏi bài kiểm tra
 * Route prefix: /api/v1/quizzes/:quizId/questions
 *
 * Tác nhân:
 *   - LECTURER: CRUD câu hỏi (chỉ quiz của mình)
 *   - HEAD_OF_DEPARTMENT: chỉ được xem
 */
@Controller('api/v1/quizzes/:quizId/questions')
@UseGuards(JwtAuthGuard, RolesGuard)
export class QuizQuestionController {
  constructor(private readonly questionService: QuizQuestionService) {}

  // GET /api/v1/quizzes/:quizId/questions
  @Get()
  @Roles(UserRole.LECTURER, UserRole.HEAD_OF_DEPARTMENT)
  async findAll(
    @Param('quizId', ParseIntPipe) quizId: number,
  ): Promise<QuizQuestionResponseDto[]> {
    const questions = await this.questionService.findByQuiz(quizId);
    return questions.map(q => QuizQuestionResponseDto.fromEntity(q));
  }

  // GET /api/v1/quizzes/:quizId/questions/:id
  @Get(':id')
  @Roles(UserRole.LECTURER, UserRole.HEAD_OF_DEPARTMENT)
  async findOne(
    @Param('quizId', ParseIntPipe) quizId: number,
    @Param('id', ParseIntPipe) id: number,
  ): Promise<QuizQuestionResponseDto> {
    const question = await this.questionService.findOne(id);
    return QuizQuestionResponseDto.fromEntity(question);
  }

  // POST /api/v1/quizzes/:quizId/questions
  @Post()
  @Roles(UserRole.LECTURER)
  @HttpCode(HttpStatus.CREATED)
  async create(
    @Param('quizId', ParseIntPipe) quizId: number,
    @Body() dto: CreateQuizQuestionDto,
    @Request() req: any,
  ): Promise<QuizQuestionResponseDto> {
    const question = await this.questionService.create(quizId, dto, req.user.id);
    return QuizQuestionResponseDto.fromEntity(question);
  }

  // PATCH /api/v1/quizzes/:quizId/questions/:id
  @Patch(':id')
  @Roles(UserRole.LECTURER)
  async update(
    @Param('quizId', ParseIntPipe) quizId: number,
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateQuizQuestionDto,
    @Request() req: any,
  ): Promise<QuizQuestionResponseDto> {
    const question = await this.questionService.update(id, dto, req.user.id);
    return QuizQuestionResponseDto.fromEntity(question);
  }

  // PATCH /api/v1/quizzes/:quizId/questions/:id/reorder
  @Patch(':id/reorder')
  @Roles(UserRole.LECTURER)
  async reorder(
    @Param('quizId', ParseIntPipe) quizId: number,
    @Param('id', ParseIntPipe) id: number,
    @Body('orderIndex', ParseIntPipe) orderIndex: number,
    @Request() req: any,
  ): Promise<QuizQuestionResponseDto> {
    const question = await this.questionService.reorder(id, orderIndex, req.user.id);
    return QuizQuestionResponseDto.fromEntity(question);
  }

  // DELETE /api/v1/quizzes/:quizId/questions/:id
  @Delete(':id')
  @Roles(UserRole.LECTURER)
  @HttpCode(HttpStatus.NO_CONTENT)
  async delete(
    @Param('quizId', ParseIntPipe) quizId: number,
    @Param('id', ParseIntPipe) id: number,
    @Request() req: any,
  ): Promise<void> {
    await this.questionService.delete(id, req.user.id);
  }
}
