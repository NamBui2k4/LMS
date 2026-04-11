import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { SubmissionStatus } from '../common/enums/submission-status.enum';
import { Quiz } from './quizzes.entity';
import { Student } from './student.entity';
import { Lecturer } from './lecturers.entity';

@Entity('submissions')
export class Submission {
  @PrimaryGeneratedColumn()
  id!: number;

  // DB: quiz_id → quizzes(id) CASCADE
  @ManyToOne(() => Quiz, (quiz) => quiz.submissions, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'quiz_id' })
  quiz!: Quiz;

  // DB: student_id → students(user_id) CASCADE
  // ✅ FIX: Thêm @JoinColumn với referencedColumnName: 'userId'
  //         Student PK là userId (bigint), TypeORM cần biết join đúng cột nào
  @ManyToOne(() => Student, (student) => student.submissions, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'student_id', referencedColumnName: 'userId' })
  student!: Student;

  /**
   * Dữ liệu câu trả lời của học viên (JSONB)
   * Ví dụ trắc nghiệm: { "question_id_1": "A" }
   * Ví dụ tự luận: { "answer": "Nội dung bài viết..." }
   */
  @Column({ type: 'jsonb', nullable: true, name: 'answer_data' })
  answerData?: any;

  @Column({ type: 'numeric', precision: 6, scale: 2, nullable: true })
  score?: number;

  @Column({ type: 'enum', enum: SubmissionStatus, default: SubmissionStatus.SUBMITTED, enumName: 'submission_status' })
  status!: SubmissionStatus;

  @CreateDateColumn({ type: 'timestamptz', name: 'submitted_at' })
  submittedAt!: Date;

  @Column({ type: 'timestamptz', nullable: true, name: 'graded_at' })
  gradedAt?: Date;

  // DB: graded_by → lecturers(user_id) SET NULL
  // ✅ FIX: Thêm @JoinColumn với referencedColumnName: 'userId'
  //         Lecturer PK cũng là userId, không phải id
  @ManyToOne(() => Lecturer, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'graded_by', referencedColumnName: 'userId' })
  gradedBy?: Lecturer;

  @Column({ type: 'boolean', default: false, name: 'regrade_requested' })
  regradeRequested!: boolean;

  @Column({ type: 'text', nullable: true, name: 'regrade_note' })
  regradeNote?: string;
}