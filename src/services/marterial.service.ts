import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import { MaterialRepository } from '../repository/materials.repository';
import { LessonRepository } from '../repository/lessons.repository';
import { CourseRepository } from '../repository/courses.repository';
import { Material } from '../models/material.entity';
import { CourseStatus } from '../common/enums/course-status.enum';
import { CreateMaterialDto, UpdateMaterialDto } from '../dto/material.dto';

const EDITABLE_STATUSES = [CourseStatus.PLANNED, CourseStatus.OPEN];

@Injectable()
export class MaterialService {
  constructor(
    private readonly materialRepo: MaterialRepository,
    private readonly lessonRepo: LessonRepository,
    private readonly courseRepo: CourseRepository,
  ) {}

  async findByLesson(lessonId: string): Promise<Material[]> {
    const lesson = await this.lessonRepo.findById(lessonId);
    if (!lesson) throw new NotFoundException('Không tìm thấy bài giảng.');
    return this.materialRepo.findByLesson(lessonId);
  }

  async findOne(id: number): Promise<Material> {
    const material = await this.materialRepo.findById(id);
    if (!material) throw new NotFoundException('Không tìm thấy học liệu.');
    return material;
  }

  private async assertLecturerCanEdit(lessonId: string, lecturerId: number): Promise<void> {
    const lesson = await this.lessonRepo.findById(lessonId);
    if (!lesson) throw new NotFoundException('Không tìm thấy bài giảng.');
    const course = await this.courseRepo.findById(lesson.course.id);
    if (!course) throw new NotFoundException('Không tìm thấy khóa học.');
    if (course.createdBy?.id !== lecturerId)
      throw new ForbiddenException('Bạn không có quyền chỉnh sửa học liệu này.');
    if ([CourseStatus.CLOSED, CourseStatus.CANCELLED].includes(course.status))
      throw new BadRequestException('Không thể chỉnh sửa học liệu trong khóa học đã đóng.');
  }

  async create(lessonId: string, dto: CreateMaterialDto, lecturerId: number): Promise<Material> {
    await this.assertLecturerCanEdit(lessonId, lecturerId);
    const maxOrder = await this.materialRepo.findMaxOrder(lessonId);
    const order = dto.order ?? maxOrder + 1;

    return this.materialRepo.create({
      name: dto.name,
      description: dto.description,
      type: dto.type,
      fileUrl: dto.fileUrl,
      order,
      lesson: { id: lessonId } as any,
    });
  }

  async update(id: number, dto: UpdateMaterialDto, lecturerId: number): Promise<Material> {
    const material = await this.findOne(id);
    await this.assertLecturerCanEdit(material.lesson.id, lecturerId);
    const updated = await this.materialRepo.update(id, dto);
    return updated!;
  }

  async reorder(id: number, newOrder: number, lecturerId: number): Promise<Material> {
    const material = await this.findOne(id);
    await this.assertLecturerCanEdit(material.lesson.id, lecturerId);
    const updated = await this.materialRepo.updateOrder(id, newOrder);
    return updated!;
  }

  async delete(id: number, lecturerId: number): Promise<void> {
    const material = await this.findOne(id);
    await this.assertLecturerCanEdit(material.lesson.id, lecturerId);
    await this.materialRepo.delete(id);
  }
}