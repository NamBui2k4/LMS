import { IsString, IsOptional, IsNumber, IsEnum, IsNotEmpty, MaxLength } from 'class-validator';
import { MaterialType } from '../common/enums/material-type.enum';
import { Material } from '../models/material.entity';

// ========================
// MATERIAL DTOs
// ========================

export class CreateMaterialDto {
  // ✅ FIX: name → fileName (khớp với Material entity: fileName, DB: file_name)
  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  fileName: string;

  // ✅ FIX: type → fileType (khớp với Material entity: fileType, DB: file_type)
  @IsEnum(MaterialType)
  fileType: MaterialType;

  // ✅ FIX: fileUrl bắt buộc (DB: file_url NOT NULL)
  @IsString()
  @IsNotEmpty()
  fileUrl: string;

  // ✅ FIX: Thêm fileSizeKb (DB: file_size_kb, entity: fileSizeKb)
  @IsOptional()
  @IsNumber()
  fileSizeKb?: number;

  // ✅ FIX: order → orderIndex (khớp với Material entity: orderIndex, DB: order_index)
  @IsOptional()
  @IsNumber()
  orderIndex?: number;
}

export class UploadMaterialDto {
  @IsOptional()
  @IsString()
  @MaxLength(255)
  fileName?: string;

  @IsOptional()
  @IsEnum(MaterialType)
  fileType?: MaterialType;

  @IsOptional()
  @IsNumber()
  orderIndex?: number;
}

export class UpdateMaterialDto {
  // ✅ FIX: name → fileName
  @IsOptional()
  @IsString()
  @MaxLength(255)
  fileName?: string;

  @IsOptional()
  @IsString()
  fileUrl?: string;

  @IsOptional()
  @IsEnum(MaterialType)
  fileType?: MaterialType;

  // ✅ FIX: Thêm fileSizeKb
  @IsOptional()
  @IsNumber()
  fileSizeKb?: number;

  // ✅ FIX: order → orderIndex
  @IsOptional()
  @IsNumber()
  orderIndex?: number;
}

export class MaterialResponseDto {
  // ✅ FIX: id: string → number (Material PK là BIGSERIAL)
  id: number;
  fileName: string;       // ✅ FIX: name → fileName
  fileType: MaterialType; // ✅ FIX: type → fileType
  fileUrl: string;
  fileSizeKb?: number;    // ✅ FIX: fileSize → fileSizeKb
  orderIndex: number;     // ✅ FIX: order → orderIndex
  lessonId: number;       // ✅ FIX: string → number (Lesson PK là BIGSERIAL)
  createdAt: Date;

  static fromEntity(material: Material): MaterialResponseDto {
    const dto = new MaterialResponseDto();
    dto.id = material.id;                     // ✅ FIX: number
    dto.fileName = material.fileName;         // ✅ FIX
    dto.fileType = material.fileType;         // ✅ FIX
    dto.fileUrl = material.fileUrl;
    dto.fileSizeKb = material.fileSizeKb;     // ✅ FIX
    dto.orderIndex = material.orderIndex;     // ✅ FIX
    dto.lessonId = material.lesson?.id;       // ✅ FIX: number
    dto.createdAt = material.createdAt;
    return dto;
  }
}