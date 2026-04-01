import {
  Entity,
  PrimaryColumn,
  Column,
  OneToOne,
  JoinColumn,
} from 'typeorm';
import { Lecturer } from './lecturers.entity';
import { DepartmentHeadService } from '../services/department-heads.service';

/**
 * DB (schema mới - file upload):
 *   department_heads(user_id, appointed_at, term_end)
 *   user_id BIGINT PRIMARY KEY REFERENCES lecturers(user_id) ON DELETE CASCADE
 *
 * ✅ FIX: PK đổi từ `instructor_id` → `userId` để khớp với DB schema mới
 *         DB file upload dùng: user_id BIGINT PRIMARY KEY REFERENCES lecturers(user_id)
 */
@Entity('department_heads')
export class DepartmentHead {
  // DB: user_id BIGINT PRIMARY KEY REFERENCES lecturers(user_id)
  @PrimaryColumn({ type: 'bigint', name: 'user_id' })
  userId: number; // ✅ FIX: từ instructorId → userId

  @OneToOne(() => Lecturer, (lecturer) => lecturer.departmentHead, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  lecturer: Lecturer;

  // DB: appointed_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
  @Column({ type: 'timestamptz', default: () => 'NOW()', name: 'appointed_at' })
  appointedAt: Date;

  // DB: term_end DATE (nullable) — NULL = nhiệm kỳ chưa xác định kết thúc
  @Column({ type: 'date', nullable: true, name: 'term_end' })
  termEnd?: Date;
}