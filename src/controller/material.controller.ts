import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Patch,
  Param,
  Body,
  ParseIntPipe,
  HttpCode,
  HttpStatus,
  UseGuards,
  Request,
} from '@nestjs/common';
import { MaterialService } from '../services/material.service';
import {
  CreateMaterialDto,
  UpdateMaterialDto,
  MaterialResponseDto,
} from '../dto/material.dto';
import { JwtAuthGuard } from '../auth/guard/jwt-auth.guard';
import { RolesGuard } from '../auth/guard/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from '../common/enums/role.enum';

@Controller('api/v1/lessons/:lessonId/materials')
@UseGuards(JwtAuthGuard, RolesGuard)
export class MaterialController {
  constructor(private readonly materialService: MaterialService) {}

  /**
   * GET /api/v1/lessons/:lessonId/materials
   * Xem danh sách học liệu trong bài giảng
   */
  @Get()
  @Roles(UserRole.LECTURER, UserRole.HEAD_OF_DEPARTMENT)
  async findAll(@Param('lessonId') lessonId: string): Promise<MaterialResponseDto[]> {
    const materials = await this.materialService.findByLesson(lessonId);
    return materials.map(MaterialResponseDto.fromEntity);
  }

  /**
   * GET /api/v1/lessons/:lessonId/materials/:id
   * Xem chi tiết học liệu
   */
  @Get(':id')
  @Roles(UserRole.LECTURER, UserRole.HEAD_OF_DEPARTMENT)
  async findOne(
    @Param('lessonId') lessonId: string,
    @Param('id', ParseIntPipe) id: number,
  ): Promise<MaterialResponseDto> {
    const material = await this.materialService.findOne(id);
    return MaterialResponseDto.fromEntity(material);
  }

  /**
   * POST /api/v1/lessons/:lessonId/materials
   * Thêm học liệu mới (Giảng viên)
   */
  @Post()
  @HttpCode(HttpStatus.CREATED)
  @Roles(UserRole.LECTURER)
  async create(
    @Param('lessonId') lessonId: string,
    @Body() dto: CreateMaterialDto,
    @Request() req: any,
  ): Promise<MaterialResponseDto> {
    const material = await this.materialService.create(lessonId, dto, req.user.id);
    return MaterialResponseDto.fromEntity(material);
  }

  /**
   * PUT /api/v1/lessons/:lessonId/materials/:id
   * Chỉnh sửa học liệu (Giảng viên)
   */
  @Put(':id')
  @Roles(UserRole.LECTURER)
  async update(
    @Param('lessonId') lessonId: string,
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateMaterialDto,
    @Request() req: any,
  ): Promise<MaterialResponseDto> {
    const material = await this.materialService.update(id, dto, req.user.id);
    return MaterialResponseDto.fromEntity(material);
  }

  /**
   * PATCH /api/v1/lessons/:lessonId/materials/:id/order
   * Sắp xếp thứ tự học liệu (Giảng viên)
   */
  @Patch(':id/order')
  @Roles(UserRole.LECTURER)
  async reorder(
    @Param('lessonId') lessonId: string,
    @Param('id', ParseIntPipe) id: number,
    @Body('order', ParseIntPipe) order: number,
    @Request() req: any,
  ): Promise<MaterialResponseDto> {
    const material = await this.materialService.reorder(id, order, req.user.id);
    return MaterialResponseDto.fromEntity(material);
  }

  /**
   * DELETE /api/v1/lessons/:lessonId/materials/:id
   * Xóa học liệu (Giảng viên)
   */
  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @Roles(UserRole.LECTURER)
  async delete(
    @Param('lessonId') lessonId: string,
    @Param('id', ParseIntPipe) id: number,
    @Request() req: any,
  ): Promise<void> {
    await this.materialService.delete(id, req.user.id);
  }
}