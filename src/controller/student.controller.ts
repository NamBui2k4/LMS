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
  status: AccountStatus;
  reason?: string;
}

@Controller('api/v1/students')
@UseGuards(JwtAuthGuard, RolesGuard)
export class StudentController {
  constructor(private readonly studentService: StudentService) {}

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