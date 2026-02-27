// src/services/student.service.ts
import {
  Injectable,
  NotFoundException,
  ConflictException,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';
import * as bcrypt from 'bcrypt';

import { StudentRepository, PaginationResult, FindAllOptions } from '../repository/StudentRepository';
import { Student, AccountStatus } from '../models/student.entity';
import { CreateStudentDto } from '../dto/student/create-student.dto';
import {
  UpdateStudentDto,
  UpdateStudentStatusDto,
  ChangePasswordDto,
} from '../dto/student/update-student.dto';

// ─── Response DTO (loại bỏ passwordHash trước khi trả về client) ─────────────
export type StudentResponse = Omit<Student, 'passwordHash'>;

@Injectable()
export class StudentService {
  constructor(private readonly studentRepository: StudentRepository) {}

  // ═══════════════════════════════════════════════════════════════════════════
  // ADMIN USE CASES
  // ═══════════════════════════════════════════════════════════════════════════

  /**
   * [ADMIN] Lấy danh sách học viên — phân trang, tìm kiếm, lọc status
   */
  async findAll(options: FindAllOptions = {}): Promise<PaginationResult<StudentResponse>> {
    const result = await this.studentRepository.findAll(options);
    return {
      ...result,
      data: result.data.map(this.sanitize),
    };
  }

  /**
   * [ADMIN] Tạo tài khoản học viên mới (Admin tạo thủ công — không phải tự đăng ký)
   */
  async createByAdmin(dto: CreateStudentDto): Promise<StudentResponse> {
    // 1. Kiểm tra email trùng
    const exists = await this.studentRepository.existsByEmail(dto.email);
    if (exists) {
      throw new ConflictException(`Email "${dto.email}" đã được sử dụng`);
    }

    // 2. Hash mật khẩu
    const passwordHash = await this.hashPassword(dto.password);

    // 3. Tạo bản ghi
    const student = await this.studentRepository.create({
      fullname: dto.fullname,
      email:    dto.email,
      phone:    dto.phone ?? null,
      avatarUrl: dto.avatarUrl ?? null,
      passwordHash,
      status: AccountStatus.ACTIVE,
    });

    return this.sanitize(student);
  }

  /**
   * [ADMIN] Thay đổi status học viên (active / inactive / banned)
   */
  async updateStatus(id: number, dto: UpdateStudentStatusDto): Promise<StudentResponse> {
    const student = await this.findOneOrFail(id);

    if (student.status === dto.status) {
      throw new BadRequestException(`Học viên đã ở trạng thái "${dto.status}"`);
    }

    const updated = await this.studentRepository.update(id, { status: dto.status });
    return this.sanitize(updated!);
  }

  /**
   * [ADMIN] Xoá cứng học viên khỏi hệ thống
   */
  async remove(id: number): Promise<{ message: string }> {
    await this.findOneOrFail(id); // ném 404 nếu không tồn tại

    const deleted = await this.studentRepository.delete(id);
    if (!deleted) {
      throw new BadRequestException('Xóa học viên thất bại');
    }

    return { message: `Đã xóa học viên #${id} thành công` };
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // STUDENT USE CASES (chính học viên thao tác)
  // ═══════════════════════════════════════════════════════════════════════════

  /**
   * Xem hồ sơ cá nhân
   */
  async getProfile(id: number): Promise<StudentResponse> {
    const student = await this.findOneOrFail(id);
    return this.sanitize(student);
  }

  /**
   * Cập nhật hồ sơ cá nhân (tên, SĐT, avatar)
   * — Không cho sửa email hoặc status tại đây
   */
  async updateProfile(id: number, dto: UpdateStudentDto): Promise<StudentResponse> {
    await this.findOneOrFail(id);

    // Chỉ cập nhật các trường được phép
    const allowedFields: Partial<Student> = {};
    if (dto.fullname  !== undefined) allowedFields.fullname  = dto.fullname;
    if (dto.phone     !== undefined) allowedFields.phone     = dto.phone ?? null;
    if (dto.avatarUrl !== undefined) allowedFields.avatarUrl = dto.avatarUrl ?? null;

    if (Object.keys(allowedFields).length === 0) {
      throw new BadRequestException('Không có trường nào được cập nhật');
    }

    const updated = await this.studentRepository.update(id, allowedFields);
    return this.sanitize(updated!);
  }

  /**
   * Đổi mật khẩu — yêu cầu nhập đúng mật khẩu hiện tại
   */
  async changePassword(
    id: number,
    dto: ChangePasswordDto,
    requesterId: number,
  ): Promise<{ message: string }> {
    // Chỉ chính học viên đó mới được đổi mật khẩu
    if (id !== requesterId) {
      throw new ForbiddenException('Bạn không có quyền đổi mật khẩu của người khác');
    }

    // Lấy kèm passwordHash (field bị ẩn mặc định)
    const student = await this.studentRepository.findByEmail(
      (await this.findOneOrFail(id)).email,
    );

    if (!student || !student.passwordHash) {
      throw new BadRequestException('Tài khoản này không có mật khẩu (đăng nhập qua Google)');
    }

    // Kiểm tra mật khẩu hiện tại
    const isMatch = await bcrypt.compare(dto.currentPassword, student.passwordHash);
    if (!isMatch) {
      throw new BadRequestException('Mật khẩu hiện tại không chính xác');
    }

    // Không cho đặt lại mật khẩu giống cũ
    const isSame = await bcrypt.compare(dto.newPassword, student.passwordHash);
    if (isSame) {
      throw new BadRequestException('Mật khẩu mới không được trùng với mật khẩu hiện tại');
    }

    const newHash = await this.hashPassword(dto.newPassword);
    await this.studentRepository.update(id, { passwordHash: newHash });

    return { message: 'Đổi mật khẩu thành công' };
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // SHARED (dùng nội bộ, e.g. AuthService)
  // ═══════════════════════════════════════════════════════════════════════════

  /**
   * Tìm theo ID — ném NotFoundException nếu không có
   */
  async findOneOrFail(id: number): Promise<Student> {
    const student = await this.studentRepository.findById(id);
    if (!student) {
      throw new NotFoundException(`Không tìm thấy học viên với ID #${id}`);
    }
    return student;
  }

  /**
   * Tìm theo email kèm passwordHash — dùng cho AuthService khi login
   */
  async findByEmailWithPassword(email: string): Promise<Student | null> {
    return this.studentRepository.findByEmail(email);
  }

  /**
   * Đăng ký tài khoản (học viên tự đăng ký)
   */
  async register(dto: CreateStudentDto): Promise<StudentResponse> {
    const exists = await this.studentRepository.existsByEmail(dto.email);
    if (exists) {
      throw new ConflictException(`Email "${dto.email}" đã được đăng ký`);
    }

    const passwordHash = await this.hashPassword(dto.password);

    const student = await this.studentRepository.create({
      fullname: dto.fullname,
      email:    dto.email,
      phone:    dto.phone ?? null,
      avatarUrl: dto.avatarUrl ?? null,
      passwordHash,
      status: AccountStatus.ACTIVE,
    });

    return this.sanitize(student);
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // PRIVATE HELPERS
  // ═══════════════════════════════════════════════════════════════════════════

  /** Loại bỏ passwordHash khỏi object trước khi trả về client */
  private sanitize(student: Student): StudentResponse {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { passwordHash, ...safe } = student as Student & { passwordHash?: string };
    return safe as StudentResponse;
  }

  /** Hash mật khẩu với bcrypt */
  private async hashPassword(plain: string): Promise<string> {
    const SALT_ROUNDS = 12;
    return bcrypt.hash(plain, SALT_ROUNDS);
  }
}