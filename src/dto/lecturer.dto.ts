import { 
  IsEmail, IsNotEmpty, IsOptional, IsString, 
  IsEnum, MaxLength, IsUrl, MinLength 
} from 'class-validator';import { AccountStatus } from '../common/enums/account-status.enum';

/**
 * DTO dùng cho việc cập nhật thông tin giảng viên
 * Tương ứng với chức năng: "Cập nhật trình độ/Chuyên môn" và "Cập nhật thông tin cá nhân"
 */
export class UpdateLecturerDto {
  @IsOptional()
  @IsString()
  @MaxLength(150)
  fullname?: string;

  @IsOptional()
  @IsEmail({}, { message: 'Email không đúng định dạng.' })
  @MaxLength(255)
  email?: string;

  @IsOptional()
  @IsString()
  @MaxLength(20)
  phone?: string;

  @IsOptional()
  @IsUrl({}, { message: 'Avatar URL phải là một đường dẫn hợp lệ.' })
  @IsString()
  avatarUrl?: string;

  @IsOptional()
  @IsString()
  bio?: string;

  @IsOptional()
  @IsString()
  @MaxLength(50)
  academicDegree?: string; // Học vị (Thạc sĩ, Tiến sĩ...)

  @IsOptional()
  @IsString()
  @MaxLength(150)
  subject?: string; // Bộ môn giảng dạy

  @IsOptional()
  @IsString()
  @MaxLength(150)
  department?: string; // Khoa/Phòng ban

  @IsOptional()
  @IsEnum(AccountStatus)
  status?: AccountStatus;
}

/**
 * DTO dùng để trả về dữ liệu (Response) 
 * Giúp ẩn các thông tin nhạy cảm như passwordHash
 */
export class LecturerResponseDto {
  id: number;
  fullname: string;
  email: string;
  phone?: string;
  avatarUrl?: string;
  bio?: string;
  academicDegree?: string;
  subject?: string;
  department?: string;
  status: AccountStatus;
  createdAt: Date;
  updatedAt: Date;

  // Static method để map từ Entity sang DTO nhanh chóng
  static fromEntity(entity: any): LecturerResponseDto {
    const dto = new LecturerResponseDto();
    dto.id = Number(entity.userId);        
    dto.fullname = entity.fullname;
    dto.email = entity.email;
    dto.phone = entity.phone;
    dto.avatarUrl = entity.avatarUrl;
    dto.bio = entity.bio;
    dto.academicDegree = entity.academicDegree;
    dto.subject = entity.subject;
    dto.department = entity.department;
    dto.status = entity.status;
    dto.createdAt = entity.createdAt;
    dto.updatedAt = entity.updatedAt;
    return dto;
  }
}

// Thêm vào cuối file lecturer.dto.ts

export class CreateLecturerDto {
  @IsNotEmpty({ message: 'Họ tên không được để trống.' })
  @IsString()
  @MaxLength(150)
  fullname: string;

  @IsEmail({}, { message: 'Email không đúng định dạng.' })
  @IsNotEmpty()
  email: string;

  @IsNotEmpty({ message: 'Mật khẩu không được để trống.' })
  @IsString()
  @MinLength(6, { message: 'Mật khẩu phải có ít nhất 6 ký tự.' })
  password: string;

  @IsOptional()
  @IsString()
  @MaxLength(20)
  phone?: string;

  @IsOptional()
  @IsString()
  @MaxLength(50)
  academicDegree?: string;

  @IsOptional()
  @IsString()
  @MaxLength(150)
  subject?: string;

  @IsOptional()
  @IsString()
  @MaxLength(150)
  department?: string;
}