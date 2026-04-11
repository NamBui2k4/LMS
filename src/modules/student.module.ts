// src/modules/student/student.module.ts

import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

// Entities
import { Student } from '../models/student.entity';
import { User } from '../models/user.entity';
import { Enrollment } from '../models/enrollment.entity';
import { Submission } from '../models/submission.entity';

// Controllers
import { StudentController } from '../controller/student.controller';

// Services
import { StudentService } from '../services/student.service';

// Repositories
import { StudentRepository } from '../repository/student.repository';
import { UserModule } from './user.module';             // ← THÊM DÒNG NÀY

@Module({
  imports: [
    TypeOrmModule.forFeature([Student, User, Enrollment, Submission]),
    UserModule,
  ],
  controllers: [StudentController],
  providers: [StudentService, StudentRepository],
  exports: [StudentService, StudentRepository],
})
export class StudentModule {}