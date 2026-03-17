import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { AssignedLecturersRepository } from '../repository/assigned-lecturers.repository';
import { CourseRepository } from '../repository/course.repository';
import { LecturerRepository } from '../repository/lecturer.repository';
import { AssignedLecturers } from '../models/assigned-lecturers.entity';

@Injectable()
export class AssignedLecturersService {
  constructor(
    private readonly assignedRepo: AssignedLecturersRepository,
    private readonly courseRepo: CourseRepository,
    private readonly lecturerRepo: LecturerRepository,
  ) {}

  /**
   * Lấy danh sách giảng viên được phân công trong một khóa học
   */
  async findByCourse(courseId: number): Promise<AssignedLecturers[]> {
    const course = await this.courseRepo.findById(courseId);
    if (!course) throw new NotFoundException('Không tìm thấy khóa học.');
    return this.assignedRepo.findByCourse(courseId);
  }

  /**
   * Lấy danh sách khóa học mà một giảng viên được phân công
   * ✅ FIX: truyền lecturerId → instructorId (khớp với repository signature mới)
   */
  async findByLecturer(lecturerId: number): Promise<AssignedLecturers[]> {
    // ✅ FIX: repository.findByLecturer nhận instructorId (tên tham số đổi nhưng giá trị giữ nguyên)
    return this.assignedRepo.findByLecturer(lecturerId);
  }

  /**
   * Phân công giảng viên vào khóa học
   * Kiểm tra: khóa học tồn tại, giảng viên tồn tại, chưa phân công trước đó
   * ✅ FIX: các lời gọi repo.findOne / repo.assign đổi tham số lecturerId → instructorId
   */
  async assign(courseId: number, lecturerId: number): Promise<AssignedLecturers> {
    const course = await this.courseRepo.findById(courseId);
    if (!course) throw new NotFoundException('Không tìm thấy khóa học.');

    const lecturer = await this.lecturerRepo.findById(lecturerId);
    if (!lecturer) throw new NotFoundException('Không tìm thấy giảng viên.');

    // ✅ FIX: findOne(courseId, lecturerId) — repository đã đổi tham số thứ 2 thành instructorId
    const existing = await this.assignedRepo.findOne(courseId, lecturerId);
    if (existing) throw new ConflictException('Giảng viên đã được phân công vào khóa học này.');

    // ✅ FIX: assign(courseId, instructorId)
    return this.assignedRepo.assign(courseId, lecturerId);
  }

  /**
   * Hủy phân công giảng viên khỏi khóa học
   * ✅ FIX: unassign(courseId, instructorId)
   */
  async unassign(courseId: number, lecturerId: number): Promise<void> {
    const existing = await this.assignedRepo.findOne(courseId, lecturerId);
    if (!existing) throw new NotFoundException('Không tìm thấy phân công giảng viên.');

    // ✅ FIX: repository.unassign nhận instructorId
    await this.assignedRepo.unassign(courseId, lecturerId);
  }
}