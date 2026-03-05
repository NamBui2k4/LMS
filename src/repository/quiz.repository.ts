import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import { Quiz } from '../models/quizzes.entity';

@Injectable()
export class QuizRepository {
  constructor(
    @InjectRepository(Quiz)
    private readonly quizRepo: Repository<Quiz>,
    private readonly dataSource: DataSource,
  ) {}

  async findByCourse(courseId: number): Promise<Quiz[]> {
    return this.quizRepo.find({
      where: { course: { id: courseId } },
      relations: ['createdBy'],
      order: { createdAt: 'ASC' },
    });
  }

  async findById(id: number): Promise<Quiz | null> {
    return this.quizRepo.findOne({
      where: { id },
      relations: ['course', 'createdBy'],
    });
  }

  async findByIdWithQuestions(id: number): Promise<Quiz | null> {
    return this.quizRepo.findOne({
      where: { id },
      relations: ['course', 'createdBy', 'questions'],
    });
  }

  async create(data: Partial<Quiz>): Promise<Quiz> {
    const entity = this.quizRepo.create(data);
    return this.quizRepo.save(entity);
  }

  async update(id: number, data: Partial<Quiz>): Promise<Quiz | null> {
    await this.quizRepo.update(id, data);
    return this.findById(id);
  }

  async delete(id: number): Promise<void | null> {
    await this.quizRepo.delete(id);
  }
}