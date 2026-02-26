import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, OneToMany } from 'typeorm';
import { AccountStatus } from '../common/enums/account-status.enum';
import { Course } from './courses.entity';
import { AssignedLecturers } from './assigned-lecturers.entity';

@Entity('lecturers')
export class Lecturer {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ length: 150 })
  fullname: string;

  @Column({ length: 255, unique: true })
  email: string;

  @Column({ length: 20, nullable: true })
  phone?: string;

  @Column({ nullable: true })
  avatarUrl?: string;

  @Column({ type: 'text', nullable: true })
  bio?: string;

  @Column({ length: 50, nullable: true })
  academicDegree?: string;

  @Column({ length: 150, nullable: true })
  subject?: string;

  @Column({ length: 150, nullable: true })
  department?: string;

  @Column({ nullable: true })
  passwordHash?: string;

  @Column({ length: 255, unique: true, nullable: true })
  googleId?: string;

  @Column({
    type: 'enum',
    enum: AccountStatus,
    default: AccountStatus.ACTIVE,
  })
  status: AccountStatus;

  @CreateDateColumn({ type: 'timestamptz' })
  createdAt: Date;

  @UpdateDateColumn({ type: 'timestamptz' })
  updatedAt: Date;

  @OneToMany(() => Course, (course) => course.createdBy)
  createdCourses: Course[];

  @OneToMany(() => AssignedLecturers, (al) => al.instructor)
  assignedCourses: AssignedLecturers[];
}