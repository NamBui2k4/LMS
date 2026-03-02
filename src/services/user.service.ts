import { 
  Injectable, 
  ConflictException, 
  BadRequestException 
} from '@nestjs/common';
import * as bcrypt from 'bcrypt'; // Nhớ cài đặt: npm i bcrypt
import { UserRepository } from '../repository/user.repository';
import { User} from '../models/user.entity';
import { UserRole } from 'src/common/enums/role.enum';
import { NotFoundException } from '@nestjs/common';

// Định nghĩa nhanh DTO (Data Transfer Object) để nhận dữ liệu từ Controller
export interface CreateUserDto {
  email: string;
  password?: string;
  role: UserRole;
}

@Injectable()
export class UserService {
  constructor(private readonly userRepository: UserRepository) {}

  /**
   * 1. TẠO TÀI KHOẢN NGƯỜI DÙNG
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

    // Gọi Repository để lưu vào Database
    return await this.userRepository.createUser({
      email,
      passwordHash,
      role,
      isActive: true, // Mặc định tài khoản mới tạo là active
    });
  }

  /**
   * 2. GÁN VAI TRÒ CHO NGƯỜI DÙNG
   */
  async assignRole(targetUserId: string, newRole: UserRole): Promise<User> {
    // Rule nghiệp vụ (Ví dụ): Không cho phép gán vai trò không hợp lệ (nếu cần bắt chặt hơn enum)
    if (!Object.values(UserRole).includes(newRole)) {
      throw new BadRequestException(`Vai trò ${newRole} không hợp lệ.`);
    }

    // Repository đã lo việc quăng lỗi NotFoundException nếu targetUserId không tồn tại
    return await this.userRepository.assignRole(targetUserId, newRole);
  }

  /**
   * 3. VÔ HIỆU HÓA TÀI KHOẢN
   */
  async deactivateUser(targetUserId: string): Promise<User> {
    // Gọi Repository để set isActive = false
    // Tương tự, nếu không tìm thấy user, Repo sẽ tự ném lỗi NotFoundException
    return await this.userRepository.deactivateUser(targetUserId);
  }

  /**
   * 4. TÌM KIẾM THEO EMAIL
   */
  async findUserViaEmail(email: string): Promise<User> {
    const user = await this.userRepository.findByEmail(email);
    if (!user){
      throw new ConflictException(`Người dùng không tồn tại trong hệ thống.`);
    }
    return user
  }
  

  /**
   * 5. TÌM KIẾM THEO id
   */
  async findUserViaId(email: string): Promise<User> {
    return await this.userRepository.findById(email);
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

}