import { Injectable } from '@nestjs/common';
import { DataSource, Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import { Student } from '../models/student.entity';
import { AccountStatus } from '../common/enums/account-status.enum';
import { UserRole } from '../common/enums/role.enum';

// ─── Type mô tả kết quả trả về từ createWithTransaction ──────────────────────
// Không dùng User entity để tránh phụ thuộc vào các field optional của entity.
// Chỉ khai báo đúng những field mà User entity THỰC SỰ có (theo user.entity.ts):
//   ✅ id, email, passwordHash?, googleId?, role, isActive
//   ✅ lastLoginAt?, failedLoginAttempts, lockedUntil?, createdAt, updatedAt
//   ❌ status — KHÔNG có trên User entity (status thuộc Student/Lecturer entity)
export interface CreatedUserData {
  id: number;
  email: string;
  passwordHash: string;      // chắc chắn có vì vừa hash xong
  role: UserRole;
  isActive: boolean;
  failedLoginAttempts: number;
  lockedUntil: Date | null;
  lastLoginAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateTransactionResult {
  user: CreatedUserData;
  student: Student;
}

@Injectable()
export class StudentRepository {
  constructor(
    @InjectRepository(Student)
    private readonly studentRepo: Repository<Student>,
    private readonly dataSource: DataSource,
  ) {}

  async findByEmail(email: string): Promise<Student | null> {
    return this.studentRepo.findOne({
      where: { email },
      select: {
        userId: true,
        email: true,
        fullname: true,
        avatarUrl: true,
        status: true,
        googleId: true,
      },
    });
  }

  async findById(userId: number): Promise<Student | null> {
    return this.studentRepo.findOne({
      where: { userId },
      // Không cần load relation khi chỉ lấy profile cơ bản
      relations: [],
    });
  }

  async findProfileByUserId(userId: number): Promise<Record<string, any> | null> {
    const columns: Array<{ column_name: string }> = await this.dataSource.query(
      `SELECT column_name
       FROM information_schema.columns
       WHERE table_schema = 'public' AND table_name = 'students'`,
    );

    const set = new Set(columns.map((c) => c.column_name));

    const col = (name: string, fallback = 'NULL') =>
      set.has(name) ? `s.${name}` : fallback;

    const mssvExpr = set.has('mssv')
      ? 's.mssv'
      : set.has('student_code')
        ? 's.student_code'
        : `split_part(s.email, '@', 1)`;

    const khoaExpr = set.has('khoa')
      ? 's.khoa'
      : set.has('faculty')
        ? 's.faculty'
        : 'NULL';

    const nganhExpr = set.has('nganh')
      ? 's.nganh'
      : set.has('major')
        ? 's.major'
        : 'NULL';

    const diaChiExpr = set.has('dia_chi')
      ? 's.dia_chi'
      : set.has('address')
        ? 's.address'
        : 'NULL';

    const statusExpr = set.has('status')
      ? 's.status'
      : set.has('tinh_trang')
        ? 's.tinh_trang'
        : "CASE WHEN u.is_active THEN 'active' ELSE 'inactive' END";

    const rows: Array<Record<string, any>> = await this.dataSource.query(
      `SELECT
         s.user_id                        AS "userId",
         u.email                          AS "loginEmail",
         s.email                          AS "email",
         s.fullname                       AS "fullname",
         ${col('phone')}                  AS "phone",
         ${col('avatar_url')}             AS "avatarUrl",
         ${mssvExpr}                      AS "mssv",
         ${khoaExpr}                      AS "khoa",
         ${nganhExpr}                     AS "nganh",
         ${diaChiExpr}                    AS "diaChi",
         ${statusExpr}                    AS "status",
         u.is_active                      AS "isActive",
         ${col('created_at', 'u.created_at')} AS "createdAt"
       FROM users u
       JOIN students s ON u.id = s.user_id
       WHERE s.user_id = $1
       LIMIT 1`,
      [userId],
    );

    return rows[0] ?? null;
  }

  async findByIdWithRelations(userId: number): Promise<Student | null> {
    return this.studentRepo.findOne({
      where: { userId },
      relations: ['enrollments', 'submissions'],
    });
  }

  async findByStatus(status: AccountStatus): Promise<Student[]> {
    return this.studentRepo.find({
      where: { status },
      order: { fullname: 'ASC' },
    });
  }

  async updateStatus(
    userId: number,
    status: AccountStatus,
  ): Promise<Student | null> {
    await this.studentRepo.update({ userId }, { status });
    return this.findById(userId);
  }

  async findAllPaginated(page: number = 1, limit: number = 10) {
    const [data, total] = await this.studentRepo.findAndCount({
      skip: (page - 1) * limit,
      take: limit,
      order: { createdAt: 'DESC' },
    });
    return {
      data,
      meta: {
        total,
        page,
        limit,
        lastPage: Math.ceil(total / limit),
      },
    };
  }

  async findByIdWithEnrollments(userId: number): Promise<Student | null> {
    return this.studentRepo.findOne({
      where: { userId },
      relations: [
        'enrollments',
        'enrollments.course',
        'enrollments.course.category',
        'enrollments.course.createdBy',
      ],
    });
  }

  async findByIdWithSubmissions(userId: number): Promise<Student | null> {
    return this.studentRepo.findOne({
      where: { userId },
      relations: [
        'submissions',
        'submissions.quiz',
        'submissions.quiz.course',
        'submissions.gradedBy',
      ],
    });
  }

  async update(
    userId: number,
    data: Partial<Student>,
  ): Promise<Student | null> {
    await this.studentRepo.update({ userId }, data as any);
    return this.findById(userId);
  }

  // ✅ FIX: Trả về CreateTransactionResult thay vì Promise<Student>
  //
  // Vấn đề cũ:
  //   - Trả về Student → auth.service.ts truy cập student.passwordHash,
  //     student.status, student.isActive... → ts(2339) vì Student entity
  //     không có các field đó.
  //
  // Giải pháp:
  //   - RETURNING * từ SQL INSERT → lấy đủ tất cả cột của row users vừa tạo
  //   - Map sang interface CreatedUserData (type-safe, không phụ thuộc entity)
  //   - Trả về { user: CreatedUserData, student: Student }
  //   - auth.service.ts build userData từ `user` (security fields) +
  //     `student.status` (AccountStatus — đúng entity chứa nó)
  async createWithTransaction(data: {
    fullname: string;
    email: string;
    passwordHash: string;
    phone?: string | null;
  }): Promise<CreateTransactionResult> {
    return this.dataSource.transaction(async (manager) => {
      // ── Bước 1: Insert vào bảng users ──────────────────────────────────────
      // Dùng RETURNING với alias camelCase để map trực tiếp, không cần transform
      // Các cột phải khớp chính xác với User entity (user.entity.ts):
      //   id, email, password_hash, role, is_active,
      //   failed_login_attempts, locked_until, last_login_at,
      //   created_at, updated_at
      const rows: Array<{
        id: string;            // bigint trả về dạng string từ pg driver
        email: string;
        passwordHash: string;
        role: string;
        isActive: boolean;
        failedLoginAttempts: number;
        lockedUntil: Date | null;
        lastLoginAt: Date | null;
        createdAt: Date;
        updatedAt: Date;
      }> = await manager.query(
        `INSERT INTO users (
           email,
           password_hash,
           role,
           is_active,
           failed_login_attempts
         )
         VALUES ($1, $2, $3, true, 0)
         RETURNING
           id,
           email,
           password_hash         AS "passwordHash",
           role,
           is_active             AS "isActive",
           failed_login_attempts AS "failedLoginAttempts",
           locked_until          AS "lockedUntil",
           last_login_at         AS "lastLoginAt",
           created_at            AS "createdAt",
           updated_at            AS "updatedAt"`,
        [data.email, data.passwordHash, UserRole.STUDENT],
      );

      const raw = rows[0];
      const userId = Number(raw.id); // pg trả bigint dạng string → convert number

      // Map raw SQL row → CreatedUserData (plain object, type-safe)
      const user: CreatedUserData = {
        id: userId,
        email: raw.email,
        passwordHash: raw.passwordHash,
        role: raw.role as UserRole,
        isActive: raw.isActive,
        failedLoginAttempts: raw.failedLoginAttempts ?? 0,
        lockedUntil: raw.lockedUntil ?? null,
        lastLoginAt: raw.lastLoginAt ?? null,
        createdAt: new Date(raw.createdAt),
        updatedAt: new Date(raw.updatedAt),
      };

      // ── Bước 2: Insert vào bảng students ───────────────────────────────────
      const student = manager.create(Student, {
        userId,
        fullname: data.fullname,
        email: data.email,
        status: AccountStatus.ACTIVE,
        phone: data.phone ?? undefined,
      });
      const savedStudent = await manager.save(Student, student);

      return { user, student: savedStudent };
    });
  }
}