import { IsString, IsOptional, IsNumber, IsNotEmpty, MaxLength } from 'class-validator';
import { Lesson } from '../models/lesson.entity';

// ========================
// LESSON DTOs
// ========================

export class CreateLessonDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  title: string;

  @IsOptional()
  @IsString()
  content?: string;

  @IsOptional()
  @IsNumber()
  order?: number;
}

export class UpdateLessonDto {
  @IsOptional()
  @IsString()
  @MaxLength(255)
  title?: string;

  @IsOptional()
  @IsString()
  content?: string;

  @IsOptional()
  @IsNumber()
  order?: number;
}

export class ReorderLessonsDto {
  @IsNumber()
  lessonId: string;

  @IsNumber()
  order: number;
}

export class LessonResponseDto {
  id: string;
  title: string;
  content?: string;
  order: number;
  courseId: number;
  materialCount: number;

  static fromEntity(lesson: Lesson): LessonResponseDto {
    const dto = new LessonResponseDto();
    dto.id = lesson.id;
    dto.title = lesson.title;
    dto.content = lesson.content;
    dto.order = lesson.order;
    dto.courseId = lesson.course?.id;
    dto.materialCount = lesson.materials?.length ?? 0;
    return dto;
  }
}

export class LessonDetailResponseDto extends LessonResponseDto {
  materials: any[];

  static fromEntity(lesson: Lesson): LessonDetailResponseDto {
    const dto = new LessonDetailResponseDto();
    dto.id = lesson.id;
    dto.title = lesson.title;
    dto.content = lesson.content;
    dto.order = lesson.order;
    dto.courseId = lesson.course?.id;
    dto.materialCount = lesson.materials?.length ?? 0;
    dto.materials = lesson.materials ?? [];
    return dto;
  }
}