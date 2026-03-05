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

  // [SỬA] Kiểu trả về Lecturer[] thay vì Lecturer[] | null
  // Array rỗng [] thể hiện "không có dữ liệu", null không có nghĩa ở đây
  async findAll(): Promise<Lecturer[]> {
    return this.lecturerRepo.find({
      order: { createdAt: 'DESC' },
    });
  }

  async findById(id: number): Promise<Lecturer | null> {
    return this.lecturerRepo.findOne({
      where: { id },
      // [SỬA] Thêm createdCourses để phục vụ xem khóa học của giảng viên
      relations: ['assignedCourses', 'assignedCourses.course', 'createdCourses'],
    });
  }

  async findByEmail(email: string): Promise<Lecturer | null> {
    return this.lecturerRepo.findOne({ where: { email } });
  }

  async update(id: number, data: Partial<Lecturer>): Promise<Lecturer | null> {
    await this.lecturerRepo.update(id, data);
    return this.findById(id);
  }

  // [MỚI] Tải đầy đủ dữ liệu thống kê: courses tạo + bài giảng + học liệu
  // Phục vụ chức năng "Thống kê hoạt động giảng dạy" cho Trưởng bộ môn
  async findWithTeachingStats(id: number): Promise<Lecturer | null> {
    return this.lecturerRepo.findOne({
      where: { id },
      relations: [
        'createdCourses',
        'createdCourses.category',
        'createdCourses.lessons',
        'createdCourses.lessons.materials',
        'assignedCourses',
        'assignedCourses.course',
      ],
    });
  }

  // [MỚI] Xem các khóa học mà giảng viên đã tạo, kèm thông tin chi tiết
  // Phục vụ "Xem danh sách khóa học" lọc theo giảng viên
  async findWithCreatedCourses(id: number): Promise<Lecturer | null> {
    return this.lecturerRepo.findOne({
      where: { id },
      relations: [
        'createdCourses',
        'createdCourses.category',
      ],
    });
  }

  // [MỚI] Xem các khóa học mà giảng viên được phân công giảng dạy
  async findWithAssignedCourses(id: number): Promise<Lecturer | null> {
    return this.lecturerRepo.findOne({
      where: { id },
      relations: [
        'assignedCourses',
        'assignedCourses.course',
        'assignedCourses.course.category',
      ],
    });
  }

  // [MỚI] Tìm tất cả giảng viên kèm thông tin khóa học tạo và phân công
  // Phục vụ "Xem danh sách giảng viên" với đầy đủ thông tin cho Trưởng bộ môn
  async findAllWithCourses(): Promise<Lecturer[]> {
    return this.lecturerRepo.find({
      relations: [
        'createdCourses',
        'assignedCourses',
        'assignedCourses.course',
      ],
      order: { createdAt: 'DESC' },
    });
  }

  // [MỚI] Tìm giảng viên kèm thống kê bài kiểm tra và bài nộp mà họ tạo
  // Phục vụ báo cáo hoạt động chấm điểm
  async findWithGradingStats(id: number): Promise<Lecturer | null> {
    return this.lecturerRepo
      .createQueryBuilder('lecturer')
      .leftJoinAndSelect('lecturer.createdCourses', 'createdCourses')
      .leftJoinAndSelect('createdCourses.quizzes', 'quizzes')
      .leftJoinAndSelect('quizzes.submissions', 'submissions')
      .where('lecturer.id = :id', { id })
      .getOne();
  }
}