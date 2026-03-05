import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Patch,
  Param,
  Body,
  ParseIntPipe,
  HttpCode,
  HttpStatus,
  UseGuards,
  Request,
} from '@nestjs/common';
import { LessonService } from '../services/lessons.service';
import {
  CreateLessonDto,
  UpdateLessonDto,
  LessonResponseDto,
  LessonDetailResponseDto,
} from '../dto/lesson.dto';
import { JwtAuthGuard } from '../auth/guard/jwt-auth.guard';
import { RolesGuard } from '../auth/guard/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from '../common/enums/role.enum';

@Controller('api/v1/courses/:courseId/lessons')
@UseGuards(JwtAuthGuard, RolesGuard)
export class LessonController {
  constructor(private readonly lessonService: LessonService) {}

  /**
   * GET /api/v1/courses/:courseId/lessons
   * Xem danh sách bài giảng trong khóa học
   */
  @Get()
  @Roles(UserRole.LECTURER, UserRole.DEPARTMENT_HEAD)
  async findAll(
    @Param('courseId', ParseIntPipe) courseId: number,
  ): Promise<LessonResponseDto[]> {
    const lessons = await this.lessonService.findByCourse(courseId);
    return lessons.map(LessonResponseDto.fromEntity);
  }

  /**
   * GET /api/v1/courses/:courseId/lessons/:id
   * Xem chi tiết bài giảng
   */
  @Get(':id')
  @Roles(UserRole.LECTURER, UserRole.DEPARTMENT_HEAD)
  async findOne(
    @Param('courseId', ParseIntPipe) courseId: number,
    @Param('id') id: string,
  ): Promise<LessonDetailResponseDto> {
    const lesson = await this.lessonService.findOne(id);
    return LessonDetailResponseDto.fromEntity(lesson);
  }

  /**
   * POST /api/v1/courses/:courseId/lessons
   * Tạo bài giảng mới (Giảng viên)
   */
  @Post()
  @HttpCode(HttpStatus.CREATED)
  @Roles(UserRole.LECTURER)
  async create(
    @Param('courseId', ParseIntPipe) courseId: number,
    @Body() dto: CreateLessonDto,
    @Request() req: any,
  ): Promise<LessonResponseDto> {
    const lesson = await this.lessonService.create(courseId, dto, req.user.id);
    return LessonResponseDto.fromEntity(lesson);
  }

  /**
   * PUT /api/v1/courses/:courseId/lessons/:id
   * Chỉnh sửa bài giảng (Giảng viên)
   */
  @Put(':id')
  @Roles(UserRole.LECTURER)
  async update(
    @Param('courseId', ParseIntPipe) courseId: number,
    @Param('id') id: string,
    @Body() dto: UpdateLessonDto,
    @Request() req: any,
  ): Promise<LessonResponseDto> {
    const lesson = await this.lessonService.update(id, dto, req.user.id);
    return LessonResponseDto.fromEntity(lesson);
  }

  /**
   * PATCH /api/v1/courses/:courseId/lessons/:id/order
   * Thay đổi thứ tự bài giảng (Giảng viên)
   */
  @Patch(':id/order')
  @Roles(UserRole.LECTURER)
  async reorder(
    @Param('courseId', ParseIntPipe) courseId: number,
    @Param('id') id: string,
    @Body('order', ParseIntPipe) order: number,
    @Request() req: any,
  ): Promise<LessonResponseDto> {
    const lesson = await this.lessonService.reorder(courseId, id, order, req.user.id);
    return LessonResponseDto.fromEntity(lesson);
  }

  /**
   * DELETE /api/v1/courses/:courseId/lessons/:id
   * Xóa bài giảng (Giảng viên)
   */
  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @Roles(UserRole.LECTURER)
  async delete(
    @Param('courseId', ParseIntPipe) courseId: number,
    @Param('id') id: string,
    @Request() req: any,
  ): Promise<void> {
    await this.lessonService.delete(id, req.user.id);
  }
}