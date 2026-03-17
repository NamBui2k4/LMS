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

  // ✅ FIX: Thêm summary — DB có cột summary, LessonService.create() dùng dto.summary
  @IsOptional()
  @IsString()
  summary?: string;

  @IsOptional()
  @IsString()
  content?: string;

  // ✅ FIX: order → orderIndex (khớp với Lesson entity property & LessonService)
  @IsOptional()
  @IsNumber()
  orderIndex?: number;
}

export class UpdateLessonDto {
  @IsOptional()
  @IsString()
  @MaxLength(255)
  title?: string;

  // ✅ FIX: Thêm summary — LessonService.update() spread dto.summary
  @IsOptional()
  @IsString()
  summary?: string;

  @IsOptional()
  @IsString()
  content?: string;

  // ✅ FIX: order → orderIndex
  @IsOptional()
  @IsNumber()
  orderIndex?: number;
}

export class ReorderLessonsDto {
  // ✅ FIX: lessonId type number (BIGSERIAL) thay vì string; decorator @IsNumber đúng với type
  @IsNumber()
  lessonId: number;

  // ✅ FIX: order → orderIndex
  @IsNumber()
  orderIndex: number;
}

export class LessonResponseDto {
  // ✅ FIX: id: string → number (Lesson PK là BIGSERIAL)
  id: number;
  title: string;
  summary?: string;       // ✅ FIX: Thêm summary vào response
  content?: string;
  // ✅ FIX: order → orderIndex
  orderIndex: number;
  courseId: number;
  materialCount: number;

  static fromEntity(lesson: Lesson): LessonResponseDto {
    const dto = new LessonResponseDto();
    dto.id = lesson.id;                           // ✅ FIX: number (không cần cast)
    dto.title = lesson.title;
    dto.summary = lesson.summary;                 // ✅ FIX: thêm summary
    dto.content = lesson.content;
    dto.orderIndex = lesson.orderIndex;           // ✅ FIX: orderIndex
    dto.courseId = lesson.course?.id;
    dto.materialCount = lesson.materials?.length ?? 0;
    return dto;
  }
}

export class LessonDetailResponseDto extends LessonResponseDto {
  materials: any[];

  static fromEntity(lesson: Lesson): LessonDetailResponseDto {
    const dto = new LessonDetailResponseDto();
    dto.id = lesson.id;                           // ✅ FIX: number
    dto.title = lesson.title;
    dto.summary = lesson.summary;                 // ✅ FIX
    dto.content = lesson.content;
    dto.orderIndex = lesson.orderIndex;           // ✅ FIX
    dto.courseId = lesson.course?.id;
    dto.materialCount = lesson.materials?.length ?? 0;
    dto.materials = lesson.materials ?? [];
    return dto;
  }
}