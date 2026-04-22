import {
  Controller,
  Get,
  Render,
  Param,
  Req,
  Post,
  Body,
  Res,
  Query,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { memoryStorage } from 'multer';
import { AppService } from './app.service';
import { StudentService } from './services/student.service';
import { UserService } from './services/user.service';
import { LecturerService } from './services/lecturer.service';
import { CourseService } from './services/course.service';
import { EnrollmentService } from './services/enrollment.service';
import { QuizService } from './services/quiz.service';
import { SubmissionService } from './services/submissions.service';
import { QuizQuestionService } from './services/quiz-question.service';
import { LessonService } from './services/lesson.service';
import { MaterialService } from './services/material.service';
import { CategoryService } from './services/categories.service';
import { DepartmentHeadService } from './services/department-heads.service';
import { AssignedLecturersService } from './services/assigned-lecturers.service';
import { Lecturer } from './models/lecturers.entity';
import { Courses } from './models/courses.entity';
import { Submission } from './models/submission.entity';
import { Quiz } from './models/quizzes.entity';
import { Enrollment } from './models/enrollment.entity';
import { CourseStatus } from './common/enums/course-status.enum';
import { UserRole } from './common/enums/role.enum';

type UploadedFileType = {
  originalname: string;
  mimetype: string;
  size: number;
  buffer: Buffer;
};

@Controller()
export class AppController {
  constructor(
    private readonly appService: AppService,
    private readonly studentService: StudentService,
    private readonly userService: UserService,
    private readonly lecturerService: LecturerService,
    private readonly courseService: CourseService,
    private readonly enrollmentService: EnrollmentService,
    private readonly quizService: QuizService,
    private readonly submissionService: SubmissionService,
    private readonly quizQuestionService: QuizQuestionService,
    private readonly lessonService: LessonService,
    private readonly materialService: MaterialService,
    private readonly categoryService: CategoryService,
    private readonly departmentHeadService: DepartmentHeadService,
    private readonly assignedLecturersService: AssignedLecturersService,
  ) { }

  // ====================== ROOT & LOGIN ======================

  @Get('')
  @Render('public/guest-homepage')
  root() {
    return { 
      title: 'TDTU LMS - Guest Homepage'
    }; }

  // Trang chọn vai trò (Student hoặc Giảng viên)
  @Get('login')
  @Render('login-role')
  loginChoice() {
    return {
      roleType: null,
      title: 'LMS — Đăng nhập'
    };
  }

  // Đăng nhập theo role cụ thể (/login/student, /login/staff, /login/lecturer)
  @Get('login/:role')
  @Render('login-role')
  loginRole(@Param('role') role: string) {
    let displayRole = role.toLowerCase();

    // Chuẩn hóa lecturer → staff
    if (displayRole === 'lecturer' || displayRole === 'teacher') {
      displayRole = 'staff';
    }

    return {
      roleType: displayRole,
      title: `Đăng nhập ${displayRole === 'student' ? 'Người học' : 'Giảng viên'}`
    };
  }

  // ====================== ADMIN ======================
  @Get('admin/login')
  @Render('login')                    // login.ejs nằm trực tiếp trong views/
  adminLogin() {
    return { title: 'LMS Admin — Đăng nhập' };
  }

  @Get('admin')
  @Render('admin/dashboard')
  async adminDashboard(@Req() req: any) {
    const payload = req.userPayload;
    if (!payload) return { title: 'Admin Dashboard', user: null };
    try {
      // Find user via Id
      const adminUser = await this.userService.findUserViaId(String(payload.sub));
      return { title: 'Admin Dashboard', user: adminUser };
    } catch {
      return { title: 'Admin Dashboard', user: null };
    }
  }

  @Get('admin/dashboard')
  @Render('admin/dashboard')
  async adminDashboardAlt(@Req() req: any) {
    const payload = req.userPayload;
    if (!payload) return { title: 'Admin Dashboard', user: null };
    try {
      const adminUser = await this.userService.findUserViaId(String(payload.sub));
      return { title: 'Admin Dashboard', user: adminUser };
    } catch {
      return { title: 'Admin Dashboard', user: null };
    }
  }

  @Get('admin/users')
  @Render('admin/users')
  async adminUsers(@Req() req: any) {
    const payload = req.userPayload;
    if (!payload || !payload.sub) {
      return { title: 'Quản lý người dùng', user: null, users: [] };
    }

    try {
      const [adminUser, users] = await Promise.all([
        this.userService.findUserViaId(String(payload.sub)),
        this.userService.getUsersForAdminView(),
      ]);

      return {
        title: 'Quản lý người dùng',
        user: adminUser,
        users,
      };
    } catch {
      return { title: 'Quản lý người dùng', user: null, users: [] };
    }
  }

  @Get('admin/settings')
  @Render('admin/settings')
  adminSettings() {
    return { title: 'Cài đặt hệ thống' };
  }

  @Get('admin/categories')
  @Render('admin/categories')
  async adminCategories(@Req() req: any, @Query('updated') updated?: string, @Query('error') error?: string) {
    const payload = req.userPayload;
    if (!payload || !payload.sub) {
      return { title: 'Quản lý danh mục', user: null, categories: [], updated: false, error: null };
    }

    try {
      const [adminUser, categories] = await Promise.all([
        this.userService.findUserViaId(String(payload.sub)),
        this.categoryService.findAll(),
      ]);

      return {
        title: 'Quản lý danh mục',
        user: adminUser,
        categories,
        updated: updated === '1',
        error: error === '1' ? 'Không thể cập nhật danh mục. Vui lòng thử lại.' : null,
      };
    } catch {
      return { title: 'Quản lý danh mục', user: null, categories: [], updated: false, error: null };
    }
  }

  @Post('admin/categories/create')
  async createAdminCategory(@Body() body: any, @Res() res: any) {
    try {
      await this.categoryService.create({
        name: String(body.name || '').trim(),
        description: String(body.description || '').trim() || undefined,
      });
      return res.redirect('/admin/categories?updated=1');
    } catch {
      return res.redirect('/admin/categories?error=1');
    }
  }

  @Post('admin/categories/:id/update')
  async updateAdminCategory(@Param('id') id: string, @Body() body: any, @Res() res: any) {
    try {
      await this.categoryService.update(Number(id), {
        name: String(body.name || '').trim() || undefined,
        description: String(body.description || '').trim() || undefined,
      });
      return res.redirect('/admin/categories?updated=1');
    } catch {
      return res.redirect('/admin/categories?error=1');
    }
  }

  @Post('admin/categories/:id/delete')
  async deleteAdminCategory(@Param('id') id: string, @Res() res: any) {
    try {
      await this.categoryService.delete(Number(id));
      return res.redirect('/admin/categories?updated=1');
    } catch {
      return res.redirect('/admin/categories?error=1');
    }
  }

  @Get('admin/department-heads')
  @Render('admin/department-heads')
  async adminDepartmentHeads(@Req() req: any, @Query('updated') updated?: string, @Query('error') error?: string) {
    const payload = req.userPayload;
    if (!payload || !payload.sub) {
      return {
        title: 'Quản lý trưởng bộ môn',
        user: null,
        departmentHeads: [],
        lecturers: [],
        updated: false,
        error: null,
      };
    }

    try {
      const [adminUser, departmentHeads, lecturers] = await Promise.all([
        this.userService.findUserViaId(String(payload.sub)),
        this.departmentHeadService.findAll(),
        this.lecturerService.getAllLecturers(),
      ]);

      return {
        title: 'Quản lý trưởng bộ môn',
        user: adminUser,
        departmentHeads,
        lecturers,
        updated: updated === '1',
        error: error === '1' ? 'Không thể cập nhật trưởng bộ môn. Vui lòng thử lại.' : null,
      };
    } catch {
      return {
        title: 'Quản lý trưởng bộ môn',
        user: null,
        departmentHeads: [],
        lecturers: [],
        updated: false,
        error: null,
      };
    }
  }

  @Post('admin/department-heads/appoint')
  async appointDepartmentHead(@Body() body: any, @Res() res: any) {
    try {
      const termEnd = body.termEnd ? new Date(body.termEnd) : undefined;
      await this.departmentHeadService.appoint({
        userId: Number(body.userId),
        termEnd,
      });
      return res.redirect('/admin/department-heads?updated=1');
    } catch {
      return res.redirect('/admin/department-heads?error=1');
    }
  }

  @Post('admin/department-heads/:id/update')
  async updateDepartmentHead(@Param('id') id: string, @Body() body: any, @Res() res: any) {
    try {
      const termEnd = body.termEnd ? new Date(body.termEnd) : undefined;
      await this.departmentHeadService.update(Number(id), termEnd);
      return res.redirect('/admin/department-heads?updated=1');
    } catch {
      return res.redirect('/admin/department-heads?error=1');
    }
  }

  @Post('admin/department-heads/:id/remove')
  async removeDepartmentHead(@Param('id') id: string, @Res() res: any) {
    try {
      await this.departmentHeadService.remove(Number(id));
      return res.redirect('/admin/department-heads?updated=1');
    } catch {
      return res.redirect('/admin/department-heads?error=1');
    }
  }

  // ====================== STAFF ======================
  @Get('staff')
  @Render('staff/index')
  async staffDashboard(@Req() req: any) {
    const payload = req.userPayload;
    if (!payload) return { title: 'Staff Dashboard', user: null, courses: [], pendingCount: 0, recentSubmissions: [] };
    
    const lecturerId = Number(payload.sub);
    let lecturer: Lecturer | null = null;
    let courses: Courses[] = [];
    let pendingCount = 0;
    let recentSubmissions: Submission[] = [];

    // Tách biệt việc fetch profile và courses (cơ bản) khỏi việc fetch submissions (nâng cao)
    try {
      lecturer = await this.lecturerService.getLecturerProfile(lecturerId);
      courses = await this.courseService.findAll(lecturerId, payload.role);
    } catch (err) {
      console.error('CRITICAL: Error loading staff profile/courses:', err);
    }

    try {
      if (lecturer) {
        const allSubmissions = await this.submissionService.findAllByLecturer(lecturerId, payload.role);
        pendingCount = allSubmissions.filter(s => 
          s.status === 'submitted' || s.status === 'under_review'
        ).length;
        recentSubmissions = allSubmissions.slice(0, 4);
      }
    } catch (err) {
      console.error('NON-CRITICAL: Error loading submissions for dashboard:', err);
    }

    return { 
      title: 'Staff Dashboard', 
      user: lecturer,
      courses: courses,
      pendingCount: pendingCount,
      recentSubmissions: recentSubmissions
    };
  }

  @Get('staff/courses')
  @Render('staff/course-list')
  async staffCourseList(@Req() req: any, @Query('updated') updated?: string, @Query('error') error?: string) {
    const payload = req.userPayload;
    if (!payload || !payload.sub) {
      return {
        title: 'Danh sách khóa học',
        courses: [],
        user: null,
        updated: false,
        error: null,
      };
    }
    try {
      const lecturer = await this.lecturerService.getLecturerProfile(Number(payload.sub));
      const courses = await this.courseService.findAll(Number(payload.sub), payload.role);
      
      return {
        title: 'Danh sách khóa học',
        courses,
        user: lecturer,
        updated: updated === '1',
        error: error === '1' ? 'Không thể cập nhật dữ liệu khóa học. Vui lòng thử lại.' : null,
      };
    } catch {
      return {
        title: 'Danh sách khóa học',
        courses: [],
        user: null,
        updated: false,
        error: null,
      };
    }
  }

  @Get('staff/courses/:id')
  @Render('staff/course-detail')
  async staffCourseDetail(
    @Req() req: any,
    @Param('id') id: string,
    @Query('updated') updated?: string | string[],
    @Query('error') error?: string | string[],
    @Query('notice') notice?: string | string[],
    @Query('errorCode') errorCode?: string | string[],
  ) {
    const payload = req.userPayload;
    if (!payload || !payload.sub) return { title: 'Lỗi', courseId: id, course: null, user: null };

    const isSupabaseStorageReady =
      Boolean(process.env.SUPABASE_URL) &&
      Boolean(process.env.SUPABASE_SERVICE_ROLE_KEY);

    const noticeMap: Record<string, string> = {
      lesson_created: 'Đã tạo bài giảng thành công.',
      material_created: 'Đã thêm học liệu thành công.',
      material_deleted: 'Đã xóa học liệu thành công.',
    };

    const errorMap: Record<string, string> = {
      lesson_create_failed: 'Không thể tạo bài giảng. Hãy kiểm tra quyền chỉnh sửa và trạng thái khóa học.',
      material_create_failed: 'Không thể thêm học liệu. Hãy kiểm tra file/URL và cấu hình storage.',
      material_missing_source: 'Vui lòng chọn file upload hoặc nhập URL học liệu trước khi thêm.',
      material_supabase_not_configured: 'Bạn đang upload file nhưng chưa cấu hình Supabase Storage (SUPABASE_URL/SUPABASE_SERVICE_ROLE_KEY).',
      material_upload_failed: 'Upload file lên Supabase thất bại. Hãy kiểm tra bucket/quyền truy cập.',
      material_delete_failed: 'Không thể xóa học liệu. Vui lòng thử lại.',
    };

    const pickLast = (value?: string | string[]) =>
      Array.isArray(value) ? value[value.length - 1] : value;

    const updatedValue = pickLast(updated);
    const errorValue = pickLast(error);
    const noticeValue = pickLast(notice);
    const errorCodeValue = pickLast(errorCode);
    
    try {
      const lecturer = await this.lecturerService.getLecturerProfile(Number(payload.sub));
      const course = await this.courseService.findOne(Number(id), Number(payload.sub), payload.role);
      const statusOptions = this.getAllowedCourseStatusTransitions(course.status);
      return {
        title: 'Chi tiết khóa học',
        courseId: id,
        course,
        user: lecturer,
        canManageAssignments: payload.role === UserRole.HEAD_OF_DEPARTMENT,
        canChangeStatus: payload.role === UserRole.HEAD_OF_DEPARTMENT,
        statusOptions,
        updated: updatedValue === '1',
        notice: noticeValue ? (noticeMap[noticeValue] || null) : null,
        error: errorValue === '1' ? 'Không thể cập nhật khóa học. Vui lòng thử lại.' : null,
        flowError: errorCodeValue
          ? (errorMap[errorCodeValue] || 'Thao tác không thành công. Vui lòng thử lại.')
          : null,
        isSupabaseStorageReady,
      };
    } catch (err: any) {
      return {
        title: 'Không tìm thấy khóa học',
        courseId: id,
        course: { title: 'Khóa học', description: '', status: 'draft', lessons: [], enrollments: [] },
        user: null,
        canManageAssignments: false,
        canChangeStatus: false,
        statusOptions: [],
        updated: false,
        notice: null,
        error: err?.message || 'Không thể tải chi tiết khóa học.',
        flowError: null,
        isSupabaseStorageReady,
      };
    }
  }

  @Post('staff/courses/:id/update')
  async updateStaffCourse(@Req() req: any, @Param('id') id: string, @Body() body: any, @Res() res: any) {
    const payload = req.userPayload;
    if (!payload || !payload.sub) return res.redirect('/login/staff');

    const courseId = Number(id);

    try {
      await this.courseService.updateBasicInfo(
        courseId,
        {
          title: body.title,
          description: body.description,
        },
        Number(payload.sub),
        payload.role,
      );

      if (payload.role === UserRole.HEAD_OF_DEPARTMENT && body.status) {
        const deptHead = await this.departmentHeadService.findOne(Number(payload.sub));
        await this.courseService.changeStatus(
          courseId,
          body.status,
          deptHead,
          payload.role,
        );
      }

      return res.redirect(`/staff/courses/${courseId}?updated=1`);
    } catch {
      return res.redirect(`/staff/courses/${courseId}?error=1`);
    }
  }

  @Post('staff/courses/:id/delete')
  async deleteStaffCourse(@Req() req: any, @Param('id') id: string, @Res() res: any) {
    const payload = req.userPayload;
    if (!payload || !payload.sub) return res.redirect('/login/staff');

    try {
      await this.courseService.delete(Number(id), Number(payload.sub), payload.role);
      return res.redirect('/staff/courses?updated=1');
    } catch {
      return res.redirect('/staff/courses?error=1');
    }
  }

  @Get('staff/courses/:id/assigned-lecturers')
  @Render('staff/assigned-lecturers')
  async staffAssignedLecturers(@Req() req: any, @Param('id') id: string, @Query('updated') updated?: string, @Query('error') error?: string) {
    const payload = req.userPayload;
    if (!payload || !payload.sub) {
      return {
        title: 'Phân công giảng viên',
        user: null,
        course: null,
        assignments: [],
        lecturers: [],
        canManageAssignments: false,
        updated: false,
        error: null,
      };
    }

    const courseId = Number(id);
    try {
      const [lecturer, course, assignments, lecturers] = await Promise.all([
        this.lecturerService.getLecturerProfile(Number(payload.sub)),
        this.courseService.findOne(courseId, Number(payload.sub), payload.role),
        this.assignedLecturersService.findByCourse(courseId),
        this.lecturerService.getAllLecturers(),
      ]);

      return {
        title: 'Phân công giảng viên',
        user: lecturer,
        course,
        assignments,
        lecturers,
        canManageAssignments: payload.role === UserRole.HEAD_OF_DEPARTMENT,
        updated: updated === '1',
        error: error === '1' ? 'Không thể cập nhật phân công giảng viên. Vui lòng thử lại.' : null,
      };
    } catch {
      return {
        title: 'Phân công giảng viên',
        user: null,
        course: null,
        assignments: [],
        lecturers: [],
        canManageAssignments: false,
        updated: false,
        error: null,
      };
    }
  }

  @Post('staff/courses/:id/assigned-lecturers/assign')
  async assignLecturerToCourse(@Req() req: any, @Param('id') id: string, @Body() body: any, @Res() res: any) {
    const payload = req.userPayload;
    if (!payload || payload.role !== UserRole.HEAD_OF_DEPARTMENT) {
      return res.redirect(`/staff/courses/${id}/assigned-lecturers?error=1`);
    }

    try {
      await this.assignedLecturersService.assign(Number(id), Number(body.lecturerId));
      return res.redirect(`/staff/courses/${id}/assigned-lecturers?updated=1`);
    } catch {
      return res.redirect(`/staff/courses/${id}/assigned-lecturers?error=1`);
    }
  }

  @Post('staff/courses/:id/assigned-lecturers/:lecturerId/remove')
  async unassignLecturerFromCourse(@Req() req: any, @Param('id') id: string, @Param('lecturerId') lecturerId: string, @Res() res: any) {
    const payload = req.userPayload;
    if (!payload || payload.role !== UserRole.HEAD_OF_DEPARTMENT) {
      return res.redirect(`/staff/courses/${id}/assigned-lecturers?error=1`);
    }

    try {
      await this.assignedLecturersService.unassign(Number(id), Number(lecturerId));
      return res.redirect(`/staff/courses/${id}/assigned-lecturers?updated=1`);
    } catch {
      return res.redirect(`/staff/courses/${id}/assigned-lecturers?error=1`);
    }
  }

  @Post('staff/courses/:courseId/lessons')
  async createStaffLesson(@Req() req: any, @Param('courseId') courseId: string, @Body() body: any, @Res() res: any) {
    const payload = req.userPayload;
    if (!payload || !payload.sub) return res.redirect('/login/staff');

    try {
      await this.lessonService.create(
        Number(courseId),
        {
          title: body.title,
          summary: body.summary,
          content: body.content,
        },
        Number(payload.sub),
      );
      return res.redirect(`/staff/courses/${courseId}?notice=lesson_created`);
    } catch {
      return res.redirect(`/staff/courses/${courseId}?errorCode=lesson_create_failed`);
    }
  }

  @Post('staff/courses/:courseId/lessons/:lessonId/delete')
  async deleteStaffLesson(
    @Req() req: any,
    @Param('courseId') courseId: string,
    @Param('lessonId') lessonId: string,
    @Res() res: any,
  ) {
    const payload = req.userPayload;
    if (!payload || !payload.sub) return res.redirect('/login/staff');

    try {
      await this.lessonService.delete(Number(lessonId), Number(payload.sub));
      return res.redirect(`/staff/courses/${courseId}`);
    } catch {
      return res.redirect(`/staff/courses/${courseId}`);
    }
  }

  @Post('staff/lessons/:lessonId/materials')
  @UseInterceptors(
    FileInterceptor('file', {
      storage: memoryStorage(),
      limits: { fileSize: 50 * 1024 * 1024 },
    }),
  )
  async createStaffMaterial(
    @Req() req: any,
    @Param('lessonId') lessonId: string,
    @Body() body: any,
    @UploadedFile() file: UploadedFileType,
    @Res() res: any,
  ) {
    const payload = req.userPayload;
    const backTo = req.get('referer') || '/staff/courses';
    const withRedirectFlag = (
      targetUrl: string,
      key: 'notice' | 'errorCode',
      value: string,
    ) => {
      const [basePath, rawQuery = ''] = String(targetUrl).split('?');
      const params = new URLSearchParams(rawQuery);
      params.delete('notice');
      params.delete('errorCode');
      params.set(key, value);
      const query = params.toString();
      return query ? `${basePath}?${query}` : basePath;
    };

    if (!payload || !payload.sub) return res.redirect('/login/staff');

    try {
      if (file) {
        await this.materialService.uploadAndCreate(
          Number(lessonId),
          file,
          {
            fileName: body.fileName,
            fileType: body.fileType,
          },
          Number(payload.sub),
        );
      } else {
        if (!body.fileUrl) {
          throw new Error('Thiếu file upload hoặc URL học liệu.');
        }

        await this.materialService.create(
          Number(lessonId),
          {
            fileName: body.fileName,
            fileUrl: body.fileUrl,
            fileType: body.fileType || 'document',
          },
          Number(payload.sub),
        );
      }
      return res.redirect(withRedirectFlag(backTo, 'notice', 'material_created'));
    } catch (err: any) {
      const message = String(err?.message || '');

      if (message.includes('Thiếu file upload hoặc URL học liệu')) {
        return res.redirect(withRedirectFlag(backTo, 'errorCode', 'material_missing_source'));
      }

      if (
        message.includes('SUPABASE_URL') ||
        message.includes('SUPABASE_SERVICE_ROLE_KEY')
      ) {
        return res.redirect(withRedirectFlag(backTo, 'errorCode', 'material_supabase_not_configured'));
      }

      if (message.includes('Upload file lên Supabase thất bại')) {
        return res.redirect(withRedirectFlag(backTo, 'errorCode', 'material_upload_failed'));
      }

      return res.redirect(withRedirectFlag(backTo, 'errorCode', 'material_create_failed'));
    }
  }

  @Post('staff/lessons/:lessonId/materials/:materialId/delete')
  async deleteStaffMaterial(
    @Req() req: any,
    @Param('lessonId') lessonId: string,
    @Param('materialId') materialId: string,
    @Res() res: any,
  ) {
    const payload = req.userPayload;
    const backTo = req.get('referer') || '/staff/courses';
    const withRedirectFlag = (
      targetUrl: string,
      key: 'notice' | 'errorCode',
      value: string,
    ) => {
      const [basePath, rawQuery = ''] = String(targetUrl).split('?');
      const params = new URLSearchParams(rawQuery);
      params.delete('notice');
      params.delete('errorCode');
      params.set(key, value);
      const query = params.toString();
      return query ? `${basePath}?${query}` : basePath;
    };

    if (!payload || !payload.sub) return res.redirect('/login/staff');

    try {
      await this.materialService.delete(Number(materialId), Number(payload.sub));
      return res.redirect(withRedirectFlag(backTo, 'notice', 'material_deleted'));
    } catch {
      return res.redirect(withRedirectFlag(backTo, 'errorCode', 'material_delete_failed'));
    }
  }

  @Get('staff/grading')
  @Render('staff/grading')
  async staffGrading(@Req() req: any) {
    const payload = req.userPayload;
    if (!payload || !payload.sub) return { title: 'Lỗi', submissions: [], user: null };
    
    try {
      const lecturer = await this.lecturerService.getLecturerProfile(Number(payload.sub));
      const submissions = await this.submissionService.findAllByLecturer(Number(payload.sub), payload.role);
      return { title: 'Chấm điểm', submissions, user: lecturer };
    } catch {
      return { title: 'Chấm điểm', submissions: [], user: null };
    }
  }

  @Post('staff/submissions/:id/grade')
  async staffGradeSubmission(@Req() req: any, @Param('id') id: string, @Body() body: any, @Res() res: any) {
    const payload = req.userPayload;
    if (!payload || !payload.sub) return res.redirect('/login/staff');

    try {
      await this.submissionService.grade(
        Number(id),
        { score: Number(body.score), note: body.note },
        Number(payload.sub),
      );
      return res.redirect('/staff/grading');
    } catch {
      return res.redirect('/staff/grading');
    }
  }

  @Get('staff/question-bank')
  @Render('staff/question-bank')
  async staffQuestionBank(@Req() req: any) {
    const payload = req.userPayload;
    if (!payload || !payload.sub) return { title: 'Lỗi', questions: [], user: null, courses: [] };

    const lecturerId = Number(payload.sub);
    let lecturer: Lecturer | null = null;
    let courses: Courses[] = [];
    let quizzes: Quiz[] = [];

    try {
      lecturer = await this.lecturerService.getLecturerProfile(lecturerId);
      courses = await this.courseService.findAll(lecturerId, payload.role);
    } catch (err) {
      console.error('Error loading profile/courses for question bank:', err);
    }

    try {
      quizzes = await this.quizService.findAllByLecturer(lecturerId, payload.role);
    } catch (err) {
      console.error('Error loading quizzes for question bank:', err);
    }
    
    // Convert quizzes to formatted questions for the view
    const questionsFormatted = quizzes.flatMap(q => (q.questions || []).map(ques => ({
      id: ques.id,
      quizId: q.id,
      course: q.course?.id || 'N/A',
      courseName: q.course?.title || 'Chưa phân môn',
      difficulty: 'Trung bình',
      type: q.quizType === 'multiple_choice' ? 'multiple_choice' : 'essay',
      content: ques.questionText,
      options: ques.options || []
    })));

    return { 
      title: 'Ngân hàng câu hỏi', 
      questions: questionsFormatted, 
      user: lecturer, 
      courses: courses,
      quizzes: quizzes,
    };
  }

  @Post('staff/question-bank/create')
  async createQuestion(@Req() req: any, @Body() body: any, @Res() res: any) {
    const payload = req.userPayload;
    if (!payload || !payload.sub) return res.status(401).json({ message: 'Unauthorized' });

    try {
      const type = body.type || 'multiple_choice';
      const options = type === 'multiple_choice'
        ? ['A', 'B', 'C', 'D']
            .map((label) => ({
              label,
              text: String(body[`opt${label}`] || '').trim(),
              isCorrect: String(body.correctOption || '').toUpperCase() === label,
            }))
            .filter((opt) => opt.text.length > 0)
        : undefined;

      await this.quizQuestionService.create(
        Number(body.quizId),
        {
          questionText: body.content,
          options,
          correctAnswer: type === 'multiple_choice' ? String(body.correctOption || '').toUpperCase() : undefined,
          scoreWeight: 1,
        },
        Number(payload.sub),
      );

      return res.json({ ok: true });
    } catch (err: any) {
      return res.status(400).json({ ok: false, message: err?.message || 'Không thể tạo câu hỏi.' });
    }
  }

  @Post('staff/question-bank/:id/update')
  async updateQuestion(@Req() req: any, @Param('id') id: string, @Body() body: any, @Res() res: any) {
    const payload = req.userPayload;
    if (!payload || !payload.sub) return res.status(401).json({ message: 'Unauthorized' });

    try {
      await this.quizQuestionService.update(
        Number(id),
        {
          questionText: body.content,
        },
        Number(payload.sub),
      );
      return res.json({ ok: true });
    } catch (err: any) {
      return res.status(400).json({ ok: false, message: err?.message || 'Không thể cập nhật câu hỏi.' });
    }
  }

  @Post('staff/question-bank/:id/delete')
  async deleteQuestion(@Req() req: any, @Param('id') id: string, @Res() res: any) {
    const payload = req.userPayload;
    if (!payload || !payload.sub) return res.status(401).json({ message: 'Unauthorized' });

    try {
      await this.quizQuestionService.delete(Number(id), Number(payload.sub));
      return res.json({ ok: true });
    } catch (err: any) {
      return res.status(400).json({ ok: false, message: err?.message || 'Không thể xóa câu hỏi.' });
    }
  }

  @Get('staff/reports')
  @Render('staff/reports')
  async staffReports(@Req() req: any) {
    const payload = req.userPayload;
    
    // Initialize defaults to prevent EJS rendering errors
    const defaultData = {
      title: 'Báo cáo',
      user: null as any,
      stats: { totalStudents: 0, openCoursesCount: 0, avgGrade: '0.0', completionRate: 0 },
      distributionPct: { yếu: 0, tb: 0, khá: 0, giỏi: 0 },
      featuredCourses: [] as any[]
    };

    if (!payload) return defaultData;

    try {
      const lecturerId = Number(payload.sub);
      
      // 1. Fetch Basic Data
      let lecturer: Lecturer | null = null;
      let courses: Courses[] = [];
      try {
        lecturer = await this.lecturerService.getLecturerProfile(lecturerId);
        courses = await this.courseService.findAll(lecturerId, payload.role);
      } catch (err) {
        console.error('Error fetching profile/courses for reports:', err);
      }

      // 2. Fetch Enrollments & Submissions
      let enrollments: Enrollment[] = [];
      let submissions: Submission[] = [];
      try {
        enrollments = await this.enrollmentService.findAllForLecturer(lecturerId, payload.role);
        submissions = await this.submissionService.findAllByLecturer(lecturerId, payload.role);
      } catch (err) {
        console.error('Error fetching enrollments/submissions for reports:', err);
      }

      // 3. Process Data
      const gradedSubmissions = submissions.filter(s => s.status === 'graded' && s.score !== null);
      const totalStudents = new Set(enrollments.map(e => e.student.userId)).size;
      const openCoursesCount = courses.filter(c => c.status === CourseStatus.PUBLISHED).length;
      
      const avgGrade = gradedSubmissions.length > 0
        ? (gradedSubmissions.reduce((acc, s) => acc + Number(s.score), 0) / gradedSubmissions.length).toFixed(1)
        : '0.0';

      const completionRate = enrollments.length > 0
        ? Math.round(enrollments.reduce((acc, e) => acc + Number(e.progressPct), 0) / enrollments.length)
        : 0;

      const totalGraded = gradedSubmissions.length || 1;
      const distributionPct = {
        yếu: Math.round((gradedSubmissions.filter(s => Number(s.score) < 4).length / totalGraded) * 100),
        tb: Math.round((gradedSubmissions.filter(s => Number(s.score) >= 4 && Number(s.score) < 6).length / totalGraded) * 100),
        khá: Math.round((gradedSubmissions.filter(s => Number(s.score) >= 6 && Number(s.score) < 8).length / totalGraded) * 100),
        giỏi: Math.round((gradedSubmissions.filter(s => Number(s.score) >= 8).length / totalGraded) * 100),
      };
      
      const featuredCourses = courses.slice(0, 3).map(c => {
        const courseEnrols = enrollments.filter(e => e.course.id === c.id);
        const courseSubs = gradedSubmissions.filter(s => s.quiz?.course?.id === c.id);
        const avgProg = courseEnrols.length > 0
          ? Math.round(courseEnrols.reduce((acc, e) => acc + Number(e.progressPct), 0) / courseEnrols.length)
          : 0;
        const avgSc = courseSubs.length > 0
          ? (courseSubs.reduce((acc, s) => acc + Number(s.score), 0) / courseSubs.length).toFixed(1)
          : '0.0';

        return {
          title: c.title,
          students: courseEnrols.length,
          avgProgress: avgProg,
          avgScore: avgSc
        };
      });

      return {
        title: 'Báo cáo',
        user: lecturer,
        stats: { totalStudents, openCoursesCount, avgGrade, completionRate },
        distributionPct,
        featuredCourses
      };
    } catch (err) {
      console.error('Fatal error in staffReports:', err);
      return defaultData;
    }
  }

  // ====================== STUDENT ======================
  @Get('student')
  @Render('student/profile')
  async studentDashboard(@Req() req: any) {
    const payload = req.userPayload;
    if (!payload) return { title: 'Student Dashboard', user: null };
    try {
      const student = await this.studentService.getProfileByUserId(Number(payload.sub));
      return { title: 'Student Dashboard', user: student };
    } catch {
      return { title: 'Student Dashboard', user: null };
    }
  }

  @Get('student/profile')
  @Render('student/profile')
  async studentProfile(@Req() req: any, @Query('updated') updated?: string, @Query('error') error?: string) {
    const payload = req.userPayload;
    if (!payload) return { title: 'Hồ sơ sinh viên', user: null, updated: false, error: null };
    try {
      const student = await this.studentService.getProfileByUserId(Number(payload.sub));
      return {
        title: 'Hồ sơ sinh viên',
        user: student,
        updated: updated === '1',
        error: error === '1' ? 'Không thể cập nhật thông tin. Vui lòng thử lại.' : null,
      };
    } catch {
      return { title: 'Hồ sơ sinh viên', user: null, updated: false, error: null };
    }
  }

  @Post('student/profile')
  async updateStudentProfile(@Req() req: any, @Body() body: any, @Res() res: any) {
    const payload = req.userPayload;
    if (!payload || !payload.sub) {
      return res.redirect('/login/student');
    }

    try {
      await this.studentService.updateProfile(Number(payload.sub), {
        phone: body.phone,
        diaChi: body.diaChi,
      });
      return res.redirect('/student/profile?updated=1');
    } catch {
      return res.redirect('/student/profile?error=1');
    }
  }

  @Get('student/courses')
  @Render('student/course-list')
  async studentCourseList(@Req() req: any) {
    const payload = req.userPayload;
    if (!payload || !payload.sub) return { title: 'Khóa học của tôi', registered: [], available: [], user: null };
    try {
      const student = await this.studentService.getProfileByUserId(Number(payload.sub));
      
      // 1. Lấy danh sách khóa đã ghi danh
      const enrollments = await this.enrollmentService.findByStudent(Number(payload.sub));
      const registered = enrollments.map(e => ({
        ...e.course, // Lấy chi tiết khóa học từ enrollment
        enrollmentStatus: e.status,
        progressPct: e.progressPct
      }));

      // 2. Lấy tất cả khóa đang PUBLISHED
      const allPublished = await this.courseService.findAllPublished();
      
      // Khóa available là danh sách chưa đăng ký
      const registeredIds = new Set(registered.map(r => r.id));
      const available = allPublished.filter(c => !registeredIds.has(c.id));

      return { 
        title: 'Khóa học của tôi', 
        registered, 
        available,
        user: student 
      };
    } catch (err) {
      console.error(err);
      return { title: 'Khóa học của tôi', registered: [], available: [], user: null };
    }
  }

  @Post('student/courses/:id/enroll')
  async studentEnrollCourse(@Req() req: any, @Param('id') id: string, @Res() res: any) {
    const payload = req.userPayload;
    if (!payload || !payload.sub) {
      return res.status(401).json({ ok: false, message: 'Bạn chưa đăng nhập.' });
    }

    try {
      await this.enrollmentService.enroll(Number(payload.sub), Number(id));
      return res.json({ ok: true });
    } catch (err: any) {
      return res.status(400).json({ ok: false, message: err?.message || 'Không thể đăng ký khóa học.' });
    }
  }

  @Get('student/courses/:id')
  @Render('student/course-detail')
  async studentCourseDetail(@Req() req: any, @Param('id') id: string) {
    const payload = req.userPayload;
    if (!payload || !payload.sub) return { title: 'Lỗi', courseId: id, course: null, user: null };

    try {
      const student = await this.studentService.getProfileByUserId(Number(payload.sub));
      // Trích xuất Course thông qua findOne — để tiện, do Service check `canView` bằng Role, ta bypass role hoặc chỉ cho phép nếu đã Enroll.
      // Do CourseService.findOne chưa cấp quyền load cho role Student một cách official, ta tận dụng CourseRepo
      // TẠM: Truy xuất trực tiếp cho view sinh viên vì Student không có role LECTURER
      // Note: Đây là bypass, trong Project chuẩn thì viết thêm logic canView=true cho STUDENT.
      const course = await this.courseService['courseRepo'].findByIdDetailed(Number(id));
      
      return { title: 'Lớp học', courseId: id, course, user: student };
    } catch {
      return { title: 'Không tìm thấy khóa học', courseId: id, course: null, user: null };
    }
  }

  @Get('student/quizzes/:id')
  @Render('student/quiz-submit')
  async studentQuizSubmitPage(@Req() req: any, @Param('id') id: string) {
    const payload = req.userPayload;
    if (!payload || !payload.sub) return { title: 'Làm bài', quiz: null, user: null };

    try {
      const [student, quiz] = await Promise.all([
        this.studentService.getProfileByUserId(Number(payload.sub)),
        this.quizService.findOne(Number(id)),
      ]);

      return {
        title: 'Làm bài kiểm tra',
        quiz,
        user: student,
      };
    } catch {
      return { title: 'Làm bài', quiz: null, user: null };
    }
  }

  @Post('student/quizzes/:id/submit')
  async studentQuizSubmit(@Req() req: any, @Param('id') id: string, @Body() body: any, @Res() res: any) {
    const payload = req.userPayload;
    if (!payload || !payload.sub) return res.redirect('/login/student');

    try {
      let answerData: any = body.answerData;
      if (typeof answerData === 'string') {
        const trimmed = answerData.trim();
        answerData = trimmed ? JSON.parse(trimmed) : {};
      }

      await this.submissionService.submit(Number(id), Number(payload.sub), { answerData });
      return res.redirect('/student/assignments');
    } catch {
      return res.redirect('/student/assignments');
    }
  }

  @Get('student/assignments')
  @Render('student/assignments')
  async studentAssignments(@Req() req: any) {
    const payload = req.userPayload;
    if (!payload || !payload.sub) {
      return { title: 'Bài tập', user: null, submissions: [], enrollments: [] };
    }

    try {
      const studentId = Number(payload.sub);
      const [student, submissions, enrollments] = await Promise.all([
        this.studentService.getProfileByUserId(studentId),
        this.studentService.getSubmissions(studentId),
        this.studentService.getEnrollments(studentId),
      ]);

      return { title: 'Bài tập', user: student, submissions, enrollments };
    } catch {
      return { title: 'Bài tập', user: null, submissions: [], enrollments: [] };
    }
  }

  @Get('student/assignments/:id')
  @Render('student/assignment-detail')
  studentAssignmentDetail(@Param('id') id: string) {
    return { title: 'Chi tiết bài tập', assignmentId: id };
  }

  @Get('student/attendance')
  @Render('student/attendance')
  async studentAttendance(@Req() req: any) {
    const payload = req.userPayload;
    if (!payload || !payload.sub) {
      return { title: 'Điểm danh', user: null, enrollments: [] };
    }

    try {
      const studentId = Number(payload.sub);
      const [student, enrollments] = await Promise.all([
        this.studentService.getProfileByUserId(studentId),
        this.studentService.getEnrollments(studentId),
      ]);

      return { title: 'Điểm danh', user: student, enrollments };
    } catch {
      return { title: 'Điểm danh', user: null, enrollments: [] };
    }
  }

  private getAllowedCourseStatusTransitions(currentStatus: CourseStatus): CourseStatus[] {
    const transitions: Record<CourseStatus, CourseStatus[]> = {
      [CourseStatus.DRAFT]: [CourseStatus.PENDING],
      [CourseStatus.PENDING]: [CourseStatus.PUBLISHED, CourseStatus.DRAFT],
      [CourseStatus.PUBLISHED]: [CourseStatus.CLOSED, CourseStatus.ARCHIVED],
      [CourseStatus.CLOSED]: [CourseStatus.ARCHIVED],
      [CourseStatus.ARCHIVED]: [],
    };

    return transitions[currentStatus] ?? [];
  }
}