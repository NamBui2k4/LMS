import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  OneToOne,
} from 'typeorm';
import { UserRole } from '../common/enums/role.enum';
import { Student } from './student.entity';
import { Lecturer } from './lecturers.entity';
import { Admin } from './admins.entity';

/**
 * Bảng identity chung — xác thực & phân quyền (RBAC).
 * Không lưu profile chi tiết. Profile nằm ở bảng con tương ứng.
 *
 * Quan hệ IS-A (Table-Per-Type):
 *   users (1) ──── (1) students
 *   users (1) ──── (1) lecturers
 *   users (1) ──── (1) admins
 *   lecturers (1) ── (1) department_heads   ← kế thừa sâu hơn
 */
@Entity('users')
export class User {
  // DB: id BIGSERIAL PRIMARY KEY
  @PrimaryGeneratedColumn({ type: 'bigint' })
  id!: number;

  // DB: email VARCHAR(255) NOT NULL UNIQUE
  @Column({ type: 'varchar', length: 255, unique: true })
  email!: string;

  // DB: password_hash VARCHAR(255)
  @Column({ type: 'varchar', length: 255, nullable: true, name: 'password_hash' })
  passwordHash?: string;

  // DB: google_id VARCHAR(255) UNIQUE
  @Column({ type: 'varchar', length: 255, unique: true, nullable: true, name: 'google_id' })
  googleId?: string;

  // DB: role VARCHAR(50) CHECK ('STUDENT','LECTURER','HEAD_OF_DEPARTMENT','ADMIN')
  @Column({ type: 'enum', enum: UserRole })
  role!: UserRole;

  // DB: is_active BOOLEAN NOT NULL DEFAULT true
  @Column({ type: 'boolean', default: true, name: 'is_active' })
  isActive!: boolean;

  // DB: last_login_at TIMESTAMPTZ
  @Column({ type: 'timestamptz', nullable: true, name: 'last_login_at' })
  lastLoginAt?: Date;

  // DB: failed_login_attempts INT DEFAULT 0
  @Column({ type: 'int', default: 0, name: 'failed_login_attempts' })
  failedLoginAttempts!: number;

  // DB: locked_until TIMESTAMPTZ
  @Column({ type: 'timestamptz', nullable: true, name: 'locked_until' })
  lockedUntil?: Date;

  @CreateDateColumn({ type: 'timestamptz', name: 'created_at' })
  createdAt!: Date;

  @UpdateDateColumn({ type: 'timestamptz', name: 'updated_at' })
  updatedAt!: Date;

  // ── Quan hệ IS-A xuống các bảng con ─────────────────────────────────────
  // mappedBy trỏ đến property 'user' trong entity con

  @OneToOne(() => Student, (student) => student.user)
  student?: Student;

  @OneToOne(() => Lecturer, (lecturer) => lecturer.user)
  lecturer?: Lecturer;

  @OneToOne(() => Admin, (admin) => admin.user)
  admin?: Admin;
}