import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  OneToMany,
  JoinColumn,
} from 'typeorm';

import { QuizType } from '../common/enums/quiz-type.enum';
import { Courses } from './courses.entity';
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
  id!: number;

  @ManyToOne(() => Courses, (course) => course.quizzes, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'course_id' }) // ← FIX
  course!: Courses;

  @Column({ length: 255 })
  title!: string;

  @Column({
    type: 'enum',
    enum: QuizType,
    enumName: 'quiz_type', // ← FIX quan trọng
    default: QuizType.MULTIPLE_CHOICE,
    name: 'quiz_type'
  })
  quizType!: QuizType;

  @Column({ type: 'numeric', precision: 6, scale: 2, default: 100.00, name: 'max_score' })
  maxScore!: number;

  @Column({ type: 'numeric', precision: 6, scale: 2, nullable: true, name: 'pass_score' })
  passScore?: number;

  @Column({ type: 'int', nullable: true, name: 'duration_min' })
  durationMin?: number;

  @ManyToOne(() => Lecturer, { nullable: false, onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'created_by', referencedColumnName: 'userId' })
  createdBy!: Lecturer;

  @CreateDateColumn({ type: 'timestamptz', name: 'created_at' })
  createdAt!: Date;

  @UpdateDateColumn({ type: 'timestamptz', name: 'updated_at' })
  updatedAt!: Date;

  // Quan hệ 1-n: Một quiz có nhiều câu hỏi
  @OneToMany(() => QuizQuestion, (question) => question.quiz, { cascade: true })
  questions!: QuizQuestion[];

  // Quan hệ 1-n: Một quiz có nhiều bài nộp từ học viên
  @OneToMany(() => Submission, (submission) => submission.quiz)
  submissions!: Submission[];
}