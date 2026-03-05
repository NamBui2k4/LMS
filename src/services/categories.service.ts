 import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { CategoryRepository } from '../repository/categories.repository';
import { Category } from '../models/categories.entity';
import { CreateCategoryDto, UpdateCategoryDto } from '../dto/category.dto';

@Injectable()
export class CategoryService {
  constructor(private readonly categoryRepo: CategoryRepository) {}

  async findAll(): Promise<Category[]> {
    return this.categoryRepo.findAll();
  }

  async findOne(id: number): Promise<Category> {
    const category = await this.categoryRepo.findById(id);
    if (!category) throw new NotFoundException('Không tìm thấy danh mục.');
    return category;
  }

  async create(dto: CreateCategoryDto): Promise<Category> {
    const existing = await this.categoryRepo.findByName(dto.name);
    if (existing) throw new ConflictException('Tên danh mục đã tồn tại.');
    return this.categoryRepo.create({ name: dto.name, description: dto.description });
  }

  async update(id: number, dto: UpdateCategoryDto): Promise<Category> {
    await this.findOne(id);
    if (dto.name) {
      const existing = await this.categoryRepo.findByName(dto.name);
      if (existing && existing.id !== id) throw new ConflictException('Tên danh mục đã tồn tại.');
    }
    const updated = await this.categoryRepo.update(id, dto);
    return updated!;
  }

  async delete(id: number): Promise<void> {
    const category = await this.categoryRepo.findByIdWithCourses(id);
    if (!category) throw new NotFoundException('Không tìm thấy danh mục.');
    if (category.courses?.length > 0)
      throw new ConflictException('Không thể xóa danh mục đang có khóa học.');
    await this.categoryRepo.delete(id);
  }
}