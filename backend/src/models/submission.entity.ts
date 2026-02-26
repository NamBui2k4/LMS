// src/entities/submission.entity.ts

import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
} from 'typeorm';

import { SubmissionStatus } from '../common/enums/submission-status.enum';
import { Quiz } from './quizzes.entity';
import { Student } from './student.entity';
import { Lecturer } from './lecturers.entity';

/**
 * Bảng submissions - Bài nộp của học viên cho một bài kiểm tra (quiz)
 * - Thực thể yếu, phụ thuộc vào quizzes và students (cascade delete)
 * - Lưu câu trả lời (JSONB), điểm số, trạng thái chấm, và yêu cầu phúc khảo
 */
@Entity('submissions')
export class Submission {
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(() => Quiz, (quiz) => quiz.submissions, { onDelete: 'CASCADE' })
  quiz: Quiz;

  @ManyToOne(() => Student, (student) => student.submissions, { onDelete: 'CASCADE' })
  student: Student;

  /**
   * Dữ liệu câu trả lời của học viên (JSONB)
   * Ví dụ trắc nghiệm: { "question_id_1": "A", "question_id_2": ["B", "C"] }
   * Ví dụ tự luận: { "answer": "Nội dung bài viết..." }
   */
  @Column({ type: 'jsonb', nullable: true })
  answerData?: any;

  @Column({ type: 'numeric', precision: 6, scale: 2, nullable: true })
  score?: number;

  @Column({
    type: 'enum',
    enum: SubmissionStatus,
    default: SubmissionStatus.SUBMITTED,
  })
  status: SubmissionStatus;

  @CreateDateColumn({ type: 'timestamptz' })
  submittedAt: Date;

  @Column({ type: 'timestamptz', nullable: true })
  gradedAt?: Date;

  @ManyToOne(() => Lecturer, { nullable: true, onDelete: 'SET NULL' })
  gradedBy?: Lecturer;

  @Column({ default: false })
  regradeRequested: boolean;

  @Column({ type: 'text', nullable: true })
  regradeNote?: string;
}