// src/entities/assigned-lecturers.entity.ts

import { Entity, PrimaryColumn, Column, ManyToOne } from 'typeorm';
import { Course } from './courses.entity';
import { Lecturer } from './lecturers.entity';

/**
 * Bảng trung gian thể hiện giảng viên được phân công (assigned) cho khóa học
 * - Tên entity: AssignedLecturers (ngắn gọn, ý nghĩa: giảng viên được chỉ định)
 * - Tên bảng trong DB: course_instructors (giữ nguyên như lược đồ SQL, không thay đổi)
 */
@Entity('course_instructors')
export class AssignedLecturers {
  @PrimaryColumn({ name: 'course_id' })
  courseId: number;

  @PrimaryColumn({ name: 'instructor_id' })
  lecturerId: number;

  @Column({ type: 'timestamptz', default: () => 'NOW()', name: 'assigned_at' })
  assignedAt: Date;

  // Quan hệ ngược với Course
  @ManyToOne(() => Course, (course) => course.assignedLecturers, { onDelete: 'CASCADE' })
  course: Course;

  // Quan hệ ngược với Lecturer
  @ManyToOne(() => Lecturer, (lecturer) => lecturer.assignedCourses, { onDelete: 'CASCADE' })
  instructor: Lecturer;
}