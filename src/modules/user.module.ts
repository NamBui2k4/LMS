// src/modules/user/user.module.ts

import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

// Entities
import { User } from '../models/user.entity';

// Controllers
import { UserController } from '../controller/user.controller';

// Services
import { UserService } from '../services/user.service';

// Repositories
import { UserRepository } from '../repository/user.repository';

@Module({
  imports: [TypeOrmModule.forFeature([User])],
  controllers: [UserController],
  providers: [UserService, UserRepository],
  exports: [UserService, UserRepository, ], // Export cho modules khác nếu cần
})
export class UserModule {}