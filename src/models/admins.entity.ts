import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn } from 'typeorm';
import { AccountStatus } from '../common/enums/account-status.enum';

@Entity('admins')
export class Admin {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ length: 150 })
  fullname: string;

  @Column({ length: 255, unique: true })
  email: string;

  @Column({ nullable: true })
  passwordHash?: string;

  @Column({ type: 'jsonb', nullable: true })
  permissions?: any[];

  @Column({ type: 'jsonb', nullable: true })
  recentActivityLog?: any;

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
}