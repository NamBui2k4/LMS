import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Param,
  Body,
  ParseIntPipe,
  HttpCode,
  HttpStatus,
  UseGuards,
  Request,
} from '@nestjs/common';
import { QuizService, CreateQuizDto, UpdateQuizDto } from '../services/quiz.service';
import { JwtAuthGuard } from '../auth/guard/jwt-auth.guard';
import { RolesGuard } from '../auth/guard/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from '../common/enums/role.enum';

@Controller('api/v1/courses/:courseId/quizzes')
@UseGuards(JwtAuthGuard, RolesGuard)
export class QuizController {
  constructor(private readonly quizService: QuizService) {}

  /**
   * GET /api/v1/courses/:courseId/quizzes
   * Danh sách bài kiểm tra trong khóa học
   */
  @Get()
  @Roles(UserRole.LECTURER, UserRole.HEAD_OF_DEPARTMENT)
  async findAll(@Param('courseId', ParseIntPipe) courseId: number) {
    return this.quizService.findByCourse(courseId);
  }

  /**
   * GET /api/v1/courses/:courseId/quizzes/:id
   * Chi tiết bài kiểm tra (kèm câu hỏi)
   */
  @Get(':id')
  @Roles(UserRole.LECTURER, UserRole.HEAD_OF_DEPARTMENT)
  async findOne(
    @Param('courseId', ParseIntPipe) courseId: number,
    @Param('id', ParseIntPipe) id: number,
  ) {
    return this.quizService.findOne(id);
  }

  /**
   * POST /api/v1/courses/:courseId/quizzes
   * Tạo bài kiểm tra mới (Giảng viên)
   */
  @Post()
  @HttpCode(HttpStatus.CREATED)
  @Roles(UserRole.LECTURER)
  async create(
    @Param('courseId', ParseIntPipe) courseId: number,
    @Body() dto: CreateQuizDto,
    @Request() req: any,
  ) {
    return this.quizService.create(courseId, dto, req.user.id);
  }

  /**
   * PUT /api/v1/courses/:courseId/quizzes/:id
   * Cập nhật bài kiểm tra (Giảng viên)
   */
  @Put(':id')
  @Roles(UserRole.LECTURER)
  async update(
    @Param('courseId', ParseIntPipe) courseId: number,
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateQuizDto,
    @Request() req: any,
  ) {
    return this.quizService.update(id, dto, req.user.id);
  }

  /**
   * DELETE /api/v1/courses/:courseId/quizzes/:id
   * Xóa bài kiểm tra (Giảng viên)
   */
  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @Roles(UserRole.LECTURER)
  async delete(
    @Param('courseId', ParseIntPipe) courseId: number,
    @Param('id', ParseIntPipe) id: number,
    @Request() req: any,
  ): Promise<void> {
    await this.quizService.delete(id, req.user.id);
  }
}