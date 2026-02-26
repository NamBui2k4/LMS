import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, OneToMany } from 'typeorm';
import { AccountStatus } from '../common/enums/account-status.enum';
import { Enrollment } from './enrollment.entity';
import { Submission } from './submission.entity';

@Entity('students')
export class Student {
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

  @OneToMany(() => Enrollment, (enrollment) => enrollment.student)
  enrollments: Enrollment[];

  @OneToMany(() => Submission, (submission) => submission.student)
  submissions: Submission[]
}
