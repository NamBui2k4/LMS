import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { AssignedLecturersRepository } from '../repository/assigned-lecturers.repository';
import { CourseRepository } from '../repository/courses.repository';
import { LecturerRepository } from '../repository/lecturer.repository';
import { AssignedLecturers } from '../models/assigned-lecturers.entity';

@Injectable()
export class AssignedLecturersService {
  constructor(
    private readonly assignedRepo: AssignedLecturersRepository,
    private readonly courseRepo: CourseRepository,
    private readonly lecturerRepo: LecturerRepository,
  ) {}

  async findByCourse(courseId: number): Promise<AssignedLecturers[]> {
    const course = await this.courseRepo.findById(courseId);
    if (!course) throw new NotFoundException('Không tìm thấy khóa học.');
    return this.assignedRepo.findByCourse(courseId);
  }

  async findByLecturer(lecturerId: number): Promise<AssignedLecturers[]> {
    return this.assignedRepo.findByLecturer(lecturerId);
  }

  async assign(courseId: number, lecturerId: number): Promise<AssignedLecturers> {
    const course = await this.courseRepo.findById(courseId);
    if (!course) throw new NotFoundException('Không tìm thấy khóa học.');
    const lecturer = await this.lecturerRepo.findById(lecturerId);
    if (!lecturer) throw new NotFoundException('Không tìm thấy giảng viên.');

    const existing = await this.assignedRepo.findOne(courseId, lecturerId);
    if (existing) throw new ConflictException('Giảng viên đã được phân công vào khóa học này.');

    return this.assignedRepo.assign(courseId, lecturerId);
  }

  async unassign(courseId: number, lecturerId: number): Promise<void> {
    const existing = await this.assignedRepo.findOne(courseId, lecturerId);
    if (!existing) throw new NotFoundException('Không tìm thấy phân công giảng viên.');
    await this.assignedRepo.unassign(courseId, lecturerId);
  }
}