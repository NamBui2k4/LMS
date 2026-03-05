import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import { Material } from '../models/material.entity';

@Injectable()
export class MaterialRepository {
  constructor(
    @InjectRepository(Material)
    private readonly materialRepo: Repository<Material>,
    private readonly dataSource: DataSource,
  ) {}

  async findByLesson(lessonId: string): Promise<Material[]> {
    return this.materialRepo.find({
      where: { lesson: { id: lessonId } },
      order: { order: 'ASC' },
    });
  }

  async findById(id: number): Promise<Material | null> {
    return this.materialRepo.findOne({
      where: { id },
      relations: ['lesson'],
    });
  }

  async findMaxOrder(lessonId: string): Promise<number> {
    const result = await this.materialRepo
      .createQueryBuilder('material')
      .select('MAX(material.order)', 'maxOrder')
      .where('material.lessonId = :lessonId', { lessonId })
      .getRawOne();
    return result?.maxOrder ?? 0;
  }

  async create(data: Partial<Material>): Promise<Material> {
    const entity = this.materialRepo.create(data);
    return this.materialRepo.save(entity);
  }

  async update(id: number, data: Partial<Material>): Promise<Material | null> {
    await this.materialRepo.update(id, data);
    return this.findById(id);
  }

  async updateOrder(id: number, order: number): Promise<Material | null> {
    await this.materialRepo.update(id, { order });
    return this.findById(id);
  }

  async delete(id: number): Promise<void | null> {
    await this.materialRepo.delete(id);
  }
}