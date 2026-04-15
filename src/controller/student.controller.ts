import {
  Controller,
  Get,
  Put,
  Patch,
  Param,
  Body,
  Query,
  Request,
  Req,
  Res,
  UseGuards,
  HttpCode,
  HttpStatus,
  ForbiddenException,
  ParseIntPipe,
} from '@nestjs/common';
import { StudentService } from '../services/student.service';
import { JwtAuthGuard } from '../auth/guard/jwt-auth.guard';
import { RolesGuard } from '../auth/guard/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from '../common/enums/role.enum';
import { UpdateStudentDto } from '../dto/student.dto';
import { AccountStatus } from '../common/enums/account-status.enum';

export class UpdateAccountStatusDto {
  status!: AccountStatus;
  reason?: string;
}

@Controller('api/v1/students')
@UseGuards(JwtAuthGuard, RolesGuard)
export class StudentController {
  constructor(private readonly studentService: StudentService) {}

  // Route trả về trang hồ sơ cá nhân student (EJS)
  @Get('/profile')
  async renderProfile(@Req() req: any, @Res() res: any) {
    const userId = Number(req.userPayload?.sub);
    if (!userId) return res.redirect('/login/student');
    const user = await this.studentService.getProfileByUserId(userId);
    return res.render('student/profile', { user });
  }

  // Route trả về trang bài tập student (EJS)
  @Get('/assignments')
  async renderAssignments(@Req() req: any, @Res() res: any) {
    const userId = Number(req.userPayload?.sub);
    if (!userId) return res.redirect('/login/student');
    // Lấy submissions (bài tập đã nộp) và enrollments (để lấy các bài tập cần làm)
    const submissions = await this.studentService.getSubmissions(userId);
    const enrollments = await this.studentService.getEnrollments(userId);
    // TODO: Xử lý mapping assignment thực tế nếu có bảng assignment riêng
    return res.render('student/assignments', { submissions, enrollments });
  }

  // Route trả về trang điểm danh student (EJS)
  @Get('/attendance')
  async renderAttendance(@Req() req: any, @Res() res: any) {
    const userId = Number(req.userPayload?.sub);
    if (!userId) return res.redirect('/login/student');
    const enrollments = await this.studentService.getEnrollments(userId);
    // TODO: Nếu có bảng điểm danh riêng, lấy dữ liệu điểm danh thực tế
    return res.render('student/attendance', { enrollments });
  }

  @Get()
  @Roles(UserRole.LECTURER, UserRole.HEAD_OF_DEPARTMENT)
  async findAll(
    @Query('page') page: number = 1,
    @Query('limit') limit: number = 10,
  ) {
    return this.studentService.findAll(page, limit);
  }

  // ✅ FIX: ParseIntPipe để convert ':id' string → number trước khi vào service
  @Get(':id')
  @Roles(UserRole.LECTURER, UserRole.HEAD_OF_DEPARTMENT, UserRole.STUDENT)
  async findOne(
    @Param('id', ParseIntPipe) id: number,
    @Request() req: any,
  ) {
    await this.studentService.assertIsOwnerOrStaff(id, req.user.id, req.user.role);
    return this.studentService.findOne(id);
  }

  // ✅ FIX: ParseIntPipe; so sánh number === number (không phải string)
  @Put(':id')
  @HttpCode(HttpStatus.OK)
  @Roles(UserRole.STUDENT)
  async updateProfile(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateStudentDto,
    @Request() req: any,
  ) {
    if (req.user.id !== id) {
      throw new ForbiddenException('Bạn chỉ được cập nhật hồ sơ của chính mình.');
    }
    return this.studentService.updateProfile(id, dto);
  }

  // ✅ FIX: ParseIntPipe
  @Patch(':id/status')
  @HttpCode(HttpStatus.OK)
  @Roles(UserRole.LECTURER, UserRole.HEAD_OF_DEPARTMENT)
  async updateAccountStatus(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateAccountStatusDto,
  ) {
    return this.studentService.updateAccountStatus(id, dto.status, dto.reason);
  }

  // ✅ FIX: ParseIntPipe
  @Get(':id/enrollments')
  @Roles(UserRole.LECTURER, UserRole.HEAD_OF_DEPARTMENT, UserRole.STUDENT)
  async getEnrollments(
    @Param('id', ParseIntPipe) id: number,
    @Request() req: any,
  ) {
    await this.studentService.assertIsOwnerOrStaff(id, req.user.id, req.user.role);
    return this.studentService.getEnrollments(id);
  }

  // ✅ FIX: ParseIntPipe
  @Get(':id/submissions')
  @Roles(UserRole.LECTURER, UserRole.HEAD_OF_DEPARTMENT, UserRole.STUDENT)
  async getSubmissions(
    @Param('id', ParseIntPipe) id: number,
    @Request() req: any,
  ) {
    await this.studentService.assertIsOwnerOrStaff(id, req.user.id, req.user.role);
    return this.studentService.getSubmissions(id);
  }
}