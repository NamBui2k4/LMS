import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { LecturerRepository } from '../repository/lecturer.repository';
import { Lecturer } from '../models/lecturers.entity';
import { Course } from '../models/courses.entity';
import { UpdateLecturerDto } from '../dto/lecturer.dto';

@Injectable()
export class LecturerService {
  constructor(private readonly lecturerRepo: LecturerRepository) {}

  // [SỬA] Bỏ try/catch bọc findAll — không cần thiết vì findAll không throw lỗi business
  // Nếu DB lỗi thì NestJS đã có global exception filter xử lý
  async getAllLecturers(): Promise<Lecturer[]> {
    return this.lecturerRepo.findAll();
  }

  async getLecturerProfile(id: number): Promise<Lecturer> {
    const lecturer = await this.lecturerRepo.findById(id);
    if (!lecturer) throw new NotFoundException('Không tìm thấy giảng viên.');
    return lecturer;
  }

  // [SỬA] Kiểm tra tồn tại trước khi update thay vì kiểm tra sau
  // Tránh trường hợp update thành công nhưng findById trả về null (race condition)
  // [SỬA] Bỏ try/catch bọc toàn bộ — chỉ handle NotFoundException đúng chỗ
  async updateProfile(id: number, updateDto: UpdateLecturerDto): Promise<Lecturer> {
    const existing = await this.lecturerRepo.findById(id);
    if (!existing) throw new NotFoundException('Không tìm thấy giảng viên.');

    const updated = await this.lecturerRepo.update(id, updateDto);
    return updated!;
  }

  // [SỬA] Tách riêng hàm thống kê dùng findWithTeachingStats thay vì findById thông thường
  // findById chỉ tải assignedCourses + createdCourses cơ bản,
  // còn thống kê cần cả lessons và materials bên trong
  async getTeachingStatistics(id: number): Promise<Lecturer> {
    const lecturer = await this.lecturerRepo.findWithTeachingStats(id);
    if (!lecturer) throw new NotFoundException('Không tìm thấy giảng viên.');
    return lecturer;
  }

  // [MỚI] Lấy danh sách khóa học do giảng viên tạo
  // Phục vụ endpoint GET /lecturers/:id/created-courses
  // Trả về Lecturer (entity gốc) để controller tự map sang DTO nếu cần
  async getCreatedCourses(id: number): Promise<Course[]> {
    const lecturer = await this.lecturerRepo.findWithCreatedCourses(id);
    if (!lecturer) throw new NotFoundException('Không tìm thấy giảng viên.');
    return lecturer.createdCourses ?? [];
  }

  // [MỚI] Lấy danh sách khóa học giảng viên được phân công giảng dạy
  // Phục vụ endpoint GET /lecturers/:id/assigned-courses
  async getAssignedCourses(id: number): Promise<Course[]> {
    const lecturer = await this.lecturerRepo.findWithAssignedCourses(id);
    if (!lecturer) throw new NotFoundException('Không tìm thấy giảng viên.');
    return lecturer.assignedCourses?.map((al) => al.course) ?? [];
  }

  // [MỚI] Kiểm tra quyền: giảng viên chỉ được cập nhật hồ sơ của chính mình
  // Được gọi từ controller sau khi decode JWT để lấy requesterId
  async assertCanUpdateProfile(targetId: number, requesterId: number): Promise<void> {
    if (targetId !== requesterId)
      throw new ForbiddenException('Bạn chỉ được phép cập nhật hồ sơ của chính mình.');
  }

  // [MỚI] Lấy danh sách tất cả giảng viên kèm thông tin khóa học
  // Phục vụ "Xem danh sách giảng viên" cho Trưởng bộ môn với đầy đủ ngữ cảnh
  async getAllWithCourses(): Promise<Lecturer[]> {
    return this.lecturerRepo.findAllWithCourses();
  }

  // [MỚI] Lấy thống kê chấm điểm của giảng viên (quiz, submission)
  // Phục vụ báo cáo hoạt động chấm bài cho Trưởng bộ môn
  async getGradingStats(id: number): Promise<Lecturer> {
    const lecturer = await this.lecturerRepo.findWithGradingStats(id);
    if (!lecturer) throw new NotFoundException('Không tìm thấy giảng viên.');
    return lecturer;
  }
}