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
import { UserRole } from 'src/common/enums/role.enum';


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

  async findAll(userId: number, role: UserRole): Promise<Courses[]> {
    const isDepartmentHead = role === UserRole.HEAD_OF_DEPARTMENT;
    return this.courseRepo.findAllForUser(userId, isDepartmentHead);
  }

  async findAllPublished(): Promise<Courses[]> {
    return this.courseRepo.find({
      where: { status: CourseStatus.PUBLISHED },
      relations: ['createdBy', 'category'],
      order: { createdAt: 'DESC' }
    });
  }

  async findOne(courseId: number, userId: number, role: UserRole): Promise<Courses> {
    const course = await this.courseRepo.findByIdDetailed(courseId);
    if (!course) throw new NotFoundException('Không tìm thấy khóa học.');

    const canView =
      role === UserRole.HEAD_OF_DEPARTMENT ||
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

  async updateBasicInfo(
    courseId: number,
    payload: { title?: string; description?: string },
    actorUserId: number,
    actorRole: UserRole,
  ): Promise<Courses> {
    const course = await this.courseRepo.findById(courseId);
    if (!course) throw new NotFoundException('Không tìm thấy khóa học.');

    const isHead = actorRole === UserRole.HEAD_OF_DEPARTMENT;
    const isOwner = Number(course.createdBy.userId) === Number(actorUserId);
    if (!isHead && !isOwner) {
      throw new ForbiddenException('Bạn không có quyền chỉnh sửa khóa học này.');
    }

    if (typeof payload.title === 'string') {
      const nextTitle = payload.title.trim();
      if (!nextTitle) {
        throw new BadRequestException('Tiêu đề khóa học không được để trống.');
      }
      course.title = nextTitle;
    }

    if (typeof payload.description === 'string') {
      const nextDescription = payload.description.trim();
      course.description = nextDescription || undefined;
    }

    return this.courseRepo.save(course);
  }

  async delete(courseId: number, actorUserId: number, actorRole: UserRole): Promise<void> {
    const course = await this.courseRepo.findById(courseId);
    if (!course) throw new NotFoundException('Không tìm thấy khóa học.');

    const isHead = actorRole === UserRole.HEAD_OF_DEPARTMENT;
    const isOwner = Number(course.createdBy.userId) === Number(actorUserId);
    if (!isHead && !isOwner) {
      throw new ForbiddenException('Bạn không có quyền xóa khóa học này.');
    }

    await this.courseRepo.deleteById(courseId);
  }

      async changeStatus(
    courseId: number,
    newStatus: CourseStatus,
    actor: Lecturer | DepartmentHead,
    actorRole: string,
  ): Promise<Courses> {
    const course = await this.courseRepo.findById(courseId);
    if (!course) throw new NotFoundException('Không tìm thấy khóa học.');

    // Kiểm tra trạng thái chuyển đổi hợp lệ
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

    // ==================== QUYỀN TRUY CẬP ====================
    if (newStatus === CourseStatus.PENDING) {
      // ✅ Cho phép cả LECTURER lẫn HEAD_OF_DEPARTMENT chuyển sang PENDING
      if (actorRole !== UserRole.LECTURER && actorRole !== UserRole.HEAD_OF_DEPARTMENT) {
        throw new ForbiddenException('Chỉ giảng viên hoặc Trưởng bộ môn mới được đưa khóa học về trạng thái chờ duyệt.');
      }

      // Nếu là Lecturer thì phải là người tạo khóa học
      if (actorRole === UserRole.LECTURER) {
        const lecturerActor = actor as Lecturer;
        if (Number(course.createdBy.userId) !== Number(lecturerActor.userId)) {
          throw new ForbiddenException('Bạn chỉ được gửi duyệt khóa học do chính mình tạo.');
        }
      }

      // Nếu là Trưởng bộ môn thì không cần kiểm tra owner (vì họ có quyền quản lý tất cả)
    } 
    else if (newStatus === CourseStatus.PUBLISHED || newStatus === CourseStatus.DRAFT) {
      // Chỉ Trưởng bộ môn được phê duyệt hoặc trả về draft
      if (actorRole !== UserRole.HEAD_OF_DEPARTMENT) {
        throw new ForbiddenException('Chỉ Trưởng bộ môn có quyền phê duyệt hoặc từ chối.');
      }
    } 
    else if (newStatus === CourseStatus.CLOSED) {
      // Giảng viên tạo hoặc Trưởng bộ môn đều được đóng khóa học
      const isOwner = 
        actorRole === UserRole.LECTURER && 
        Number(course.createdBy.userId) === Number((actor as Lecturer).userId);
      
      const isHead = actorRole === UserRole.HEAD_OF_DEPARTMENT;

      if (!isOwner && !isHead) {
        throw new ForbiddenException(
          'Chỉ giảng viên tạo khóa học hoặc Trưởng bộ môn có thể đóng khóa học.',
        );
      }
    } 
    else if (newStatus === CourseStatus.ARCHIVED) {
      if (actorRole !== UserRole.HEAD_OF_DEPARTMENT) {
        throw new ForbiddenException('Chỉ Trưởng bộ môn có quyền lưu trữ khóa học.');
      }
    }

    const reviewer = actorRole === UserRole.HEAD_OF_DEPARTMENT 
      ? (actor as DepartmentHead) 
      : undefined;

    const updated = await this.courseRepo.updateStatus(courseId, newStatus, reviewer);
    return updated;
  }
}