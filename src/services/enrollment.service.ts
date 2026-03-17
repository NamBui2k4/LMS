import {
  Injectable,
  NotFoundException,
  ConflictException,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import { EnrollmentRepository } from '../repository/enrollment.repository';
import { CourseRepository } from '../repository/course.repository';
import { StudentRepository } from '../repository/student.repository';
import { Enrollment } from '../models/enrollment.entity';
import { EnrollmentStatus } from '../common/enums/enrollment-status.enum';
import { CourseStatus } from '../common/enums/course-status.enum';

@Injectable()
export class EnrollmentService {
  constructor(
    private readonly enrollmentRepo: EnrollmentRepository,
    private readonly courseRepo: CourseRepository,
    private readonly studentRepo: StudentRepository,
  ) {}

  async findByCourse(courseId: number): Promise<Enrollment[]> {
    const course = await this.courseRepo.findById(courseId);
    if (!course) throw new NotFoundException('Không tìm thấy khóa học.');
    return this.enrollmentRepo.findByCourse(courseId);
  }

  async findByStudent(studentId: number): Promise<Enrollment[]> {
    const student = await this.studentRepo.findById(studentId);
    if (!student) throw new NotFoundException('Không tìm thấy học viên.');
    return this.enrollmentRepo.findByStudent(studentId);
  }

  async findOne(id: number): Promise<Enrollment> {
    const enrollment = await this.enrollmentRepo.findById(id);
    if (!enrollment) throw new NotFoundException('Không tìm thấy bản ghi danh.');
    return enrollment;
  }

  /**
   * Ghi danh học viên vào khóa học
   * ✅ FIX: Điều kiện ghi danh là course.status === PUBLISHED
   *         (OPEN_FOR_ENROLLMENT không tồn tại trong DB enum)
   * SRS: Học viên chỉ ghi danh được khi khóa học đang ở trạng thái PUBLISHED
   */
  async enroll(studentId: number, courseId: number): Promise<Enrollment> {
    const student = await this.studentRepo.findById(studentId);
    if (!student) throw new NotFoundException('Không tìm thấy học viên.');

    const course = await this.courseRepo.findById(courseId);
    if (!course) throw new NotFoundException('Không tìm thấy khóa học.');

    // ✅ FIX: dùng PUBLISHED (không phải OPEN_FOR_ENROLLMENT — không tồn tại trong DB)
    if (course.status !== CourseStatus.PUBLISHED) {
      throw new BadRequestException(
        'Khóa học chưa được công bố. Chỉ ghi danh được khi khóa học ở trạng thái "Đã công bố" (published).',
      );
    }

    const existing = await this.enrollmentRepo.findByStudentAndCourse(studentId, courseId);
    if (existing) throw new ConflictException('Học viên đã được ghi danh vào khóa học này.');

    return this.enrollmentRepo.create({
      student: { userId: studentId } as any, // ✅ FIX: userId (không phải id)
      course: { id: courseId } as any,
      status: EnrollmentStatus.ENROLLED,
    });
  }

  async unenroll(studentId: number, courseId: number): Promise<void> {
    const existing = await this.enrollmentRepo.findByStudentAndCourse(studentId, courseId);
    if (!existing) throw new NotFoundException('Học viên chưa được ghi danh vào khóa học này.');
    await this.enrollmentRepo.deleteByStudentAndCourse(studentId, courseId);
  }

  async updateStatus(id: number, status: EnrollmentStatus): Promise<Enrollment> {
    await this.findOne(id);
    const updated = await this.enrollmentRepo.update(id, { status });
    return updated!;
  }

  /**
   * [MỚI] Cập nhật tiến độ học (progress_pct 0-100)
   * Phục vụ chức năng "Theo dõi tiến độ học tập" từ SRS
   */
  async updateProgress(id: number, progressPct: number): Promise<Enrollment> {
    if (progressPct < 0 || progressPct > 100) {
      throw new BadRequestException('Tiến độ phải trong khoảng 0–100.');
    }
    await this.findOne(id);
    const updated = await this.enrollmentRepo.updateProgress(id, progressPct);
    return updated!;
  }
}