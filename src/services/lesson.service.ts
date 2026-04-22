import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import { LessonRepository } from '../repository/lesson.repository';
import { CourseRepository } from '../repository/course.repository';
import { Lesson } from '../models/lesson.entity';
import { CourseStatus } from '../common/enums/course-status.enum';
import { CreateLessonDto, UpdateLessonDto } from '../dto/lesson.dto';

/**
 * Giảng viên chỉ được chỉnh sửa nội dung khi khóa học ở trạng thái DRAFT hoặc PENDING
 */
const EDITABLE_STATUSES: CourseStatus[] = [
  CourseStatus.DRAFT,
  CourseStatus.PENDING,
  CourseStatus.PUBLISHED,
];

@Injectable()
export class LessonService {
  constructor(
    private readonly lessonRepo: LessonRepository,
    private readonly courseRepo: CourseRepository,
  ) {}

  async findByCourse(courseId: number): Promise<Lesson[]> {
    const course = await this.courseRepo.findById(courseId);
    if (!course) throw new NotFoundException('Không tìm thấy khóa học.');
    return this.lessonRepo.findByCourse(courseId);
  }

  async findOne(id: number): Promise<Lesson> {
    const lesson = await this.lessonRepo.findByIdWithMaterials(id);
    if (!lesson) throw new NotFoundException('Không tìm thấy bài giảng.');
    return lesson;
  }

  async create(courseId: number, dto: CreateLessonDto, lecturerId: number): Promise<Lesson> {
    const course = await this.courseRepo.findById(courseId);
    if (!course) throw new NotFoundException('Không tìm thấy khóa học.');

    if (Number(course.createdBy?.userId) !== lecturerId)
      throw new ForbiddenException('Bạn không có quyền thêm bài giảng vào khóa học này.');

    if (!EDITABLE_STATUSES.includes(course.status))
      throw new BadRequestException(
        'Không thể thêm bài giảng khi khóa học đã ở trạng thái published, closed hoặc archived.',
      );

    const maxOrderIndex = await this.lessonRepo.findMaxOrderIndex(courseId);
    // ✅ dto.orderIndex đã có trong CreateLessonDto (sau khi fix dto)
    const orderIndex = dto.orderIndex ?? maxOrderIndex + 1;

    return this.lessonRepo.create({
      title:      dto.title,
      summary:    dto.summary,    // ✅ dto.summary có trong CreateLessonDto
      content:    dto.content,
      orderIndex,
      course: { id: courseId } as any,
    });
  }

  async update(id: number, dto: UpdateLessonDto, lecturerId: number): Promise<Lesson> {
    const lesson = await this.findOne(id);
    const course = await this.courseRepo.findById(lesson.course.id);

    if (Number(course?.createdBy?.userId) !== lecturerId)
      throw new ForbiddenException('Bạn không có quyền chỉnh sửa bài giảng này.');

    if (!EDITABLE_STATUSES.includes(course!.status))
      throw new BadRequestException('Không thể chỉnh sửa bài giảng trong khóa học đã đóng hoặc lưu trữ.');

    const updated = await this.lessonRepo.update(id, {
      ...(dto.title      !== undefined && { title:      dto.title }),
      // ✅ dto.summary có trong UpdateLessonDto (sau khi fix dto)
      ...(dto.summary    !== undefined && { summary:    dto.summary }),
      ...(dto.content    !== undefined && { content:    dto.content }),
      // ✅ dto.orderIndex có trong UpdateLessonDto (sau khi fix dto)
      ...(dto.orderIndex !== undefined && { orderIndex: dto.orderIndex }),
    });
    return updated!;
  }

  async reorder(
    courseId: number,
    lessonId: number,
    newOrderIndex: number,
    lecturerId: number,
  ): Promise<Lesson> {
    const course = await this.courseRepo.findById(courseId);
    if (!course) throw new NotFoundException('Không tìm thấy khóa học.');
    if (Number(course.createdBy?.userId) !== lecturerId)
      throw new ForbiddenException('Bạn không có quyền sắp xếp bài giảng.');

    const lesson = await this.lessonRepo.findById(lessonId);
    if (!lesson) throw new NotFoundException('Không tìm thấy bài giảng.');

    const updated = await this.lessonRepo.updateOrderIndex(lessonId, newOrderIndex);
    return updated!;
  }

  async delete(id: number, lecturerId: number): Promise<void> {
    const lesson = await this.findOne(id);
    const course = await this.courseRepo.findById(lesson.course.id);
    if (Number(course?.createdBy?.userId) !== lecturerId)
      throw new ForbiddenException('Bạn không có quyền xóa bài giảng này.');
    await this.lessonRepo.delete(id);
  }
}
