import { Injectable, NotFoundException, InternalServerErrorException } from '@nestjs/common';
import { LecturerRepository } from '../repository/lecturer.repository';
import { Lecturer } from '../models/lecturers.entity';
import { UpdateLecturerDto } from '../dto/lecturer.dto';

@Injectable()
export class LecturerService {
  constructor(private readonly lecturerRepo: LecturerRepository) {}

  async getAllLecturers(): Promise<Lecturer[]> {
    try {
      const lecturers = await this.lecturerRepo.findAll();
      if (!lecturers) return [];
      return lecturers;
    } catch (error) {
      throw new InternalServerErrorException('Lỗi khi lấy danh sách giảng viên.');
    }
  }

  async getLecturerProfile(id: number): Promise<Lecturer> {
    const lecturer = await this.lecturerRepo.findById(id);
    if (!lecturer) throw new NotFoundException('Không tìm thấy giảng viên.');
    return lecturer;
  }

  async updateProfile(id: number, updateDto: UpdateLecturerDto): Promise<Lecturer> {
    try {
      const updatedLecturer = await this.lecturerRepo.update(id, updateDto);
      if (!updatedLecturer) throw new NotFoundException('Cập nhật thất bại, không tìm thấy giảng viên.');
      return updatedLecturer;
    } catch (error) {
      if (error instanceof NotFoundException) throw error;
      throw new InternalServerErrorException('Lỗi hệ thống khi cập nhật hồ sơ.');
    }
  }

  async getTeachingStatistics(id: number): Promise<Lecturer> {
    const stats = await this.lecturerRepo.getTeachingStats(id);
    if (!stats) throw new NotFoundException('Không tìm thấy dữ liệu thống kê cho giảng viên này.');
    return stats;
  }
}