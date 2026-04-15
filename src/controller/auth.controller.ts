import {
  Controller,
  Post,
  Get,
  Body,
  HttpCode,
  HttpStatus,
  Res,
  Req,
  BadRequestException,
  UnauthorizedException,
} from '@nestjs/common';
import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';
import { type Response, type Request } from 'express';
import { AuthService } from '../services/auth.service';
import { RegisterDto } from '../dto/register.dto';

@Controller('api/v1/auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  /**
   * POST /api/v1/auth/register
   *
   * Nhận @Body() dạng Record<string, any> (raw body) để tự normalize
   * trước khi validate — tránh vấn đề @Transform không map được
   * khi key của client không khớp chính xác với property name của DTO.
   *
   * Flow:
   *   1. Nhận raw body
   *   2. Normalize: gán confirmPassword từ bất kỳ key variant nào
   *   3. plainToInstance → DTO instance
   *   4. validate → throw nếu có lỗi
   *   5. So sánh password === confirmPassword
   *   6. Gọi service
   */
  @Post('register')
  @HttpCode(HttpStatus.CREATED)
  async register(@Body() body: Record<string, any>) {
    // Bước 1: Normalize key trước khi bind vào DTO
    // Client có thể gửi: "confirmPassword", "confirmpassword", "confirm_password"
    // → chuẩn hóa tất cả về "confirmPassword"
    const normalizedBody = {
      ...body,
      confirmPassword:
        body['confirmPassword'] ??      // camelCase — chuẩn
        body['confirmpassword'] ??      // lowercase  ← Postman trong ảnh
        body['confirm_password'],       // snake_case
    };

    // Bước 2: Tạo DTO instance và validate thủ công
    const dto = plainToInstance(RegisterDto, normalizedBody);
    const errors = await validate(dto);

    if (errors.length > 0) {
      const messages = errors.flatMap((e) =>
        Object.values(e.constraints ?? {}),
      );
      throw new BadRequestException(messages);
    }

    // Bước 3: So sánh password
    if (dto.password !== dto.confirmPassword) {
      throw new BadRequestException('Mật khẩu xác nhận không khớp.');
    }

    // Bước 4: Gọi service (không truyền confirmPassword)
    const { confirmPassword, ...registerDto } = dto;
    return this.authService.register(registerDto);
  }

  /**
   * POST /api/v1/auth/login
   *
   * Thay đổi so với code cũ:
   *   ❌ Cũ: gọi generateTokens(user) → userData chỉ có {id, email, role}
   *   ✅ Mới: gọi loginAndBuildResponse(user) → userData đầy đủ như register:
   *            id, email, passwordHash, role, status, isActive,
   *            failedLoginAttempts, lockedUntil, lastLoginAt, createdAt, updatedAt
   */
  @Post('login')
  @HttpCode(HttpStatus.OK)
  async login(
    @Body() loginDto: any,
    @Res({ passthrough: true }) response: Response,
  ) {
    // Bước 0: Validate Domain Email theo Portal
    if (loginDto.portal === 'student' && !loginDto.email.endsWith('@student.tdtu.edu.vn') && !loginDto.email.endsWith('@gmail.com')) {
      throw new BadRequestException('Email không thuộc tên miền người học (@student.tdtu.edu.vn hoặc @gmail.com).');
    }
    if ((loginDto.portal === 'staff' || loginDto.portal === 'lecturer') && !loginDto.email.endsWith('@lecturer.tdtu.edu.vn') && !loginDto.email.endsWith('@gmail.com')) {
      throw new BadRequestException('Email không thuộc tên miền giảng viên (@lecturer.tdtu.edu.vn hoặc @gmail.com).');
    }

    // Bước 1: validate credentials → trả về full User entity
    const user = await this.authService.validateUser(
      loginDto.email,
      loginDto.password,
    );

    // Bước 2: Kiểm tra role phù hợp với portal đang đăng nhập
    const isStudentPortal = loginDto.portal === 'student';
    const isStaffPortal   = loginDto.portal === 'staff' || loginDto.portal === 'lecturer';
    const isStudentRole   = user.role === 'STUDENT';
    const isStaffRole     = ['LECTURER', 'HEAD_OF_DEPARTMENT', 'ADMIN'].includes(user.role);

    if (isStudentPortal && !isStudentRole) {
      throw new BadRequestException(
        'Tài khoản này không phải Người học. Vui lòng đăng nhập đúng cổng.',
      );
    }
    if (isStaffPortal && !isStaffRole) {
      throw new BadRequestException(
        'Tài khoản này không phải Giảng viên - Viên chức. Vui lòng đăng nhập đúng cổng.',
      );
    }

    // Bước 3: build response đầy đủ (query thêm student.status bên trong)
    const { accessToken, refreshToken, message, data } =
      await this.authService.loginAndBuildResponse(user);

    // Bước 4: set refreshToken vào httpOnly cookie (middleware dùng để xác thực trang UI)
    response.cookie('refreshToken', refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 30 * 24 * 60 * 60 * 1000,
    });

    // Bước 5: Xác định URL redirect dựa trên role thực tế từ DB (không hardcode theo form)
    const redirectUrl = isStudentRole ? '/student/profile' : '/staff';

    return { accessToken, message, data, redirectUrl };
  }

  /**
   * POST /api/v1/auth/refresh
   */
  @Post('refresh')
  async refreshToken(@Req() request: Request) {
    const authHeader = request.headers.authorization;
    if (!authHeader) {
      throw new UnauthorizedException('Không tìm thấy token');
    }
    const refreshToken = authHeader.split(' ')[1];
    return this.authService.refresh(refreshToken);
  }

  /**
   * GET /api/v1/auth/logout
   * Xóa refreshToken cookie → người dùng sẽ bị đá ra khỏi trang nội bộ
   */
  @Get('logout')
  logout(@Res() response: Response) {
    // Xóa cookie refreshToken
    (response as any).clearCookie('refreshToken', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
    });
    
    // Redirect về trang gốc (http://localhost:3001/)
    return (response as any).redirect('/');
  }
}