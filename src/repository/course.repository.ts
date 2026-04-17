import { Injectable } from '@nestjs/common';
import { DataSource, Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import { NotFoundException } from '@nestjs/common';
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

  async find(options: any): Promise<Courses[]> {
    return this.courseRepo.find(options);
  }

  /**
   * Tìm khóa học theo ID (kèm createdBy và category)
   * Dùng cho các thao tác cần kiểm tra quyền hoặc trạng thái nhanh
   */
  async findById(id: number): Promise<Courses | null> {
  return this.courseRepo.findOne({
    where: { id },
    relations: ['createdBy', 'category'],   // đã có
    // Thêm để chắc chắn load createdBy.userId
    select: {
      id: true,
      status: true,
      createdBy: {
        userId: true,     // quan trọng
      }
    }
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
        'lessons.materials', // <--- [MỚI] Fetch data học liệu
        'quizzes',
        'enrollments',
        'enrollments.student',
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
    // Sử dụng queryBuilder để dùng lock
    return this.courseRepo.createQueryBuilder('course')
      .setLock('pessimistic_write')
      .leftJoinAndSelect('course.createdBy', 'createdBy')
      .leftJoinAndSelect('course.reviewedBy', 'reviewedBy')
      .where('course.id = :id', { id })
      .getOne();
}

  async create(courseData: Partial<Courses>): Promise<Courses> {
    const course = this.courseRepo.create(courseData);
    return this.courseRepo.save(course);
  }

  async save(course: Courses): Promise<Courses> {
    return this.courseRepo.save(course);
  }

  async deleteById(courseId: number): Promise<void> {
    await this.courseRepo.delete({ id: courseId });
  }

  /**
   * Cập nhật trạng thái khóa học
   * Nếu có reviewer (Trưởng bộ môn), lưu lại người review và thời điểm review
   */
  async updateStatus(
  courseId: number,
  newStatus: CourseStatus,
  reviewer?: DepartmentHead,
): Promise<Courses> {
  return this.dataSource.transaction(async (manager) => {
    // KHÔNG dùng relations ở đây
    // Sử dụng queryBuilder để dùng lock
    const course = await manager.createQueryBuilder(Courses, 'course')
      .setLock('pessimistic_write')
      .where('course.id = :id', { id: courseId })
      .getOne();

    if (!course) {
      throw new NotFoundException(`Không tìm thấy khóa học với id ${courseId}`);
    }

    course.status = newStatus;

    if (reviewer) {
      course.reviewedBy = reviewer;
      course.reviewedAt = new Date();
    } else {
      // Đảm bảo xóa reviewer nếu không phải HoD (ví dụ: lecturer gửi pending)
      course.reviewedBy = undefined;
      course.reviewedAt = undefined;
    }

    await manager.save(course);

    // Sau khi update, load lại relations nếu cần
    const updatedCourse = await manager.findOne(Courses, {
      where: { id: courseId },
      relations: ['createdBy', 'reviewedBy'],
    });

    if (!updatedCourse) {
      throw new NotFoundException(`Không tìm thấy khóa học với id ${courseId}`);
    }

    return updatedCourse;
  });
  }
}