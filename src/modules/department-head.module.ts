// src/modules/department-head/department-head.module.ts

import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

// Entities
import { DepartmentHead } from '../models/department-heads.entity';
import { User } from '../models/user.entity';

// Services
import { DepartmentHeadService } from '../services/department-heads.service';
import { DepartmentHeadController } from '../controller/department-heads.controller';

// Repositories
import { DepartmentHeadRepository } from '../repository/department-heads.repository';
import { LecturerModule } from './lecturer.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([DepartmentHead, User]),
    LecturerModule
  ],
  controllers: [DepartmentHeadController],
  providers: [DepartmentHeadService, DepartmentHeadRepository],
  exports: [DepartmentHeadService, DepartmentHeadRepository],
})
export class DepartmentHeadModule {}