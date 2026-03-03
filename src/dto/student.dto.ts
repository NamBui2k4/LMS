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
  fullname?: string;
  email?: string;
  phone?: string;
  avatarUrl?: string;
}