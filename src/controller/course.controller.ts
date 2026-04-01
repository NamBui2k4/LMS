import {
  Controller, Get, Post, Body, Param,
  Patch, UseGuards, Request, ParseIntPipe,
  HttpCode, HttpStatus, BadRequestException,
  NotFoundException,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guard/jwt-auth.guard';
import { RolesGuard } from '../auth/guard/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from '../common/enums/role.enum';
import { CourseService } from '../services/course.service';
import { LecturerService } from '../services/lecturer.service';
import { CourseStatus } from '../common/enums/course-status.enum';
import { DepartmentHeadService } from '../services/department-heads.service';
// ✅ Import từ course.dto.ts thay vì khai báo lại
import {
  CreateCourseDto,
  ChangeCourseStatusDto,
  CourseResponseDto,
} from '../dto/course.dto';
import { DepartmentHead } from 'src/models/department-heads.entity';
import { Lecturer } from 'src/models/lecturers.entity';

@Controller('api/v1/courses')
@UseGuards(JwtAuthGuard, RolesGuard)
export class CourseController {
  constructor(
    private readonly courseService: CourseService,
    private readonly lecturerService: LecturerService, // ✅ thêm để load entity
    private readonly deptHeadService: DepartmentHeadService   // ← Thêm dòng này
  ) {}

  @Get()
  @Roles(UserRole.LECTURER, UserRole.HEAD_OF_DEPARTMENT)
  async getAllCourses(@Request() req): Promise<CourseResponseDto[]> {
    const courses = await this.courseService.findAll(req.user.id, req.user.role);
    return courses.map(CourseResponseDto.fromEntity);
  }

  @Get(':id')
  @Roles(UserRole.LECTURER, UserRole.HEAD_OF_DEPARTMENT)
  async getCourseDetail(
    @Param('id', ParseIntPipe) id: number,
    @Request() req,
  ): Promise<CourseResponseDto> {
    const course = await this.courseService.findOne(id, req.user.id, req.user.role);
    return CourseResponseDto.fromEntity(course);
  }

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @Roles(UserRole.LECTURER, UserRole.HEAD_OF_DEPARTMENT)
  async createCourse(
    @Body() dto: CreateCourseDto, // ✅ dùng DTO đúng có decorator
    @Request() req,
  ): Promise<CourseResponseDto> {
    // ✅ Load Lecturer entity thật từ DB — req.user chỉ là JWT payload
    const lecturer = await this.lecturerService.getLecturerProfile(req.user.id);

    if (dto.categoryId === undefined) {
      throw new BadRequestException('categoryId là bắt buộc');
    }
    const course = await this.courseService.create({
      title:       dto.title,
      description: dto.description,
      categoryId:  dto.categoryId,
      createdBy:   lecturer, // ✅ entity thật, có userId
    });
    return CourseResponseDto.fromEntity(course);
  }

    @Patch(':id/status')
  @Roles(UserRole.LECTURER, UserRole.HEAD_OF_DEPARTMENT)
  async updateCourseStatus(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: ChangeCourseStatusDto,
    @Request() req,
  ): Promise<CourseResponseDto> {
    try {
      console.log('PATCH /courses/:id/status', {
        id,
        status: dto.status,
        userId: req.user.id,
        userRole: req.user.role,
      });

      let actor: Lecturer | DepartmentHead;

      if (req.user.role === UserRole.HEAD_OF_DEPARTMENT) {
        // ✅ Load DepartmentHead entity khi là Trưởng bộ môn
        const deptHead = await this.deptHeadService?.findOne(req.user.id); // cần inject DepartmentHeadService
        if (!deptHead) {
          throw new NotFoundException('Không tìm thấy thông tin Trưởng bộ môn');
        }
        actor = deptHead;
      } else {
        // Load Lecturer entity khi là Giảng viên
        actor = await this.lecturerService.getLecturerProfile(req.user.id);
      }

      const course = await this.courseService.changeStatus(
        id,
        dto.status,
        actor,
        req.user.role,
      );

      return CourseResponseDto.fromEntity(course);
    } catch (error) {
      console.error('Error when updating course status:', error);
      throw error;
    }
  }
}