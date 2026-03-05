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
      order: { order: 'ASC' },
    });
  }

  async findById(id: string): Promise<Lesson | null> {
    return this.lessonRepo.findOne({
      where: { id },
      relations: ['course'],
    });
  }

  async findByIdWithMaterials(id: string): Promise<Lesson | null> {
    return this.lessonRepo.findOne({
      where: { id },
      relations: ['course', 'materials'],
    });
  }

  async findMaxOrder(courseId: number): Promise<number> {
    const result = await this.lessonRepo
      .createQueryBuilder('lesson')
      .select('MAX(lesson.order)', 'maxOrder')
      .where('lesson.courseId = :courseId', { courseId })
      .getRawOne();
    return result?.maxOrder ?? 0;
  }

  async create(data: Partial<Lesson>): Promise<Lesson> {
    const entity = this.lessonRepo.create(data);
    return this.lessonRepo.save(entity);
  }

  async update(id: string, data: Partial<Lesson>): Promise<Lesson | null> {
    await this.lessonRepo.update(id, data);
    return this.findById(id);
  }

  async updateOrder(id: string, order: number): Promise<Lesson | null> {
    await this.lessonRepo.update(id, { order });
    return this.findById(id);
  }

  async delete(id: string): Promise<void | null> {
    await this.lessonRepo.delete(id);
  }
}