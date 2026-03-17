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
import { CategoryService } from '../services/categories.service';
import { CreateCategoryDto, UpdateCategoryDto, CategoryResponseDto } from '../dto/category.dto';
import { JwtAuthGuard } from '../auth/guard/jwt-auth.guard';
import { RolesGuard } from '../auth/guard/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from '../common/enums/role.enum';

@Controller('api/v1/categories')
@UseGuards(JwtAuthGuard, RolesGuard)
export class CategoryController {
  constructor(private readonly categoryService: CategoryService) {}

  /**
   * GET /api/v1/categories
   * Lấy danh sách danh mục
   */
  @Get()
  @Roles(UserRole.ADMIN, UserRole.LECTURER, UserRole.HEAD_OF_DEPARTMENT)
  async findAll(): Promise<CategoryResponseDto[]> {
    const categories = await this.categoryService.findAll();
    return categories.map(CategoryResponseDto.fromEntity);
  }

  /**
   * GET /api/v1/categories/:id
   * Xem chi tiết danh mục
   */
  @Get(':id')
  @Roles(UserRole.ADMIN, UserRole.LECTURER, UserRole.HEAD_OF_DEPARTMENT   )
  async findOne(@Param('id', ParseIntPipe) id: number): Promise<CategoryResponseDto> {
    const category = await this.categoryService.findOne(id);
    return CategoryResponseDto.fromEntity(category);
  }

  /**
   * POST /api/v1/categories
   * Tạo danh mục mới
   */
  @Post()
  @HttpCode(HttpStatus.CREATED)
  @Roles(UserRole.ADMIN, UserRole.HEAD_OF_DEPARTMENT)
  async create(@Body() dto: CreateCategoryDto): Promise<CategoryResponseDto> {
    const category = await this.categoryService.create(dto);
    return CategoryResponseDto.fromEntity(category);
  }

  /**
   * PUT /api/v1/categories/:id
   * Cập nhật danh mục
   */
  @Put(':id')
  @Roles(UserRole.ADMIN, UserRole.HEAD_OF_DEPARTMENT)
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateCategoryDto,
  ): Promise<CategoryResponseDto> {
    const category = await this.categoryService.update(id, dto);
    return CategoryResponseDto.fromEntity(category);
  }

  /**
   * DELETE /api/v1/categories/:id
   * Xóa danh mục
   */
  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @Roles(UserRole.ADMIN, UserRole.HEAD_OF_DEPARTMENT)
  async delete(@Param('id', ParseIntPipe) id: number): Promise<void> {
    await this.categoryService.delete(id);
  }
}