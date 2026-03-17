import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import { Lesson } from '../models/lesson.entity';

@Injectable()
export class LessonRepository {
  constructor(
    @InjectRepository(Lesson)
    private readonly lessonRepo: Repository<Lesson>,
    private readonly dataSource: DataSource,
  ) {}

  async findByCourse(courseId: number): Promise<Lesson[]> {
    return this.lessonRepo.find({
      where: { course: { id: courseId } },
      relations: ['materials'],
      // ✅ FIX: order → orderIndex (đúng tên property trong Lesson entity)
      order: { orderIndex: 'ASC' },
    });
  }

  // ✅ FIX: id: string → number (Lesson PK là BIGSERIAL → number)
  async findById(id: number): Promise<Lesson | null> {
    return this.lessonRepo.findOne({
      where: { id },
      relations: ['course'],
    });
  }

  // ✅ FIX: id: string → number
  async findByIdWithMaterials(id: number): Promise<Lesson | null> {
    return this.lessonRepo.findOne({
      where: { id },
      relations: ['course', 'materials'],
    });
  }

  /**
   * Tìm orderIndex lớn nhất trong khóa học để tự động gán thứ tự kế tiếp khi tạo bài giảng mới
   * ✅ FIX: đổi tên findMaxOrder → findMaxOrderIndex (khớp với lesson.service.ts)
   * ✅ FIX: MAX(lesson.orderIndex) thay vì MAX(lesson.order)
   */
  async findMaxOrderIndex(courseId: number): Promise<number> {
    const result = await this.lessonRepo
      .createQueryBuilder('lesson')
      .select('MAX(lesson.orderIndex)', 'maxOrderIndex')
      .where('lesson.course_id = :courseId', { courseId })
      .getRawOne();
    return parseInt(result?.maxOrderIndex, 10) || 0;
  }

  async create(data: Partial<Lesson>): Promise<Lesson> {
    const entity = this.lessonRepo.create(data);
    return this.lessonRepo.save(entity);
  }

  // ✅ FIX: id: string → number
  async update(id: number, data: Partial<Lesson>): Promise<Lesson | null> {
    await this.lessonRepo.update(id, data);
    return this.findById(id);
  }

  /**
   * Cập nhật thứ tự bài giảng trong khóa học (reorder)
   * ✅ FIX: đổi tên updateOrder → updateOrderIndex (khớp với lesson.service.ts)
   * ✅ FIX: id: string → number; { order } → { orderIndex }
   */
  async updateOrderIndex(id: number, orderIndex: number): Promise<Lesson | null> {
    await this.lessonRepo.update(id, { orderIndex });
    return this.findById(id);
  }

  // ✅ FIX: id: string → number
  async delete(id: number): Promise<void> {
    await this.lessonRepo.delete(id);
  }
}