import { Controller, Post, Body, HttpCode, HttpStatus, Res, Req } from '@nestjs/common';
import { type Response, type Request } from 'express'; // <-- NHẬP ĐÚNG TỪ EXPRESS
import { AuthService } from '../services/auth.service';
import { UnauthorizedException } from '@nestjs/common';

@Controller('api/v1/auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('login')
  @HttpCode(HttpStatus.OK)
  @Post('login')
  @HttpCode(HttpStatus.OK)
  async login(@Body() loginDto: any, @Res({ passthrough: true }) response: Response) {
    const user = await this.authService.validateUser(loginDto.email, loginDto.password);
    const { accessToken, refreshToken } = await this.authService.generateTokens(user);

    // Ép kiểu response về Response của express để nhận diện hàm .cookie()
    const expressResponse = response as Response; 

    expressResponse.cookie('refreshToken', refreshToken, {
      httpOnly: true, // Bảo mật XSS
      secure: true,   // Chỉ gửi qua HTTPS
      sameSite: 'strict', // Chống CSRF
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 ngày
    });

    return { accessToken }; // Chỉ trả về access token ở body
  }

  @Post('refresh')
  async refreshToken(@Req() request: Request) {
    // Lấy token từ header "Authorization: Bearer <token>"
    const authHeader = request.headers.authorization;
    if (!authHeader) {
      throw new UnauthorizedException('Không tìm thấy token');
    }
    const refreshToken = authHeader.split(' ')[1]; // Lấy phần token sau chữ 'Bearer'
    
    return this.authService.refresh(refreshToken);
  }
}