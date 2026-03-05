import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import { DepartmentHead } from '../models/department-heads.entity';

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

  async findById(instructorId: number): Promise<DepartmentHead | null> {
    return this.deptHeadRepo.findOne({
      where: { instructorId },
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

  async update(instructorId: number, data: Partial<DepartmentHead>): Promise<DepartmentHead | null> {
    await this.deptHeadRepo.update(instructorId, data);
    return this.findById(instructorId);
  }

  async delete(instructorId: number): Promise<void | null> {
    await this.deptHeadRepo.delete(instructorId);
  }

  // [MỚI] Tìm Trưởng bộ môn kèm toàn bộ thông tin khóa học đã duyệt
  // Phục vụ báo cáo hoạt động phê duyệt và quản lý khóa học
  async findByIdWithReviewedCourses(instructorId: number): Promise<DepartmentHead | null> {
    return this.deptHeadRepo
      .createQueryBuilder('dh')
      .leftJoinAndSelect('dh.lecturer', 'lecturer')
      .leftJoinAndSelect('lecturer.createdCourses', 'createdCourses')
      .where('dh.instructorId = :instructorId', { instructorId })
      .getOne();
  }

  // [MỚI] Tìm Trưởng bộ môn kèm danh sách giảng viên đã phân công
  // Phục vụ xem tổng quan hoạt động quản lý phân công
  async findByIdWithAssignments(instructorId: number): Promise<DepartmentHead | null> {
    return this.deptHeadRepo
      .createQueryBuilder('dh')
      .leftJoinAndSelect('dh.lecturer', 'lecturer')
      .where('dh.instructorId = :instructorId', { instructorId })
      .getOne();
  }

  // [MỚI] Kiểm tra Trưởng bộ môn có đang trong nhiệm kỳ không
  async isInActiveTerm(instructorId: number): Promise<boolean> {
    const result = await this.deptHeadRepo
      .createQueryBuilder('dh')
      .where('dh.instructorId = :instructorId', { instructorId })
      .andWhere('dh.termEnd IS NULL OR dh.termEnd > CURRENT_DATE')
      .getCount();
    return result > 0;
  }
}