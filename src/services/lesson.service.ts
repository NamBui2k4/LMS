import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import { LessonRepository } from '../repository/lessons.repository';
import { CourseRepository } from '../repository/courses.repository';
import { Lesson } from '../models/lesson.entity';
import { CourseStatus } from '../common/enums/course-status.enum';
import { CreateLessonDto, UpdateLessonDto } from '../dto/lesson.dto';

const EDITABLE_STATUSES = [CourseStatus.PLANNED, CourseStatus.OPEN];

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

  async findOne(id: string): Promise<Lesson> {
    const lesson = await this.lessonRepo.findByIdWithMaterials(id);
    if (!lesson) throw new NotFoundException('Không tìm thấy bài giảng.');
    return lesson;
  }

  async create(courseId: number, dto: CreateLessonDto, lecturerId: number): Promise<Lesson> {
    const course = await this.courseRepo.findById(courseId);
    if (!course) throw new NotFoundException('Không tìm thấy khóa học.');
    if (course.createdBy?.id !== lecturerId)
      throw new ForbiddenException('Bạn không có quyền thêm bài giảng vào khóa học này.');
    if (!EDITABLE_STATUSES.includes(course.status))
      throw new BadRequestException('Khóa học không ở trạng thái cho phép chỉnh sửa.');

    const maxOrder = await this.lessonRepo.findMaxOrder(courseId);
    const order = dto.order ?? maxOrder + 1;

    return this.lessonRepo.create({
      title: dto.title,
      content: dto.content,
      order,
      course: { id: courseId } as any,
    });
  }

  async update(id: string, dto: UpdateLessonDto, lecturerId: number): Promise<Lesson> {
    const lesson = await this.findOne(id);
    if (lesson.course?.createdBy?.id !== lecturerId) {
      // Re-fetch with createdBy relation
      const course = await this.courseRepo.findById(lesson.course.id);
      if (course?.createdBy?.id !== lecturerId)
        throw new ForbiddenException('Bạn không có quyền chỉnh sửa bài giảng này.');
      if ([CourseStatus.CLOSED, CourseStatus.CANCELLED].includes(course.status))
        throw new BadRequestException('Không thể chỉnh sửa bài giảng trong khóa học đã đóng.');
    }
    const updated = await this.lessonRepo.update(id, dto);
    return updated!;
  }

  async reorder(courseId: number, lessonId: string, newOrder: number, lecturerId: number): Promise<Lesson> {
    const course = await this.courseRepo.findById(courseId);
    if (!course) throw new NotFoundException('Không tìm thấy khóa học.');
    if (course.createdBy?.id !== lecturerId)
      throw new ForbiddenException('Bạn không có quyền sắp xếp bài giảng.');

    const lesson = await this.lessonRepo.findById(lessonId);
    if (!lesson) throw new NotFoundException('Không tìm thấy bài giảng.');

    const updated = await this.lessonRepo.updateOrder(lessonId, newOrder);
    return updated!;
  }

  async delete(id: string, lecturerId: number): Promise<void> {
    const lesson = await this.findOne(id);
    const course = await this.courseRepo.findById(lesson.course.id);
    if (course?.createdBy?.id !== lecturerId)
      throw new ForbiddenException('Bạn không có quyền xóa bài giảng này.');
    await this.lessonRepo.delete(id);
  }
}