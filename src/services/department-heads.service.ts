import {
  Injectable,
  NotFoundException,
  ConflictException,
  ForbiddenException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { DepartmentHeadRepository } from '../repository/department-heads.repository';
import { LecturerRepository } from '../repository/lecturer.repository';
import { DepartmentHead } from '../models/department-heads.entity';
import { IsNumber, IsOptional } from 'class-validator';
import { User } from '../models/user.entity';
import { UserRole } from '../common/enums/role.enum';

// ✅ FIX: DTO dùng userId (không phải instructorId)
export class AppointDeptHeadDto {
  @IsNumber()
  userId: number; // ✅ FIX: userId (không phải instructorId)

  @IsOptional()
  termEnd?: Date;
}

@Injectable()
export class DepartmentHeadService {
  constructor(
    private readonly deptHeadRepo: DepartmentHeadRepository,
    private readonly lecturerRepo: LecturerRepository,
    @InjectRepository(User)
    private readonly userRepo: Repository<User>,
  ) {}

  async findAll(): Promise<DepartmentHead[]> {
    return this.deptHeadRepo.findAll();
  }

  // ✅ FIX: tham số userId
  async findOne(userId: number): Promise<DepartmentHead> {
    const deptHead = await this.deptHeadRepo.findById(userId);
    if (!deptHead) throw new NotFoundException('Không tìm thấy trưởng bộ môn.');
    return deptHead;
  }

  async findActive(): Promise<DepartmentHead[]> {
    return this.deptHeadRepo.findActive();
  }

  async appoint(dto: AppointDeptHeadDto): Promise<DepartmentHead> {
    // ✅ FIX: tìm lecturer bằng userId
    const lecturer = await this.lecturerRepo.findById(dto.userId);
    if (!lecturer) throw new NotFoundException('Không tìm thấy giảng viên.');

    const existing = await this.deptHeadRepo.findById(dto.userId); // ✅ FIX
    if (existing) throw new ConflictException('Giảng viên đã là trưởng bộ môn.');

    const departmentHead = await this.deptHeadRepo.create({
      userId: dto.userId, // ✅ FIX
      termEnd: dto.termEnd,
    });

    await this.userRepo.update({ id: dto.userId } as any, {
      role: UserRole.HEAD_OF_DEPARTMENT,
    });

    return departmentHead;
  }

  // ✅ FIX: tham số userId
  async update(userId: number, termEnd?: Date): Promise<DepartmentHead> {
    await this.findOne(userId);
    const updated = await this.deptHeadRepo.update(userId, { termEnd });
    return updated!;
  }

  // ✅ FIX: tham số userId
  async remove(userId: number): Promise<void> {
    await this.findOne(userId);
    await this.deptHeadRepo.delete(userId);
    await this.userRepo.update({ id: userId } as any, {
      role: UserRole.LECTURER,
    });
  }

  async getReviewedCourses(userId: number): Promise<DepartmentHead> {
    const deptHead = await this.deptHeadRepo.findByIdWithReviewedCourses(userId); // ✅ FIX
    if (!deptHead) throw new NotFoundException('Không tìm thấy trưởng bộ môn.');
    return deptHead;
  }

  async assertIsInActiveTerm(userId: number): Promise<void> {
    const isActive = await this.deptHeadRepo.isInActiveTerm(userId); // ✅ FIX
    if (!isActive) {
      throw new ForbiddenException('Trưởng bộ môn không còn trong nhiệm kỳ hiện tại.');
    }
  }

  async findByIdWithAssignments(userId: number): Promise<DepartmentHead> {
    const deptHead = await this.deptHeadRepo.findByIdWithAssignments(userId); // ✅ FIX
    if (!deptHead) throw new NotFoundException('Không tìm thấy trưởng bộ môn.');
    return deptHead;
  }
}