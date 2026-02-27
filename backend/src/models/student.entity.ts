import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  OneToMany,
} from 'typeorm';

import { Enrollment } from './enrollment.entity'; // quan hệ ghi danh
import { Submission } from './submission.entity'; // quan hệ nộp bài

// Enum khớp với PostgreSQL ENUM 'account_status'
export enum AccountStatus {
  ACTIVE   = 'active',
  INACTIVE = 'inactive',
  BANNED   = 'banned',
}

@Entity('students') // ánh xạ đúng tên bảng trong DB
export class Student {
  // BIGSERIAL PRIMARY KEY → 'increment' + type bigint
  @PrimaryGeneratedColumn({ type: 'bigint' })
  id: number;

  // VARCHAR(150) NOT NULL
  @Column({ length: 150 })
  fullname: string;

  // VARCHAR(255) NOT NULL UNIQUE
  @Column({ unique: true, length: 255 })
  email: string;

  // VARCHAR(20) nullable
  @Column({ length: 20, nullable: true })
  phone: string | null;

  // TEXT nullable
  @Column({ name: 'avatar_url', type: 'text', nullable: true })
  avatarUrl: string | null;

  // VARCHAR(255) nullable — không trả về trong query thông thường
  @Column({ name: 'password_hash', length: 255, nullable: true, select: false })
  passwordHash: string | null;

  // VARCHAR(255) UNIQUE nullable — đăng nhập bằng Google
  @Column({ name: 'google_id', length: 255, nullable: true, unique: true })
  googleId: string | null;

  // ENUM account_status DEFAULT 'active'
  @Column({
    type: 'enum',
    enum: AccountStatus,
    default: AccountStatus.ACTIVE,
  })
  status: AccountStatus;

  // Quan hệ 1-n: Một học viên có nhiều lần ghi danh
  @OneToMany(() => Enrollment, (enrollment: Enrollment) => enrollment.student)
  enrollments: Enrollment[];

  // Quan hệ 1-n: Một học viên có nhiều bài nộp
  @OneToMany(() => Submission, (submission: Submission) => submission.student)
  submissions: Submission[];

  // TIMESTAMPTZ NOT NULL DEFAULT NOW()
  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt: Date;

  // TIMESTAMPTZ NOT NULL DEFAULT NOW()
  @UpdateDateColumn({ name: 'updated_at', type: 'timestamptz' })
  updatedAt: Date;
}