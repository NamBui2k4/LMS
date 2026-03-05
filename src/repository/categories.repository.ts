import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import { Category } from '../models/categories.entity';

@Injectable()
export class CategoryRepository {
  constructor(
    @InjectRepository(Category)
    private readonly categoryRepo: Repository<Category>,
    private readonly dataSource: DataSource,
  ) {}

  async findAll(): Promise<Category[]> {
    return this.categoryRepo.find({ order: { name: 'ASC' } });
  }

  async findById(id: number): Promise<Category | null> {
    return this.categoryRepo.findOne({ where: { id } });
  }

  async findByIdWithCourses(id: number): Promise<Category | null> {
    return this.categoryRepo.findOne({
      where: { id },
      relations: ['courses'],
    });
  }

  async findByName(name: string): Promise<Category | null> {
    return this.categoryRepo.findOne({ where: { name } });
  }

  async create(data: Partial<Category>): Promise<Category> {
    const entity = this.categoryRepo.create(data);
    return this.categoryRepo.save(entity);
  }

  async update(id: number, data: Partial<Category>): Promise<Category | null> {
    await this.categoryRepo.update(id, data);
    return this.findById(id);
  }

  async delete(id: number): Promise<void | null> {
    await this.categoryRepo.delete(id);
  }
}