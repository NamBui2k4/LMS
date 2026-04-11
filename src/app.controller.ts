import { Controller, Get, Render, Param, Redirect } from '@nestjs/common';
import { AppService } from './app.service';

@Controller()
export class AppController {
  constructor(private readonly appService: AppService) { }

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
  adminDashboard() {
    return { title: 'Admin Dashboard' };
  }

  @Get('admin/dashboard')
  @Render('admin/dashboard')
  adminDashboardAlt() {
    return { title: 'Admin Dashboard' };
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
  staffDashboard() {
    return { title: 'Staff Dashboard' };
  }

  @Get('staff/courses')
  @Render('staff/course-list')
  staffCourseList() {
    return { title: 'Danh sách khóa học' };
  }

  @Get('staff/courses/:id')
  @Render('staff/course-detail')
  staffCourseDetail(@Param('id') id: string) {
    return { title: 'Chi tiết khóa học', courseId: id };
  }

  @Get('staff/grading')
  @Render('staff/grading')
  staffGrading() {
    return { title: 'Chấm điểm' };
  }

  @Get('staff/question-bank')
  @Render('staff/question-bank')
  staffQuestionBank() {
    return { title: 'Ngân hàng câu hỏi' };
  }

  @Get('staff/reports')
  @Render('staff/reports')
  staffReports() {
    return { title: 'Báo cáo' };
  }

  // ====================== STUDENT ======================
  @Get('student')
  @Render('student/profile')
  studentDashboard() {
    return { title: 'Student Dashboard' };
  }

  @Get('student/profile')
  @Render('student/profile')
  studentProfile() {
    return { title: 'Hồ sơ sinh viên' };
  }

  @Get('student/courses')
  @Render('student/course-list')
  studentCourseList() {
    return { title: 'Khóa học của tôi' };
  }

  @Get('student/courses/:id')
  @Render('student/course-detail')
  studentCourseDetail(@Param('id') id: string) {
    return { title: 'Chi tiết khóa học', courseId: id };
  }

  @Get('student/assignments')
  @Render('student/assignments')
  studentAssignments() {
    return { title: 'Bài tập' };
  }

  @Get('student/assignments/:id')
  @Render('student/assignment-detail')
  studentAssignmentDetail(@Param('id') id: string) {
    return { title: 'Chi tiết bài tập', assignmentId: id };
  }

  @Get('student/attendance')
  @Render('student/attendance')
  studentAttendance() {
    return { title: 'Điểm danh' };
  }
}