import {
  Entity,
  ManyToOne,
  PrimaryColumn,
  Column,
  JoinColumn,
} from 'typeorm';
import { Courses } from './courses.entity';
import { Lecturer } from './lecturers.entity';

/**
 * Bảng course_instructors — quan hệ N-N giữa Course và Lecturer.
 * DB: PRIMARY KEY (course_id, instructor_id)
 */
@Entity('course_instructors')
export class AssignedLecturers {
  // DB: course_id BIGINT NOT NULL → FK → courses(id)
  @PrimaryColumn({ type: 'bigint', name: 'course_id' })
  courseId: number;

  // DB: instructor_id BIGINT NOT NULL → FK → lecturers(user_id)
  @PrimaryColumn({ type: 'bigint', name: 'instructor_id' })
  instructorId: number;

  @ManyToOne(() => Courses, (course: Courses) => course.assignedLecturers, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'course_id' })
  course: Courses;

  /**
   * referencedColumnName: 'userId' vì Lecturer.userId là PK (tên property trong entity),
   * không phải 'id'.
   */
  @ManyToOne(() => Lecturer, (lecturer) => lecturer.assignedCourses, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'instructor_id', referencedColumnName: 'userId' })
  instructor: Lecturer;

  // DB: assigned_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
  @Column({ type: 'timestamptz', default: () => 'NOW()', name: 'assigned_at' })
  assignedAt: Date;
}