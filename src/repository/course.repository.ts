import { Injectable } from '@nestjs/common';
import { DataSource, Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import { Course } from '../models/courses.entity';
import { CourseStatus } from '../common/enums/course-status.enum';
import { Lecturer } from '../models/lecturers.entity';
import { DepartmentHead } from '../models/department-heads.entity';

@Injectable()
export class CourseRepository {
  constructor(
    @InjectRepository(Course)
    private readonly courseRepo: Repository<Course>,
    private readonly dataSource: DataSource,
  ) {}

  async findAllForUser(userId: number, isDepartmentHead: boolean): Promise<Course[]> {
    const qb = this.courseRepo
      .createQueryBuilder('course')
      .leftJoinAndSelect('course.category', 'category')
      .leftJoinAndSelect('course.createdBy', 'createdBy')
      .leftJoinAndSelect('course.reviewedBy', 'reviewedBy');

    // Giảng viên chỉ thấy khóa học mình tạo + khóa học đã assign (sau này mở rộng)
    if (!isDepartmentHead) {
      qb.andWhere('(course.createdBy.id = :userId OR EXISTS (' +
        'SELECT 1 FROM course_instructors ci WHERE ci.course_id = course.id AND ci.instructor_id = :userId' +
      '))', { userId });
    }

    return qb
      .orderBy('course.createdAt', 'DESC')
      .getMany();
  }

  async findByIdDetailed(id: number): Promise<Course | null> {
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

  async findByIdForUpdate(id: number): Promise<Course | null> {
    return this.courseRepo.findOne({
      where: { id },
      relations: ['createdBy', 'reviewedBy'],
      lock: { mode: 'pessimistic_write' }, // dùng khi update trạng thái
    });
  }

  async create(courseData: Partial<Course>): Promise<Course> {
    const course = this.courseRepo.create(courseData);
    return this.courseRepo.save(course);
  }

  async updateStatus(
    courseId: number,
    newStatus: CourseStatus,
    reviewer?: DepartmentHead,
  ): Promise<Course | null> {
    const course = await this.findByIdForUpdate(courseId);
    if (!course) return null;

    course.status = newStatus;

    if (reviewer) {
      course.reviewedBy = reviewer;
      course.reviewedAt = new Date();
    }

    return this.courseRepo.save(course);
  }

  // Có thể thêm sau: softDelete, findByTitle, pagination, filter theo status/category...
}