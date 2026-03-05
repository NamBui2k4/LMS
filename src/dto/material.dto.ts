import { IsString, IsOptional, IsNumber, IsEnum, IsNotEmpty, IsUrl, MaxLength } from 'class-validator';
import { MaterialType } from '../common/enums/material-type.enum';
import { Material } from '../models/material.entity';

// ========================
// MATERIAL DTOs
// ========================

export class CreateMaterialDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  name: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsEnum(MaterialType)
  type: MaterialType;

  @IsOptional()
  @IsString()
  fileUrl?: string;

  @IsOptional()
  @IsNumber()
  order?: number;
}

export class UpdateMaterialDto {
  @IsOptional()
  @IsString()
  @MaxLength(255)
  name?: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsString()
  fileUrl?: string;

  @IsOptional()
  @IsNumber()
  order?: number;
}

export class ReorderMaterialsDto {
  materialId: number;
  order: number;
}

export class MaterialResponseDto {
  id: number;
  name: string;
  description?: string;
  type: MaterialType;
  fileUrl?: string;
  fileSize?: number;
  order: number;
  lessonId: string;
  uploadedAt?: Date;

  static fromEntity(material: Material): MaterialResponseDto {
    const dto = new MaterialResponseDto();
    dto.id = material.id;
    dto.name = material.name;
    dto.description = material.description;
    dto.type = material.type;
    dto.fileUrl = material.fileUrl;
    dto.fileSize = material.fileSize;
    dto.order = material.order;
    dto.lessonId = material.lesson?.id;
    dto.uploadedAt = material.uploadedAt;
    return dto;
  }
}