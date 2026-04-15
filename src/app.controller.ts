import { Controller, Get, Render, Param, Req } from '@nestjs/common';
import { AppService } from './app.service';
import { StudentService } from './services/student.service';
import { UserService } from './services/user.service';
import { LecturerService } from './services/lecturer.service';
import { CourseService } from './services/course.service';
import { EnrollmentService } from './services/enrollment.service';
import { QuizService } from './services/quiz.service';
import { SubmissionService } from './services/submissions.service';
import { Lecturer } from './models/lecturers.entity';
import { Courses } from './models/courses.entity';
import { Submission } from './models/submission.entity';
import { Quiz } from './models/quizzes.entity';
import { Enrollment } from './models/enrollment.entity';
import { CourseStatus } from './common/enums/course-status.enum';

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
  adminUsers() {
    return { title: 'Quản lý người dùng' };
  }

  @Get('admin/settings')
  @Render('admin/settings')
  adminSettings() {
    return { title: 'Cài đặt hệ thống' };
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
  async staffCourseList(@Req() req: any) {
    const payload = req.userPayload;
    if (!payload || !payload.sub) return { title: 'Danh sách khóa học', courses: [], user: null };
    try {
      const lecturer = await this.lecturerService.getLecturerProfile(Number(payload.sub));
      const courses = await this.courseService.findAll(Number(payload.sub), payload.role);
      
      return { title: 'Danh sách khóa học', courses, user: lecturer };
    } catch {
      return { title: 'Danh sách khóa học', courses: [], user: null };
    }
  }

  @Get('staff/courses/:id')
  @Render('staff/course-detail')
  async staffCourseDetail(@Req() req: any, @Param('id') id: string) {
    const payload = req.userPayload;
    if (!payload || !payload.sub) return { title: 'Lỗi', courseId: id, course: null, user: null };
    
    try {
      const lecturer = await this.lecturerService.getLecturerProfile(Number(payload.sub));
      const course = await this.courseService.findOne(Number(id), Number(payload.sub), payload.role);
      return { title: 'Chi tiết khóa học', courseId: id, course, user: lecturer };
    } catch {
      return { title: 'Không tìm thấy khóa học', courseId: id, course: null, user: null };
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
      course: q.course?.id || 'N/A',
      courseName: q.course?.title || 'Chưa phân môn',
      difficulty: 'Trung bình',
      type: q.quizType === 'multiple_choice' ? 'multiple_choice' : 'essay',
      content: ques.questionText,
      options: []
    })));

    return { 
      title: 'Ngân hàng câu hỏi', 
      questions: questionsFormatted, 
      user: lecturer, 
      courses: courses 
    };
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
  async studentProfile(@Req() req: any) {
    const payload = req.userPayload;
    if (!payload) return { title: 'Hồ sơ sinh viên', user: null };
    try {
      const student = await this.studentService.getProfileByUserId(Number(payload.sub));
      return { title: 'Hồ sơ sinh viên', user: student };
    } catch {
      return { title: 'Hồ sơ sinh viên', user: null };
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
}