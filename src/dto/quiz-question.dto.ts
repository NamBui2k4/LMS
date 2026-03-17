import {
  IsString,
  IsOptional,
  IsNumber,
  IsNotEmpty,
  Min,
  IsArray,
  ValidateNested,
  IsBoolean,
} from 'class-validator';
import { Type } from 'class-transformer';
import { QuizQuestion } from '../models/quiz-question.entity';

// ========================
// QUIZ QUESTION DTOs
// ========================

/**
 * DTO mô tả một lựa chọn trong câu hỏi trắc nghiệm
 * DB: options JSONB — [{label, text, is_correct}]
 */
export class QuestionOptionDto {
  @IsString()
  label: string; // 'A', 'B', 'C', 'D'

  @IsString()
  text: string; // Nội dung lựa chọn

  @IsOptional()
  @IsBoolean()
  isCorrect?: boolean; // Đáp án đúng hay không
}

/**
 * DTO tạo câu hỏi mới trong bài kiểm tra
 * Tác nhân: Giảng viên
 * SRS: "Thêm câu hỏi mới (text, lựa chọn, đáp án đúng)"
 *
 * DB: quiz_questions(id, quiz_id, question_text, options JSONB,
 *                    correct_answer, score_weight, order_index)
 */
export class CreateQuizQuestionDto {
  @IsString()
  @IsNotEmpty({ message: 'Nội dung câu hỏi không được để trống.' })
  questionText: string;

  // DB: options JSONB — dùng cho câu hỏi trắc nghiệm (multiple_choice)
  // Null/empty nếu là tự luận (essay)
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => QuestionOptionDto)
  options?: QuestionOptionDto[];

  // DB: correct_answer TEXT — đáp án đúng (text hoặc label như 'A', 'B'...)
  @IsOptional()
  @IsString()
  correctAnswer?: string;

  // DB: score_weight NUMERIC(5,2) DEFAULT 1.00 — trọng số điểm của câu hỏi này
  @IsOptional()
  @IsNumber()
  @Min(0)
  scoreWeight?: number;

  // DB: order_index INT DEFAULT 0 — thứ tự hiển thị trong bài kiểm tra
  @IsOptional()
  @IsNumber()
  @Min(0)
  orderIndex?: number;
}

/**
 * DTO chỉnh sửa câu hỏi hiện có
 * Tác nhân: Giảng viên
 * SRS: "Chỉnh sửa câu hỏi hiện có"
 */
export class UpdateQuizQuestionDto {
  @IsOptional()
  @IsString()
  questionText?: string;

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => QuestionOptionDto)
  options?: QuestionOptionDto[];

  @IsOptional()
  @IsString()
  correctAnswer?: string;

  @IsOptional()
  @IsNumber()
  @Min(0)
  scoreWeight?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  orderIndex?: number;
}

/**
 * DTO trả về thông tin câu hỏi
 * Ẩn đáp án đúng khi trả về cho học viên (logic xử lý ở service/controller)
 */
export class QuizQuestionResponseDto {
  id: number;
  questionText: string;
  options?: QuestionOptionDto[];
  correctAnswer?: string; // Chỉ trả về cho Giảng viên/Trưởng bộ môn, ẩn với Học viên
  scoreWeight: number;
  orderIndex: number;
  quizId: number;

  static fromEntity(question: QuizQuestion): QuizQuestionResponseDto {
    const dto = new QuizQuestionResponseDto();
    dto.id = question.id;
    dto.questionText = question.questionText;
    dto.options = question.options;
    dto.correctAnswer = question.correctAnswer;
    dto.scoreWeight = question.scoreWeight;
    dto.orderIndex = question.orderIndex;
    dto.quizId = question.quiz?.id;
    return dto;
  }

  /**
   * Tạo DTO cho Học viên — ẩn correctAnswer để tránh lộ đáp án
   * Dùng khi học viên đang làm bài (chưa nộp)
   */
  static fromEntityForStudent(question: QuizQuestion): QuizQuestionResponseDto {
    const dto = QuizQuestionResponseDto.fromEntity(question);
    dto.correctAnswer = undefined; // Ẩn đáp án đúng
    return dto;
  }
}