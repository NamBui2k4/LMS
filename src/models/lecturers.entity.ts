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
import { DepartmentHead } from './department-heads.entity';
// ✅ FIX: import Courses (không phải Course) — export name trong courses.entity.ts là `Courses`
import { Courses } from './courses.entity';
import { AssignedLecturers } from './assigned-lecturers.entity';

/**
 * Bảng lecturers — entity con của users (IS-A / Table-Per-Type).
 *
 * DB:
 *   lecturers.user_id BIGINT PRIMARY KEY
 *   REFERENCES users(id) ON DELETE CASCADE
 *
 * Lưu ý:
 *   - DepartmentHead kế thừa tiếp từ Lecturer (lecturers → department_heads)
 *   - Không cần tạo User + Lecturer riêng lẻ nếu dùng cascade
 */
@Entity('lecturers')
export class Lecturer {
  /**
   * user_id: vừa là PK vừa là FK → users(id).
   */
  @PrimaryColumn({ type: 'bigint', name: 'user_id' })
  userId!: number;

  /**
   * Quan hệ 1-1 với User (entity cha).
   * @JoinColumn đặt ở phía "sở hữu" FK (bảng lecturers).
   * inverse property: user.lecturer (khai báo trong User entity).
   */
  @OneToOne(() => User, (user) => user.lecturer, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  user!: User;

  // DB: fullname VARCHAR(150) NOT NULL
  @Column({ length: 150, name: 'fullname' })
  fullname!: string;

  // DB: email VARCHAR(255) NOT NULL UNIQUE
  @Column({ length: 255, unique: true })
  email!: string;

  // DB: phone VARCHAR(20)
  @Column({ length: 20, nullable: true })
  phone?: string;

  // DB: avatar_url TEXT
  @Column({ type: 'text', nullable: true, name: 'avatar_url' })
  avatarUrl?: string;

  // DB: bio TEXT
  @Column({ type: 'text', nullable: true })
  bio?: string;

  // DB: academic_degree VARCHAR(50) — ThS | TS | PGS.TS | GS.TS
  @Column({ length: 50, nullable: true, name: 'academic_degree' })
  academicDegree?: string;

  // DB: subject VARCHAR(150) — chuyên ngành giảng dạy chính
  @Column({ length: 150, nullable: true })
  subject?: string;

  // DB: department VARCHAR(150) — tên bộ môn (VARCHAR, không FK)
  @Column({ length: 150, nullable: true })
  department?: string;

  // DB: password_hash VARCHAR(255) — riêng của lecturers (có thể khác users)
  @Column({ length: 255, nullable: true, name: 'password_hash' })
  passwordHash?: string;

  // DB: google_id VARCHAR(255) UNIQUE
  @Column({ length: 255, nullable: true, unique: true, name: 'google_id' })
  googleId?: string;

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

  // ── Quan hệ IS-A xuống department_heads ──────────────────────────────
  // Một Lecturer CÓ THỂ là DepartmentHead (nullable)
  @OneToOne(() => DepartmentHead, (dh) => dh.lecturer)
  departmentHead?: DepartmentHead;

  // ── Quan hệ xuống các bảng phụ thuộc ─────────────────────────────────
  // ✅ FIX: Course → Courses (đúng class name được export từ courses.entity.ts)
  @OneToMany(() => Courses, (course) => course.createdBy)
  createdCourses!: Courses[];

  @OneToMany(() => AssignedLecturers, (ci) => ci.instructor)
  assignedCourses!: AssignedLecturers[];
}