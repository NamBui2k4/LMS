// src/modules/lecturer/lecturer.module.ts

import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

// Entities
import { Lecturer } from '../models/lecturers.entity';
import { User } from '../models/user.entity';
import { Courses } from '../models/courses.entity';
import { AssignedLecturers } from '../models/assigned-lecturers.entity';

// Controllers
import { LecturerController } from '../controller/lecturer.controller';

// Services
import { LecturerService } from '../services/lecturer.service';

// Repositories
import { LecturerRepository } from '../repository/lecturer.repository';
import { UserModule } from './user.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Lecturer, User, Courses, AssignedLecturers]),
    UserModule
  ],
  controllers: [LecturerController],
  providers: [LecturerService, LecturerRepository],
  exports: [LecturerService, LecturerRepository],
})
export class LecturerModule { }