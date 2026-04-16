import { 
  Controller, 
  Post, 
  Body, 
  Patch, 
  Param, 
  HttpCode, 
  HttpStatus, 
  UseGuards,
  Get, 
  Query
} from '@nestjs/common';
import { UserService } from 'src/services/user.service';
import { CreateUserDto, AssignRoleDto, UserResponseDto } from 'src/dto/user.dto';
import { JwtAuthGuard } from 'src/auth/guard/jwt-auth.guard';
import { RolesGuard } from 'src/auth/guard/roles.guard';
import { Roles } from 'src/auth/decorators/roles.decorator';
import { UserRole } from 'src/common/enums/role.enum';

// @UseGuards(JwtAuthGuard, RolesGuard): Yêu cầu phải đăng nhập và qua vòng kiểm tra Role
// @Roles(UserRole.ADMIN): Chỉ Role ADMIN mới được chui vào Controller này
@Controller('api/v1/users')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.ADMIN)
export class UserController {
  constructor(private readonly userService: UserService) {}

  /**
   * 1. TẠO TÀI KHOẢN NGƯỜI DÙNG
   * POST /api/v1/users
   */
  @Post()
  @HttpCode(HttpStatus.CREATED) // Trả về HTTP 201 Created
  async createUser(@Body() createUserDto: CreateUserDto): Promise<UserResponseDto> {
    // Controller nhận DTO đã được class-validator xác thực
    const newUser = await this.userService.createUser(createUserDto);
    
    // Map Entity ra Response DTO trước khi trả về
    return UserResponseDto.fromEntity(newUser);
  }
   
  /**
   * 2. GÁN VAI TRÒ CHO NGƯỜI DÙNG
   * PATCH /api/v1/users/:id/role
   */
  @Patch(':id/role')
  @HttpCode(HttpStatus.OK) // Trả về HTTP 200 OK
  async assignRole(
    @Param('id') userId: string,
    @Body() assignRoleDto: AssignRoleDto,
  ): Promise<UserResponseDto> {
    const updatedUser = await this.userService.assignRole(userId, assignRoleDto.role);
    return UserResponseDto.fromEntity(updatedUser);
  }

  /**
   * 3. VÔ HIỆU HÓA TÀI KHOẢN
   * PATCH /api/v1/users/:id/deactivate
   * (Dùng PATCH hợp lý hơn DELETE vì chúng ta đang làm Soft Delete)
   */
  @Patch(':id/deactivate')
  @HttpCode(HttpStatus.OK)
  async deactivateUser(@Param('id') userId: string): Promise<UserResponseDto> {
    const deactivatedUser = await this.userService.deactivateUser(userId);
    return UserResponseDto.fromEntity(deactivatedUser);
  }

  /**
   * 4. TÌM KIẾM THEO EMAIL
   * GET /api/v1/users/search?email=...
   */
  @Get('search')
  @HttpCode(HttpStatus.OK)
  async findUserByEmail(
    // Dùng @Query để lấy tham số email từ URL ?email=...
    @Query('email') email: string,
  ): Promise<UserResponseDto> {
    
    const user = await this.userService.findUserViaEmail(email);
    return UserResponseDto.fromEntity(user);
  }

  @Get('stats')
  @HttpCode(HttpStatus.OK)
  async getStats() {
    const data = await this.userService.getSystemStats();
    return { data };
  }

  /**
   * 5. TÌM KIẾM THEO ID
   * GET /api/v1/users/{id}
   */
  @Get(':id')
  @HttpCode(HttpStatus.OK)
  async findUserById(@Param('id') userId: string): Promise<UserResponseDto> {
    
    const user = await this.userService.findUserViaId(userId);
    return UserResponseDto.fromEntity(user);
  }
}