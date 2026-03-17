import { Injectable, UnauthorizedException, ConflictException } from '@nestjs/common'; // ✅ thêm ConflictException
import { JwtService } from '@nestjs/jwt';
import { UserService } from './user.service';
import { StudentRepository } from '../repository/student.repository'; // ✅ thêm
import * as bcrypt from 'bcrypt';

@Injectable()
export class AuthService {

  constructor(
    private readonly userService: UserService,
    private readonly jwtService: JwtService,
    private readonly studentRepo: StudentRepository, // ✅ inject thêm
  ) {}

  // 1. Kiểm tra đăng nhập
  async validateUser(email: string, pass: string): Promise<any> {
    const user = await this.userService.findUserViaEmail(email);

    if (!user.passwordHash) {
      throw new UnauthorizedException('Tài khoản này không sử dụng đăng nhập bằng mật khẩu.');
    }

    const isMatch = await bcrypt.compare(pass, user.passwordHash);

    if (user && isMatch) {
      const { passwordHash, ...result } = user;
      return result;
    }
    throw new UnauthorizedException('Email hoặc mật khẩu không chính xác.');
  }

  // 2. Đăng ký Student ✅ THÊM MỚI
  async register(dto: {
    fullname: string;
    email: string;
    password: string;
    phone?: string;
  }) {
    // 1. Kiểm tra email đã tồn tại chưa
    // findUserViaEmail throw ConflictException nếu không tìm thấy
    // nên dùng catch để chuyển "không tìm thấy" → null
    const existing = await this.userService
      .findUserViaEmail(dto.email)
      .catch(() => null);

    if (existing) {
      throw new ConflictException('Email này đã được sử dụng.');
    }

    // 2. Hash password
    const passwordHash = await bcrypt.hash(dto.password, 10);

    // 3. Tạo user + student trong 1 transaction
    const student = await this.studentRepo.createWithTransaction({
      fullname: dto.fullname,
      email: dto.email,
      passwordHash,
      phone: dto.phone,
    });

    // 4. Auto login — trả về token ngay sau khi đăng ký
    return this.generateTokens({
      id: student.userId, // ✅ userId là PK của student
      email: student.email,
      role: 'STUDENT',
    });
  }

  // 3. Tạo JWT Token đơn giản (login flow cũ)
  async login(user: any) {
    const payload = {
      email: user.email,
      sub: Number(user.id), // ✅ đảm bảo number
      role: user.role,
    };
    return {
      accessToken: this.jwtService.sign(payload), // ✅ fix: accesstoken → accessToken
    };
  }

  // 4. Tạo cặp Access + Refresh Token
  async generateTokens(user: any) {
    let accessTokenExp = '1h';
    let refreshTokenExp = '14d';

    if (user.role === 'STUDENT') {
      accessTokenExp = '4h';
      refreshTokenExp = '30d';
    }

    const payload = {
      email: user.email,
      sub: Number(user.id), // ✅ đảm bảo number
      role: user.role,
    };

    const accessToken = this.jwtService.sign(payload, {
      expiresIn: accessTokenExp as any,
    });

    const refreshToken = this.jwtService.sign(payload, {
      expiresIn: refreshTokenExp as any,
    });

    return { accessToken, refreshToken };
  }

  // 5. Refresh Token
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