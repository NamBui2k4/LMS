import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import { MaterialRepository } from '../repository/material.repository';
import { LessonRepository } from '../repository/lesson.repository';
import { CourseRepository } from '../repository/course.repository';
import { Material } from '../models/material.entity';
import { CourseStatus } from '../common/enums/course-status.enum';
import { CreateMaterialDto, UpdateMaterialDto } from '../dto/material.dto';

// Trạng thái khóa học cho phép chỉnh sửa học liệu.
// Theo SRS & DB: giảng viên chỉnh sửa khi khóa học đang ở draft hoặc pending
// (chưa published/closed/archived).
const EDITABLE_STATUSES: CourseStatus[] = [
  CourseStatus.DRAFT,
  CourseStatus.PENDING,
];

@Injectable()
export class MaterialService {
  constructor(
    private readonly materialRepo: MaterialRepository,
    private readonly lessonRepo: LessonRepository,
    private readonly courseRepo: CourseRepository,
  ) {}

  // lessonId: number (BIGSERIAL)
  async findByLesson(lessonId: number): Promise<Material[]> {
    const lesson = await this.lessonRepo.findById(lessonId);
    if (!lesson) throw new NotFoundException('Không tìm thấy bài giảng.');
    return this.materialRepo.findByLesson(lessonId);
  }

  // id: number (BIGSERIAL)
  async findOne(id: number): Promise<Material> {
    const material = await this.materialRepo.findById(id);
    if (!material) throw new NotFoundException('Không tìm thấy học liệu.');
    return material;
  }

  private async assertLecturerCanEdit(
    lessonId: number,
    lecturerId: number,
  ): Promise<void> {
    const lesson = await this.lessonRepo.findById(lessonId);
    if (!lesson) throw new NotFoundException('Không tìm thấy bài giảng.');

    const course = await this.courseRepo.findById(lesson.course.id);
    if (!course) throw new NotFoundException('Không tìm thấy khóa học.');

    if (course.createdBy?.userId !== lecturerId)
      throw new ForbiddenException('Bạn không có quyền chỉnh sửa học liệu này.');

    if (!EDITABLE_STATUSES.includes(course.status))
      throw new BadRequestException(
        'Không thể chỉnh sửa học liệu khi khóa học đã được công bố, đóng hoặc lưu trữ.',
      );
  }

  async create(
    lessonId: number,
    dto: CreateMaterialDto,
    lecturerId: number,
  ): Promise<Material> {
    await this.assertLecturerCanEdit(lessonId, lecturerId);

    const maxOrder = await this.materialRepo.findMaxOrderIndex(lessonId);
    const orderIndex = dto.orderIndex ?? maxOrder + 1;

    return this.materialRepo.create({
      fileName:   dto.fileName,
      fileUrl:    dto.fileUrl,
      fileType:   dto.fileType,
      fileSizeKb: dto.fileSizeKb,
      orderIndex,
      lesson: { id: lessonId } as any,
    });
  }

  async update(
    id: number,
    dto: UpdateMaterialDto,
    lecturerId: number,
  ): Promise<Material> {
    const material = await this.findOne(id);
    await this.assertLecturerCanEdit(material.lesson.id, lecturerId);

    const updated = await this.materialRepo.update(id, {
      ...(dto.fileName   !== undefined && { fileName:   dto.fileName }),
      ...(dto.fileUrl    !== undefined && { fileUrl:    dto.fileUrl }),
      ...(dto.fileSizeKb !== undefined && { fileSizeKb: dto.fileSizeKb }),
      ...(dto.orderIndex !== undefined && { orderIndex: dto.orderIndex }),
    });
    return updated!;
  }

  async reorder(
    id: number,
    newOrderIndex: number,
    lecturerId: number,
  ): Promise<Material> {
    const material = await this.findOne(id);
    await this.assertLecturerCanEdit(material.lesson.id, lecturerId);
    const updated = await this.materialRepo.updateOrderIndex(id, newOrderIndex);
    return updated!;
  }

  async delete(id: number, lecturerId: number): Promise<void> {
    const material = await this.findOne(id);
    await this.assertLecturerCanEdit(material.lesson.id, lecturerId);
    await this.materialRepo.delete(id);
  }
}