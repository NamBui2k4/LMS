import { IsString, IsOptional, IsNotEmpty, MaxLength } from 'class-validator';
import { Category } from '../models/categories.entity';

export class CreateCategoryDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(150)
  name: string;

  @IsOptional()
  @IsString()
  description?: string;
}

export class UpdateCategoryDto {
  @IsOptional()
  @IsString()
  @MaxLength(150)
  name?: string;

  @IsOptional()
  @IsString()
  description?: string;
}

export class CategoryResponseDto {
  id: number;
  name: string;
  description?: string;
  createdAt: Date;

  static fromEntity(category: Category): CategoryResponseDto {
    const dto = new CategoryResponseDto();
    dto.id = category.id;
    dto.name = category.name;
    dto.description = category.description;
    dto.createdAt = category.createdAt;
    return dto;
  }
}