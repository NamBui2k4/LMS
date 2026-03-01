
import { Injectable } from '@nestjs/common';
import { DataSource, Repository } from 'typeorm';
import { Student } from '../models/student.entity';
import { AccountStatus } from '../common/enums/account-status.enum';

@Injectable()
export class StudentRepository extends Repository<Student> {
  constructor(private dataSource: DataSource) {
    super(Student, dataSource.createEntityManager());
  }

  // Tìm user theo email (thường dùng cho login)
  async findByEmail(email: string): Promise<Student | null> {
    return this.findOne({
      where: { email },
      select: {
        id: true,
        email: true,
        passwordHash: true, // cần select explicit vì có { select: false } trong entity
        fullname: true,
        avatarUrl: true,
        status: true,
        googleId: true,
      },
    });
  }

  // Tìm user theo id, kèm một số relation nếu cần
  async findByIdWithRelations(id: number): Promise<Student | null> {
    return this.findOne({
      where: { id },
      relations: ['enrollments', 'createdCourses', 'submissions'],
    });
  }

  // Tìm tất cả user theo role (ví dụ: lấy tất cả giảng viên)
  async findByRole(status: AccountStatus): Promise<Student[]> {
    return this.find({
      where: { status },
      order: { fullname: 'ASC' },
    });
  }

  // Tìm sinh viên theo email
  async findByIdEmail(email: string): Promise<Student | null> {
    return this.findOne({
      where: { email, },
      select: ['id', 'email', 'passwordHash', 'fullname', 'avatarUrl', 'googleId'],
    });
  }

 
}