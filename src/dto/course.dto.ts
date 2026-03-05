import { IsString, IsOptional, IsNumber, IsEnum, MaxLength, IsNotEmpty } from 'class-validator';
import { CourseStatus } from '../common/enums/course-status.enum';
import { Course } from '../models/courses.entity';

// ========================
// COURSE DTOs
// ========================

export class CreateCourseDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  title: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsNumber()
  categoryId?: number;
}

export class UpdateCourseDto {
  @IsOptional()
  @IsString()
  @MaxLength(255)
  title?: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsNumber()
  categoryId?: number;
}

export class ChangeCourseStatusDto {
  @IsEnum(CourseStatus)
  status: CourseStatus;

  @IsOptional()
  @IsString()
  reviewNote?: string;
}

export class CourseResponseDto {
  id: number;
  title: string;
  description?: string;
  status: CourseStatus;
  categoryId?: number;
  categoryName?: string;
  createdById: number;
  createdByName: string;
  reviewNote?: string;
  createdAt: Date;
  updatedAt: Date;

  static fromEntity(course: Course): CourseResponseDto {
    const dto = new CourseResponseDto();
    dto.id = course.id;
    dto.title = course.title;
    dto.description = course.description;
    dto.status = course.status;
    dto.categoryId = course.category?.id;
    dto.categoryName = course.category?.name;
    dto.createdById = course.createdBy?.id;
    dto.createdByName = course.createdBy?.fullname;
    dto.reviewNote = course.reviewNote;
    dto.createdAt = course.createdAt;
    dto.updatedAt = course.updatedAt;
    return dto;
  }
}