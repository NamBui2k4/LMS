import {
  IsString,
  IsOptional,
  IsNumber,
  IsEnum,
  IsNotEmpty,
  MaxLength,
  Min,
} from 'class-validator';
import { QuizType } from '../common/enums/quiz-type.enum';
import { Quiz } from '../models/quizzes.entity';

// ========================
// QUIZ DTOs
// ========================

/**
 * DTO tạo bài kiểm tra mới
 * Tác nhân: Giảng viên
 * SRS: "Tạo bài kiểm tra mới — chọn loại, đặt tiêu đề, thời lượng, điểm tối đa, điểm đạt"
 */
export class CreateQuizDto {
  @IsString()
  @IsNotEmpty({ message: 'Tiêu đề bài kiểm tra không được để trống.' })
  @MaxLength(255)
  title: string;

  // DB: quiz_type — chỉ 2 giá trị: 'multiple_choice' | 'essay'
  @IsEnum(QuizType, { message: 'Loại bài kiểm tra không hợp lệ.' })
  quizType: QuizType;

  // DB: max_score NUMERIC(6,2) NOT NULL DEFAULT 100.00
  @IsOptional()
  @IsNumber()
  @Min(0)
  maxScore?: number;

  // DB: pass_score NUMERIC(6,2) — nullable
  @IsOptional()
  @IsNumber()
  @Min(0)
  passScore?: number;

  // DB: duration_min INT — thời gian làm bài (phút), nullable
  @IsOptional()
  @IsNumber()
  @Min(1)
  durationMin?: number;
}

/**
 * DTO chỉnh sửa bài kiểm tra
 * Tác nhân: Giảng viên (chỉ người tạo)
 * SRS: "Chỉnh sửa tiêu đề, thời lượng, điểm số, hoặc thay đổi loại bài kiểm tra"
 */
export class UpdateQuizDto {
  @IsOptional()
  @IsString()
  @MaxLength(255)
  title?: string;

  @IsOptional()
  @IsEnum(QuizType)
  quizType?: QuizType;

  @IsOptional()
  @IsNumber()
  @Min(0)
  maxScore?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  passScore?: number;

  @IsOptional()
  @IsNumber()
  @Min(1)
  durationMin?: number;
}

/**
 * DTO trả về thông tin bài kiểm tra (không kèm câu hỏi)
 * Dùng cho danh sách (GET /courses/:courseId/quizzes)
 */
export class QuizResponseDto {
  id: number;
  title: string;
  quizType: QuizType;
  maxScore: number;
  passScore?: number;
  durationMin?: number;
  courseId: number;
  createdById: number;
  createdAt: Date;
  updatedAt: Date;

  static fromEntity(quiz: Quiz): QuizResponseDto {
    const dto = new QuizResponseDto();
    dto.id = quiz.id;
    dto.title = quiz.title;
    dto.quizType = quiz.quizType;
    dto.maxScore = quiz.maxScore;
    dto.passScore = quiz.passScore;
    dto.durationMin = quiz.durationMin;
    dto.courseId = quiz.course?.id;
    // createdBy PK là userId (Lecturer)
    dto.createdById = quiz.createdBy?.userId;
    dto.createdAt = quiz.createdAt;
    dto.updatedAt = quiz.updatedAt;
    return dto;
  }
}

/**
 * DTO trả về chi tiết bài kiểm tra KÈM danh sách câu hỏi
 * Dùng cho xem chi tiết (GET /courses/:courseId/quizzes/:id)
 * SRS: "Xem đầy đủ thông tin bài kiểm tra — tiêu đề, loại, thời lượng, điểm tối đa, điểm đạt, danh sách câu hỏi"
 */
export class QuizDetailResponseDto extends QuizResponseDto {
  questions: any[];

  static fromEntity(quiz: Quiz): QuizDetailResponseDto {
    const dto = new QuizDetailResponseDto();
    dto.id = quiz.id;
    dto.title = quiz.title;
    dto.quizType = quiz.quizType;
    dto.maxScore = quiz.maxScore;
    dto.passScore = quiz.passScore;
    dto.durationMin = quiz.durationMin;
    dto.courseId = quiz.course?.id;
    dto.createdById = quiz.createdBy?.userId;
    dto.createdAt = quiz.createdAt;
    dto.updatedAt = quiz.updatedAt;
    dto.questions = quiz.questions ?? [];
    return dto;
  }
}