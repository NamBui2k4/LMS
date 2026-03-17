import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Material } from '../models/material.entity';

@Injectable()
export class MaterialRepository {
  constructor(
    @InjectRepository(Material)
    private readonly materialRepo: Repository<Material>,
  ) {}

  // lessonId: number — khớp với Lesson.id (BIGSERIAL)
  async findByLesson(lessonId: number): Promise<Material[]> {
    return this.materialRepo.find({
      where: { lesson: { id: lessonId } },
      order: { orderIndex: 'ASC' },
    });
  }

  // id: number — khớp với Material.id (BIGSERIAL)
  async findById(id: number): Promise<Material | null> {
    return this.materialRepo.findOne({
      where: { id },
      relations: ['lesson'],
    });
  }

  // Tìm orderIndex lớn nhất trong bài giảng để tự động gán thứ tự kế tiếp
  async findMaxOrderIndex(lessonId: number): Promise<number> {
    const result = await this.materialRepo
      .createQueryBuilder('material')
      .select('MAX(material.orderIndex)', 'maxOrderIndex')
      .where('material.lesson_id = :lessonId', { lessonId })
      .getRawOne();
    return parseInt(result?.maxOrderIndex, 10) || 0;
  }

  async create(data: Partial<Material>): Promise<Material> {
    const entity = this.materialRepo.create(data);
    return this.materialRepo.save(entity);
  }

  async update(id: number, data: Partial<Material>): Promise<Material | null> {
    await this.materialRepo.update(id, data);
    return this.findById(id);
  }

  async updateOrderIndex(id: number, orderIndex: number): Promise<Material | null> {
    await this.materialRepo.update(id, { orderIndex });
    return this.findById(id);
  }

  async delete(id: number): Promise<void> {
    await this.materialRepo.delete(id);
  }
}