import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import { DepartmentHead } from '../models/department-heads.entity';

/**
 * ✅ FIX: Đổi toàn bộ tham số `instructorId` → `userId` để khớp với entity mới
 *         (DepartmentHead.userId — PK là user_id trong DB)
 */
@Injectable()
export class DepartmentHeadRepository {
  constructor(
    @InjectRepository(DepartmentHead)
    private readonly deptHeadRepo: Repository<DepartmentHead>,
    private readonly dataSource: DataSource,
  ) {}

  async findAll(): Promise<DepartmentHead[]> {
    return this.deptHeadRepo.find({ relations: ['lecturer'] });
  }

  // ✅ FIX: tham số userId (không phải instructorId)
  async findById(userId: number): Promise<DepartmentHead | null> {
    return this.deptHeadRepo.findOne({
      where: { userId },
      relations: ['lecturer'],
    });
  }

  async findActive(): Promise<DepartmentHead[]> {
    return this.deptHeadRepo
      .createQueryBuilder('dh')
      .leftJoinAndSelect('dh.lecturer', 'lecturer')
      .where('dh.termEnd IS NULL OR dh.termEnd > CURRENT_DATE')
      .getMany();
  }

  async create(data: Partial<DepartmentHead>): Promise<DepartmentHead> {
    const entity = this.deptHeadRepo.create(data);
    return this.deptHeadRepo.save(entity);
  }

  // ✅ FIX: tham số userId
  async update(userId: number, data: Partial<DepartmentHead>): Promise<DepartmentHead | null> {
    await this.deptHeadRepo.update({ userId }, data);
    return this.findById(userId);
  }

  // ✅ FIX: tham số userId
  async delete(userId: number): Promise<void> {
    await this.deptHeadRepo.delete({ userId });
  }

  async findByIdWithReviewedCourses(userId: number): Promise<DepartmentHead | null> {
    return this.deptHeadRepo
      .createQueryBuilder('dh')
      .leftJoinAndSelect('dh.lecturer', 'lecturer')
      .leftJoinAndSelect('lecturer.createdCourses', 'createdCourses')
      .where('dh.userId = :userId', { userId }) // ✅ FIX
      .getOne();
  }

  async findByIdWithAssignments(userId: number): Promise<DepartmentHead | null> {
    return this.deptHeadRepo
      .createQueryBuilder('dh')
      .leftJoinAndSelect('dh.lecturer', 'lecturer')
      .where('dh.userId = :userId', { userId }) // ✅ FIX
      .getOne();
  }

  // ✅ FIX: tham số userId
  async isInActiveTerm(userId: number): Promise<boolean> {
    const result = await this.deptHeadRepo
      .createQueryBuilder('dh')
      .where('dh.userId = :userId', { userId }) // ✅ FIX
      .andWhere('dh.termEnd IS NULL OR dh.termEnd > CURRENT_DATE')
      .getCount();
    return result > 0;
  }
}