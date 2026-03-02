import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { UserService } from './user.service'; // Đường dẫn tới UserService của bạn
import * as bcrypt from 'bcrypt';

@Injectable()
export class AuthService {
  constructor(
    private readonly userService: UserService,
    private readonly jwtService: JwtService,
  ) {}

  // 1. Kiểm tra đăng nhập
  async validateUser(email: string, pass: string): Promise<any> {
    const user = await this.userService.findUserViaEmail(email);

    // So sánh mật khẩu băm
    const isMatch = await bcrypt.compare(pass, user.passwordHash);
    if (user && isMatch) {
      const { passwordHash, ...result } = user;
      return result;
    }
    throw new UnauthorizedException('Email hoặc mật khẩu không chính xác.');
  }

  // 2. Tạo JWT Token
  async login(user: any) {
    const payload = { 
      email: user.email, 
      sub: user.id, 
      role: user.role 
    };
    return {
      access_token: this.jwtService.sign(payload),
    };
  }

  async generateTokens(user: any) {
    const payload = { email: user.email, sub: user.id, role: user.role };
    
    // Access Token: Ngắn hạn (ví dụ: 15 phút)
    const accessToken = this.jwtService.sign(payload, { expiresIn: '15m' });
    
    // Refresh Token: Dài hạn (ví dụ: 7 ngày)
    const refreshToken = this.jwtService.sign(payload, { expiresIn: '7d' });

    return {
      accessToken,
      refreshToken,
    };
  }

  // 4. Logic Refresh Token
  async refresh(refreshToken: string) {
    try {
      // Xác thực Refresh Token
      const payload = this.jwtService.verify(refreshToken);
      const user = await this.userService.findUserViaEmail(payload.email);
      
      if (!user) {
        throw new UnauthorizedException('User không tồn tại');
      }

      // Tạo cặp token mới
      return this.generateTokens(user);
    } catch (e) {
      throw new UnauthorizedException('Refresh token không hợp lệ hoặc đã hết hạn');
    }
  }
}