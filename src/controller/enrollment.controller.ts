import {
  Controller,
  Get,
  Post,
  Delete,
  Param,
  Body,
  ParseIntPipe,
  HttpCode,
  HttpStatus,
  UseGuards,
} from '@nestjs/common';
import { EnrollmentService } from '../services/enrollment.service';
import { JwtAuthGuard } from '../auth/guard/jwt-auth.guard';
import { RolesGuard } from '../auth/guard/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from '../common/enums/role.enum';

export class EnrollStudentDto {
  studentId: string;
}

@Controller('api/v1/courses/:courseId/enrollments')
@UseGuards(JwtAuthGuard, RolesGuard)
export class EnrollmentController {
  constructor(private readonly enrollmentService: EnrollmentService) {}

  /**
   * GET /api/v1/courses/:courseId/enrollments
   * Xem danh sách học viên ghi danh trong khóa học
   * Tác nhân: Giảng viên, Trưởng bộ môn
   */
  @Get()
  @Roles(UserRole.LECTURER, UserRole.HEAD_OF_DEPARTMENT)
  async findByCourse(@Param('courseId', ParseIntPipe) courseId: number) {
    return this.enrollmentService.findByCourse(courseId);
  }

  /**
   * POST /api/v1/courses/:courseId/enrollments
   * Thêm học viên vào khóa học
   * Tác nhân: Giảng viên, Trưởng bộ môn
   */
  @Post()
  @HttpCode(HttpStatus.CREATED)
  @Roles(UserRole.LECTURER, UserRole.HEAD_OF_DEPARTMENT)
  async enroll(
    @Param('courseId', ParseIntPipe) courseId: number,
    @Body() dto: EnrollStudentDto,
  ) {
    return this.enrollmentService.enroll(dto.studentId, courseId);
  }

  /**
   * DELETE /api/v1/courses/:courseId/enrollments/:studentId
   * Xóa học viên khỏi khóa học
   * Tác nhân: Giảng viên, Trưởng bộ môn
   */
  @Delete(':studentId')
  @HttpCode(HttpStatus.NO_CONTENT)
  @Roles(UserRole.LECTURER, UserRole.HEAD_OF_DEPARTMENT)
  async unenroll(
    @Param('courseId', ParseIntPipe) courseId: number,
    @Param('studentId') studentId: string,
  ): Promise<void> {
    await this.enrollmentService.unenroll(studentId, courseId);
  }
}
