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
  console.log(`[assertLecturerCanEdit] Checking lessonId=${lessonId}, lecturerId=${lecturerId}`);

  const lesson = await this.lessonRepo.findById(lessonId);
  if (!lesson) {
    console.error(`Lesson ${lessonId} not found`);
    throw new NotFoundException('Không tìm thấy bài giảng.');
  }

  console.log(`Lesson found: "${lesson.title}", course_id=${lesson.course?.id}`);

  // Load course với createdBy rõ ràng
  const course = await this.courseRepo.findById(lesson.course.id);
  if (!course) {
    console.error(`Course ${lesson.course.id} not found`);
    throw new NotFoundException('Không tìm thấy khóa học.');
  }

  console.log(`Course id=${course.id}, created_by=${course.createdBy?.userId}, status=${course.status}`);

  // So sánh an toàn hơn
  const courseOwnerId = Number(course.createdBy?.userId);
  if (courseOwnerId !== Number(lecturerId)) {
    console.error(`Permission denied: course owner=${courseOwnerId}, requester=${lecturerId}`);
    throw new ForbiddenException('Bạn không có quyền chỉnh sửa học liệu này.');
  }

  if (!EDITABLE_STATUSES.includes(course.status)) {
    throw new BadRequestException(
      'Không thể chỉnh sửa học liệu khi khóa học đã được công bố, đóng hoặc lưu trữ.',
    );
  }

  console.log(`[assertLecturerCanEdit] Permission GRANTED for lecturer ${lecturerId}`);
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