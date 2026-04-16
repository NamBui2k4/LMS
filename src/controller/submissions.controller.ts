import {
  Controller,
  Get,
  Post,
  Patch,
  Param,
  Body,
  ParseIntPipe,
  HttpCode,
  HttpStatus,
  UseGuards,
  Request,
} from '@nestjs/common';
import {
  SubmissionService,
  CreateSubmissionDto,
  GradeSubmissionDto,
} from '../services/submissions.service';
import { JwtAuthGuard } from '../auth/guard/jwt-auth.guard';
import { RolesGuard } from '../auth/guard/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from '../common/enums/role.enum';

@Controller('api/v1')
@UseGuards(JwtAuthGuard, RolesGuard)
export class SubmissionController {
  constructor(private readonly submissionService: SubmissionService) {}

  /**
   * GET /api/v1/quizzes/:quizId/submissions
   * Danh sách bài nộp của quiz (Giảng viên xem)
   */
  @Get('quizzes/:quizId/submissions')
  @Roles(UserRole.LECTURER, UserRole.HEAD_OF_DEPARTMENT)
  async findByQuiz(@Param('quizId', ParseIntPipe) quizId: number) {
    return this.submissionService.findByQuiz(quizId);
  }

  /**
   * GET /api/v1/submissions/:id
   * Chi tiết một bài nộp
   */
  @Get('submissions/:id')
  @Roles(UserRole.LECTURER, UserRole.HEAD_OF_DEPARTMENT, UserRole.STUDENT)
  async findOne(@Param('id', ParseIntPipe) id: number) {
    return this.submissionService.findOne(id);
  }

  /**
   * POST /api/v1/quizzes/:quizId/submissions
   * Học viên nộp bài
   */
  @Post('quizzes/:quizId/submissions')
  @HttpCode(HttpStatus.CREATED)
  @Roles(UserRole.STUDENT)
  async submit(
    @Param('quizId', ParseIntPipe) quizId: number,
    @Body() dto: CreateSubmissionDto,
    @Request() req: any,
  ) {
    return this.submissionService.submit(quizId, req.user.id, dto);
  }

  /**
   * PATCH /api/v1/submissions/:id/grade
   * Giảng viên chấm điểm bài nộp
   */
  @Patch('submissions/:id/grade')
  @Roles(UserRole.LECTURER)
  async grade(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: GradeSubmissionDto,
    @Request() req: any,
  ) {
    return this.submissionService.grade(id, dto, req.user.id);
  }

  @Post('submissions/:id/grade')
  @Roles(UserRole.LECTURER)
  async gradeViaForm(
    @Param('id', ParseIntPipe) id: number,
    @Body() body: any,
    @Request() req: any,
  ) {
    const dto: GradeSubmissionDto = {
      score: Number(body.score),
      note: body.note,
    };
    return this.submissionService.grade(id, dto, req.user.id);
  }

  /**
   * PATCH /api/v1/submissions/:id/regrade
   * Học viên yêu cầu phúc khảo
   */
  @Patch('submissions/:id/regrade')
  @Roles(UserRole.STUDENT)
  async requestRegrade(
    @Param('id', ParseIntPipe) id: number,
    @Body('note') note: string,
    @Request() req: any,
  ) {
    return this.submissionService.requestRegrade(id, note, req.user.id);
  }
}