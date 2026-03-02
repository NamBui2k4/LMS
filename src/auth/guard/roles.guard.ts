import { Injectable, CanActivate, ExecutionContext } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { UserRole } from 'src/common/enums/role.enum'; // Điều chỉnh đường dẫn tới Enum UserRole của bạn

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    // 1. Lấy vai trò yêu cầu từ decorator @Roles() trên handler hoặc controller
    const requiredRoles = this.reflector.getAllAndOverride<UserRole[]>('roles', [
      context.getHandler(),
      context.getClass(),
    ]);

    // Nếu không có decorator @Roles(), nghĩa là route này không yêu cầu quyền đặc biệt
    if (!requiredRoles) {
      return true;
    }

    // 2. Lấy thông tin user từ request (đã được JwtAuthGuard gán vào request.user)
    const { user } = context.switchToHttp().getRequest();

    // 3. Kiểm tra xem user có vai trò phù hợp không
    // user.role là vai trò của user hiện tại, requiredRoles là mảng vai trò được phép
    return requiredRoles.some((role) => user.role === role);
  }
}