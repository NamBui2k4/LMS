import {
  Controller,
  Get,
  Put,
  Patch,
  Param,
  Body,
  Query,
  Request,
  UseGuards,
  HttpCode,
  HttpStatus,
  ForbiddenException,
} from '@nestjs/common';
import { StudentService } from '../services/student.service';
import { JwtAuthGuard } from '../auth/guard/jwt-auth.guard';
import { RolesGuard } from '../auth/guard/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from '../common/enums/role.enum';
import { UpdateStudentDto } from '../dto/student.dto';
import { AccountStatus } from '../common/enums/account-status.enum';

export class UpdateAccountStatusDto {
  status: AccountStatus;
  reason?: string;
}

@Controller('api/v1/students')
@UseGuards(JwtAuthGuard, RolesGuard)
export class StudentController {
  constructor(private readonly studentService: StudentService) {}

  /**
   * GET /api/v1/students
   * Xem danh sách học viên (có phân trang)
   * Tác nhân: Giảng viên, Trưởng bộ môn
   */
  @Get()
  @Roles(UserRole.LECTURER, UserRole.HEAD_OF_DEPARTMENT)
  async findAll(
    @Query('page') page: number = 1,
    @Query('limit') limit: number = 10,
  ) {
    return this.studentService.findAll(page, limit);
  }

  /**
   * GET /api/v1/students/:id
   * Xem chi tiết hồ sơ học viên
   * Tác nhân: Giảng viên, Trưởng bộ môn, hoặc chính học viên đó
   */
  @Get(':id')
  @Roles(UserRole.LECTURER, UserRole.HEAD_OF_DEPARTMENT, UserRole.STUDENT)
  async findOne(
    @Param('id') id: string,
    @Request() req: any,
  ) {
    await this.studentService.assertIsOwnerOrStaff(id, req.user.id, req.user.role);
    return this.studentService.findOne(id);
  }

  /**
   * PUT /api/v1/students/:id
   * Học viên tự cập nhật thông tin cá nhân
   * Tác nhân: Học viên (chỉ được cập nhật hồ sơ của chính mình)
   */
  @Put(':id')
  @HttpCode(HttpStatus.OK)
  @Roles(UserRole.STUDENT)
  async updateProfile(
    @Param('id') id: string,
    @Body() dto: UpdateStudentDto,
    @Request() req: any,
  ) {
    if (req.user.id !== id) {
      throw new ForbiddenException('Bạn chỉ được cập nhật hồ sơ của chính mình.');
    }
    return this.studentService.updateProfile(id, dto);
  }

  /**
   * PATCH /api/v1/students/:id/status
   * Cập nhật trạng thái tài khoản học viên (Ban/Unban)
   * Tác nhân: Giảng viên, Trưởng bộ môn
   */
  @Patch(':id/status')
  @HttpCode(HttpStatus.OK)
  @Roles(UserRole.LECTURER, UserRole.HEAD_OF_DEPARTMENT)
  async updateAccountStatus(
    @Param('id') id: string,
    @Body() dto: UpdateAccountStatusDto,
  ) {
    return this.studentService.updateAccountStatus(id, dto.status, dto.reason);
  }

  /**
   * GET /api/v1/students/:id/enrollments
   * Xem danh sách khóa học mà học viên đã ghi danh
   * Tác nhân: Giảng viên, Trưởng bộ môn, hoặc chính học viên đó
   */
  @Get(':id/enrollments')
  @Roles(UserRole.LECTURER, UserRole.HEAD_OF_DEPARTMENT, UserRole.STUDENT)
  async getEnrollments(
    @Param('id') id: string,
    @Request() req: any,
  ) {
    await this.studentService.assertIsOwnerOrStaff(id, req.user.id, req.user.role);
    return this.studentService.getEnrollments(id);
  }

  /**
   * GET /api/v1/students/:id/submissions
   * Xem lịch sử bài nộp của học viên
   * Tác nhân: Giảng viên, Trưởng bộ môn, hoặc chính học viên đó
   */
  @Get(':id/submissions')
  @Roles(UserRole.LECTURER, UserRole.HEAD_OF_DEPARTMENT, UserRole.STUDENT)
  async getSubmissions(
    @Param('id') id: string,
    @Request() req: any,
  ) {
    await this.studentService.assertIsOwnerOrStaff(id, req.user.id, req.user.role);
    return this.studentService.getSubmissions(id);
  }
}