
-- ============================================================
--  NHÓM 0: QUẢN LÝ TÀI KHOẢN CHUNG (IDENTITY)
-- ============================================================

-- =======================
-- BẢNG: users
-- Bảng identity chung cho xác thực và phân quyền (RBAC)
-- =======================
CREATE TABLE users (
    id                    BIGSERIAL        PRIMARY KEY,
    email                 VARCHAR(255)     NOT NULL UNIQUE,
    password_hash         VARCHAR(255),
    google_id             VARCHAR(255)     UNIQUE,
    role                  VARCHAR(50)      NOT NULL CHECK (role IN ('STUDENT', 'LECTURER', 'HEAD_OF_DEPARTMENT', 'ADMIN')),
    is_active             BOOLEAN          NOT NULL DEFAULT true,
    last_login_at         TIMESTAMPTZ,
    failed_login_attempts INT              DEFAULT 0,
    locked_until          TIMESTAMPTZ,
    created_at            TIMESTAMPTZ      NOT NULL DEFAULT NOW(),
    updated_at            TIMESTAMPTZ      NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE users IS 'Bảng identity chung cho xác thực và phân quyền (RBAC). Không lưu profile chi tiết.';
COMMENT ON COLUMN users.email IS 'Email dùng để đăng nhập, unique toàn hệ thống';
COMMENT ON COLUMN users.role IS 'Vai trò chính của người dùng, quyết định quyền hạn cơ bản';


-- ============================================================
--  NHÓM 1: NGƯỜI DÙNG (3 thực thể nghiệp vụ kế thừa từ users)
-- ============================================================

-- =======================
-- BẢNG: students
-- Học viên — kế thừa users (Table-Per-Type)
-- =======================
CREATE TABLE students (
    user_id         BIGINT           PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
    fullname        VARCHAR(150)     NOT NULL,
    email           VARCHAR(255)     NOT NULL UNIQUE,
    phone           VARCHAR(20),
    avatar_url      TEXT,
    google_id       VARCHAR(255)     UNIQUE,
    student_code    VARCHAR(20)      UNIQUE,
    faculty         VARCHAR(150),
    major           VARCHAR(150),
    address         TEXT,
    status          account_status   NOT NULL DEFAULT 'active',
    created_at      TIMESTAMPTZ      NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMPTZ      NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE students IS 'Học viên — kế thừa bảng users (quan hệ 1-1)';

-- =======================
-- BẢNG: lecturers
-- Giảng viên — kế thừa users (Table-Per-Type)
-- =======================
CREATE TABLE lecturers (
    user_id         BIGINT           PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
    fullname        VARCHAR(150)     NOT NULL,
    email           VARCHAR(255)     NOT NULL UNIQUE,
    phone           VARCHAR(20),
    avatar_url      TEXT,
    bio             TEXT,
    academic_degree VARCHAR(50),     -- ThS, TS, PGS.TS, GS.TS
    subject         VARCHAR(150),    -- Chuyên ngành / môn giảng dạy chính
    department      VARCHAR(150),    -- Tên bộ môn
    password_hash   VARCHAR(255),
    google_id       VARCHAR(255)     UNIQUE,
    status          account_status   NOT NULL DEFAULT 'active',
    created_at      TIMESTAMPTZ      NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMPTZ      NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE lecturers IS 'Giảng viên — kế thừa bảng users (quan hệ 1-1)';
COMMENT ON COLUMN lecturers.academic_degree IS 'Học vị: ThS, TS, PGS.TS, GS.TS';

-- =======================
-- BẢNG: department_heads
-- Trưởng bộ môn — kế thừa lecturers (Table-Per-Type)
-- =======================
CREATE TABLE department_heads (
    user_id         BIGINT           PRIMARY KEY REFERENCES lecturers(user_id) ON DELETE CASCADE,
    appointed_at    TIMESTAMPTZ      NOT NULL DEFAULT NOW(),
    term_end        DATE             -- Ngày hết nhiệm kỳ (NULL = không xác định)
);

COMMENT ON TABLE department_heads IS 'Trưởng bộ môn — kế thừa bảng lecturers (quan hệ 1-1)';

-- =======================
-- BẢNG: admins
-- Quản trị viên — kế thừa users (Table-Per-Type)
-- =======================
CREATE TABLE admins (
    user_id             BIGINT           PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
    fullname            VARCHAR(150)     NOT NULL,
    permissions         JSONB,           -- Danh sách quyền hạn
    recent_activity_log JSONB,           -- Nhật ký hoạt động gần nhất
    status              account_status   NOT NULL DEFAULT 'active',
    created_at          TIMESTAMPTZ      NOT NULL DEFAULT NOW(),
    updated_at          TIMESTAMPTZ      NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE admins IS 'Quản trị viên — kế thừa bảng users (quan hệ 1-1)';


-- ============================================================
--  NHÓM 2: KHÓA HỌC & NỘI DUNG
-- ============================================================

-- =======================
-- BẢNG: categories
-- =======================
CREATE TABLE categories (
    id          SERIAL          PRIMARY KEY,
    name        VARCHAR(150)    NOT NULL UNIQUE,
    description TEXT,
    created_at  TIMESTAMPTZ     NOT NULL DEFAULT NOW()
);

-- =======================
-- BẢNG: courses
-- =======================
CREATE TABLE courses (
    id              BIGSERIAL       PRIMARY KEY,
    title           VARCHAR(255)    NOT NULL,
    description     TEXT,
    category_id     INT             NOT NULL,
    status          course_status   NOT NULL DEFAULT 'draft',
    created_by      BIGINT          NOT NULL,    -- FK → lecturers.user_id
    review_note     TEXT,
    reviewed_by     BIGINT,                      -- FK → department_heads.user_id
    reviewed_at     TIMESTAMPTZ,
    created_at      TIMESTAMPTZ     NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMPTZ     NOT NULL DEFAULT NOW(),

    CONSTRAINT fk_course_category
        FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE RESTRICT,

    CONSTRAINT fk_course_creator
        FOREIGN KEY (created_by) REFERENCES lecturers(user_id) ON DELETE RESTRICT,

    CONSTRAINT fk_course_reviewer
        FOREIGN KEY (reviewed_by) REFERENCES department_heads(user_id) ON DELETE SET NULL
);

-- =======================
-- BẢNG: course_instructors
-- =======================
CREATE TABLE course_instructors (
    course_id       BIGINT          NOT NULL,
    instructor_id   BIGINT          NOT NULL,    -- FK → lecturers.user_id
    assigned_at     TIMESTAMPTZ     NOT NULL DEFAULT NOW(),

    PRIMARY KEY (course_id, instructor_id),

    CONSTRAINT fk_ci_course
        FOREIGN KEY (course_id) REFERENCES courses(id) ON DELETE CASCADE,

    CONSTRAINT fk_ci_instructor
        FOREIGN KEY (instructor_id) REFERENCES lecturers(user_id) ON DELETE CASCADE
);

-- =======================
-- BẢNG: lessons
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

-- =======================
-- BẢNG: materials
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


-- ============================================================
--  NHÓM 3: GHI DANH & ĐÁNH GIÁ
-- ============================================================

-- =======================
-- BẢNG: enrollments
-- =======================
CREATE TABLE enrollments (
    id              BIGSERIAL           PRIMARY KEY,
    student_id      BIGINT              NOT NULL,    -- FK → students.user_id
    course_id       BIGINT              NOT NULL,
    status          enrollment_status   NOT NULL DEFAULT 'enrolled',
    progress_pct    NUMERIC(5,2)        NOT NULL DEFAULT 0.00 CHECK (progress_pct >= 0 AND progress_pct <= 100),
    enrolled_at     TIMESTAMPTZ         NOT NULL DEFAULT NOW(),
    completed_at    TIMESTAMPTZ,

    CONSTRAINT uq_enrollment UNIQUE (student_id, course_id),

    CONSTRAINT fk_enrollment_student
        FOREIGN KEY (student_id) REFERENCES students(user_id) ON DELETE CASCADE,

    CONSTRAINT fk_enrollment_course
        FOREIGN KEY (course_id) REFERENCES courses(id) ON DELETE CASCADE
);

-- =======================
-- BẢNG: quizzes
-- =======================
CREATE TABLE quizzes (
    id              BIGSERIAL       PRIMARY KEY,
    course_id       BIGINT          NOT NULL,
    title           VARCHAR(255)    NOT NULL,
    quiz_type       quiz_type       NOT NULL DEFAULT 'multiple_choice',
    max_score       NUMERIC(6,2)    NOT NULL DEFAULT 100.00,
    pass_score      NUMERIC(6,2),
    duration_min    INT,
    created_by      BIGINT          NOT NULL,   -- FK → lecturers.user_id
    created_at      TIMESTAMPTZ     NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMPTZ     NOT NULL DEFAULT NOW(),

    CONSTRAINT fk_quiz_course
        FOREIGN KEY (course_id) REFERENCES courses(id) ON DELETE CASCADE,

    CONSTRAINT fk_quiz_creator
        FOREIGN KEY (created_by) REFERENCES lecturers(user_id) ON DELETE RESTRICT
);

-- =======================
-- BẢNG: quiz_questions
-- =======================
CREATE TABLE quiz_questions (
    id              BIGSERIAL       PRIMARY KEY,
    quiz_id         BIGINT          NOT NULL,
    question_text   TEXT            NOT NULL,
    options         JSONB,
    correct_answer  TEXT,
    score_weight    NUMERIC(5,2)    NOT NULL DEFAULT 1.00,
    order_index     INT             NOT NULL DEFAULT 0,

    CONSTRAINT fk_question_quiz
        FOREIGN KEY (quiz_id) REFERENCES quizzes(id) ON DELETE CASCADE
);

-- =======================
-- BẢNG: submissions
-- =======================
CREATE TABLE submissions (
    id                  BIGSERIAL           PRIMARY KEY,
    quiz_id             BIGINT              NOT NULL,
    student_id          BIGINT              NOT NULL,    -- FK → students.user_id
    answer_data         JSONB,
    score               NUMERIC(6,2),
    status              submission_status   NOT NULL DEFAULT 'submitted',
    submitted_at        TIMESTAMPTZ         NOT NULL DEFAULT NOW(),
    graded_at           TIMESTAMPTZ,
    graded_by           BIGINT,                          -- FK → lecturers.user_id
    regrade_requested   BOOLEAN             NOT NULL DEFAULT FALSE,
    regrade_note        TEXT,

    CONSTRAINT fk_submission_quiz
        FOREIGN KEY (quiz_id) REFERENCES quizzes(id) ON DELETE CASCADE,

    CONSTRAINT fk_submission_student
        FOREIGN KEY (student_id) REFERENCES students(user_id) ON DELETE CASCADE,

    CONSTRAINT fk_submission_grader
        FOREIGN KEY (graded_by) REFERENCES lecturers(user_id) ON DELETE SET NULL
);


-- ============================================================
--  INDEXES
-- ============================================================

-- users
CREATE INDEX idx_users_email            ON users(email);
CREATE INDEX idx_users_role             ON users(role);
CREATE INDEX idx_users_is_active        ON users(is_active);

-- students
CREATE INDEX idx_students_email         ON students(email);
CREATE INDEX idx_students_status        ON students(status);

-- lecturers
CREATE INDEX idx_lecturers_email        ON lecturers(email);
CREATE INDEX idx_lecturers_department   ON lecturers(department);

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

INSERT INTO categories (name, description) VALUES
    ('Công nghệ thông tin', 'Lập trình, hệ thống, mạng'),
    ('Ngoại ngữ', 'Tiếng Anh, Tiếng Nhật ...'),
    ('Kinh tế - Quản trị', 'Quản trị kinh doanh, Tài chính');

-- Để tạo admin mẫu, bây giờ bạn cần tạo user trước, sau đó dùng ID đó để tạo admin.
-- Ví dụ (chạy trong function hoặc thủ công):
-- INSERT INTO users (email, role) VALUES ('admin@lms.edu.vn', 'ADMIN');
INSERT INTO users (
    email,
    password_hash,
    role,
    is_active,
    created_at,
    updated_at
) VALUES (
    'admin@lms.com',
    '$2a$12$GNxEkDnEQxQ0M7t4NkA.bu9UaOsOM6dDFfnYxd.TCgh.Y/D6HcZ9C',
    'ADMIN',
    true,
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP
);

INSERT INTO admins ( user_id, fullname, permissions) VALUES ( 1, 'Administrator', '["all"]');


