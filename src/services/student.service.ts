import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import { Student } from '../models/student.entity';
import { UpdateStudentDto } from '../dto/student.dto';
import { AccountStatus } from '../common/enums/account-status.enum';
import { StudentRepository } from '../repository/student.repository';
import { UserRepository } from '../repository/user.repository';
import { Enrollment } from '../models/enrollment.entity';
import { Submission } from '../models/submission.entity';

@Injectable()
export class StudentService {
  private readonly includeLegacyProfileKeys: boolean;

  constructor(
    private readonly studentRepo: StudentRepository,
    private readonly userRepo: UserRepository,
  ) {
    const raw = (process.env.STUDENT_PROFILE_INCLUDE_LEGACY_KEYS ?? 'true').toLowerCase();
    this.includeLegacyProfileKeys = raw === 'true' || raw === '1' || raw === 'yes';
  }

  async findAll(page: number = 1, limit: number = 10) {
    return this.studentRepo.findAllPaginated(page, limit);
  }

  async getProfileByUserId(userId: number): Promise<Record<string, any>> {
    const profile = await this.studentRepo.findProfileByUserId(userId);
    if (!profile) throw new NotFoundException('Không tìm thấy học viên.');

    if (!this.includeLegacyProfileKeys) {
      delete profile.mssv;
      delete profile.khoa;
      delete profile.nganh;
      delete profile.diaChi;
    }

    return profile;
  }

  // Trả về đầy đủ profile student (bao gồm MSSV/Khoa/Ngành/Địa chỉ khi có)
  async findOne(userId: number): Promise<Record<string, any>> {
    return this.getProfileByUserId(userId);
  }

  async updateProfile(userId: number, updateDto: UpdateStudentDto): Promise<Record<string, any>> {
    const student = await this.getProfileByUserId(userId);

    // Nếu đổi email → cập nhật cả bảng users (để đồng bộ)
    if (updateDto.email && updateDto.email !== student.email) {
      // ✅ FIX: truyền userId dạng string vì UserRepository dùng string id
      await this.userRepo.updateEmailById(String(userId), updateDto.email);
    }

    const updated = await this.studentRepo.updateProfileByUserId(userId, {
      fullname: updateDto.fullname,
      email: updateDto.email,
      phone: updateDto.phone,
      avatarUrl: updateDto.avatarUrl,
      mssv: updateDto.studentCode ?? updateDto.mssv,
      khoa: updateDto.faculty ?? updateDto.khoa,
      nganh: updateDto.major ?? updateDto.nganh,
      diaChi: updateDto.address ?? updateDto.diaChi,
    });
    if (!updated) throw new NotFoundException('Không tìm thấy học viên.');
    return updated;
  }

  /**
   * Cập nhật trạng thái tài khoản (active / inactive / banned)
   * ✅ FIX: AccountStatus.BANNED (không còn SUSPENDED)
   */
  async updateAccountStatus(
    userId: number,
    status: AccountStatus,
    reason?: string,
  ): Promise<Student> {
    // Validate: chỉ cho phép set BANNED, ACTIVE, INACTIVE
    if (!Object.values(AccountStatus).includes(status)) {
      throw new BadRequestException(`Trạng thái không hợp lệ: ${status}`);
    }

    const updated = await this.studentRepo.updateStatus(userId, status);
    if (!updated) throw new NotFoundException('Không tìm thấy học viên.');

    // Đồng bộ isActive trên bảng users
    const isActive = status === AccountStatus.ACTIVE;
    await this.userRepo.updateStatus(String(userId), isActive);

    return updated;
  }

  async getEnrollments(userId: number): Promise<Enrollment[]> {
    const student = await this.studentRepo.findByIdWithEnrollments(userId);
    if (!student) throw new NotFoundException('Không tìm thấy học viên.');
    return student.enrollments ?? [];
  }

  async getSubmissions(userId: number): Promise<Submission[]> {
    const student = await this.studentRepo.findByIdWithSubmissions(userId);
    if (!student) throw new NotFoundException('Không tìm thấy học viên.');
    return student.submissions ?? [];
  }

  /**
   * Kiểm tra quyền: học viên chỉ được xem/sửa dữ liệu của chính mình
   * ✅ FIX: so sánh number với number (userId)
   */
  async assertIsOwnerOrStaff(
    targetId: number,
    requesterId: number,
    requesterRole: string,
  ): Promise<void> {
    const staffRoles = ['LECTURER', 'HEAD_OF_DEPARTMENT', 'ADMIN'];
    if (targetId !== requesterId && !staffRoles.includes(requesterRole)) {
      throw new ForbiddenException('Bạn không có quyền truy cập thông tin của học viên khác.');
    }
  }
}