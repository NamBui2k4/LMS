import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Param,
  Body,
  ParseIntPipe,
  HttpCode,
  HttpStatus,
  UseGuards,
} from '@nestjs/common';
import {
  DepartmentHeadService,
  AppointDeptHeadDto,
} from '../services/department-heads.service';
import { JwtAuthGuard } from '../auth/guard/jwt-auth.guard';
import { RolesGuard } from '../auth/guard/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from '../common/enums/role.enum';

export class UpdateDeptHeadDto {
  termEnd?: Date;
}

@Controller('api/v1/department-heads')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.ADMIN)
export class DepartmentHeadController {
  constructor(private readonly deptHeadService: DepartmentHeadService) {}

  /**
   * GET /api/v1/department-heads
   * Danh sách tất cả trưởng bộ môn
   */
  @Get()
  async findAll() {
    return this.deptHeadService.findAll();
  }

  /**
   * GET /api/v1/department-heads/active
   * Danh sách trưởng bộ môn đang hoạt động
   */
  @Get('active')
  async findActive() {
    return this.deptHeadService.findActive();
  }

  /**
   * GET /api/v1/department-heads/:id
   * Chi tiết trưởng bộ môn
   */
  @Get(':id')
  async findOne(@Param('id', ParseIntPipe) id: number) {
    return this.deptHeadService.findOne(id);
  }

  /**
   * POST /api/v1/department-heads
   * Bổ nhiệm trưởng bộ môn
   */
  @Post()
  @HttpCode(HttpStatus.CREATED)
  async appoint(@Body() dto: AppointDeptHeadDto) {
    return this.deptHeadService.appoint(dto);
  }

  /**
   * PUT /api/v1/department-heads/:id
   * Cập nhật thông tin nhiệm kỳ
   */
  @Put(':id')
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateDeptHeadDto,
  ) {
    return this.deptHeadService.update(id, dto.termEnd);
  }

  /**
   * DELETE /api/v1/department-heads/:id
   * Miễn nhiệm trưởng bộ môn
   */
  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  async remove(@Param('id', ParseIntPipe) id: number): Promise<void> {
    await this.deptHeadService.remove(id);
  }

  /**
   * GET /api/v1/department-heads/:id/reviewed-courses
   * [MỚI] Xem danh sách khóa học đã được Trưởng bộ môn này duyệt
   * Phục vụ báo cáo hoạt động phê duyệt nội dung đào tạo cho Admin
   */
  @Get(':id/reviewed-courses')
  async getReviewedCourses(@Param('id', ParseIntPipe) id: number) {
    return this.deptHeadService.getReviewedCourses(id);
  }

  /**
   * GET /api/v1/department-heads/:id/assignments
   * [MỚI] Xem thông tin phân công giảng dạy do Trưởng bộ môn quản lý
   * Phục vụ Admin xem tổng quan nhân sự theo từng Trưởng bộ môn
   */
  @Get(':id/assignments')
  async getAssignments(@Param('id', ParseIntPipe) id: number) {
    return this.deptHeadService.findByIdWithAssignments(id);
  }

  /**
   * GET /api/v1/department-heads/:id/active-check
   * [MỚI] Kiểm tra Trưởng bộ môn có đang trong nhiệm kỳ không
   * Phục vụ Admin xác nhận trạng thái nhiệm kỳ trước khi thực hiện thao tác
   */
  @Get(':id/active-check')
  async checkActiveTerm(@Param('id', ParseIntPipe) id: number) {
    await this.deptHeadService.assertIsInActiveTerm(id);
    return { instructorId: id, isInActiveTerm: true };
  }
}