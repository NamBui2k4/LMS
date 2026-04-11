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
import { Category } from './categories.entity';
import { Lecturer } from './lecturers.entity';
import { DepartmentHead } from './department-heads.entity';
import { Lesson } from './lesson.entity';
import { Quiz } from './quizzes.entity';
import { Enrollment } from './enrollment.entity';
import { AssignedLecturers } from './assigned-lecturers.entity';
import { CourseStatus } from '../common/enums/course-status.enum';

/**
 * DB: courses(id, title, description, category_id, status, created_by,
 *             review_note, reviewed_by, reviewed_at, created_at, updated_at)
 *
 * Quan hệ:
 *   courses.created_by  → lecturers.user_id  (RESTRICT)
 *   courses.reviewed_by → department_heads.user_id (SET NULL)
 *   courses.category_id → categories.id (RESTRICT)
 */
@Entity('courses')
export class Courses {
  // DB: id BIGSERIAL PRIMARY KEY
  @PrimaryGeneratedColumn()
  id!: number;

  // DB: title VARCHAR(255) NOT NULL
  @Column({ length: 255 })
  title!: string;

  // DB: description TEXT (nullable)
  @Column({ type: 'text', nullable: true })
  description?: string;

  // DB: category_id INT NOT NULL → FK → categories(id)
  @ManyToOne(() => Category, (category) => category.courses, { onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'category_id' })
  category!: Category;

  // DB: status course_status NOT NULL DEFAULT 'draft'
  @Column({ type: 'enum', enum: CourseStatus, default: CourseStatus.DRAFT, enumName: 'course_status' })
  status!: CourseStatus;

  // DB: created_by BIGINT NOT NULL → FK → lecturers(user_id)
  @ManyToOne(() => Lecturer, (lecturer) => lecturer.createdCourses, { onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'created_by', referencedColumnName: 'userId' })
  createdBy!: Lecturer;

  // DB: review_note TEXT (nullable) — ghi chú từ Trưởng bộ môn khi từ chối
  @Column({ type: 'text', nullable: true, name: 'review_note' })
  reviewNote?: string;

  // DB: reviewed_by BIGINT → FK → department_heads(user_id) (nullable, SET NULL)
  @ManyToOne(() => DepartmentHead, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'reviewed_by', referencedColumnName: 'userId' })
  reviewedBy?: DepartmentHead;

  // DB: reviewed_at TIMESTAMPTZ (nullable)
  @Column({ type: 'timestamptz', nullable: true, name: 'reviewed_at' })
  reviewedAt?: Date;

  @CreateDateColumn({ type: 'timestamptz', name: 'created_at' })
  createdAt!: Date;

  @UpdateDateColumn({ type: 'timestamptz', name: 'updated_at' })
  updatedAt!: Date;

  // ── Quan hệ 1-n xuống các bảng phụ thuộc ────────────────────────────
  @OneToMany(() => Lesson, (lesson) => lesson.course, { cascade: true })
  lessons!: Lesson[];

  @OneToMany(() => Quiz, (quiz) => quiz.course, { cascade: true })
  quizzes!: Quiz[];

  @OneToMany(() => Enrollment, (enrollment) => enrollment.course)
  enrollments!: Enrollment[];

  @OneToMany(() => AssignedLecturers, (al) => al.course)
  assignedLecturers!: AssignedLecturers[];
}