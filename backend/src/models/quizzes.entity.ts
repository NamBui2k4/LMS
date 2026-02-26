import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  OneToMany,
} from 'typeorm';

import { QuizType } from '../common/enums/quiz-type.enum';
import { Course } from './courses.entity';
import { Lecturer } from './lecturers.entity';
import { QuizQuestion } from './quiz-question.entity';
import { Submission } from './submission.entity';

/**
 * Bảng quizzes - Bài kiểm tra trong khóa học
 * - Thực thể yếu, phụ thuộc vào courses (cascade delete)
 * - Có thể là trắc nghiệm, tự luận hoặc hỗn hợp
 */
@Entity('quizzes')
export class Quiz {
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(() => Course, (course) => course.quizzes, { onDelete: 'CASCADE' })
  course: Course;

  @Column({ length: 255 })
  title: string;

  @Column({
    type: 'enum',
    enum: QuizType,
    default: QuizType.MULTIPLE_CHOICE,
  })
  quizType: QuizType;

  @Column({ type: 'numeric', precision: 6, scale: 2, default: 100.00 })
  maxScore: number;

  @Column({ type: 'numeric', precision: 6, scale: 2, nullable: true })
  passScore?: number;

  @Column({ type: 'int', nullable: true })
  durationMin?: number;

  @ManyToOne(() => Lecturer, { nullable: false, onDelete: 'RESTRICT' })
  createdBy: Lecturer;

  @CreateDateColumn({ type: 'timestamptz' })
  createdAt: Date;

  @UpdateDateColumn({ type: 'timestamptz' })
  updatedAt: Date;

  // Quan hệ 1-n: Một quiz có nhiều câu hỏi
  @OneToMany(() => QuizQuestion, (question) => question.quiz, { cascade: true })
  questions: QuizQuestion[];

  // Quan hệ 1-n: Một quiz có nhiều bài nộp từ học viên
  @OneToMany(() => Submission, (submission) => submission.quiz)
  submissions: Submission[];
}