import { ExtractJwt, Strategy } from 'passport-jwt';
import { PassportStrategy } from '@nestjs/passport';
import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(private readonly configService: ConfigService) {
    // 1. Không cần dùng @Inject(ConfigService) vì ConfigService là một class provider 
    // NestJS tự động nhận diện được qua kiểu dữ liệu (Type-based injection).
    super({
      jwtFromRequest: ExtractJwt.fromExtractors([
        ExtractJwt.fromAuthHeaderAsBearerToken(),
        (req: any) => req?.cookies?.refreshToken,
      ]),
      ignoreExpiration: false,
      // 2. Đảm bảo biến môi trường 'JWT_SECRET' đã được định nghĩa trong file .env
      secretOrKey: configService.get<string>('JWT_SECRET') || 'mặc_định_nếu_thiếu', 
    });
  }

  // 3. Hàm validate này sẽ gán kết quả trả về vào request.user
  async validate(payload: any) {
    // Nếu bạn muốn kiểm tra user có còn tồn tại trong DB không (bảo mật hơn), 
    // bạn có thể gọi UserService tại đây.
    
    // Nếu payload thiếu thông tin, passport sẽ tự chặn lại.
    if (!payload) {
      throw new UnauthorizedException();
    }

    // Kết quả này chính là "user" mà RolesGuard sẽ kiểm tra (user.role)
    return { 
      id: Number(payload.sub), 
      email: payload.email, 
      role: payload.role 
    };
  }
}