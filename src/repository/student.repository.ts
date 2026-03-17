import { Injectable } from '@nestjs/common';
import { DataSource, Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import { Student } from '../models/student.entity';
import { AccountStatus } from '../common/enums/account-status.enum';

/**
 * ✅ FIX: Students PK là `userId` (maps to DB column `user_id`)
 *         Trước đây nhiều method dùng `id` → TypeORM không tìm được cột đúng.
 *
 * ✅ FIX: Bỏ relations ['createdCourses'] — Student không có property này trong entity mới
 * ✅ FIX: AccountStatus.BANNED (không còn SUSPENDED)
 * ✅ FIX: select dùng đúng property name của entity (userId, không phải id)
 */
@Injectable()
export class StudentRepository {
  constructor(
    @InjectRepository(Student)
    private readonly studentRepo: Repository<Student>,
    private readonly dataSource: DataSource,
  ) {}

  async findByEmail(email: string): Promise<Student | null> {
    return this.studentRepo.findOne({
      where: { email },
      select: {
        userId: true,    // ✅ FIX: userId (không phải id)
        email: true,
        fullname: true,
        avatarUrl: true,
        status: true,
        googleId: true,
      },
    });
  }

  async findById(userId: number): Promise<Student | null> {
    return this.studentRepo.findOne({
      // ✅ FIX: where dùng userId (PK đúng)
      where: { userId },
      relations: ['user', 'enrollments'],
    });
  }

  async findByIdWithRelations(userId: number): Promise<Student | null> {
    return this.studentRepo.findOne({
      where: { userId }, // ✅ FIX
      relations: ['enrollments', 'submissions'],
    });
  }

  async findByStatus(status: AccountStatus): Promise<Student[]> {
    return this.studentRepo.find({
      where: { status },
      order: { fullname: 'ASC' },
    });
  }

  async updateStatus(userId: number, status: AccountStatus): Promise<Student | null> {
    // ✅ FIX: update theo userId (PK đúng)
    await this.studentRepo.update({ userId }, { status });
    return this.findById(userId);
  }

  async findAllPaginated(page: number = 1, limit: number = 10) {
    const [data, total] = await this.studentRepo.findAndCount({
      skip: (page - 1) * limit,
      take: limit,
      order: { createdAt: 'DESC' },
    });
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

  async findByIdWithEnrollments(userId: number): Promise<Student | null> {
    return this.studentRepo.findOne({
      where: { userId }, // ✅ FIX
      relations: [
        'enrollments',
        'enrollments.course',
        'enrollments.course.category',
        'enrollments.course.createdBy',
      ],
    });
  }

  async findByIdWithSubmissions(userId: number): Promise<Student | null> {
    return this.studentRepo.findOne({
      where: { userId }, // ✅ FIX
      relations: [
        'submissions',
        'submissions.quiz',
        'submissions.quiz.course',
        'submissions.gradedBy',
      ],
    });
  }

  async update(userId: number, data: Partial<Student>): Promise<Student | null> {
    await this.studentRepo.update({ userId }, data as any); // ✅ FIX
    return this.findById(userId);
  }

  async createWithTransaction(data: {
    fullname: string;
    email: string;
    passwordHash: string;
    phone?: string | null;
  }): Promise<Student> {
    return this.dataSource.transaction(async (manager) => {
      // Bước 1: Insert vào bảng users
      const userResult = await manager.query(
        `INSERT INTO users (email, password_hash, role, is_active)
         VALUES ($1, $2, 'STUDENT', true) RETURNING id`,
        [data.email, data.passwordHash],
      );
      const userId = Number(userResult[0].id);

      // Bước 2: Insert vào bảng students
      // ✅ null → undefined để tránh TypeORM type error
      const student = manager.create(Student, {
        userId,
        fullname: data.fullname,
        email: data.email,
        //passwordHash: data.passwordHash,
        status: AccountStatus.ACTIVE,
        phone: data.phone ?? undefined,
      });

      return manager.save(Student, student);
    });
  }
}