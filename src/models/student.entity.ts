import {
  Entity,
  PrimaryColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  OneToOne,
  OneToMany,
  JoinColumn,
} from 'typeorm';
import { User } from './user.entity';
import { AccountStatus } from '../common/enums/account-status.enum';
import { Enrollment } from './enrollment.entity';
import { Submission } from './submission.entity';

/**
 * Bảng students — entity con của users (IS-A / Table-Per-Type).
 *
 * DB:
 *   students.user_id BIGINT PRIMARY KEY
 *   REFERENCES users(id) ON DELETE CASCADE
 *
 * Luồng tạo:
 *   1. INSERT users (email, role='STUDENT', ...) → nhận id
 *   2. INSERT students (user_id = id trên, fullname, ...)
 */
@Entity('students')
export class Student {
  /**
   * user_id: vừa là PK vừa là FK → users(id).
   * KHÔNG dùng @PrimaryGeneratedColumn — giá trị đến từ users.id.
   */
  @PrimaryColumn({ type: 'bigint', name: 'user_id' })
  userId!: number;

  /**
   * Quan hệ 1-1 với User (entity cha).
   * @JoinColumn đặt ở phía "sở hữu" FK (bảng students).
   * inverse property: user.student (khai báo trong User entity).
   */
  @OneToOne(() => User, (user) => user.student, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  user!: User;

  // DB: fullname VARCHAR(150) NOT NULL
  @Column({ length: 150, name: 'fullname' })
  fullname!: string;

  // DB: email VARCHAR(255) NOT NULL UNIQUE
  // Denormalize để tìm kiếm nhanh, không cần JOIN users
  @Column({ length: 255, unique: true })
  email!: string;

  // DB: phone VARCHAR(20)
  @Column({ length: 20, nullable: true })
  phone?: string;

  // DB: avatar_url TEXT
  @Column({ type: 'text', nullable: true, name: 'avatar_url' })
  avatarUrl?: string;

  // DB: google_id VARCHAR(255) UNIQUE
  @Column({ length: 255, nullable: true, unique: true, name: 'google_id' })
  googleId?: string;

  // DB: student_code VARCHAR(20) UNIQUE
  @Column({ length: 20, nullable: true, unique: true, name: 'student_code' })
  studentCode?: string;

  // DB: faculty VARCHAR(150)
  @Column({ length: 150, nullable: true, name: 'faculty' })
  faculty?: string;

  // DB: major VARCHAR(150)
  @Column({ length: 150, nullable: true, name: 'major' })
  major?: string;

  // DB: address TEXT
  @Column({ type: 'text', nullable: true, name: 'address' })
  address?: string;

  // DB: status account_status NOT NULL DEFAULT 'active'
  @Column({
    type: 'enum',
    enum: AccountStatus,
    enumName: 'account_status', // ← FIX quan trọng nhất
    default: AccountStatus.ACTIVE
  })
  status!: AccountStatus;

  @CreateDateColumn({ type: 'timestamptz', name: 'created_at' })
  createdAt!: Date;

  @UpdateDateColumn({ type: 'timestamptz', name: 'updated_at' })
  updatedAt!: Date;

  // ── Quan hệ xuống bảng phụ thuộc ──────────────────────────────────────
  @OneToMany(() => Enrollment, (enrollment) => enrollment.student)
  enrollments!: Enrollment[];

  @OneToMany(() => Submission, (submission) => submission.student)
  submissions!: Submission[];
}