import {
  IsOptional,
  IsString,
  IsNumber,
  IsNotEmpty,
  Min,
  Max,
} from 'class-validator';
import { SubmissionStatus } from '../common/enums/submission-status.enum';
import { Submission } from '../models/submission.entity';

// ========================
// SUBMISSION DTOs
// ========================

/**
 * DTO học viên nộp bài kiểm tra
 * Tác nhân: Học viên
 * SRS: "Nộp bài kiểm tra — trả lời câu hỏi, tải file nếu cần"
 *
 * DB: answer_data JSONB — cấu trúc linh hoạt theo loại quiz:
 *   Trắc nghiệm: { "question_id_1": "A", "question_id_2": ["B", "C"] }
 *   Tự luận:     { "answer": "Nội dung bài viết..." }
 */
export class CreateSubmissionDto {
  @IsOptional()
  answerData?: Record<string, any>;
}

/**
 * DTO Giảng viên chấm điểm bài nộp
 * Tác nhân: Giảng viên
 * SRS: "Chấm điểm — tự động cho trắc nghiệm hoặc thủ công cho tự luận, ghi chú phản hồi"
 */
export class GradeSubmissionDto {
  @IsNumber()
  @Min(0)
  score: number;

  // Ghi chú phản hồi cho học viên sau khi chấm
  @IsOptional()
  @IsString()
  note?: string;
}

/**
 * DTO học viên yêu cầu phúc khảo
 * Tác nhân: Học viên
 * SRS: "Yêu cầu chấm lại — học viên yêu cầu giảng viên xem xét lại bài nộp"
 */
export class RequestRegradeDto {
  @IsString()
  @IsNotEmpty({ message: 'Lý do yêu cầu phúc khảo không được để trống.' })
  note: string;
}

/**
 * DTO trả về thông tin bài nộp
 * Dùng cho: Giảng viên xem danh sách bài nộp, Học viên xem bài của mình
 */
export class SubmissionResponseDto {
  id: number;
  quizId: number;
  studentId: number;
  studentName?: string;
  answerData?: Record<string, any>;
  score?: number;
  status: SubmissionStatus;
  submittedAt: Date;
  gradedAt?: Date;
  gradedById?: number;
  regradeRequested: boolean;
  regradeNote?: string;

  static fromEntity(submission: Submission): SubmissionResponseDto {
    const dto = new SubmissionResponseDto();
    dto.id = submission.id;
    dto.quizId = submission.quiz?.id;
    // Student PK là userId
    dto.studentId = submission.student?.userId;
    dto.studentName = submission.student?.fullname;
    dto.answerData = submission.answerData;
    dto.score = submission.score;
    dto.status = submission.status;
    dto.submittedAt = submission.submittedAt;
    dto.gradedAt = submission.gradedAt;
    // GradedBy (Lecturer) PK là userId
    dto.gradedById = submission.gradedBy?.userId;
    dto.regradeRequested = submission.regradeRequested;
    dto.regradeNote = submission.regradeNote;
    return dto;
  }

  /**
   * Tạo DTO cho Học viên — ẩn answerData của bài nộp khác (nếu cần)
   * Hiện tại trả về đầy đủ vì học viên chỉ xem bài của mình
   */
  static fromEntityForStudent(submission: Submission): SubmissionResponseDto {
    return SubmissionResponseDto.fromEntity(submission);
  }
}