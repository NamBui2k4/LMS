import {
  Injectable,
  NotFoundException,
  ConflictException,
  ForbiddenException,
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

  /**
   * Xem danh sách học viên đã ghi danh trong một khóa học
   * Tác nhân: Giảng viên, Trưởng bộ môn
   */
  async findByCourse(courseId: number): Promise<Enrollment[]> {
    const course = await this.courseRepo.findById(courseId);
    if (!course) throw new NotFoundException('Không tìm thấy khóa học.');
    return this.enrollmentRepo.findByCourse(courseId);
  }

  /**
   * Xem danh sách khóa học mà học viên đã ghi danh
   * Tác nhân: Học viên, Giảng viên, Trưởng bộ môn
   */
  async findByStudent(studentId: string): Promise<Enrollment[]> {
    const student = await this.studentRepo.findById(studentId);
    if (!student) throw new NotFoundException('Không tìm thấy học viên.');
    return this.enrollmentRepo.findByStudent(studentId);
  }

  /**
   * Xem chi tiết một bản ghi danh
   */
  async findOne(id: string): Promise<Enrollment> {
    const enrollment = await this.enrollmentRepo.findById(id);
    if (!enrollment) throw new NotFoundException('Không tìm thấy bản ghi danh.');
    return enrollment;
  }

  /**
   * Thêm học viên vào khóa học (ghi danh)
   * Tác nhân: Giảng viên, Trưởng bộ môn
   * Điều kiện: Khóa học phải ở trạng thái OPEN_FOR_ENROLLMENT
   */
  async enroll(studentId: string, courseId: number): Promise<Enrollment> {
    const student = await this.studentRepo.findById(studentId);
    if (!student) throw new NotFoundException('Không tìm thấy học viên.');

    const course = await this.courseRepo.findById(courseId);
    if (!course) throw new NotFoundException('Không tìm thấy khóa học.');

    if (course.status !== CourseStatus.OPEN_FOR_ENROLLMENT) {
      throw new ForbiddenException(
        'Khóa học chưa mở đăng ký. Chỉ ghi danh được khi khóa học ở trạng thái "Đã mở đăng ký".',
      );
    }

    const existing = await this.enrollmentRepo.findByStudentAndCourse(studentId, courseId);
    if (existing) throw new ConflictException('Học viên đã được ghi danh vào khóa học này.');

    return this.enrollmentRepo.create({
      student: { id: studentId } as any,
      course: { id: courseId } as any,
      status: EnrollmentStatus.ENROLLED,
    });
  }

  /**
   * Xóa học viên khỏi khóa học (hủy ghi danh)
   * Tác nhân: Giảng viên, Trưởng bộ môn
   */
  async unenroll(studentId: string, courseId: number): Promise<void> {
    const existing = await this.enrollmentRepo.findByStudentAndCourse(studentId, courseId);
    if (!existing) {
      throw new NotFoundException('Học viên chưa được ghi danh vào khóa học này.');
    }
    await this.enrollmentRepo.deleteByStudentAndCourse(studentId, courseId);
  }
}