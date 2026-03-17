import { Injectable, NotFoundException, ForbiddenException, ConflictException } from '@nestjs/common';
import { LecturerRepository } from '../repository/lecturer.repository';
import { Lecturer } from '../models/lecturers.entity';
import { Courses } from '../models/courses.entity';
import { DepartmentHeadRepository } from '../repository/department-heads.repository'; 
import { UserRepository } from '../repository/user.repository';        
import * as bcrypt from 'bcrypt'; 
import { CreateLecturerDto, UpdateLecturerDto } from '../dto/lecturer.dto'; 
import { AccountStatus } from 'src/common/enums/account-status.enum';
import { UserRole } from 'src/common/enums/role.enum';

@Injectable()
export class LecturerService {
  constructor(
    private readonly lecturerRepo: LecturerRepository,
    private readonly userRepo: UserRepository, // ✅ inject thêm
  ) {}

  // ✅ THÊM MỚI: Admin tạo tài khoản Lecturer
  async createLecturer(dto: CreateLecturerDto): Promise<Lecturer> {
  const existing = await this.lecturerRepo.findByEmail(dto.email);
  if (existing) throw new ConflictException(`Email ${dto.email} đã được sử dụng.`);

  const passwordHash = await bcrypt.hash(dto.password, 10);

  // ✅ Không cần gọi userRepo.createUser() riêng nữa
  // createWithTransaction() lo cả 2 bảng trong 1 transaction
  return this.lecturerRepo.createWithTransaction({
    fullname: dto.fullname,
    email: dto.email,
    passwordHash,
    phone: dto.phone,           // undefined nếu không có
    academicDegree: dto.academicDegree,
    subject: dto.subject,
    department: dto.department,
  });
}

  // ✅ THÊM MỚI: Promote Lecturer → HEAD_OF_DEPARTMENT
  async promoteToHoD(lecturerId: number): Promise<Lecturer> {
    const lecturer = await this.lecturerRepo.findById(lecturerId);
    if (!lecturer) throw new NotFoundException('Không tìm thấy giảng viên.');

    // Cập nhật role trong bảng users
    await this.userRepo.assignRole(String(lecturerId), UserRole.HEAD_OF_DEPARTMENT);

    return lecturer;
  }

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
  async getCreatedCourses(id: number): Promise<Courses[]> {
    const lecturer = await this.lecturerRepo.findWithCreatedCourses(id);
    if (!lecturer) throw new NotFoundException('Không tìm thấy giảng viên.');
    return lecturer.createdCourses ?? [];
  }

  // [MỚI] Lấy danh sách khóa học giảng viên được phân công giảng dạy
  // Phục vụ endpoint GET /lecturers/:id/assigned-courses
  async getAssignedCourses(id: number): Promise<Courses[]> {
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