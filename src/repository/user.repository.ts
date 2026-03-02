import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from '../models/user.entity';
import { UserRole } from 'src/common/enums/role.enum';
import { DeleteResult } from 'typeorm/browser';

@Injectable()
export class UserRepository {
  constructor(
    @InjectRepository(User)
    private readonly ormRepository: Repository<User>,
  ) {}

  /**
   * 1. TẠO TÀI KHOẢN NGƯỜI DÙNG
   * Thỏa mãn chức năng: Tạo tài khoản mới bởi Quản trị viên
   * @param userData Dữ liệu người dùng mới (email, passwordHash, role,...)
   * @returns User entity vừa được tạo
   */
  async createUser(userData: Partial<User>): Promise<User> {
    // ormRepository.create() chỉ tạo object trong bộ nhớ, chưa lưu DB
    const newUser = this.ormRepository.create(userData);
    
    // ormRepository.save() thực thi câu lệnh INSERT INTO
    return await this.ormRepository.save(newUser);
  }

  /**
   * 2. GÁN VAI TRÒ CHO NGƯỜI DÙNG
   * Thỏa mãn chức năng: Đổi vai trò cho tài khoản đã tồn tại
   * @param userId ID của người dùng cần đổi vai trò
   * @param newRole Vai trò mới (STUDENT, LECTURER, ADMIN,...)
   * @returns User entity sau khi đã cập nhật
   */
  async assignRole(userId: string, newRole: UserRole): Promise<User> {
    const user = await this.ormRepository.findOne({ where: { id: userId } });
    if (!user) {
      throw new NotFoundException(`Không tìm thấy tài khoản với ID: ${userId}`);
    }

    user.role = newRole;
    return await this.ormRepository.save(user); // Thực thi lệnh UPDATE
  }

  /**
   * 3. VÔ HIỆU HÓA TÀI KHOẢN (SOFT DELETE)
   * Thỏa mãn chức năng: Vô hiệu hóa một tài khoản đã tồn tại
   * @param userId ID của người dùng cần vô hiệu hóa
   */
  async deactivateUser(userId: string): Promise<User> {
    const user = await this.ormRepository.findOne({ where: { id: userId } });
    if (!user) {
      throw new NotFoundException(`Không tìm thấy tài khoản với ID: ${userId}`);
    }

    // Thay vì xóa cứng (Hard Delete), ta set cờ isActive = false
    // Đây là Best Practice để giữ lại lịch sử dữ liệu (lịch sử học, bài nộp...)
    user.isActive = false;
    return await this.ormRepository.save(user);
  }

  /**
   * (Tùy chọn) XÓA VĨNH VIỄN TÀI KHOẢN (HARD DELETE)
   * Trong SRS của bạn có ghi "Hậu điều kiện: Tài khoản đã bị xóa." 
   * Nếu nghiệp vụ thực sự yêu cầu xóa bay màu khỏi CSDL, hãy dùng hàm này thay vì hàm deactivateUser ở trên.
   */
  async permanentlyDeleteUser(userId: string): Promise<DeleteResult> {
    return await this.ormRepository.delete(userId);
  }

  // --- CÁC HÀM HỖ TRỢ THÊM CHO SERVICE SAU NÀY --- //

  // Tìm user theo Email (dùng cho Service kiểm tra trùng lặp khi tạo, hoặc lúc đăng nhập)
  async findByEmail(email: string): Promise<User | null> {
    
    const user = await this.ormRepository.findOne({ where: { email },
        select: {
          id: true,
          email: true,
          passwordHash: true, // cần select explicit vì có { select: false } trong entity
          isActive: true,
          googleId: true,
          role: true
        }, 
    });
    // if(!user){
    //     throw new NotFoundException(`Không tìm thấy người dùng với email: ${email}`);
    // }
    return user;
  }

 
  // Tìm user theo ID
  async findById(userId: string): Promise<User> {

    const user = await this.ormRepository.findOne({ 
        where: { id: userId },
        select: {
          id: true,
          email: true,
          passwordHash: true, // cần select explicit vì có { select: false } trong entity
          isActive: true,
          googleId: true,
          role: true
        }, 
    });
    
    if(!user){
        throw new NotFoundException(`Không tìm thấy người dùng với id: ${userId}`);
    }
    return user
  }
}