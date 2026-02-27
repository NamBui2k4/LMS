// src/dtos/student/create-student.dto.ts
import {
  IsEmail,
  IsNotEmpty,
  IsOptional,
  IsString,
  Length,
  Matches,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateStudentDto {
  @ApiProperty({ example: 'Nguyễn Văn A', description: 'Họ và tên đầy đủ' })
  @IsNotEmpty({ message: 'Họ tên không được để trống' })
  @IsString()
  @Length(2, 150, { message: 'Họ tên phải từ 2 đến 150 ký tự' })
  fullname: string;

  @ApiProperty({ example: 'sinhvien@example.com' })
  @IsNotEmpty({ message: 'Email không được để trống' })
  @IsEmail({}, { message: 'Email không hợp lệ' })
  email: string;

  @ApiProperty({ example: 'Password@123', description: 'Mật khẩu (min 8 ký tự)' })
  @IsNotEmpty({ message: 'Mật khẩu không được để trống' })
  @Length(8, 255, { message: 'Mật khẩu phải có ít nhất 8 ký tự' })
  @Matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/, {
    message: 'Mật khẩu phải chứa chữ hoa, chữ thường và số',
  })
  password: string;

  @ApiPropertyOptional({ example: '0912345678' })
  @IsOptional()
  @IsString()
  @Length(9, 20)
  phone?: string;

  @ApiPropertyOptional({ example: 'https://example.com/avatar.jpg' })
  @IsOptional()
  @IsString()
  avatarUrl?: string;
}