import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToOne, OneToMany } from 'typeorm';
import { CourseStatus } from '../common/enums/course-status.enum';
import { Category } from './categories.entity';
import { Lecturer } from './lecturers.entity';
import { DepartmentHead } from './department-heads.entity';
import { Lesson } from './lesson.entity';
import { Quiz } from './quizzes.entity';
import { Enrollment } from './enrollment.entity';
import { AssignedLecturers } from './assigned-lecturers.entity';

@Entity('courses')
export class Course {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ length: 255 })
  title: string;

  @Column({ type: 'text', nullable: true })
  description?: string;

  @ManyToOne(() => Category, (category) => category.courses)
  category: Category;

  @Column({
    type: 'enum',
    enum: CourseStatus,
    default: CourseStatus.DRAFT,
  })
  status: CourseStatus;

  @ManyToOne(() => Lecturer, (lecturer) => lecturer.createdCourses)
  createdBy: Lecturer;

  @Column({ type: 'text', nullable: true })
  reviewNote?: string;

  @ManyToOne(() => DepartmentHead, { nullable: true })
  reviewedBy?: DepartmentHead;

  @Column({ type: 'timestamptz', nullable: true })
  reviewedAt?: Date;

  @CreateDateColumn({ type: 'timestamptz' })
  createdAt: Date;

  @UpdateDateColumn({ type: 'timestamptz' })
  updatedAt: Date;

  @OneToMany(() => Lesson, (lesson) => lesson.course)
  lessons: Lesson[];

  @OneToMany(() => Quiz, (quiz) => quiz.course)
  quizzes: Quiz[];

  @OneToMany(() => Enrollment, (enrollment) => enrollment.course)
  enrollments: Enrollment[];

  @OneToMany(() => AssignedLecturers, (ci) => ci.course)
  assignedLecturers: AssignedLecturers[];
}