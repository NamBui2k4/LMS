import {
  Injectable,
  ForbiddenException,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { CourseRepository } from '../repository/course.repository';
import { Courses } from '../models/courses.entity';
import { CourseStatus } from '../common/enums/course-status.enum';
import { Lecturer } from '../models/lecturers.entity';
import { DepartmentHead } from '../models/department-heads.entity';

/**
 * ✅ FIX: Tất cả so sánh actor/owner dùng `userId` (Lecturer.userId, DepartmentHead.userId)
 *         không phải `.id` (property không tồn tại)
 */
interface CreateCourseInput {
  title: string;
  description?: string;
  categoryId: number;
  createdBy: Lecturer;
}

@Injectable()
export class CourseService {
  constructor(private readonly courseRepo: CourseRepository) {}

  async findAll(userId: number, role: string): Promise<Courses[]> {
    const isDepartmentHead = role === 'HEAD_OF_DEPARTMENT';
    return this.courseRepo.findAllForUser(userId, isDepartmentHead);
  }

  async findOne(courseId: number, userId: number, role: string): Promise<Courses> {
    const course = await this.courseRepo.findByIdDetailed(courseId);
    if (!course) throw new NotFoundException('Không tìm thấy khóa học.');

    const canView =
      role === 'HEAD_OF_DEPARTMENT' ||
      Number(course.createdBy.userId) === userId || // ✅ FIX: userId
      course.assignedLecturers?.some((a) => Number(a.instructor.userId) === userId); // ✅ FIX

    if (!canView) throw new ForbiddenException('Bạn không có quyền xem khóa học này.');
    return course;
  }

  async create(input: CreateCourseInput): Promise<Courses> {
    if (!input.title?.trim()) {
      throw new BadRequestException('Tiêu đề khóa học là bắt buộc.');
    }
    return this.courseRepo.create({
      title:       input.title.trim(),
      description: input.description?.trim(),
      category:    { id: input.categoryId } as any,
      createdBy:   input.createdBy,
      status:      CourseStatus.DRAFT,
    });
  }

  async changeStatus(
    courseId: number,
    newStatus: CourseStatus,
    actor: Lecturer | DepartmentHead,
    actorRole: string,
  ): Promise<Courses> {
    const course = await this.courseRepo.findByIdForUpdate(courseId);
    if (!course) throw new NotFoundException('Không tìm thấy khóa học.');

    const allowedTransitions: Record<CourseStatus, CourseStatus[]> = {
      [CourseStatus.DRAFT]:     [CourseStatus.PENDING],
      [CourseStatus.PENDING]:   [CourseStatus.PUBLISHED, CourseStatus.DRAFT],
      [CourseStatus.PUBLISHED]: [CourseStatus.CLOSED, CourseStatus.ARCHIVED],
      [CourseStatus.CLOSED]:    [CourseStatus.ARCHIVED],
      [CourseStatus.ARCHIVED]:  [],
    };

    const allowed = allowedTransitions[course.status] ?? [];
    if (!allowed.includes(newStatus)) {
      throw new BadRequestException(
        `Không thể chuyển trạng thái từ "${course.status}" sang "${newStatus}".`,
      );
    }

    if (newStatus === CourseStatus.PENDING) {
      const lecturerActor = actor as Lecturer;
      // ✅ FIX: so sánh userId
      if (
        actorRole !== 'LECTURER' ||
        Number(course.createdBy.userId) !== Number(lecturerActor.userId)
      ) {
        throw new ForbiddenException('Chỉ giảng viên tạo khóa học mới được gửi duyệt.');
      }
    } else if (newStatus === CourseStatus.PUBLISHED || newStatus === CourseStatus.DRAFT) {
      if (actorRole !== 'HEAD_OF_DEPARTMENT') {
        throw new ForbiddenException('Chỉ Trưởng bộ môn có quyền phê duyệt hoặc từ chối.');
      }
    } else if (newStatus === CourseStatus.CLOSED) {
      // ✅ FIX: so sánh userId
      const isOwner =
        actorRole === 'LECTURER' &&
        Number(course.createdBy.userId) === Number((actor as Lecturer).userId);
      const isHead = actorRole === 'HEAD_OF_DEPARTMENT';
      if (!isOwner && !isHead) {
        throw new ForbiddenException(
          'Chỉ giảng viên tạo khóa học hoặc Trưởng bộ môn có thể đóng khóa học.',
        );
      }
    } else if (newStatus === CourseStatus.ARCHIVED) {
      if (actorRole !== 'HEAD_OF_DEPARTMENT') {
        throw new ForbiddenException('Chỉ Trưởng bộ môn có quyền lưu trữ khóa học.');
      }
    }

    const updated = await this.courseRepo.updateStatus(
      courseId,
      newStatus,
      actorRole === 'HEAD_OF_DEPARTMENT' ? (actor as DepartmentHead) : undefined,
    );
    if (!updated) throw new NotFoundException('Khóa học không còn tồn tại.');
    return updated;
  }
}