import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import { Lecturer } from '../models/lecturers.entity';
import { AccountStatus } from 'src/common/enums/account-status.enum';

/**
 * ✅ FIX TOÀN BỘ FILE: Lecturer PK là `userId` (maps to DB: user_id)
 *    Tất cả `where: { id }` phải đổi thành `where: { userId }`.
 *    TypeORM FindOptionsWhere chỉ nhận đúng tên property trong entity.
 */
@Injectable()
export class LecturerRepository {
  constructor(
    @InjectRepository(Lecturer)
    private readonly lecturerRepo: Repository<Lecturer>,
    private readonly dataSource: DataSource,
  ) {}

  // Kiểu trả về Lecturer[] — array rỗng [] thể hiện "không có dữ liệu", null không có nghĩa ở đây
  async findAll(): Promise<Lecturer[]> {
    return this.lecturerRepo.find({
      order: { createdAt: 'DESC' },
    });
  }

  // ✅ FIX: where: { id } → where: { userId }
  async findById(userId: number): Promise<Lecturer | null> {
    return this.lecturerRepo.findOne({
      where: { userId },
      // Thêm createdCourses để phục vụ xem khóa học của giảng viên
      relations: ['assignedCourses', 'assignedCourses.course', 'createdCourses'],
    });
  }

  async findByEmail(email: string): Promise<Lecturer | null> {
    return this.lecturerRepo.findOne({ where: { email } });
  }

  // ✅ FIX: update theo userId (không phải id)
  async update(userId: number, data: Partial<Lecturer>): Promise<Lecturer | null> {
    await this.lecturerRepo.update({ userId }, data as any);
    return this.findById(userId);
  }

  /**
   * Tải đầy đủ dữ liệu thống kê: courses tạo + bài giảng + học liệu
   * Phục vụ chức năng "Thống kê hoạt động giảng dạy" cho Trưởng bộ môn
   * ✅ FIX: where: { id } → where: { userId }
   */
  async findWithTeachingStats(userId: number): Promise<Lecturer | null> {
    return this.lecturerRepo.findOne({
      where: { userId },
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

  /**
   * Xem các khóa học mà giảng viên đã tạo, kèm thông tin chi tiết
   * Phục vụ "Xem danh sách khóa học" lọc theo giảng viên
   * ✅ FIX: where: { id } → where: { userId }
   */
  async findWithCreatedCourses(userId: number): Promise<Lecturer | null> {
    return this.lecturerRepo.findOne({
      where: { userId },
      relations: [
        'createdCourses',
        'createdCourses.category',
      ],
    });
  }

  /**
   * Xem các khóa học mà giảng viên được phân công giảng dạy
   * ✅ FIX: where: { id } → where: { userId }
   */
  async findWithAssignedCourses(userId: number): Promise<Lecturer | null> {
    return this.lecturerRepo.findOne({
      where: { userId },
      relations: [
        'assignedCourses',
        'assignedCourses.course',
        'assignedCourses.course.category',
      ],
    });
  }

  /**
   * Tìm tất cả giảng viên kèm thông tin khóa học tạo và phân công
   * Phục vụ "Xem danh sách giảng viên" với đầy đủ thông tin cho Trưởng bộ môn
   */
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

  /**
   * Tìm giảng viên kèm thống kê bài kiểm tra và bài nộp mà họ tạo
   * Phục vụ báo cáo hoạt động chấm điểm
   * ✅ FIX: where('lecturer.id = :id') → where('lecturer.userId = :userId')
   *         Trong QueryBuilder, dùng đúng tên property TypeORM không phải tên cột DB
   */
  async findWithGradingStats(userId: number): Promise<Lecturer | null> {
    return this.lecturerRepo
      .createQueryBuilder('lecturer')
      .leftJoinAndSelect('lecturer.createdCourses', 'createdCourses')
      .leftJoinAndSelect('createdCourses.quizzes', 'quizzes')
      .leftJoinAndSelect('quizzes.submissions', 'submissions')
      // ✅ FIX: 'lecturer.id = :id' → 'lecturer.userId = :userId'
      .where('lecturer.userId = :userId', { userId })
      .getOne();
  }

  async createWithTransaction(data: {
    fullname: string;
    email: string;
    passwordHash: string;
    phone?: string | null;
    academicDegree?: string | null;
    subject?: string | null;
    department?: string | null;
  }): Promise<Lecturer> {
    return this.dataSource.transaction(async (manager) => {
      // Bước 1: Insert vào bảng users
      const userResult = await manager.query(
        `INSERT INTO users (email, password_hash, role, is_active)
         VALUES ($1, $2, 'LECTURER', true) RETURNING id`,
        [data.email, data.passwordHash],
      );
      const userId = Number(userResult[0].id);

      // Bước 2: Insert vào bảng lecturers
      // ✅ FIX: Convert null → undefined để TypeORM không bị type error
      const lecturer = manager.create(Lecturer, {
        userId,
        fullname: data.fullname,
        email: data.email,
        passwordHash: data.passwordHash,
        status: AccountStatus.ACTIVE,
        // ✅ FIX: null → undefined (TypeORM chỉ chấp nhận string | undefined)
        phone: data.phone ?? undefined,
        academicDegree: data.academicDegree ?? undefined,
        subject: data.subject ?? undefined,
        department: data.department ?? undefined,
      });

      return manager.save(Lecturer, lecturer);
    });
  }

}