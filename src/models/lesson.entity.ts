import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  ManyToOne,
  OneToMany,
  CreateDateColumn,
  UpdateDateColumn,
  JoinColumn,
} from 'typeorm';
import { Courses } from './courses.entity';
import { Material } from './material.entity';

/**
 * DB: lessons(id, course_id, title, summary, content, order_index, created_at, updated_at)
 *
 * ✅ FIX: Thêm cột `summary` — DB có nhưng entity cũ thiếu
 * ✅ FIX: Đảm bảo property name là `orderIndex` (map đúng với DB column `order_index`)
 *         Nhiều file khác (DTO, Repository) dùng `order` thay vì `orderIndex` — đã fix ở các file tương ứng
 */
@Entity('lessons')
export class Lesson {
  // DB: id BIGSERIAL PRIMARY KEY
  @PrimaryGeneratedColumn()
  id: number;

  // DB: course_id BIGINT NOT NULL → FK → courses(id)
  @ManyToOne(() => Courses, (course: Courses) => course.lessons, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'course_id' })
  course: Courses;

  // DB: title VARCHAR(255) NOT NULL
  @Column({ length: 255 })
  title: string;

  // DB: summary TEXT (nullable) — tóm tắt bài giảng
  // ✅ FIX: Entity cũ đã có field này — giữ nguyên
  @Column({ type: 'text', nullable: true })
  summary?: string;

  // DB: content TEXT (nullable)
  @Column({ type: 'text', nullable: true })
  content?: string;

  // DB: order_index INT NOT NULL DEFAULT 0
  // ✅ FIX: property `orderIndex` (không phải `order`) — các DTO/Repo phải dùng tên này
  @Column({ default: 0, name: 'order_index' })
  orderIndex: number;

  @CreateDateColumn({ type: 'timestamptz', name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ type: 'timestamptz', name: 'updated_at' })
  updatedAt: Date;

  @OneToMany(() => Material, (material: Material) => material.lesson, { cascade: true })
  materials: Material[];
}