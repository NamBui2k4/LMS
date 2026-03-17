import {
  Controller,
  Get,
  Post,
  Put,
  Patch,
  Body,
  Param,
  UseGuards,
  HttpStatus,
  HttpCode,
  ParseIntPipe,
  Request,
} from '@nestjs/common';
import { LecturerService } from '../services/lecturer.service';
import { JwtAuthGuard } from '../auth/guard/jwt-auth.guard';
import { RolesGuard } from '../auth/guard/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from '../common/enums/role.enum';
import { UpdateLecturerDto, LecturerResponseDto } from '../dto/lecturer.dto';
import { CourseResponseDto } from '../dto/course.dto';
import { CreateLecturerDto } from '../dto/lecturer.dto'; // ✅ thêm

@Controller('api/v1/lecturers')
@UseGuards(JwtAuthGuard, RolesGuard)
export class LecturerController {
  constructor(private readonly lecturerService: LecturerService) {}


  /**
   * POST /api/v1/lecturers
   * Admin tạo tài khoản giảng viên mới
   */
  @Post()
  @HttpCode(HttpStatus.CREATED)
  @Roles(UserRole.ADMIN)
  async createLecturer(
    @Body() dto: CreateLecturerDto,
  ): Promise<LecturerResponseDto> {
    const lecturer = await this.lecturerService.createLecturer(dto);
    return LecturerResponseDto.fromEntity(lecturer);
  }

  /**
   * PATCH /api/v1/lecturers/:id/promote
   * Admin promote Lecturer → HEAD_OF_DEPARTMENT
   */
  @Patch(':id/promote')
  @HttpCode(HttpStatus.OK)
  @Roles(UserRole.ADMIN)
  async promoteToHoD(
    @Param('id', ParseIntPipe) id: number,
  ): Promise<LecturerResponseDto> {
    const lecturer = await this.lecturerService.promoteToHoD(id);
    return LecturerResponseDto.fromEntity(lecturer);
  }

  /**
   * GET /api/v1/lecturers
   * Xem danh sách giảng viên
   * [SỬA] UserRole.HEAD_OF_DEPARTMENT → UserRole.DEPARTMENT_HEAD để khớp với role.enum.ts
   * [SỬA] Trả về LecturerResponseDto thay vì raw Lecturer entity (ẩn passwordHash)
   */
  @Get()
  @Roles(UserRole.HEAD_OF_DEPARTMENT, UserRole.ADMIN)
  async findAll(): Promise<LecturerResponseDto[]> {
    const lecturers = await this.lecturerService.getAllLecturers();
    return lecturers.map(LecturerResponseDto.fromEntity);
  }

  /**
   * GET /api/v1/lecturers/:id
   * Xem hồ sơ cá nhân hoặc xem chi tiết giảng viên
   * [SỬA] UserRole.HEAD_OF_DEPARTMENT → UserRole.DEPARTMENT_HEAD
   * [SỬA] Trả về LecturerResponseDto
   */
  @Get(':id')
  @Roles(UserRole.LECTURER, UserRole.HEAD_OF_DEPARTMENT)
  async getProfile(@Param('id', ParseIntPipe) id: number): Promise<LecturerResponseDto> {
    const lecturer = await this.lecturerService.getLecturerProfile(id);
    return LecturerResponseDto.fromEntity(lecturer);
  }

  /**
   * PUT /api/v1/lecturers/:id
   * Cập nhật trình độ / chuyên môn / hồ sơ
   * [MỚI] Thêm kiểm tra quyền: giảng viên chỉ được sửa hồ sơ của chính mình
   * [SỬA] Trả về LecturerResponseDto
   */
  @Put(':id')
  @Roles(UserRole.LECTURER)
  @HttpCode(HttpStatus.OK)
  async updateProfile(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateDto: UpdateLecturerDto,
    @Request() req: any,
  ): Promise<LecturerResponseDto> {
    // Kiểm tra giảng viên chỉ sửa được hồ sơ của chính mình
    await this.lecturerService.assertCanUpdateProfile(id, req.user.id);
    const lecturer = await this.lecturerService.updateProfile(id, updateDto);
    return LecturerResponseDto.fromEntity(lecturer);
  }

  /**
   * GET /api/v1/lecturers/:id/stats
   * Thống kê hoạt động giảng dạy (số khóa học, bài giảng, học liệu)
   * [SỬA] UserRole.HEAD_OF_DEPARTMENT → UserRole.DEPARTMENT_HEAD
   * [SỬA] Trả về LecturerResponseDto (stats nằm trong relations)
   */
  @Get(':id/stats')
  @Roles(UserRole.HEAD_OF_DEPARTMENT)
  async getStats(@Param('id', ParseIntPipe) id: number): Promise<LecturerResponseDto> {
    const lecturer = await this.lecturerService.getTeachingStatistics(id);
    return LecturerResponseDto.fromEntity(lecturer);
  }

  /**
   * GET /api/v1/lecturers/:id/created-courses
   * [MỚI] Xem danh sách khóa học do giảng viên tạo
   * Phục vụ chức năng "Xem danh sách khóa học" lọc theo người tạo
   * Dành cho Giảng viên xem của mình và Trưởng bộ môn xem tổng quan
   */
  @Get(':id/created-courses')
  @Roles(UserRole.LECTURER, UserRole.HEAD_OF_DEPARTMENT)
  async getCreatedCourses(
    @Param('id', ParseIntPipe) id: number,
  ): Promise<CourseResponseDto[]> {
    const courses = await this.lecturerService.getCreatedCourses(id);
    return courses.map(CourseResponseDto.fromEntity);
  }

  /**
   * GET /api/v1/lecturers/:id/assigned-courses
   * [MỚI] Xem danh sách khóa học giảng viên được phân công giảng dạy
   * Dành cho Giảng viên xem lịch giảng dạy và Trưởng bộ môn quản lý phân công
   */
  @Get(':id/assigned-courses')
  @Roles(UserRole.LECTURER, UserRole.HEAD_OF_DEPARTMENT)
  async getAssignedCourses(
    @Param('id', ParseIntPipe) id: number,
  ): Promise<CourseResponseDto[]> {
    const courses = await this.lecturerService.getAssignedCourses(id);
    return courses.map(CourseResponseDto.fromEntity);
  }

  /**
   * GET /api/v1/lecturers/:id/grading-stats
   * [MỚI] Xem thống kê chấm điểm của giảng viên (số quiz, bài nộp đã chấm)
   * Dành cho Trưởng bộ môn theo dõi hoạt động chấm bài
   */
  @Get(':id/grading-stats')
  @Roles(UserRole.HEAD_OF_DEPARTMENT)
  async getGradingStats(@Param('id', ParseIntPipe) id: number): Promise<LecturerResponseDto> {
    const lecturer = await this.lecturerService.getGradingStats(id);
    return LecturerResponseDto.fromEntity(lecturer);
  }
}