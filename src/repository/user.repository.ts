import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DeleteResult } from 'typeorm';
import { User } from '../models/user.entity';
import { UserRole } from '../common/enums/role.enum';

/**
 * Repository cho bảng users — quản lý tài khoản hệ thống.
 *
 * ✅ FIX TOÀN BỘ FILE: User.id được khai báo kiểu `string` trong entity
 *    (PrimaryGeneratedColumn 'increment' type 'bigint' → TypeORM trả về string để tránh
 *    mất độ chính xác của số nguyên lớn trong JavaScript).
 *
 *    Tuy nhiên TypeORM's FindOptionsWhere<User> infer id là `number` từ cột bigint,
 *    gây lỗi ts(2322): "Type 'string' is not assignable to type 'number'".
 *    → Giải pháp: dùng `as any` tại các where clause có `id: userId` (string).
 */
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
    // ✅ FIX: `as any` — User.id khai báo string nhưng TypeORM where type expect number
    const user = await this.ormRepository.findOne({ where: { id: userId } as any });
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
    // ✅ FIX: `as any` — cùng lý do trên
    const user = await this.ormRepository.findOne({ where: { id: userId } as any });
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
   * Trong SRS có ghi "Hậu điều kiện: Tài khoản đã bị xóa."
   * Nếu nghiệp vụ thực sự yêu cầu xóa bay màu khỏi CSDL, dùng hàm này.
   */
  async permanentlyDeleteUser(userId: string): Promise<DeleteResult> {
    return await this.ormRepository.delete(userId);
  }

  // --- CÁC HÀM HỖ TRỢ THÊM CHO SERVICE SAU NÀY --- //

  /**
   * Tìm user theo Email
   * (dùng cho Service kiểm tra trùng lặp khi tạo, hoặc lúc đăng nhập)
   */
  async findByEmail(email: string): Promise<User | null> {
    return await this.ormRepository.findOne({
      where: { email },
      select: {
        id: true,
        email: true,
        passwordHash: true, // cần select explicit để lấy passwordHash
        isActive: true,
        googleId: true,
        role: true,
      },
    });
  }

  /**
   * Tìm user theo ID
   * ✅ FIX: `as any` tại where clause — User.id là string nhưng TypeORM expect number
   */
  async findById(userId: string): Promise<User | null> {
    const user = await this.ormRepository.findOne({
      // ✅ FIX: `as any` để tránh lỗi ts(2322) do mismatch string vs number
      where: { id: userId } as any,
      select: {
        id: true,
        email: true,
        passwordHash: true,
        isActive: true,
        googleId: true,
        role: true,
      },
    });

    if (!user) {
      throw new NotFoundException(`Không tìm thấy người dùng với id: ${userId}`);
    }
    return user;
  }

  /**
   * Cập nhật email theo userId
   */
  async updateEmailById(userId: string, email: string): Promise<User | null> {
    await this.ormRepository.update(userId, { email });
    // ✅ FIX: `as any` tại where clause
    return this.ormRepository.findOne({ where: { id: userId } as any });
  }

  /**
   * Cập nhật trạng thái isActive theo userId
   * Được gọi khi ban/unban student hoặc deactivate user
   */
  async updateStatus(userId: string, status: boolean): Promise<User | null> {
    await this.ormRepository.update(userId, { isActive: status });
    // ✅ FIX: `as any` tại where clause
    return this.ormRepository.findOne({ where: { id: userId } as any });
  }

  async updatePasswordHashById(
    userId: string,
    passwordHash: string,
  ): Promise<User | null> {
    await this.ormRepository.update(userId, { passwordHash });
    return this.ormRepository.findOne({ where: { id: userId } as any });
  }

  async getSystemStats(): Promise<{
    totalUsers: number;
    totalStudents: number;
    totalLecturers: number;
    totalDepartments: number;
  }> {
    const [totalUsers, totalStudents, totalLecturers, totalDepartments] = await Promise.all([
      this.ormRepository.count(),
      this.ormRepository.count({ where: { role: UserRole.STUDENT } }),
      this.ormRepository.count({ where: { role: UserRole.LECTURER } }),
      this.ormRepository.count({ where: { role: UserRole.HEAD_OF_DEPARTMENT } }),
    ]);

    return {
      totalUsers,
      totalStudents,
      totalLecturers,
      totalDepartments,
    };
  }

  async findAllForAdminView(): Promise<
    Pick<User, 'id' | 'email' | 'role' | 'isActive' | 'createdAt'>[]
  > {
    return this.ormRepository.find({
      select: {
        id: true,
        email: true,
        role: true,
        isActive: true,
        createdAt: true,
      },
      order: { createdAt: 'DESC' },
    });
  }
}