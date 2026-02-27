// src/dtos/student/update-student.dto.ts
import { IsOptional, IsString, Length, IsEnum } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { AccountStatus } from '../../models/student.entity';

export class UpdateStudentDto {
  @ApiPropertyOptional({ example: 'Nguyễn Văn B' })
  @IsOptional()
  @IsString()
  @Length(2, 150)
  fullname?: string;

  @ApiPropertyOptional({ example: '0987654321' })
  @IsOptional()
  @IsString()
  @Length(9, 20)
  phone?: string;

  @ApiPropertyOptional({ example: 'https://example.com/new-avatar.jpg' })
  @IsOptional()
  @IsString()
  avatarUrl?: string;
}

// DTO riêng cho Admin thay đổi status
export class UpdateStudentStatusDto {
  @ApiPropertyOptional({ enum: AccountStatus })
  @IsEnum(AccountStatus, { message: 'Trạng thái không hợp lệ' })
  status: AccountStatus;
}

// DTO đổi mật khẩu (do chính học viên thực hiện)
export class ChangePasswordDto {
  @ApiPropertyOptional({ example: 'OldPassword@123' })
  @IsString()
  @Length(8, 255)
  currentPassword: string;

  @ApiPropertyOptional({ example: 'NewPassword@456' })
  @IsString()
  @Length(8, 255)
  newPassword: string;
}