import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AssignedLecturersController } from '../controller/assign-lecturers.controller';
import { AssignedLecturersService } from '../services/assigned-lecturers.service';
import { AssignedLecturersRepository } from '../repository/assigned-lecturers.repository';
import { AssignedLecturers } from '../models/assigned-lecturers.entity';
import { CourseModule } from './course.module';
import { LecturerModule } from './lecturer.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([AssignedLecturers]),
    CourseModule,
    LecturerModule,
  ],
  controllers: [AssignedLecturersController],
  providers: [AssignedLecturersService, AssignedLecturersRepository],
  exports: [AssignedLecturersService, AssignedLecturersRepository],
})
export class AssignedLecturersModule {}
