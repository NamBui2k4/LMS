import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  CreateDateColumn,
  JoinColumn,
} from 'typeorm';
import { Student } from './student.entity';
import { Courses } from './courses.entity';
import { EnrollmentStatus } from '../common/enums/enrollment-status.enum';

@Entity('enrollments')
export class Enrollment {
  // DB: id BIGSERIAL PRIMARY KEY
  @PrimaryGeneratedColumn()
  id!: number;

  /**
   * DB: student_id BIGINT NOT NULL → FK → students(user_id)
   * referencedColumnName: 'userId' vì Student.userId là PK
   */
  @ManyToOne(() => Student, (student) => student.enrollments, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'student_id', referencedColumnName: 'userId' })
  student!: Student;

  // DB: course_id BIGINT NOT NULL → FK → courses(id)
  @ManyToOne(() => Courses, (course) => course.enrollments, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'course_id' })
  course!: Courses;

  // DB: status enrollment_status NOT NULL DEFAULT 'enrolled'
  @Column({ type: 'enum', enum: EnrollmentStatus, default: EnrollmentStatus.ENROLLED, enumName: 'enrollment_status' })
  status!: EnrollmentStatus;

  // DB: progress_pct NUMERIC(5,2) NOT NULL DEFAULT 0.00 CHECK (0..100)
  @Column({ type: 'numeric', precision: 5, scale: 2, default: 0.0, name: 'progress_pct' })
  progressPct!: number;

  // DB: enrolled_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
  @CreateDateColumn({ type: 'timestamptz', name: 'enrolled_at' })
  enrolledAt!: Date;

  // DB: completed_at TIMESTAMPTZ (nullable)
  @Column({ type: 'timestamptz', nullable: true, name: 'completed_at' })
  completedAt?: Date;
}