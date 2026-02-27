// backend/src/repository/StudentRepository.ts

import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Student } from '../models/student.entity';

export interface PaginationResult<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface FindAllOptions {
  page?: number;
  limit?: number;
  status?: 'active' | 'inactive' | 'banned';
  search?: string; // tìm theo fullname hoặc email
}

@Injectable()
export class StudentRepository {
  constructor(
    @InjectRepository(Student)
    private readonly repo: Repository<Student>,
  ) {}

  // ─── FIND BY ID ──────────────────────────────────────────────────────────────
  async findById(id: number): Promise<Student | null> {
    return this.repo
      .createQueryBuilder('s')
      .where('s.id = :id', { id })
      .getOne();
  }

  // ─── FIND BY EMAIL ───────────────────────────────────────────────────────────
  async findByEmail(email: string): Promise<Student | null> {
    return this.repo
      .createQueryBuilder('s')
      .addSelect('s.passwordHash') // passwordHash bị ẩn mặc định → phải chọn thủ công
      .where('s.email = :email', { email })
      .getOne();
  }

  // ─── CREATE ──────────────────────────────────────────────────────────────────
  async create(data: Partial<Student>): Promise<Student> {
    const student = this.repo.create(data);
    return this.repo.save(student);
  }

  // ─── UPDATE ──────────────────────────────────────────────────────────────────
  async update(id: number, data: Partial<Student>): Promise<Student | null> {
    await this.repo
      .createQueryBuilder()
      .update(Student)
      .set(data)
      .where('id = :id', { id })
      .execute();

    return this.findById(id);
  }

  // ─── DELETE (soft-delete bằng cách đổi status → banned, hoặc hard-delete) ───
  async delete(id: number): Promise<boolean> {
    const result = await this.repo
      .createQueryBuilder()
      .delete()
      .from(Student)
      .where('id = :id', { id })
      .execute();

    return (result.affected ?? 0) > 0;
  }

  // ─── FIND ALL (phân trang + tìm kiếm + lọc status) ─────────────────────────
  async findAll(options: FindAllOptions = {}): Promise<PaginationResult<Student>> {
    const { page = 1, limit = 10, status, search } = options;
    const offset = (page - 1) * limit;

    const qb = this.repo
      .createQueryBuilder('s')
      .orderBy('s.createdAt', 'DESC')
      .skip(offset)
      .take(limit);

    if (status) {
      qb.andWhere('s.status = :status', { status });
    }

    if (search) {
      qb.andWhere(
        '(s.fullname ILIKE :search OR s.email ILIKE :search)',
        { search: `%${search}%` },
      );
    }

    const [data, total] = await qb.getManyAndCount();

    return {
      data,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  // ─── HELPERS ─────────────────────────────────────────────────────────────────
  /** Kiểm tra email đã tồn tại chưa (dùng khi đăng ký) */
  async existsByEmail(email: string): Promise<boolean> {
    const count = await this.repo
      .createQueryBuilder('s')
      .where('s.email = :email', { email })
      .getCount();
    return count > 0;
  }

  /** Soft-delete: chuyển status → 'banned' thay vì xóa hẳn */
  async softDelete(id: number): Promise<Student | null> {
    return this.update(id, { status: 'banned' } as Partial<Student>);
  }
}