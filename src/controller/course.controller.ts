import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Patch,
  UseGuards,
  Request,
  ParseIntPipe,
  HttpCode,
  HttpStatus,
  Query,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guard/jwt-auth.guard';
import { RolesGuard } from '../auth/guard/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from '../common/enums/role.enum';
import { CourseService } from '../services/course.service';
import { Course } from '../models/courses.entity';
import { CourseStatus } from '../common/enums/course-status.enum';

class CreateCourseDto {
  title: string;
  description?: string;
  categoryId: number;
}

class ChangeStatusDto {
  status: CourseStatus;
}

@Controller('api/v1/courses')
@UseGuards(JwtAuthGuard, RolesGuard)
export class CourseController {
  constructor(private readonly courseService: CourseService) {}

  @Get()
  @Roles(UserRole.LECTURER, UserRole.HEAD_OF_DEPARTMENT)
  async getAllCourses(@Request() req): Promise<Course[]> {
    return this.courseService.findAll(req.user.id, req.user.role);
  }

  @Get(':id')
  @Roles(UserRole.LECTURER, UserRole.HEAD_OF_DEPARTMENT)
  async getCourseDetail(
    @Param('id', ParseIntPipe) id: number,
    @Request() req,
  ): Promise<Course> {
    return this.courseService.findOne(id, req.user.id, req.user.role);
  }

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @Roles(UserRole.LECTURER, UserRole.HEAD_OF_DEPARTMENT)
  async createCourse(
    @Body() dto: CreateCourseDto,
    @Request() req,
  ): Promise<Course> {
    return this.courseService.create({
      ...dto,
      createdBy: req.user, // giả sử req.user là Lecturer hoặc có trường hợp DepartmentHead cũng tạo được
    });
  }

  @Patch(':id/status')
  @Roles(UserRole.LECTURER, UserRole.HEAD_OF_DEPARTMENT)
  async updateCourseStatus(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: ChangeStatusDto,
    @Request() req,
  ): Promise<Course> {
    return this.courseService.changeStatus(id, dto.status, req.user, req.user.role);
  }
}