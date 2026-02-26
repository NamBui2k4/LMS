// src/entities/quiz-question.entity.ts

import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
} from 'typeorm';

import { Quiz } from './quizzes.entity';

/**
 * Bảng quiz_questions - Câu hỏi thuộc một bài kiểm tra (quiz)
 * - Thực thể yếu, phụ thuộc vào quizzes (cascade delete)
 * - Hỗ trợ câu trắc nghiệm (options JSONB) và tự luận (correct_answer TEXT)
 */
@Entity('quiz_questions')
export class QuizQuestion {
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(() => Quiz, (quiz) => quiz.questions, { onDelete: 'CASCADE' })
  quiz: Quiz;

  @Column({ type: 'text' })
  questionText: string;

  /**
   * JSONB lưu mảng lựa chọn cho câu trắc nghiệm
   * Ví dụ: [
   *   { label: "A", text: "Đáp án 1", is_correct: true },
   *   { label: "B", text: "Đáp án 2", is_correct: false }
   * ]
   * Với câu tự luận thì để null hoặc rỗng
   */
  @Column({ type: 'jsonb', nullable: true })
  options?: Array<{
    label: string;
    text: string;
    is_correct?: boolean;
  }>;

  /**
   * Đáp án đúng (dùng cho tự luận hoặc fallback)
   * Với trắc nghiệm thì thường lấy từ options
   */
  @Column({ type: 'text', nullable: true })
  correctAnswer?: string;

  @Column({ type: 'numeric', precision: 5, scale: 2, default: 1.00 })
  scoreWeight: number;

  @Column({ default: 0 })
  orderIndex: number;
}