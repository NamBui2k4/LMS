import { Injectable, ExecutionContext, UnauthorizedException } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {
  // Bạn có thể ghi đè hàm handleRequest nếu muốn tùy chỉnh logic bắt lỗi
  handleRequest(err: any, user: any, info: any) {
    // Nếu có lỗi giải mã token, hoặc không tìm thấy thông tin user
    if (err || !user) {
      throw err || new UnauthorizedException('Bạn chưa đăng nhập hoặc Token đã hết hạn.');
    }
    return user; // Đối tượng user này sẽ được tự động gán vào request.user
  }
}