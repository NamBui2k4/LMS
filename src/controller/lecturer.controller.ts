import { Controller, Get, Put, Body, Param, UseGuards, HttpStatus, HttpCode, ParseIntPipe } from '@nestjs/common';
import { LecturerService } from '../services/lecturer.service';
import { JwtAuthGuard } from '../auth/guard/jwt-auth.guard';
import { RolesGuard } from '../auth/guard/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from '../common/enums/role.enum';
import { UpdateLecturerDto } from '../dto/lecturer.dto';
import { Lecturer } from '../models/lecturers.entity';

@Controller('api/v1/lecturers')
@UseGuards(JwtAuthGuard, RolesGuard)
export class LecturerController {
  constructor(private readonly lecturerService: LecturerService) {}

  /**
   * Xem danh sách giảng viên
   * Dành cho Trưởng bộ môn và Admin
   */
  @Get()
  @Roles(UserRole.HEAD_OF_DEPARTMENT, UserRole.ADMIN)
  async findAll(): Promise<Lecturer[]> {
    return await this.lecturerService.getAllLecturers();
  }

  /**
   * Xem hồ sơ cá nhân hoặc xem chi tiết giảng viên
   */
  @Get(':id')
  @Roles(UserRole.LECTURER, UserRole.HEAD_OF_DEPARTMENT)
  async getProfile(@Param('id', ParseIntPipe) id: number): Promise<Lecturer> {
    return await this.lecturerService.getLecturerProfile(id);
  }

  /**
   * Cập nhật trình độ / chuyên môn / hồ sơ
   */
  @Put(':id')
  @Roles(UserRole.LECTURER)
  @HttpCode(HttpStatus.OK)
  async updateProfile(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateDto: UpdateLecturerDto
  ): Promise<Lecturer> {
    return await this.lecturerService.updateProfile(id, updateDto);
  }

  /**
   * Thống kê hoạt động giảng dạy
   * Dành cho Trưởng bộ môn
   */
  @Get(':id/stats')
  @Roles(UserRole.HEAD_OF_DEPARTMENT)
  async getStats(@Param('id', ParseIntPipe) id: number): Promise<Lecturer> {
    return await this.lecturerService.getTeachingStatistics(id);
  }
}