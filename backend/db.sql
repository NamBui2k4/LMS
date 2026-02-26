
DROP TABLE IF EXISTS submissions            CASCADE;
DROP TABLE IF EXISTS quiz_questions         CASCADE;
DROP TABLE IF EXISTS quizzes                CASCADE;
DROP TABLE IF EXISTS materials              CASCADE;
DROP TABLE IF EXISTS lessons                CASCADE;
DROP TABLE IF EXISTS enrollments            CASCADE;
DROP TABLE IF EXISTS course_instructors     CASCADE;
DROP TABLE IF EXISTS courses                CASCADE;
DROP TABLE IF EXISTS categories             CASCADE;
DROP TABLE IF EXISTS department_heads       CASCADE;
DROP TABLE IF EXISTS lecturers              CASCADE;
DROP TABLE IF EXISTS students               CASCADE;
DROP TABLE IF EXISTS admins                 CASCADE;
-- Bảng từ schema v1/v2 cũ (nếu còn tồn tại)
DROP TABLE IF EXISTS password_reset_tokens  CASCADE;
DROP TABLE IF EXISTS departments             CASCADE;
DROP TABLE IF EXISTS users                   CASCADE;

-- =======================
-- ENUM TYPES
-- =======================
DROP TYPE IF EXISTS course_status       CASCADE;
DROP TYPE IF EXISTS enrollment_status   CASCADE;
DROP TYPE IF EXISTS material_type       CASCADE;
DROP TYPE IF EXISTS quiz_type           CASCADE;
DROP TYPE IF EXISTS submission_status   CASCADE;
DROP TYPE IF EXISTS account_status      CASCADE;

CREATE TYPE course_status     AS ENUM ('draft', 'pending', 'published', 'closed', 'archived');
CREATE TYPE enrollment_status AS ENUM ('enrolled', 'in_progress', 'completed', 'dropped');
CREATE TYPE material_type     AS ENUM ('image', 'video', 'audio', 'document');
CREATE TYPE quiz_type         AS ENUM ('multiple_choice', 'essay');
CREATE TYPE submission_status AS ENUM ('submitted', 'graded', 'under_review');
CREATE TYPE account_status    AS ENUM ('active', 'inactive', 'banned');


-- ============================================================
--  NHÓM 1: NGƯỜI DÙNG (3 thực thể nghiệp vụ độc lập)
-- ============================================================

-- =======================
-- BẢNG: students
-- Học viên — thực thể độc lập
-- =======================
CREATE TABLE students (
    id              BIGSERIAL        PRIMARY KEY,
    fullname        VARCHAR(150)     NOT NULL,
    email           VARCHAR(255)     NOT NULL UNIQUE,
    phone           VARCHAR(20),
    avatar_url      TEXT,
    password_hash   VARCHAR(255),
    google_id       VARCHAR(255)     UNIQUE,
    status          account_status   NOT NULL DEFAULT 'active',
    created_at      TIMESTAMPTZ      NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMPTZ      NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE students IS 'Học viên — thực thể nghiệp vụ độc lập';

-- =======================
-- BẢNG: lecturers
-- Giảng viên — thực thể độc lập
-- department lưu dạng VARCHAR (không cần bảng riêng vì không có nghiệp vụ độc lập)
-- =======================
CREATE TABLE lecturers (
    instructor_id   BIGSERIAL        PRIMARY KEY,
    fullname        VARCHAR(150)     NOT NULL,
    email           VARCHAR(255)     NOT NULL UNIQUE,
    phone           VARCHAR(20),
    avatar_url      TEXT,
    bio             TEXT,
    academic_degree VARCHAR(50),     -- ThS, TS, PGS.TS, GS.TS
    subject         VARCHAR(150),    -- Chuyên ngành / môn giảng dạy chính
    department      VARCHAR(150),    -- Tên bộ môn — thuộc tính đơn (không FK)
    password_hash   VARCHAR(255),
    google_id       VARCHAR(255)     UNIQUE,
    status          account_status   NOT NULL DEFAULT 'active',
    created_at      TIMESTAMPTZ      NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMPTZ      NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE lecturers IS 'Giảng viên — thực thể nghiệp vụ độc lập';
COMMENT ON COLUMN lecturers.academic_degree IS 'Học vị: ThS, TS, PGS.TS, GS.TS';
COMMENT ON COLUMN lecturers.department      IS 'Bộ môn — lưu trực tiếp, không FK vì không có nghiệp vụ riêng';

-- =======================
-- BẢNG: department_heads
-- Trưởng bộ môn — specialization (IS-A) của Lecturer
-- Kế thừa toàn bộ dữ liệu từ lecturers qua cùng PK
-- Chỉ bổ sung thuộc tính/quyền đặc biệt: quyền duyệt khóa học
-- =======================
CREATE TABLE department_heads (
    instructor_id   BIGINT           PRIMARY KEY,  -- Cùng PK với lecturers (IS-A)
    appointed_at    TIMESTAMPTZ      NOT NULL DEFAULT NOW(),
    term_end        DATE,                          -- Ngày hết nhiệm kỳ (NULL = không xác định)

    CONSTRAINT fk_dh_lecturer
        FOREIGN KEY (instructor_id)
        REFERENCES lecturers(instructor_id)
        ON DELETE CASCADE
);

COMMENT ON TABLE department_heads IS 'Trưởng bộ môn — specialization của Lecturer (IS-A, PK chung). Có quyền duyệt/từ chối khóa học.';
COMMENT ON COLUMN department_heads.term_end IS 'NULL = nhiệm kỳ chưa xác định kết thúc';

-- =======================
-- BẢNG: admins
-- Quản trị viên — thực thể độc lập
-- =======================
CREATE TABLE admins (
    id                  BIGSERIAL        PRIMARY KEY,
    fullname            VARCHAR(150)     NOT NULL,
    email               VARCHAR(255)     NOT NULL UNIQUE,
    password_hash       VARCHAR(255),
    permissions         JSONB,           -- Danh sách quyền hạn
    recent_activity_log JSONB,           -- Nhật ký hoạt động gần nhất (SRS mới)
    status              account_status   NOT NULL DEFAULT 'active',
    created_at          TIMESTAMPTZ      NOT NULL DEFAULT NOW(),
    updated_at          TIMESTAMPTZ      NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE admins IS 'Quản trị viên — vận hành hệ thống';
COMMENT ON COLUMN admins.recent_activity_log IS 'Nhật ký hoạt động gần nhất theo SRS';


-- ============================================================
--  NHÓM 2: KHÓA HỌC & NỘI DUNG
-- ============================================================

-- =======================
-- BẢNG: categories
-- Danh mục phân loại khóa học
-- =======================
CREATE TABLE categories (
    id          SERIAL          PRIMARY KEY,
    name        VARCHAR(150)    NOT NULL UNIQUE,
    description TEXT,
    created_at  TIMESTAMPTZ     NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE categories IS 'Danh mục khóa học (CNTT, Ngoại ngữ, ...)';

-- =======================
-- BẢNG: courses
-- Khóa học — thực thể trung tâm
-- =======================
CREATE TABLE courses (
    id              BIGSERIAL       PRIMARY KEY,
    title           VARCHAR(255)    NOT NULL,
    description     TEXT,
    category_id     INT             NOT NULL,
    status          course_status   NOT NULL DEFAULT 'draft',
    created_by      BIGINT          NOT NULL,    -- FK → lecturers.instructor_id
    review_note     TEXT,                        -- Ghi chú từ DepartmentHead khi từ chối
    reviewed_by     BIGINT,                      -- FK → department_heads.instructor_id
    reviewed_at     TIMESTAMPTZ,
    created_at      TIMESTAMPTZ     NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMPTZ     NOT NULL DEFAULT NOW(),

    CONSTRAINT fk_course_category
        FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE RESTRICT,

    CONSTRAINT fk_course_creator
        FOREIGN KEY (created_by) REFERENCES lecturers(instructor_id) ON DELETE RESTRICT,

    CONSTRAINT fk_course_reviewer
        FOREIGN KEY (reviewed_by) REFERENCES department_heads(instructor_id) ON DELETE SET NULL
);

COMMENT ON TABLE courses IS 'Khóa học. Luồng trạng thái: draft → pending → published | closed | archived';
COMMENT ON COLUMN courses.reviewed_by IS 'Trưởng bộ môn duyệt khóa học';

-- =======================
-- BẢNG: course_instructors
-- Quan hệ N-N: Giảng viên phụ trách khóa học
-- (Một khóa học tối thiểu 1 giảng viên)
-- =======================
CREATE TABLE course_instructors (
    course_id       BIGINT          NOT NULL,
    instructor_id   BIGINT          NOT NULL,
    assigned_at     TIMESTAMPTZ     NOT NULL DEFAULT NOW(),

    PRIMARY KEY (course_id, instructor_id),

    CONSTRAINT fk_ci_course
        FOREIGN KEY (course_id) REFERENCES courses(id) ON DELETE CASCADE,

    CONSTRAINT fk_ci_instructor
        FOREIGN KEY (instructor_id) REFERENCES lecturers(instructor_id) ON DELETE CASCADE
);

COMMENT ON TABLE course_instructors IS 'Giảng viên phụ trách khóa học — quan hệ N-N';

-- =======================
-- BẢNG: lessons
-- Bài giảng — thực thể yếu, phụ thuộc vào courses
-- =======================
CREATE TABLE lessons (
    id              BIGSERIAL       PRIMARY KEY,
    course_id       BIGINT          NOT NULL,
    title           VARCHAR(255)    NOT NULL,
    summary         TEXT,
    content         TEXT,
    order_index     INT             NOT NULL DEFAULT 0,
    created_at      TIMESTAMPTZ     NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMPTZ     NOT NULL DEFAULT NOW(),

    CONSTRAINT fk_lesson_course
        FOREIGN KEY (course_id) REFERENCES courses(id) ON DELETE CASCADE
);

COMMENT ON TABLE lessons IS 'Bài giảng — thực thể yếu, xóa khi khóa học bị xóa';

-- =======================
-- BẢNG: materials
-- Học liệu đính kèm bài giảng — thực thể yếu, phụ thuộc vào lessons
-- =======================
CREATE TABLE materials (
    id              BIGSERIAL           PRIMARY KEY,
    lesson_id       BIGINT              NOT NULL,
    file_name       VARCHAR(255)        NOT NULL,
    file_url        TEXT                NOT NULL,
    file_type       material_type       NOT NULL,
    file_size_kb    INT,
    order_index     INT                 NOT NULL DEFAULT 0,
    created_at      TIMESTAMPTZ         NOT NULL DEFAULT NOW(),

    CONSTRAINT fk_material_lesson
        FOREIGN KEY (lesson_id) REFERENCES lessons(id) ON DELETE CASCADE
);

COMMENT ON TABLE materials IS 'Học liệu (image/video/audio/document) — thực thể yếu, xóa khi bài giảng bị xóa';


-- ============================================================
--  NHÓM 3: GHI DANH & ĐÁNH GIÁ
-- ============================================================

-- =======================
-- BẢNG: enrollments
-- Ghi danh học viên vào khóa học — thực thể yếu
-- Phụ thuộc vào courses (cascade delete theo SRS)
-- =======================
CREATE TABLE enrollments (
    id              BIGSERIAL           PRIMARY KEY,
    student_id      BIGINT              NOT NULL,
    course_id       BIGINT              NOT NULL,
    status          enrollment_status   NOT NULL DEFAULT 'enrolled',
    progress_pct    NUMERIC(5,2)        NOT NULL DEFAULT 0.00
                    CHECK (progress_pct >= 0 AND progress_pct <= 100),
    enrolled_at     TIMESTAMPTZ         NOT NULL DEFAULT NOW(),
    completed_at    TIMESTAMPTZ,

    -- Mỗi học viên chỉ ghi danh 1 lần vào 1 khóa học
    CONSTRAINT uq_enrollment UNIQUE (student_id, course_id),

    CONSTRAINT fk_enrollment_student
        FOREIGN KEY (student_id) REFERENCES students(id) ON DELETE CASCADE,

    CONSTRAINT fk_enrollment_course
        FOREIGN KEY (course_id) REFERENCES courses(id) ON DELETE CASCADE
);

COMMENT ON TABLE enrollments IS 'Ghi danh học viên — thực thể yếu. Xóa khi khóa học hoặc học viên bị xóa';
COMMENT ON COLUMN enrollments.progress_pct IS 'Tiến độ hoàn thành (0-100%)';

-- =======================
-- BẢNG: quizzes
-- Bài kiểm tra — thực thể yếu, phụ thuộc vào courses
-- =======================
CREATE TABLE quizzes (
    id              BIGSERIAL       PRIMARY KEY,
    course_id       BIGINT          NOT NULL,
    title           VARCHAR(255)    NOT NULL,
    quiz_type       quiz_type       NOT NULL DEFAULT 'multiple_choice',
    max_score       NUMERIC(6,2)    NOT NULL DEFAULT 100.00,
    pass_score      NUMERIC(6,2),
    duration_min    INT,
    created_by      BIGINT          NOT NULL,   -- FK → lecturers
    created_at      TIMESTAMPTZ     NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMPTZ     NOT NULL DEFAULT NOW(),

    CONSTRAINT fk_quiz_course
        FOREIGN KEY (course_id) REFERENCES courses(id) ON DELETE CASCADE,

    CONSTRAINT fk_quiz_creator
        FOREIGN KEY (created_by) REFERENCES lecturers(instructor_id) ON DELETE RESTRICT
);

COMMENT ON TABLE quizzes IS 'Bài kiểm tra — thực thể yếu, xóa khi khóa học bị xóa';

-- =======================
-- BẢNG: quiz_questions
-- Câu hỏi trong bài kiểm tra
-- =======================
CREATE TABLE quiz_questions (
    id              BIGSERIAL       PRIMARY KEY,
    quiz_id         BIGINT          NOT NULL,
    question_text   TEXT            NOT NULL,
    options         JSONB,          -- [{label, text, is_correct}] — chỉ trắc nghiệm
    correct_answer  TEXT,
    score_weight    NUMERIC(5,2)    NOT NULL DEFAULT 1.00,
    order_index     INT             NOT NULL DEFAULT 0,

    CONSTRAINT fk_question_quiz
        FOREIGN KEY (quiz_id) REFERENCES quizzes(id) ON DELETE CASCADE
);

COMMENT ON TABLE quiz_questions IS 'Câu hỏi bài kiểm tra — xóa khi bài kiểm tra bị xóa';
COMMENT ON COLUMN quiz_questions.options IS 'JSON array lựa chọn cho câu trắc nghiệm';

-- =======================
-- BẢNG: submissions
-- Bài nộp của học viên — thực thể yếu
-- Phụ thuộc học viên (cascade) và bài kiểm tra (cascade)
-- Trong ERD: submissions kết nối với users & quizzes qua "submit"
-- → Sửa đúng: kết nối với students (không phải users chung)
-- =======================
CREATE TABLE submissions (
    id                  BIGSERIAL           PRIMARY KEY,
    quiz_id             BIGINT              NOT NULL,
    student_id          BIGINT              NOT NULL,
    answer_data         JSONB,              -- Câu trả lời của học viên
    score               NUMERIC(6,2),
    status              submission_status   NOT NULL DEFAULT 'submitted',
    submitted_at        TIMESTAMPTZ         NOT NULL DEFAULT NOW(),
    graded_at           TIMESTAMPTZ,
    graded_by           BIGINT,             -- FK → lecturers (null nếu tự động)
    regrade_requested   BOOLEAN             NOT NULL DEFAULT FALSE,
    regrade_note        TEXT,

    CONSTRAINT fk_submission_quiz
        FOREIGN KEY (quiz_id) REFERENCES quizzes(id) ON DELETE CASCADE,

    CONSTRAINT fk_submission_student
        FOREIGN KEY (student_id) REFERENCES students(id) ON DELETE CASCADE,

    CONSTRAINT fk_submission_grader
        FOREIGN KEY (graded_by) REFERENCES lecturers(instructor_id) ON DELETE SET NULL
);



COMMENT ON TABLE submissions IS 'Bài nộp — thực thể yếu. Xóa khi học viên hoặc bài kiểm tra bị xóa';
COMMENT ON COLUMN submissions.graded_by IS 'Giảng viên chấm điểm. NULL = hệ thống tự chấm (trắc nghiệm)';
COMMENT ON COLUMN submissions.regrade_requested IS 'TRUE nếu học viên yêu cầu phúc khảo';


-- ============================================================
--  INDEXES — Tối ưu truy vấn thường dùng
-- ============================================================

-- students
CREATE INDEX idx_students_email     ON students(email);
CREATE INDEX idx_students_status    ON students(status);

-- lecturers
CREATE INDEX idx_lecturers_email        ON lecturers(email);
CREATE INDEX idx_lecturers_department   ON lecturers(department);  -- VARCHAR, không phải FK

-- courses
CREATE INDEX idx_courses_status         ON courses(status);
CREATE INDEX idx_courses_category       ON courses(category_id);
CREATE INDEX idx_courses_created_by     ON courses(created_by);

-- lessons
CREATE INDEX idx_lessons_course         ON lessons(course_id);
CREATE INDEX idx_lessons_order          ON lessons(course_id, order_index);

-- materials
CREATE INDEX idx_materials_lesson       ON materials(lesson_id);

-- enrollments
CREATE INDEX idx_enrollments_student    ON enrollments(student_id);
CREATE INDEX idx_enrollments_course     ON enrollments(course_id);
CREATE INDEX idx_enrollments_status     ON enrollments(status);

-- quizzes
CREATE INDEX idx_quizzes_course         ON quizzes(course_id);

-- quiz_questions
CREATE INDEX idx_questions_quiz         ON quiz_questions(quiz_id);

-- submissions
CREATE INDEX idx_submissions_student    ON submissions(student_id);
CREATE INDEX idx_submissions_quiz       ON submissions(quiz_id);
CREATE INDEX idx_submissions_status     ON submissions(status);


-- ============================================================
--  DỮ LIỆU MẪU (Seed)
-- ============================================================

-- Danh mục khóa học mẫu
INSERT INTO categories (name, description) VALUES
    ('Công nghệ thông tin', 'Lập trình, hệ thống, mạng'),
    ('Ngoại ngữ', 'Tiếng Anh, Tiếng Nhật ...'),
    ('Kinh tế - Quản trị', 'Quản trị kinh doanh, Tài chính');

-- Admin mặc định
INSERT INTO admins (fullname, email, password_hash, permissions)
VALUES ('Administrator', 'admin@lms.edu.vn', '$2b$12$placeholder', '["all"]');


