import { Injectable } from '@nestjs/common';
import { DataSource, Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
// ✅ FIX: import Courses (không phải Course) — đúng export name trong courses.entity.ts
import { Courses } from '../models/courses.entity';
import { CourseStatus } from '../common/enums/course-status.enum';
import { DepartmentHead } from '../models/department-heads.entity';

@Injectable()
export class CourseRepository {
  constructor(
    @InjectRepository(Courses)
    private readonly courseRepo: Repository<Courses>,
    private readonly dataSource: DataSource,
  ) {}

  /**
   * Lấy danh sách khóa học theo quyền người dùng:
   * - Trưởng bộ môn: thấy tất cả khóa học
   * - Giảng viên: chỉ thấy khóa học mình tạo + khóa học được phân công
   */
  async findAllForUser(userId: number, isDepartmentHead: boolean): Promise<Courses[]> {
    const qb = this.courseRepo
      .createQueryBuilder('course')
      .leftJoinAndSelect('course.category', 'category')
      .leftJoinAndSelect('course.createdBy', 'createdBy')
      .leftJoinAndSelect('course.reviewedBy', 'reviewedBy');

    if (!isDepartmentHead) {
      // ✅ FIX: 'course.createdBy.id' → 'createdBy.userId'
      //         Trong QueryBuilder, join alias 'createdBy' + đúng property name 'userId'
      qb.andWhere(
        '(createdBy.userId = :userId OR EXISTS (' +
          'SELECT 1 FROM course_instructors ci WHERE ci.course_id = course.id AND ci.instructor_id = :userId' +
        '))',
        { userId },
      );
    }

    return qb.orderBy('course.createdAt', 'DESC').getMany();
  }

  /**
   * Tìm khóa học theo ID (kèm createdBy và category)
   * Dùng cho các thao tác cần kiểm tra quyền hoặc trạng thái nhanh
   */
  async findById(id: number): Promise<Courses | null> {
    return this.courseRepo.findOne({
      where: { id },
      relations: ['createdBy', 'category'],
    });
  }

  /**
   * Tìm khóa học đầy đủ quan hệ (dùng cho xem chi tiết)
   * Bao gồm: category, createdBy, reviewedBy, lessons, quizzes, enrollments, assignedLecturers
   */
  async findByIdDetailed(id: number): Promise<Courses | null> {
    return this.courseRepo.findOne({
      where: { id },
      relations: [
        'category',
        'createdBy',
        'reviewedBy',
        'lessons',
        'quizzes',
        'enrollments',
        'assignedLecturers',
        'assignedLecturers.instructor',
      ],
    });
  }

  /**
   * Tìm khóa học với pessimistic lock (dùng khi update trạng thái)
   * Tránh race condition khi nhiều request cùng thay đổi trạng thái
   */
  async findByIdForUpdate(id: number): Promise<Courses | null> {
    return this.courseRepo.findOne({
      where: { id },
      relations: ['createdBy', 'reviewedBy'],
      lock: { mode: 'pessimistic_write' },
    });
  }

  async create(courseData: Partial<Courses>): Promise<Courses> {
    const course = this.courseRepo.create(courseData);
    return this.courseRepo.save(course);
  }

  /**
   * Cập nhật trạng thái khóa học
   * Nếu có reviewer (Trưởng bộ môn), lưu lại người review và thời điểm review
   */
  async updateStatus(
    courseId: number,
    newStatus: CourseStatus,
    reviewer?: DepartmentHead,
  ): Promise<Courses | null> {
    const course = await this.findByIdForUpdate(courseId);
    if (!course) return null;

    course.status = newStatus;

    if (reviewer) {
      course.reviewedBy = reviewer;
      course.reviewedAt = new Date();
    }

    return this.courseRepo.save(course);
  }
}