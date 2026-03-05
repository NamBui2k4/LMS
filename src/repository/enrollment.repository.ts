import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import { Enrollment } from '../models/enrollment.entity';
import { EnrollmentStatus } from '../common/enums/enrollment-status.enum';

@Injectable()
export class EnrollmentRepository {
  constructor(
    @InjectRepository(Enrollment)
    private readonly enrollmentRepo: Repository<Enrollment>,
    private readonly dataSource: DataSource,
  ) {}

  async findByCourse(courseId: number): Promise<Enrollment[]> {
    return this.enrollmentRepo.find({
      where: { course: { id: courseId } },
      relations: ['student'],
      order: { enrolledAt: 'DESC' } as any,
    });
  }

  async findByStudent(studentId: string): Promise<Enrollment[]> {
    return this.enrollmentRepo.find({
      where: { student: { id: studentId } },
      relations: ['course', 'course.category'],
      order: { enrolledAt: 'DESC' } as any,
    });
  }

  async findById(id: string): Promise<Enrollment | null> {
    return this.enrollmentRepo.findOne({
      where: { id },
      relations: ['student', 'course'],
    });
  }

  async findByStudentAndCourse(studentId: string, courseId: number): Promise<Enrollment | null> {
    return this.enrollmentRepo.findOne({
      where: {
        student: { id: studentId },
        course: { id: courseId },
      },
      relations: ['student', 'course'],
    });
  }

  async create(data: Partial<Enrollment>): Promise<Enrollment> {
    const entity = this.enrollmentRepo.create(data);
    return this.enrollmentRepo.save(entity);
  }

  async updateStatus(id: string, status: EnrollmentStatus): Promise<Enrollment | null> {
    await this.enrollmentRepo.update(id, { status } as any);
    return this.findById(id);
  }

  async delete(id: string): Promise<void | null> {
    await this.enrollmentRepo.delete(id);
  }

  async deleteByStudentAndCourse(studentId: string, courseId: number): Promise<void | null> {
    await this.enrollmentRepo.delete({
      student: { id: studentId },
      course: { id: courseId },
    } as any);
  }
}