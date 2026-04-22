import {
  IsEmail,
  IsNotEmpty,
  IsOptional,
  IsString,
  MinLength,
} from 'class-validator';

/**
 * DTO cho POST /api/v1/auth/register
 *
 * Không dùng @Transform ở đây vì class-transformer transform
 * plain object TRƯỚC khi gán — key "confirmpassword" đã không
 * match property "confirmPassword" nên obj[key] luôn undefined.
 *
 * Thay vào đó, normalize key được thực hiện trong controller
 * trước khi NestJS bind vào DTO này.
 */
export class RegisterDto {
  @IsNotEmpty({ message: 'Họ tên không được để trống.' })
  @IsString()
  fullname: string;

  @IsEmail({}, { message: 'Email không đúng định dạng.' })
  @IsNotEmpty({ message: 'Email không được để trống.' })
  email: string;

  @IsNotEmpty({ message: 'Mật khẩu không được để trống.' })
  @IsString()
  @MinLength(6, { message: 'Mật khẩu phải có ít nhất 6 ký tự.' })
  password: string;

  @IsNotEmpty({ message: 'Mật khẩu xác nhận không được để trống.' })
  @IsString()
  confirmPassword: string;

  @IsOptional()
  @IsString()
  phone?: string;

  // Legacy aliases (backward-compatible)
  @IsOptional()
  @IsString()
  mssv?: string;

  @IsOptional()
  @IsString()
  khoa?: string;

  @IsOptional()
  @IsString()
  nganh?: string;

  @IsOptional()
  @IsString()
  diaChi?: string;

  // Preferred naming (modern schema)
  @IsOptional()
  @IsString()
  studentCode?: string;

  @IsOptional()
  @IsString()
  faculty?: string;

  @IsOptional()
  @IsString()
  major?: string;

  @IsOptional()
  @IsString()
  address?: string;
}