import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { Student } from 'src/models/student.entity';
import { UpdateStudentDto } from 'src/dto/student.dto';
import { AccountStatus } from 'src/common/enums/account-status.enum';
import { emit } from 'process';
import { StudentRepository } from 'src/repository/student.repository';
import { UserRepository } from 'src/repository/user.repository';

@Injectable()
export class StudentService {
  constructor(
    private readonly studenRepo: StudentRepository,
    private readonly userRepo: UserRepository
  ) {}

  // 1. Dành cho Admin: Lấy danh sách học viên (có phân trang cơ bản)
  async findAll(page: number = 1, limit: number = 10) {
    const {data, meta} = await this.studenRepo.findAllPaginated(page, limit);

    return {
      data,
      meta
    };
  }

  // 2. Dành cho cả Admin & Student: Xem chi tiết hồ sơ
  async findOne(id: string): Promise<Student> {
    const student = await this.studenRepo.findById(id);
    if (!student) throw new NotFoundException('Không tìm thấy học viên.');
    return student;
  }

  // 3. Dành cho Student: Tự cập nhật thông tin cá nhân
  async updateProfile(id: string, updateDto: UpdateStudentDto) {
    const student = await this.findOne(id);

  // 2. Xử lý cập nhật Email (Nếu có và nếu khác email cũ)
  if (updateDto.email && updateDto.email !== student.email) {
    // Gọi UserService để thực hiện logic kiểm tra trùng và update ở bảng Users
    // Giả sử updateEmailUser trả về user đã update hoặc throw lỗi nếu trùng
    await this.userRepo.updateEmailById(id, updateDto.email);
    
    // Cập nhật luôn email ở bảng Student để đồng bộ dữ liệu (vì bạn đang để email ở cả 2 bảng)
    student.email = updateDto.email;
  }

  // 3. Cập nhật các thông tin còn lại của Student
  // Loại bỏ email ra khỏi object để không ghi đè lại nếu đã xử lý ở trên
  const { email, ...otherInfo } = updateDto;
  
  // Gán các giá trị mới vào entity student
  Object.assign(student, otherInfo);

  // 4. Lưu vào database
  return student;
  }

  // 4. Xử lý vi phạm (Ban/Unban) dành cho giảng viên
  async updateAccountStatus(id: string, status: AccountStatus, reason?: string) {
    let student: Student | null = null;
    
    if (AccountStatus.SUSPENDED) student = await this.studenRepo.updateStatus(id, status);
    if(!student){
        throw new NotFoundException("student not found");
    }
    return student;
  }
  
}