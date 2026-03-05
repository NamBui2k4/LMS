import { Injectable, NotFoundException, ConflictException, ForbiddenException } from '@nestjs/common';
import { DepartmentHeadRepository } from '../repository/department-heads.repository';
import { LecturerRepository } from '../repository/lecturer.repository';
import { DepartmentHead } from '../models/department-heads.entity';

export class AppointDeptHeadDto {
  instructorId: number;
  termEnd?: Date;
}

@Injectable()
export class DepartmentHeadService {
  constructor(
    private readonly deptHeadRepo: DepartmentHeadRepository,
    private readonly lecturerRepo: LecturerRepository,
  ) {}

  async findAll(): Promise<DepartmentHead[]> {
    return this.deptHeadRepo.findAll();
  }

  async findOne(instructorId: number): Promise<DepartmentHead> {
    const deptHead = await this.deptHeadRepo.findById(instructorId);
    if (!deptHead) throw new NotFoundException('Không tìm thấy trưởng bộ môn.');
    return deptHead;
  }

  async findActive(): Promise<DepartmentHead[]> {
    return this.deptHeadRepo.findActive();
  }

  async appoint(dto: AppointDeptHeadDto): Promise<DepartmentHead> {
    const lecturer = await this.lecturerRepo.findById(dto.instructorId);
    if (!lecturer) throw new NotFoundException('Không tìm thấy giảng viên.');

    const existing = await this.deptHeadRepo.findById(dto.instructorId);
    if (existing) throw new ConflictException('Giảng viên đã là trưởng bộ môn.');

    return this.deptHeadRepo.create({
      instructorId: dto.instructorId,
      termEnd: dto.termEnd,
    });
  }

  async update(instructorId: number, termEnd?: Date): Promise<DepartmentHead> {
    await this.findOne(instructorId);
    const updated = await this.deptHeadRepo.update(instructorId, { termEnd });
    return updated!;
  }

  async remove(instructorId: number): Promise<void> {
    await this.findOne(instructorId);
    await this.deptHeadRepo.delete(instructorId);
  }

  // [MỚI] Xem thông tin khóa học mà Trưởng bộ môn đã duyệt
  // Phục vụ báo cáo hoạt động phê duyệt nội dung đào tạo
  async getReviewedCourses(instructorId: number): Promise<DepartmentHead> {
    const deptHead = await this.deptHeadRepo.findByIdWithReviewedCourses(instructorId);
    if (!deptHead) throw new NotFoundException('Không tìm thấy trưởng bộ môn.');
    return deptHead;
  }

  // [MỚI] Kiểm tra Trưởng bộ môn có đang trong nhiệm kỳ không
  // Được dùng trước khi cho phép thực hiện các thao tác cần quyền Trưởng bộ môn
  async assertIsInActiveTerm(instructorId: number): Promise<void> {
    const isActive = await this.deptHeadRepo.isInActiveTerm(instructorId);
    if (!isActive) {
      throw new ForbiddenException('Trưởng bộ môn không còn trong nhiệm kỳ hiện tại.');
    }
  }

  // [MỚI] Lấy danh sách Trưởng bộ môn kèm thông tin phân công
  // Phục vụ Admin xem tổng quan quản lý nhân sự
  async findByIdWithAssignments(instructorId: number): Promise<DepartmentHead> {
    const deptHead = await this.deptHeadRepo.findByIdWithAssignments(instructorId);
    if (!deptHead) throw new NotFoundException('Không tìm thấy trưởng bộ môn.');
    return deptHead;
  }
}