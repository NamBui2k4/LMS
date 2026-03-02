import { SetMetadata } from '@nestjs/common';
import { UserRole } from 'src/common/enums/role.enum';

// Từ khóa để lấy metadata ra sau này
export const ROLES_KEY = 'roles';

// Decorator nhận vào một mảng các UserRole và gán vào metadata của route
export const Roles = (...roles: UserRole[]) => SetMetadata(ROLES_KEY, roles);