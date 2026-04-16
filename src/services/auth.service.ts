import {
  Injectable,
  UnauthorizedException,
  ConflictException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { UserService } from './user.service';
import { StudentRepository } from '../repository/student.repository';
import * as bcrypt from 'bcrypt';

// User entity (user.entity.ts) có đúng các field sau — KHÔNG có `status`:
//   id, email, passwordHash?, googleId?, role, isActive
//   lastLoginAt?, failedLoginAttempts, lockedUntil?, createdAt, updatedAt

@Injectable()
export class AuthService {
  constructor(
    private readonly userService: UserService,
    private readonly jwtService: JwtService,
    private readonly studentRepo: StudentRepository,
  ) {}

  // ─── 1. Validate đăng nhập ─────────────────────────────────────────────────
  async validateUser(email: string, pass: string): Promise<any> {
    const user = await this.userService.findUserViaEmail(email);

    if (!user.passwordHash) {
      throw new UnauthorizedException(
        'Tài khoản này không sử dụng đăng nhập bằng mật khẩu.',
      );
    }

    const isMatch = await bcrypt.compare(pass, user.passwordHash);
    if (!isMatch) {
      throw new UnauthorizedException('Email hoặc mật khẩu không chính xác.');
    }

    return user; // trả về full User entity
  }

  // ─── 2. Đăng ký Student ────────────────────────────────────────────────────
  async register(dto: {
    fullname: string;
    email: string;
    password: string;
    phone?: string;
    mssv?: string;
    khoa?: string;
    nganh?: string;
    diaChi?: string;
    studentCode?: string;
    faculty?: string;
    major?: string;
    address?: string;
  }) {
    // Kiểm tra email tồn tại
    const existing = await this.userService
      .findUserViaEmail(dto.email)
      .catch(() => null);
    if (existing) {
      throw new ConflictException('Email này đã được sử dụng.');
    }

    // Hash password
    const passwordHash = await bcrypt.hash(dto.password, 10);

    // Tạo user + student trong 1 transaction
    // Trả về { user: CreatedUserData, student: Student }
    //   - user    → chứa: id, email, passwordHash, role, isActive,
    //               failedLoginAttempts, lockedUntil, lastLoginAt, createdAt, updatedAt
    //   - student → chứa: userId, fullname, email, phone, status (AccountStatus)
    const { user, student } = await this.studentRepo.createWithTransaction({
      fullname: dto.fullname,
      email: dto.email,
      passwordHash,
      phone: dto.phone,
      mssv: dto.mssv ?? dto.studentCode,
      khoa: dto.khoa ?? dto.faculty,
      nganh: dto.nganh ?? dto.major,
      diaChi: dto.diaChi ?? dto.address,
    });

    // Tạo token
    const { accessToken, refreshToken } = this.signTokens(
      user.id,
      user.email,
      user.role,
    );

    // Build userData dùng helper chung
    // status lấy từ student vì User entity không có field này
    const userData = this.buildUserData(user, student.status);

    return {
      accessToken,
      message: 'Đăng ký tài khoản thành công',
      data: userData,
    };
  }

  // ─── 3. Login — trả về userData đầy đủ như register ──────────────────────
  // Được gọi từ controller sau khi validateUser thành công.
  // validateUser trả về full User entity → có đủ security fields.
  // Query thêm student để lấy status (field này thuộc Student entity).
  async loginAndBuildResponse(user: any): Promise<{
    accessToken: string;
    refreshToken: string;
    message: string;
    data: Record<string, any>;
  }> {
    const { accessToken, refreshToken } = this.signTokens(
      user.id,
      user.email,
      user.role,
    );

    // Query Student để lấy status
    // findByEmail trả về null nếu không tìm thấy → dùng fallback 'ACTIVE'
    const student = await this.studentRepo.findByEmail(user.email);

    const userData = this.buildUserData(user, student?.status);

    return {
      accessToken,
      refreshToken,
      message: 'Đăng nhập thành công',
      data: userData,
    };
  }

  // ─── 4. Tạo cặp Access + Refresh Token ────────────────────────────────────
  // Giữ nguyên signature để tương thích với các nơi khác đang gọi.
  // userData trả về tối giản vì param chỉ có {id, email, role}.
  // → Controller login nên dùng loginAndBuildResponse thay thế.
  async generateTokens(user: {
    id: number;
    email: string;
    role: string;
  }): Promise<{
    accessToken: string;
    refreshToken: string;
    userData: Record<string, any>;
  }> {
    const { accessToken, refreshToken } = this.signTokens(
      user.id,
      user.email,
      user.role,
    );

    const userData = {
      id: String(user.id),
      email: user.email,
      role: user.role,
    };

    return { accessToken, refreshToken, userData };
  }

  // ─── 5. Refresh Token ──────────────────────────────────────────────────────
  async refresh(refreshToken: string) {
    try {
      const payload = this.jwtService.verify(refreshToken);
      const user = await this.userService.findUserViaEmail(payload.email);
      if (!user) {
        throw new UnauthorizedException('User không tồn tại');
      }
      const { accessToken, refreshToken: newRefreshToken } = this.signTokens(
        user.id,
        user.email,
        user.role,
      );
      return { accessToken, refreshToken: newRefreshToken };
    } catch {
      throw new UnauthorizedException(
        'Refresh token không hợp lệ hoặc đã hết hạn',
      );
    }
  }

  // ─── Private helpers ───────────────────────────────────────────────────────

  // Ký cặp token — dùng chung cho register, login, refresh
  private signTokens(id: number, email: string, role: string) {
    const accessTokenExp = role === 'STUDENT' ? '4h' : '1h';
    const refreshTokenExp = role === 'STUDENT' ? '30d' : '14d';
    const payload = { email, sub: Number(id), role };
    return {
      accessToken: this.jwtService.sign(payload, {
        expiresIn: accessTokenExp as any,
      }),
      refreshToken: this.jwtService.sign(payload, {
        expiresIn: refreshTokenExp as any,
      }),
    };
  }

  // Build userData shape thống nhất — dùng chung cho register và login
  // user  : CreatedUserData (register) hoặc User entity (login)
  // status: từ Student entity — không có trên User entity
  private buildUserData(user: any, status?: string): Record<string, any> {
    return {
      id: String(user.id),
      email: user.email,
      passwordHash: user.passwordHash,
      role: user.role,
      status: status ?? 'ACTIVE',
      isActive: user.isActive,
      failedLoginAttempts: user.failedLoginAttempts,
      lockedUntil: user.lockedUntil ?? null,
      lastLoginAt: user.lastLoginAt ?? null,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
    };
  }
}