import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  ManyToOne,
  CreateDateColumn,
  JoinColumn,
} from 'typeorm';
import { MaterialType } from '../common/enums/material-type.enum';
import { Lesson } from './lesson.entity';

@Entity('materials')
export class Material {
  // DB: id BIGSERIAL PRIMARY KEY
  @PrimaryGeneratedColumn()
  id!: number;

  @ManyToOne(() => Lesson, (lesson) => lesson.materials, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'lesson_id' })
  lesson!: Lesson;

  // DB: file_name VARCHAR(255) NOT NULL
  @Column({ length: 255, name: 'file_name' })
  fileName!: string;

  // DB: file_url TEXT NOT NULL
  @Column({ type: 'text', name: 'file_url' })
  fileUrl!: string;

  // DB: file_type material_type NOT NULL
  // Enum hợp lệ: 'image' | 'video' | 'audio' | 'document'
  @Column(
    {
      type: 'enum',
      enum: MaterialType,
      enumName: 'material_type',
      name: 'file_type'
    })
  fileType!: MaterialType;

  // DB: file_size_kb INT (nullable) — đơn vị kilobyte
  @Column({ type: 'int', nullable: true, name: 'file_size_kb' })
  fileSizeKb?: number;

  // DB: order_index INT NOT NULL DEFAULT 0
  @Column({ default: 0, name: 'order_index' })
  orderIndex!: number;

  // DB: created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
  @CreateDateColumn({ type: 'timestamptz', name: 'created_at' })
  createdAt!: Date;
}