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
import { AssignedLecturersService } from '../services/assigned-lecturers.service';
import { JwtAuthGuard } from '../auth/guard/jwt-auth.guard';
import { RolesGuard } from '../auth/guard/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from '../common/enums/role.enum';

export class AssignLecturerDto {
  lecturerId: number;
}

@Controller('api/v1/courses/:courseId/assigned-lecturers')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.HEAD_OF_DEPARTMENT)
export class AssignedLecturersController {
  constructor(private readonly assignedService: AssignedLecturersService) {}

  /**
   * GET /api/v1/courses/:courseId/assigned-lecturers
   * Danh sách giảng viên được phân công trong khóa học
   */
  @Get()
  async findByCourse(@Param('courseId', ParseIntPipe) courseId: number) {
    return this.assignedService.findByCourse(courseId);
  }

  /**
   * POST /api/v1/courses/:courseId/assigned-lecturers
   * Phân công giảng viên vào khóa học
   */
  @Post()
  @HttpCode(HttpStatus.CREATED)
  async assign(
    @Param('courseId', ParseIntPipe) courseId: number,
    @Body() dto: AssignLecturerDto,
  ) {
    return this.assignedService.assign(courseId, dto.lecturerId);
  }

  /**
   * DELETE /api/v1/courses/:courseId/assigned-lecturers/:lecturerId
   * Hủy phân công giảng viên
   */
  @Delete(':lecturerId')
  @HttpCode(HttpStatus.NO_CONTENT)
  async unassign(
    @Param('courseId', ParseIntPipe) courseId: number,
    @Param('lecturerId', ParseIntPipe) lecturerId: number,
  ): Promise<void> {
    await this.assignedService.unassign(courseId, lecturerId);
  }
}