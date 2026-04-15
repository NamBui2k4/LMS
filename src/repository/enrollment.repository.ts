import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import { Enrollment } from '../models/enrollment.entity';
import { EnrollmentStatus } from '../common/enums/enrollment-status.enum';

@Injectable()
export class EnrollmentRepository {
  constructor(
    @InjectRepository(Enrollment)
    private readonly enrollmentRepo: Repository<Enrollment>,
    private readonly dataSource: DataSource,
  ) {}

  async findByCourse(courseId: number): Promise<Enrollment[]> {
    return this.enrollmentRepo.find({
      where: { course: { id: courseId } },
      relations: ['student'],
      order: { enrolledAt: 'DESC' } as any,
    });
  }

  // ✅ FIX: studentId: string → number; student.id → student.userId (PK của Student)
  async findByStudent(studentId: number): Promise<Enrollment[]> {
    return this.enrollmentRepo.find({
      where: { student: { userId: studentId } },
      relations: ['course', 'course.category'],
      order: { enrolledAt: 'DESC' } as any,
    });
  }

  // ✅ FIX: id: string → number (Enrollment PK là BIGSERIAL → number)
  async findById(id: number): Promise<Enrollment | null> {
    return this.enrollmentRepo.findOne({
      where: { id },
      relations: ['student', 'course'],
    });
  }

  // ✅ FIX: studentId: string → number; student.id → student.userId
  async findByStudentAndCourse(studentId: number, courseId: number): Promise<Enrollment | null> {
    return this.enrollmentRepo.findOne({
      where: {
        student: { userId: studentId },
        course: { id: courseId },
      },
      relations: ['student', 'course'],
    });
  }

  async create(data: Partial<Enrollment>): Promise<Enrollment> {
    const entity = this.enrollmentRepo.create(data);
    return this.enrollmentRepo.save(entity);
  }

  // ✅ FIX: id: string → number
  async updateStatus(id: number, status: EnrollmentStatus): Promise<Enrollment | null> {
    await this.enrollmentRepo.update(id, { status } as any);
    return this.findById(id);
  }

  /**
   * ✅ FIX: Thêm method update() — EnrollmentService.updateStatus() gọi method này
   *         mà trước đây repository không có → lỗi "Property 'update' does not exist"
   * Dùng chung cho mọi partial update trên enrollment
   */
  async update(id: number, data: Partial<Enrollment>): Promise<Enrollment | null> {
    await this.enrollmentRepo.update(id, data as any);
    return this.findById(id);
  }

  /**
   * ✅ FIX: Thêm method updateProgress() — EnrollmentService.updateProgress() gọi method này
   *         Cập nhật tiến độ học tập (progress_pct 0-100)
   *         Phục vụ chức năng "Theo dõi tiến độ học tập" từ SRS
   */
  async updateProgress(id: number, progressPct: number): Promise<Enrollment | null> {
    await this.enrollmentRepo.update(id, { progressPct } as any);
    return this.findById(id);
  }

  // ✅ FIX: id: string → number
  async delete(id: number): Promise<void> {
    await this.enrollmentRepo.delete(id);
  }

  // ✅ FIX: studentId: string → number; student.id → student.userId
  async deleteByStudentAndCourse(studentId: number, courseId: number): Promise<void> {
    await this.enrollmentRepo.delete({
      student: { userId: studentId },
      course: { id: courseId },
    } as any);
  }

  /**
   * [MỚI] Lấy tất cả ghi danh liên quan đến giảng viên (Tạo bởi hoặc được Phân công)
   */
  async findAllForLecturer(lecturerId: number, isHoD: boolean): Promise<Enrollment[]> {
    const qb = this.enrollmentRepo.createQueryBuilder('en')
      .leftJoinAndSelect('en.student', 'student')
      .leftJoinAndSelect('en.course', 'course')
      .leftJoinAndSelect('course.createdBy', 'courseOwner');

    if (!isHoD) {
      qb.andWhere(
        '(courseOwner.userId = :lecturerId OR EXISTS (' +
          'SELECT 1 FROM course_instructors ci WHERE ci.course_id = course.id AND ci.instructor_id = :lecturerId' +
        '))',
        { lecturerId },
      );
    }

    return qb.orderBy('en.enrolledAt', 'DESC').getMany();
  }
}