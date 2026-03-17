import { Controller, Post, Body, HttpCode, HttpStatus, Res, Req } from '@nestjs/common';
import { type Response, type Request } from 'express';
import { AuthService } from '../services/auth.service';
import { UnauthorizedException } from '@nestjs/common';

@Controller('api/v1/auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  // ✅ THÊM: Đăng ký Student
  @Post('register')
  @HttpCode(HttpStatus.CREATED)
  async register(
    @Body() dto: {
      fullname: string;
      email: string;
      password: string;
      phone?: string;
    },
  ) {
    return this.authService.register(dto);
  }

  // ✅ FIX: Xóa duplicate @Post('login') và @HttpCode
  @Post('login')
  @HttpCode(HttpStatus.OK)
  async login(
    @Body() loginDto: any,
    @Res({ passthrough: true }) response: Response,
  ) {
    const user = await this.authService.validateUser(loginDto.email, loginDto.password);
    const { accessToken, refreshToken } = await this.authService.generateTokens(user);

    response.cookie('refreshToken', refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production', // ✅ FIX: false ở dev → test Postman được
      sameSite: 'strict',
      maxAge: 30 * 24 * 60 * 60 * 1000,
    });

    return { accessToken };
  }

  @Post('refresh')
  async refreshToken(@Req() request: Request) {
    const authHeader = request.headers.authorization;
    if (!authHeader) {
      throw new UnauthorizedException('Không tìm thấy token');
    }
    const refreshToken = authHeader.split(' ')[1];
    return this.authService.refresh(refreshToken);
  }
}