import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  OneToMany,
} from 'typeorm';

import { Role } from '../common/enums/role.enum'; // enum chung, sẽ tạo sau
import { Enrollment } from './enrollment.entity'; // sẽ tạo sau
import { Course } from './course.entity';         // sẽ tạo sau
import { Submission } from './submission.entity'; // sẽ tạo sau

@Entity('users')
export class User {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true, length: 255 })
  email: string;

  @Column({ select: false }) // không trả về password trong query thông thường
  passwordHash: string;

  @Column({ length: 100 })
  fullName: string;

  @Column({ nullable: true })
  avatarUrl?: string;

  @Column({
    type: 'enum',
    enum: Role,
    default: Role.STUDENT,
  })
  role: Role;

  @Column({ default: true })
  isActive: boolean;

  // Quan hệ 1-n: Một user (học viên) có thể ghi danh nhiều khóa học
  @OneToMany(() => Enrollment, (enrollment) => enrollment.student, {
    cascade: true,
  })
  enrollments: Enrollment[];

  // Quan hệ 1-n: Một giảng viên có thể tạo nhiều khóa học
  @OneToMany(() => Course, (course) => course.instructor)
  createdCourses: Course[];

  // Quan hệ 1-n: Một học viên có thể nộp nhiều bài kiểm tra
  @OneToMany(() => Submission, (submission) => submission.student)
  submissions: Submission[];

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}