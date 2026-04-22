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
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { memoryStorage } from 'multer';
import { MaterialService } from '../services/material.service';
import {
  CreateMaterialDto,
  UpdateMaterialDto,
  MaterialResponseDto,
  UploadMaterialDto,
} from '../dto/material.dto';
import { JwtAuthGuard } from '../auth/guard/jwt-auth.guard';
import { RolesGuard } from '../auth/guard/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from '../common/enums/role.enum';

type UploadedFileType = {
  originalname: string;
  mimetype: string;
  size: number;
  buffer: Buffer;
};

@Controller('api/v1/lessons/:lessonId/materials')
@UseGuards(JwtAuthGuard, RolesGuard)
export class MaterialController {
  constructor(private readonly materialService: MaterialService) {}

  /**
   * GET /api/v1/lessons/:lessonId/materials
   * Xem danh sách học liệu trong bài giảng
   * Tác nhân: Giảng viên, Trưởng bộ môn
   */
  @Get()
  @Roles(UserRole.LECTURER, UserRole.HEAD_OF_DEPARTMENT)
  // ✅ FIX: lessonId: string → number với ParseIntPipe
  //         MaterialService.findByLesson(lessonId: number), LessonRepository.findById(number)
  async findAll(
    @Param('lessonId', ParseIntPipe) lessonId: number,
  ): Promise<MaterialResponseDto[]> {
    const materials = await this.materialService.findByLesson(lessonId);
    return materials.map(MaterialResponseDto.fromEntity);
  }

  /**
   * GET /api/v1/lessons/:lessonId/materials/:id
   * Xem chi tiết học liệu
   */
  @Get(':id')
  @Roles(UserRole.LECTURER, UserRole.HEAD_OF_DEPARTMENT)
  // ✅ FIX: Thêm ParseIntPipe cho cả lessonId và id — Material.id là BIGSERIAL (number)
  async findOne(
    @Param('lessonId', ParseIntPipe) lessonId: number,
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
  // ✅ FIX: ParseIntPipe cho lessonId
  async create(
    @Param('lessonId', ParseIntPipe) lessonId: number,
    @Body() dto: CreateMaterialDto,
    @Request() req: any,
  ): Promise<MaterialResponseDto> {
    const material = await this.materialService.create(lessonId, dto, req.user.id);
    return MaterialResponseDto.fromEntity(material);
  }

  /**
   * POST /api/v1/lessons/:lessonId/materials/upload
   * Upload file học liệu lên Supabase và tạo material record
   */
  @Post('upload')
  @HttpCode(HttpStatus.CREATED)
  @Roles(UserRole.LECTURER)
  @UseInterceptors(
    FileInterceptor('file', {
      storage: memoryStorage(),
      limits: {
        fileSize: 50 * 1024 * 1024,
      },
    }),
  )
  async uploadAndCreate(
    @Param('lessonId', ParseIntPipe) lessonId: number,
    @UploadedFile() file: UploadedFileType,
    @Body() dto: UploadMaterialDto,
    @Request() req: any,
  ): Promise<MaterialResponseDto> {
    const material = await this.materialService.uploadAndCreate(
      lessonId,
      file,
      dto,
      req.user.id,
    );
    return MaterialResponseDto.fromEntity(material);
  }

  /**
   * PUT /api/v1/lessons/:lessonId/materials/:id
   * Chỉnh sửa học liệu (Giảng viên)
   */
  @Put(':id')
  @Roles(UserRole.LECTURER)
  // ✅ FIX: ParseIntPipe cho cả lessonId và id
  async update(
    @Param('lessonId', ParseIntPipe) lessonId: number,
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
  // ✅ FIX: ParseIntPipe cho lessonId và id
  async reorder(
    @Param('lessonId', ParseIntPipe) lessonId: number,
    @Param('id', ParseIntPipe) id: number,
    @Body('orderIndex', ParseIntPipe) orderIndex: number,
    @Request() req: any,
  ): Promise<MaterialResponseDto> {
    const material = await this.materialService.reorder(id, orderIndex, req.user.id);
    return MaterialResponseDto.fromEntity(material);
  }

  /**
   * DELETE /api/v1/lessons/:lessonId/materials/:id
   * Xóa học liệu (Giảng viên)
   */
  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @Roles(UserRole.LECTURER)
  // ✅ FIX: ParseIntPipe cho lessonId và id
  async delete(
    @Param('lessonId', ParseIntPipe) lessonId: number,
    @Param('id', ParseIntPipe) id: number,
    @Request() req: any,
  ): Promise<void> {
    await this.materialService.delete(id, req.user.id);
  }
}