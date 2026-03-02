import { IsEmail, IsEnum, IsNotEmpty, IsOptional, IsString, MinLength } from 'class-validator';
import { UserRole } from '../common/enums/role.enum';

// ==========================================
// INPUT DTOs (Dữ liệu Client gửi lên)
// ==========================================

export class CreateUserDto {
  @IsEmail({}, { message: 'Email không đúng định dạng' })
  @IsNotEmpty({ message: 'Email không được để trống' })
  email: string;

  @IsString()
  @MinLength(6, { message: 'Mật khẩu phải có ít nhất 6 ký tự' })
  @IsOptional() // Có thể null (nếu đăng nhập qua Google hoặc tự generate)
  password?: string;

  @IsEnum(UserRole, { message: 'Vai trò không hợp lệ' })
  @IsNotEmpty({ message: 'Phải chỉ định vai trò cho người dùng' })
  role: UserRole;
}

export class AssignRoleDto {
  @IsEnum(UserRole, { message: 'Vai trò không hợp lệ' })
  @IsNotEmpty({ message: 'Vai trò không được để trống' })
  role: UserRole;
}

// ==========================================
// OUTPUT DTOs (Dữ liệu trả về Client)
// ==========================================

export class UserResponseDto {
  id: string;
  email: string;
  role: UserRole;
  isActive: boolean;
  lastLoginAt: Date | null;
  createdAt: Date;

  // Hàm mapper (Factory method) để chuyển từ Entity -> DTO an toàn
  // Che giấu đi passwordHash, googleId, failedLoginAttempts...
  static fromEntity(user: any): UserResponseDto {
    const dto = new UserResponseDto();
    dto.id = user.id;
    dto.email = user.email;
    dto.role = user.role;
    dto.isActive = user.isActive;
    dto.lastLoginAt = user.lastLoginAt;
    dto.createdAt = user.createdAt;
    return dto;
  }
}