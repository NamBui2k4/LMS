import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import { Lecturer } from '../models/lecturers.entity';

@Injectable()
export class LecturerRepository {
  constructor(
    @InjectRepository(Lecturer)
    private readonly lecturerRepo: Repository<Lecturer>,
    private readonly dataSource: DataSource,
  ) {}

  async findAll(): Promise<Lecturer[] | null> {
    return this.lecturerRepo.find();
  }

  async findById(id: number): Promise<Lecturer | null> {
    return this.lecturerRepo.findOne({
      where: { id },
      relations: ['assignedCourses', 'assignedCourses.course'],
    });
  }

  async findByEmail(email: string): Promise<Lecturer | null> {
    return this.lecturerRepo.findOne({ where: { email } });
  }

  async update(id: number, data: Partial<Lecturer>): Promise<Lecturer | null> {
    await this.lecturerRepo.update(id, data);
    return this.findById(id);
  }

  // Thống kê hoạt động giảng dạy cho Trưởng bộ môn
  async getTeachingStats(id: number): Promise<Lecturer | null> {
    return this.lecturerRepo.findOne({
      where: { id },
      relations: ['assignedCourses', 'createdCourses', 'assignedCourses.course'],
    });
  }
}