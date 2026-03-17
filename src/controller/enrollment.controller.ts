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

// ✅ FIX: studentId: string → number
//         Service enroll(studentId: number) — phải khớp kiểu dữ liệu
export class EnrollStudentDto {
  studentId: number;
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
   * Body: { studentId: number }
   */
  @Post()
  @HttpCode(HttpStatus.CREATED)
  @Roles(UserRole.LECTURER, UserRole.HEAD_OF_DEPARTMENT)
  async enroll(
    @Param('courseId', ParseIntPipe) courseId: number,
    @Body() dto: EnrollStudentDto,
  ) {
    // dto.studentId giờ là number → khớp service.enroll(studentId: number, courseId: number)
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
    // ✅ FIX: Thêm ParseIntPipe để convert string → number
    //         studentId từ URL path luôn là string, service.unenroll expect number (userId bigint)
    @Param('studentId', ParseIntPipe) studentId: number,
  ): Promise<void> {
    await this.enrollmentService.unenroll(studentId, courseId);
  }
}