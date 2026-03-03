import { Injectable, UnauthorizedException, BadRequestException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { UserService } from './user.service';
import * as bcrypt from 'bcrypt';
import { access } from 'fs';



@Injectable()
export class AuthService {

  constructor(
    private readonly userService: UserService,
    private readonly jwtService: JwtService,
  ) { }


  // 1. Kiểm tra đăng nhập
  async validateUser(email: string, pass: string): Promise<any> {
    const user = await this.userService.findUserViaEmail(email);
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
    let accessTokenExp = '15m';
    let refreshTokenExp = '7d';
    if (user.role === 'STUDENT') {
      accessTokenExp = '4h';
      refreshTokenExp = '30d';
    } else if (user.role === 'LECTURER') {
      accessTokenExp = '1h';
      refreshTokenExp = '14d';
    } else {
      accessTokenExp = '1h';
      refreshTokenExp = '14d';
    }

    const payload = { email: user.email, sub: user.id, role: user.role };
    // Khắc phục bằng cách ép kiểu chuỗi thời gian
    const accessToken = this.jwtService.sign(payload, {
      expiresIn: accessTokenExp as any
    });

    const refreshToken = this.jwtService.sign(payload, {
      expiresIn: refreshTokenExp as any
    });
    return {
      accessToken,
      refreshToken,
    };
  }



  // 4. Logic Refresh Token

  async refresh(refreshToken: string) {

    try {
      const payload = this.jwtService.verify(refreshToken);
      const user = await this.userService.findUserViaEmail(payload.email);
      if (!user) {
        throw new UnauthorizedException('User không tồn tại');
      }
      return this.generateTokens(user);
    } catch (e) {
      throw new UnauthorizedException('Refresh token không hợp lệ hoặc đã hết hạn');
    }

  }

}

