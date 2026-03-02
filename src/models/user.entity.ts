import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';
import { UserRole } from 'src/common/enums/role.enum';

@Entity('users') // Tên bảng chính xác trong database
export class User {
  // Sử dụng bigint cho ID. TypeORM sẽ trả về kiểu string trong JavaScript 
  // để tránh mất mát độ chính xác (JS không xử lý tốt số quá lớn)
  @PrimaryGeneratedColumn('increment', { type: 'bigint' })
  id: string;

  @Column({ type: 'varchar', length: 255, unique: true })
  email: string;

  @Column({ type: 'varchar', length: 255, nullable: true, name: 'password_hash' })
  passwordHash: string;

  @Column({ type: 'varchar', length: 255, unique: true, nullable: true, name: 'google_id' })
  googleId: string;

  @Column({
    type: 'enum',
    enum: UserRole,
    // Trong SQL bạn dùng CHECK, nhưng với TypeORM định nghĩa enum ở đây 
    // sẽ tự động đồng bộ hóa chuẩn xác với PostgreSQL
  })
  role: UserRole;

  @Column({ type: 'boolean', default: true, name: 'is_active' })
  isActive: boolean;

  @Column({ type: 'timestamptz', nullable: true, name: 'last_login_at' })
  lastLoginAt: Date;

  @Column({ type: 'int', default: 0, name: 'failed_login_attempts' })
  failedLoginAttempts: number;

  @Column({ type: 'timestamptz', nullable: true, name: 'locked_until' })
  lockedUntil: Date;

  @CreateDateColumn({ type: 'timestamptz', name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ type: 'timestamptz', name: 'updated_at' })
  updatedAt: Date;
}