
import { Injectable } from '@nestjs/common';
import { DataSource, Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import { Student } from '../models/student.entity';
import { AccountStatus } from '../common/enums/account-status.enum';

@Injectable()
export class StudentRepository {
  constructor(
    @InjectRepository(Student)
    private readonly studentRepo: Repository<Student>,
    private readonly dataSource: DataSource,
  ) { }

  // Tìm user theo email (thường dùng cho login)
  async findByEmail(email: string): Promise<Student | null> {
    return this.studentRepo.findOne({
      where: { email },
      select: {
        id: true,
        email: true,
        fullname: true,
        avatarUrl: true,
        status: true,
        googleId: true,
      },
    });
  }

  // Tìm user theo id, kèm một số relation nếu cần
  async findByIdWithRelations(id: string): Promise<Student | null> {
    return this.studentRepo.findOne({
      where: { id: id },
      relations: ['enrollments', 'createdCourses', 'submissions'],
    });
  }

  // Tìm tất cả user theo role (ví dụ: lấy tất cả giảng viên)
  async findByRole(status: AccountStatus): Promise<Student[]> {
    return this.studentRepo.find({
      where: { status },
      order: { fullname: 'ASC' },
    });
  }

  // Tìm sinh viên theo email
  async findByIdEmail(email: string): Promise<Student | null> {
    return this.studentRepo.findOne({
      where: { email, },
      select: ['id', 'email', 'fullname', 'avatarUrl', 'googleId'],
    });
  }

  async updateStatus(id: string, status: AccountStatus): Promise<Student | null> {
    // Cú pháp đúng: update(điều kiện, { các trường cần sửa })
    await this.studentRepo.update(id, { status });
    return this.studentRepo.findOne({ where: { id } });
  }

  async findAllPaginated(page: number = 1, limit: number = 10) {
    // 1. Thực hiện truy vấn findAndCount
    const [data, total] = await this.studentRepo.findAndCount({
      skip: (page - 1) * limit,
      take: limit,
      order: { createdAt: 'DESC' } as any, // Ép kiểu nếu TS báo lỗi với createdAt
    });

    // 2. Tính toán metadata ngay tại đây
    return {
      data,
      meta: {
        total,
        page,
        limit,
        lastPage: Math.ceil(total / limit),
      },
    };
  }

  async findById(id: string): Promise<Student | null> {
    return await this.studentRepo.findOne({
      where: { id } as any,
      // Tự động JOIN với bảng User để lấy Email, Role...
      // Và bảng Enrollments để lấy danh sách khóa học
      relations: ['user', 'enrollments'], 
    });
  }
}