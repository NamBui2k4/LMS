import { StudentRepository } from "src/repository/student.repository";
import { Student } from "src/models/student.entity";
import { AccountStatus } from "src/common/enums/account-status.enum";
import { CreateStudentDto } from "src/dto/create-student.dto";
import * as bcript from 'bcrypt';
import { BadRequestException } from "@nestjs/common";

export class StudentService{
  constructor(private studentRepository: StudentRepository){
    this.studentRepository = studentRepository;
  }
  
  // Tạo user mới (trước khi save, có thể thêm logic validate)
  async createUser(createDto: CreateStudentDto): Promise<Student> {
    const student = this.studentRepository.create({
        fullname: createDto.fullname,
        email: createDto.email,
        phone: createDto.phone,
        passwordHash: createDto.password ? await bcript.hash(createDto.password) : undefined
    })

    return this.studentRepository.save(student);
  }

  // Cập nhật profile (chỉ cho phép update một số field an toàn)
  async updateProfile(
    id: number, 
    updateData: Partial<Pick<Student, 'fullname' | 'avatarUrl'>>,
  ): Promise<Student | null> {

    const result = await this.studentRepository
        .createQueryBuilder()
        .update(Student)
        .set(updateData)
        .where("id =:id", {id})
        .returning("*")
        .execute();
    
    if (result.affected === 0) {
        throw new BadRequestException("No student found");
    }
    return result.raw[0] as Student;
  }

  // Khóa tài khoản sinh viên
  async deactivate(id: string): Promise<boolean> {
    const result = await this.studentRepository
      .createQueryBuilder()
      .update(Student)
      .set({ status: AccountStatus.INACTIVE })
      .where("id =:id", {id})
      .returning("*")
      .execute();
    
      if ((result.affected ?? 0) === 0) {
        throw new BadRequestException("No student found");
    }
    return true;
  }

  // Kiểm tra email đã tồn tại chưa (dùng khi register)
  async emailExists(email: string): Promise<boolean> {
      // Trong các phiên bản TypeORM mới, bạn có thể dùng .exists() sẽ nhanh hơn
      return await this.studentRepository
        .count({ where: { email } as any }) > 0; 
  }

// Tìm giảng viên (instructor) có ít nhất một khóa học
  async findInstructorsWithCourses(): Promise<Student[]> {
      return this.studentRepository
          .createQueryBuilder('user')
          // Sử dụng innerJoinAndSelect để chỉ lấy những user CÓ khóa học
          // Nó sẽ tự động loại bỏ những user không có course
          .innerJoinAndSelect('user.createdCourses', 'course')
          .where('lecturer.id in (SELECT "lectureId" FROM AssignedLecturers)') 
          .getMany();
  }
}