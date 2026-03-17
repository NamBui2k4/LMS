import {
  Entity,
  PrimaryColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  OneToOne,
  JoinColumn,
} from 'typeorm';
import { User } from './user.entity';
import { AccountStatus } from '../common/enums/account-status.enum';

/**
 * Bảng admins — entity con của users (IS-A / Table-Per-Type).
 *
 * DB:
 *   admins.user_id BIGINT PRIMARY KEY
 *   REFERENCES users(id) ON DELETE CASCADE
 */
@Entity('admins')
export class Admin {
  /**
   * user_id: vừa là PK vừa là FK → users(id).
   */
  @PrimaryColumn({ type: 'bigint', name: 'user_id' })
  userId: number;

  /**
   * Quan hệ 1-1 với User (entity cha).
   * @JoinColumn đặt ở phía "sở hữu" FK (bảng admins).
   * inverse property: user.admin (khai báo trong User entity).
   */
  @OneToOne(() => User, (user) => user.admin, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  user: User;

  // DB: fullname VARCHAR(150) NOT NULL
  @Column({ length: 150, name: 'fullname' })
  fullname: string;

  // DB: permissions JSONB — danh sách quyền hạn, ví dụ: ["all"] hoặc ["manage_users","manage_courses"]
  @Column({ type: 'jsonb', nullable: true })
  permissions?: string[];

  // DB: recent_activity_log JSONB — nhật ký hoạt động gần nhất (SRS yêu cầu)
  @Column({ type: 'jsonb', nullable: true, name: 'recent_activity_log' })
  recentActivityLog?: Record<string, any>[];

  // DB: status account_status NOT NULL DEFAULT 'active'
  @Column({ type: 'enum', enum: AccountStatus, default: AccountStatus.ACTIVE })
  status: AccountStatus;

  @CreateDateColumn({ type: 'timestamptz', name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ type: 'timestamptz', name: 'updated_at' })
  updatedAt: Date;
}