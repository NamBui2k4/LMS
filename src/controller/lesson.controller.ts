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
import { LessonService } from '../services/lesson.service';
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
   * Xem danh sách bài giảng trong khóa học (sắp xếp theo orderIndex)
   * Tác nhân: Giảng viên, Trưởng bộ môn
   */
  @Get()
  @Roles(UserRole.LECTURER, UserRole.HEAD_OF_DEPARTMENT)
  async findAll(
    @Param('courseId', ParseIntPipe) courseId: number,
  ): Promise<LessonResponseDto[]> {
    const lessons = await this.lessonService.findByCourse(courseId);
    return lessons.map(LessonResponseDto.fromEntity);
  }

  /**
   * GET /api/v1/courses/:courseId/lessons/:id
   * Xem chi tiết bài giảng kèm danh sách học liệu
   * Tác nhân: Giảng viên, Trưởng bộ môn
   */
  @Get(':id')
  @Roles(UserRole.LECTURER, UserRole.HEAD_OF_DEPARTMENT)
  // ✅ FIX: Thêm ParseIntPipe — id từ URL là string, service.findOne(id: number)
  async findOne(
    @Param('courseId', ParseIntPipe) courseId: number,
    @Param('id', ParseIntPipe) id: number,
  ): Promise<LessonDetailResponseDto> {
    const lesson = await this.lessonService.findOne(id);
    return LessonDetailResponseDto.fromEntity(lesson);
  }

  /**
   * POST /api/v1/courses/:courseId/lessons
   * Tạo bài giảng mới trong khóa học
   * Tác nhân: Giảng viên (chỉ người tạo khóa học)
   * Khóa học phải ở trạng thái DRAFT hoặc PENDING
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
   * Chỉnh sửa nội dung bài giảng
   * Tác nhân: Giảng viên (chỉ người tạo khóa học)
   * Khóa học phải ở trạng thái DRAFT hoặc PENDING
   */
  @Put(':id')
  @Roles(UserRole.LECTURER)
  // ✅ FIX: Thêm ParseIntPipe cho id
  async update(
    @Param('courseId', ParseIntPipe) courseId: number,
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateLessonDto,
    @Request() req: any,
  ): Promise<LessonResponseDto> {
    const lesson = await this.lessonService.update(id, dto, req.user.id);
    return LessonResponseDto.fromEntity(lesson);
  }

  /**
   * PATCH /api/v1/courses/:courseId/lessons/:id/order
   * Thay đổi thứ tự bài giảng trong khóa học
   * Tác nhân: Giảng viên (chỉ người tạo khóa học)
   * Body: { orderIndex: number }
   */
  @Patch(':id/order')
  @Roles(UserRole.LECTURER)
  // ✅ FIX: Thêm ParseIntPipe cho id
  // ✅ FIX: @Body('order') → @Body('orderIndex') — khớp với DTO & service
  async reorder(
    @Param('courseId', ParseIntPipe) courseId: number,
    @Param('id', ParseIntPipe) id: number,
    @Body('orderIndex', ParseIntPipe) orderIndex: number,
    @Request() req: any,
  ): Promise<LessonResponseDto> {
    const lesson = await this.lessonService.reorder(courseId, id, orderIndex, req.user.id);
    return LessonResponseDto.fromEntity(lesson);
  }

  /**
   * DELETE /api/v1/courses/:courseId/lessons/:id
   * Xóa bài giảng
   * Tác nhân: Giảng viên (chỉ người tạo khóa học)
   * Khóa học phải ở trạng thái DRAFT hoặc PENDING
   */
  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @Roles(UserRole.LECTURER)
  // ✅ FIX: Thêm ParseIntPipe cho id
  async delete(
    @Param('courseId', ParseIntPipe) courseId: number,
    @Param('id', ParseIntPipe) id: number,
    @Request() req: any,
  ): Promise<void> {
    await this.lessonService.delete(id, req.user.id);
  }
}