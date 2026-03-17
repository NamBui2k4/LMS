import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import { AssignedLecturers } from '../models/assigned-lecturers.entity';

/**
 * Repository cho bảng course_instructors (phân công giảng viên vào khóa học).
 *
 * ✅ FIX TOÀN BỘ FILE: đổi tham số `lecturerId` → `instructorId`
 *    Lý do: AssignedLecturers entity dùng property `instructorId` (maps to DB: instructor_id),
 *    không phải `lecturerId`. TypeORM's FindOptionsWhere chỉ chấp nhận đúng tên property
 *    trong entity — dùng `lecturerId` sẽ bị lỗi ts(2339) / ts(2769).
 */
@Injectable()
export class AssignedLecturersRepository {
  constructor(
    @InjectRepository(AssignedLecturers)
    private readonly assignedRepo: Repository<AssignedLecturers>,
    private readonly dataSource: DataSource,
  ) {}

  /**
   * Lấy danh sách giảng viên được phân công trong một khóa học
   */
  async findByCourse(courseId: number): Promise<AssignedLecturers[]> {
    return this.assignedRepo.find({
      where: { courseId },
      relations: ['instructor'],
    });
  }

  /**
   * Lấy danh sách khóa học mà một giảng viên được phân công
   * ✅ FIX: where: { lecturerId } → where: { instructorId }
   *         `instructorId` mới là tên property đúng trong AssignedLecturers entity
   */
  async findByLecturer(instructorId: number): Promise<AssignedLecturers[]> {
    return this.assignedRepo.find({
      // ✅ FIX: lecturerId → instructorId
      where: { instructorId },
      relations: ['course'],
    });
  }

  /**
   * Tìm một bản ghi phân công cụ thể (theo courseId + instructorId)
   * ✅ FIX: tham số lecturerId → instructorId; where dùng instructorId
   */
  async findOne(courseId: number, instructorId: number): Promise<AssignedLecturers | null> {
    return this.assignedRepo.findOne({
      // ✅ FIX: { courseId, lecturerId } → { courseId, instructorId }
      where: { courseId, instructorId },
      relations: ['course', 'instructor'],
    });
  }

  /**
   * Tạo bản ghi phân công giảng viên vào khóa học
   * ✅ FIX: create({ courseId, lecturerId }) → create({ courseId, instructorId })
   *         `lecturerId` không tồn tại trong entity → TypeORM báo lỗi ts(2769)
   */
  async assign(courseId: number, instructorId: number): Promise<AssignedLecturers> {
    // ✅ FIX: { courseId, lecturerId } → { courseId, instructorId }
    const entity = this.assignedRepo.create({ courseId, instructorId });
    return this.assignedRepo.save(entity);
  }

  /**
   * Xóa bản ghi phân công (hủy phân công giảng viên khỏi khóa học)
   * ✅ FIX: delete({ courseId, lecturerId }) → delete({ courseId, instructorId })
   */
  async unassign(courseId: number, instructorId: number): Promise<void> {
    // ✅ FIX: { courseId, lecturerId } → { courseId, instructorId }
    await this.assignedRepo.delete({ courseId, instructorId } as any);
  }
}