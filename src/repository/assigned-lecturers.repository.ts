import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import { AssignedLecturers } from '../models/assigned-lecturers.entity';

@Injectable()
export class AssignedLecturersRepository {
  constructor(
    @InjectRepository(AssignedLecturers)
    private readonly assignedRepo: Repository<AssignedLecturers>,
    private readonly dataSource: DataSource,
  ) {}

  async findByCourse(courseId: number): Promise<AssignedLecturers[]> {
    return this.assignedRepo.find({
      where: { courseId },
      relations: ['instructor'],
    });
  }

  async findByLecturer(lecturerId: number): Promise<AssignedLecturers[]> {
    return this.assignedRepo.find({
      where: { lecturerId },
      relations: ['course'],
    });
  }

  async findOne(courseId: number, lecturerId: number): Promise<AssignedLecturers | null> {
    return this.assignedRepo.findOne({
      where: { courseId, lecturerId },
      relations: ['course', 'instructor'],
    });
  }

  async assign(courseId: number, lecturerId: number): Promise<AssignedLecturers> {
    const entity = this.assignedRepo.create({ courseId, lecturerId });
    return this.assignedRepo.save(entity);
  }

  async unassign(courseId: number, lecturerId: number): Promise<void | null> {
    await this.assignedRepo.delete({ courseId, lecturerId });
  }
}