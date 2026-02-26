import { Entity, PrimaryColumn, Column, CreateDateColumn } from 'typeorm';
import { Lecturer } from './lecturers.entity';

@Entity('department_heads')
export class DepartmentHead {
  @PrimaryColumn()
  instructorId: number;

  @Column({ type: 'timestamptz', default: () => 'NOW()' })
  appointedAt: Date;

  @Column({ type: 'date', nullable: true })
  termEnd?: Date;

  // Quan hệ 1-1 với Lecturer
  lecturer: Lecturer; // không cần @OneToOne vì PK trùng nhau
}