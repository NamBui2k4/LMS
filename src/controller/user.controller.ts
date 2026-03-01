// src/controllers/user.controller.ts (hoặc tương tự)

import { Controller, Get, Post, Patch, Render, Body, Param, Query, Redirect, Res } from '@nestjs/common';
import { Response } from 'express';
import { UserService } from '../services/user.service';
import { CreateUserDto } from '../dto/input/user/user.create.dto';
import { AssignRoleDto } from '../dto/input/user/role.assign.dto';
import { Roles } from '../common/decorator/roles.decorator';
import { RolesGuard } from '../auth/guards/roles.guard';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { Role } from 'src/common/enums/role.enum';

@Controller('admin/users')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.ADMIN)
export class UserController {
  constructor(private readonly userService: UserService) {}

  @Get()
  @Render('admin/users/index')  // render views/admin/users/index.ejs
  async index(
    @Query('page') page: string = '1',
    @Query('limit') limit: string = '10',
    @Query('role') role?: string,
    @Query('isActive') isActive?: string,
    @Query('search') search?: string,
  ) {
    const parsedPage = parseInt(page, 10) || 1;
    const parsedLimit = parseInt(limit, 10) || 10;
    const parsedIsActive = isActive ? isActive === 'true' : undefined;

    const result = await this.userService.findAllUsers({
      page: parsedPage,
      limit: parsedLimit,
      role: role as Role | undefined,
      isActive: parsedIsActive,
      search,
    });

    return {
      users: result.data,
      pagination: {
        page: parsedPage,
        limit: parsedLimit,
        totalPages: result.totalPages,
        total: result.total,
      },
      filters: { role, isActive: parsedIsActive, search },
      // truyền thêm dữ liệu cho select role
      roles: Object.values(Role),
    };
  }

  @Post()
  @Redirect('/admin/users')  // redirect về list sau khi tạo
  async create(@Body() createUserDto: CreateUserDto) {
    await this.userService.createUser(createUserDto);
    // có thể thêm flash message nếu dùng session
  }

  @Patch(':id/role')
  @Redirect('/admin/users')
  async assignRole(@Param('id') id: string, @Body() dto: AssignRoleDto) {
    await this.userService.assignRole(+id, dto);
  }

  // Tương tự cho deactivate/activate
}