import { Injectable, ForbiddenException, NotFoundException, BadRequestException } from '@nestjs/common';
import { CourseRepository } from '../repository/course.repository';
import { Course } from '../models/courses.entity';
import { CourseStatus } from '../common/enums/course-status.enum';
import { Lecturer } from '../models/lecturers.entity';
import { DepartmentHead } from '../models/department-heads.entity';

interface CreateCourseInput {
    title: string;
    description?: string;
    categoryId: number;
    createdBy: Lecturer;
}

@Injectable()
export class CourseService {
    constructor(private readonly courseRepo: CourseRepository) { }

    async findAll(userId: number, role: string): Promise<Course[]> {
        const isDepartmentHead = role === 'DEPARTMENT_HEAD'; // giả sử role enum đã có tên này
        return this.courseRepo.findAllForUser(userId, isDepartmentHead);
    }

    async findOne(courseId: number, userId: number, role: string): Promise<Course> {
        const course = await this.courseRepo.findByIdDetailed(courseId);
        if (!course) {
            throw new NotFoundException('Không tìm thấy khóa học.');
        }

        // Kiểm tra quyền xem (có thể mở rộng sau)
        const canView =
            role === 'DEPARTMENT_HEAD' ||
            course.createdBy.id === userId ||
            course.assignedLecturers?.some((a) => a.instructor.id === userId);

        if (!canView) {
            throw new ForbiddenException('Bạn không có quyền xem khóa học này.');
        }

        return course;
    }

    async create(input: CreateCourseInput): Promise<Course> {
        if (!input.title?.trim()) {
            throw new BadRequestException('Tiêu đề khóa học là bắt buộc.');
        }

        const newCourse = await this.courseRepo.create({
            title: input.title.trim(),
            description: input.description?.trim(),
            category: { id: input.categoryId } as any, // giả sử Category entity có id
            createdBy: input.createdBy,
            status: CourseStatus.DRAFT, // hoặc CourseStatus.PLANNED_TO_OPEN tùy enum
        });

        return newCourse;
    }

    async changeStatus(
        courseId: number,
        newStatus: CourseStatus,
        actor: Lecturer | DepartmentHead,
        actorRole: string,
    ): Promise<Course> {
        const course = await this.courseRepo.findByIdForUpdate(courseId);
        if (!course) {
            throw new NotFoundException('Không tìm thấy khóa học.');
        }

        // Quy tắc chuyển trạng thái
        const allowedTransitions: Record<CourseStatus, CourseStatus[]> = {
            [CourseStatus.DRAFT]: [CourseStatus.PLANNED_TO_OPEN],

            [CourseStatus.PENDING]: [],                         // or [CourseStatus.PUBLISHED, CourseStatus.REJECTED] if applicable
            [CourseStatus.PUBLISHED]: [CourseStatus.ARCHIVED],    // adjust according to real rules
            [CourseStatus.ARCHIVED]: [],

            [CourseStatus.PLANNED_TO_OPEN]: [
                CourseStatus.OPEN_FOR_ENROLLMENT,
                CourseStatus.CANCELLED,
            ],
            [CourseStatus.OPEN_FOR_ENROLLMENT]: [CourseStatus.CLOSED],
            [CourseStatus.CLOSED]: [],
            [CourseStatus.CANCELLED]: [],

            // Add any other missing values from your enum here, e.g.:
            // [CourseStatus.REJECTED]:         [CourseStatus.DRAFT],
            // [CourseStatus.UNDER_REVIEW]:     [CourseStatus.PUBLISHED, CourseStatus.REJECTED],
        };

        const currentStatus = course.status;
        const allowed = allowedTransitions[currentStatus] || [];

        if (!allowed.includes(newStatus)) {
            throw new BadRequestException(
                `Không thể chuyển trạng thái từ "${currentStatus}" sang "${newStatus}".`,
            );
        }

        // Quyền thực hiện
        if (newStatus === CourseStatus.PLANNED_TO_OPEN) {
            if (actorRole !== 'LECTURER' || course.createdBy.id !== (actor as Lecturer).id) {
                throw new ForbiddenException('Chỉ giảng viên tạo khóa học mới được chuyển sang Dự kiến mở.');
            }
        } else {
            // Các trạng thái còn lại → chỉ Trưởng bộ môn
            if (actorRole !== 'DEPARTMENT_HEAD') {
                throw new ForbiddenException('Chỉ trưởng bộ môn có quyền thực hiện thay đổi này.');
            }
        }

        const updated = await this.courseRepo.updateStatus(
            courseId,
            newStatus,
            actorRole === 'DEPARTMENT_HEAD' ? (actor as DepartmentHead) : undefined,
        );

        if (!updated) {
            throw new NotFoundException('Khóa học không còn tồn tại.');
        }

        return updated;
    }
}