import {
  Injectable,
  ConflictException,
  BadRequestException,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { UserRepository } from '../repository/user.repository';
import { User } from '../models/user.entity';
import { UserRole } from '../common/enums/role.enum';
import { CreateUserDto } from '../dto/user.dto';
import { AccountStatus } from '../common/enums/account-status.enum';

@Injectable()
export class UserService {
  constructor(
    private readonly userRepository: UserRepository,
  ) {}

  /**
   * 1. TẠO TÀI KHOẢN NGƯỜI DÙNG
   * Tác nhân: Quản trị viên
   * Kiểm tra email trùng, hash mật khẩu, lưu vào DB
   */
  async createUser(createUserDto: CreateUserDto): Promise<User> {
    const { email, password, role } = createUserDto;

    // Rule 1: Kiểm tra email đã tồn tại trong hệ thống chưa
    const existingUser = await this.userRepository.findByEmail(email);
    if (existingUser) {
      throw new ConflictException(`Email ${email} đã được sử dụng trong hệ thống.`);
    }

    // Rule 2: Xử lý mật khẩu
    let passwordHash: string | undefined = undefined;
    if (password) {
      // Mã hóa mật khẩu với độ an toàn (salt rounds) là 10
      passwordHash = await bcrypt.hash(password, 10);
    } else if (role === UserRole.ADMIN) {
      // Ví dụ nghiệp vụ: Bắt buộc Admin phải có mật khẩu khi tạo
      throw new BadRequestException('Tài khoản Quản trị viên bắt buộc phải có mật khẩu khởi tạo.');
    }

    return await this.userRepository.createUser({
      email,
      passwordHash,
      role,
      isActive: true, // Mặc định tài khoản mới tạo là active
    });
  }

  /**
   * 2. GÁN VAI TRÒ CHO NGƯỜI DÙNG
   * Tác nhân: Quản trị viên
   */
  async assignRole(targetUserId: string, newRole: UserRole): Promise<User> {
    if (!Object.values(UserRole).includes(newRole)) {
      throw new BadRequestException(`Vai trò ${newRole} không hợp lệ.`);
    }
    // Repository đã lo việc quăng lỗi NotFoundException nếu targetUserId không tồn tại
    return await this.userRepository.assignRole(targetUserId, newRole);
  }

  /**
   * 3. VÔ HIỆU HÓA TÀI KHOẢN (SOFT DELETE)
   * Tác nhân: Quản trị viên
   * Set isActive = false — giữ lại lịch sử dữ liệu
   */
  async deactivateUser(targetUserId: string): Promise<User> {
    return await this.userRepository.deactivateUser(targetUserId);
  }

  /**
   * 4. TÌM KIẾM THEO EMAIL
   */
  async findUserViaEmail(email: string): Promise<User> {
    const user = await this.userRepository.findByEmail(email);
    if (!user) {
      // [FIX] Dùng UnauthorizedException (401) thay vì ConflictException (409)
      // 409 Conflict không đúng ngữ cảnh — email không tồn tại khi đăng nhập là lỗi xác thực
      throw new UnauthorizedException(`Email hoặc mật khẩu không chính xác.`);
    }
    return user;
  }

  /**
   * 5. TÌM KIẾM THEO ID
   */
  async findUserViaId(userId: string): Promise<User> {
    const result = await this.userRepository.findById(userId);
    if (!result) {
      throw new NotFoundException(`Không tìm thấy tài khoản với ID: ${userId} để xóa.`);
    }
    return result;
  }

  /**
   * 6. XÓA VĨNH VIỄN TÀI KHOẢN NGƯỜI DÙNG
   */
  async deleteUserPermanent(userId: string): Promise<void> {
    const result = await this.userRepository.permanentlyDeleteUser(userId);
    if (result.affected === 0) {
      throw new NotFoundException(`Không tìm thấy tài khoản với ID: ${userId} để xóa.`);
    }
  }

  /**
   * 7. CẬP NHẬT EMAIL
   */
  async updateEmailUser(userId: string, email: string): Promise<void | null> {
    const result = await this.userRepository.updateEmailById(userId, email);
    if (!result) {
      throw new NotFoundException(`Không tìm thấy tài khoản với ID: ${userId}.`);
    }
  }

  /**
   * 8. CẬP NHẬT TRẠNG THÁI TÀI KHOẢN
   * ✅ FIX: AccountStatus.SUSPENDED → AccountStatus.BANNED
   *         DB enum account_status chỉ có: 'active' | 'inactive' | 'banned'
   *         Không có 'suspended' — dùng SUSPENDED sẽ gây lỗi runtime
   */
  async updateStatus(id: string, status: AccountStatus): Promise<User> {
    // ✅ FIX: SUSPENDED không tồn tại → so sánh với BANNED và INACTIVE
    const isActivate = status === AccountStatus.ACTIVE;

    const user = await this.userRepository.updateStatus(id, isActivate);
    if (!user) {
      throw new NotFoundException(`Người dùng với ID ${id} không tồn tại.`);
    }
    return user;
  }

  async getSystemStats() {
    return this.userRepository.getSystemStats();
  }

  async getUsersForAdminView(): Promise<
    Pick<User, 'id' | 'email' | 'role' | 'isActive' | 'createdAt'>[]
  > {
    return this.userRepository.findAllForAdminView();
  }

  async updatePasswordHash(userId: string, passwordHash: string): Promise<User> {
    const user = await this.userRepository.updatePasswordHashById(userId, passwordHash);
    if (!user) {
      throw new NotFoundException(`Không tìm thấy tài khoản với ID: ${userId}.`);
    }
    return user;
  }
}