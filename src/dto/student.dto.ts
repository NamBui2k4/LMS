import { IsEmail, IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class CreateStudentDto{
  @IsNotEmpty()
  @IsString()
  fullname: string;

  @IsEmail()
  @IsNotEmpty()
  email: string;

  @IsOptional()
  @IsString()
  phone?: string;

  @IsOptional()
  @IsString()
  password?: string; // plain text, sẽ hash sau
}

export class UpdateStudentDto {
  @IsOptional()
  @IsString()
  fullname?: string;

  @IsOptional()
  @IsEmail()
  email?: string;

  @IsOptional()
  @IsString()
  phone?: string;

  @IsOptional()
  @IsString()
  avatarUrl?: string;

  // Schema A: mssv, khoa, nganh, dia_chi
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

  // Schema B: student_code, faculty, major, address
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