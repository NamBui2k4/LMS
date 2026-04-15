-- Seed dữ liệu mẫu cho LMS
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- Admin (user_id = 1)
INSERT INTO users (email, password_hash, role, is_active, created_at, updated_at)
VALUES ('admin@gmail.com', crypt('123456', gen_salt('bf')), 'ADMIN', true, NOW(), NOW())
ON CONFLICT (email) DO NOTHING;

INSERT INTO admins (user_id, fullname, permissions)
SELECT id, 'Administrator', '["all"]'::jsonb
FROM users WHERE email = 'admin@gmail.com'
ON CONFLICT (user_id) DO NOTHING;

-- Lecturers
INSERT INTO users (email, password_hash, role, is_active, created_at, updated_at)
VALUES
  ('nguyenvana@lecturer.tdtu.edu.vn', crypt('lecturer123', gen_salt('bf')), 'LECTURER', true, NOW(), NOW()),
  ('tranthib@lecturer.tdtu.edu.vn',   crypt('lecturer123', gen_salt('bf')), 'LECTURER', true, NOW(), NOW())
ON CONFLICT (email) DO NOTHING;

INSERT INTO lecturers (user_id, fullname, email, phone, bio, academic_degree, subject, department, status)
SELECT u.id, v.fullname, v.email, v.phone, v.bio, v.degree, v.subject, v.dept, 'active'
FROM (VALUES
  ('nguyenvana@lecturer.tdtu.edu.vn', 'TS. Nguyen Van An',  '0901111111', 'Giang vien CNTT', 'TS',  'Lap trinh Web',        'Khoa CNTT'),
  ('tranthib@lecturer.tdtu.edu.vn',   'ThS. Tran Thi Bich', '0902222222', 'Giang vien NN',   'ThS', 'Tieng Anh Chuyen nganh','Khoa Ngoai ngu')
) AS v(email, fullname, phone, bio, degree, subject, dept)
JOIN users u ON u.email = v.email
ON CONFLICT (user_id) DO NOTHING;

-- Students
INSERT INTO users (email, password_hash, role, is_active, created_at, updated_at)
VALUES
  ('52200001@student.tdtu.edu.vn', crypt('student123', gen_salt('bf')), 'STUDENT', true, NOW(), NOW()),
  ('52200002@student.tdtu.edu.vn', crypt('student123', gen_salt('bf')), 'STUDENT', true, NOW(), NOW()),
  ('52200003@student.tdtu.edu.vn', crypt('student123', gen_salt('bf')), 'STUDENT', true, NOW(), NOW())
ON CONFLICT (email) DO NOTHING;

INSERT INTO students (user_id, fullname, email, phone, status)
SELECT u.id, v.fullname, v.email, v.phone, 'active'
FROM (VALUES
  ('52200001@student.tdtu.edu.vn', 'Nguyen Minh Tuan', '0911000001'),
  ('52200002@student.tdtu.edu.vn', 'Tran Thi Lan Anh', '0911000002'),
  ('52200003@student.tdtu.edu.vn', 'Le Quoc Hung',     '0911000003')
) AS v(email, fullname, phone)
JOIN users u ON u.email = v.email
ON CONFLICT (user_id) DO NOTHING;

-- Xem kết quả
SELECT id, email, role FROM users ORDER BY id;

-- CATEGORY
INSERT INTO categories (name, description)
VALUES ('Lập trình', 'Khóa học lập trình')
ON CONFLICT (name) DO NOTHING;

-- COURSE
INSERT INTO courses (title, description, category_id, created_by, status)
SELECT 
    'Java Backend',
    'Khóa học Java Spring Boot',
    c.id,
    l.user_id,
    'published'
FROM categories c, lecturers l
WHERE c.name = 'Lập trình'
LIMIT 1;

-- COURSE_INSTRUCTORS
INSERT INTO course_instructors (course_id, instructor_id)
SELECT c.id, l.user_id
FROM courses c, lecturers l
WHERE c.title = 'Java Backend'
LIMIT 1;

-- LESSON
INSERT INTO lessons (course_id, title, summary, content, order_index)
SELECT c.id, v.title, v.summary, v.content, v.order_index
FROM (VALUES
  ('Giới thiệu Java', 'Intro', 'Nội dung Java cơ bản', 1),
  ('Vòng lặp và rẽ nhánh', 'Control Flow', 'Sử dụng if-else, for, while', 2),
  ('Lập trình hướng đối tượng', 'OOP', 'Class, Object, Inheritance, Polymorphism', 3)
) AS v(title, summary, content, order_index)
JOIN courses c ON c.title = 'Java Backend'
ON CONFLICT DO NOTHING;

-- MATERIAL
INSERT INTO materials (lesson_id, file_name, file_url, file_type)
SELECT l.id, v.file_name, v.file_url, v.file_type::material_type
FROM (VALUES
  ('Giới thiệu Java', 'java-intro.pdf', '/storage/materials/java-intro.pdf', 'document'),
  ('Giới thiệu Java', 'java-setup.mp4', '/storage/materials/java-setup.mp4', 'video'),
  ('Vòng lặp và rẽ nhánh', 'flow-control.pdf', '/storage/materials/flow-control.pdf', 'document')
) AS v(lesson_title, file_name, file_url, file_type)
JOIN lessons l ON l.title = v.lesson_title
ON CONFLICT DO NOTHING;

-- ENROLLMENT
INSERT INTO enrollments (student_id, course_id, progress_pct)
SELECT s.user_id, c.id, 20
FROM students s, courses c
WHERE c.title = 'Java Backend'
LIMIT 1;

-- QUIZ
INSERT INTO quizzes (course_id, title, created_by)
SELECT c.id, v.title, l.user_id
FROM (VALUES
  ('Quiz Java cơ bản'),
  ('Bài kiểm tra giữa kỳ')
) AS v(title)
JOIN courses c ON c.title = 'Java Backend'
JOIN lecturers l ON l.email = 'nguyenvana@lecturer.tdtu.edu.vn'
ON CONFLICT DO NOTHING;

-- QUESTION
INSERT INTO quiz_questions (quiz_id, question_text, correct_answer)
SELECT q.id, v.text, v.ans
FROM (VALUES
  ('Quiz Java cơ bản', 'Java là gì?', 'Ngôn ngữ lập trình'),
  ('Quiz Java cơ bản', 'Từ khóa nào dùng để khai báo class?', 'class'),
  ('Bài kiểm tra giữa kỳ', 'Tính kế thừa trong Java sử dụng từ khóa nào?', 'extends')
) AS v(quiz_title, text, ans)
JOIN quizzes q ON q.title = v.quiz_title
ON CONFLICT DO NOTHING;

-- SUBMISSION
INSERT INTO submissions (quiz_id, student_id, answer_data, score, graded_by)
SELECT q.id, s.user_id, v.ans_data::jsonb, v.score, l.user_id
FROM (VALUES
  ('Quiz Java cơ bản', '52200001@student.tdtu.edu.vn', '{"answer": "Ngôn ngữ lập trình"}', 10, 'nguyenvana@lecturer.tdtu.edu.vn'),
  ('Quiz Java cơ bản', '52200002@student.tdtu.edu.vn', '{"answer": "Công cụ quản lý"}', 2, 'nguyenvana@lecturer.tdtu.edu.vn'),
  ('Bài kiểm tra giữa kỳ', '52200001@student.tdtu.edu.vn', '{"answer": "extends"}', 10, 'nguyenvana@lecturer.tdtu.edu.vn')
) AS v(quiz_title, student_email, ans_data, score, lecturer_email)
JOIN quizzes q ON q.title = v.quiz_title
JOIN students s ON s.email = v.student_email
JOIN lecturers l ON l.email = v.lecturer_email
ON CONFLICT DO NOTHING;

INSERT INTO students (
    user_id, 
    fullname, 
    email, 
    phone, 
    student_code, -- MSSV
    faculty,      -- Khoa chủ quản
    major,        -- Ngành học
    address,      -- Địa chỉ
    status
)
SELECT 
    id, 
    'Nguyen Minh Tuan', 
    '52200001@student.tdtu.edu.vn', 
    '0909 123 456', 
    '52200001', 
    'Khoa Công nghệ Thông tin', 
    'Kỹ thuật Phần mềm (Khóa 25)', 
    'Quận 7, TP. Hồ Chí Minh', 
    'active'
FROM users 
WHERE email = '52200001@student.tdtu.edu.vn'
ON CONFLICT (user_id) DO UPDATE SET
    fullname = EXCLUDED.fullname,
    phone = EXCLUDED.phone,
    student_code = EXCLUDED.student_code,
    faculty = EXCLUDED.faculty,
    major = EXCLUDED.major,
    address = EXCLUDED.address;



INSERT INTO students (

    user_id, 

    fullname, 

    email, 

    phone, 

    student_code, 

    faculty,      

    major,        

    address,      

    status

)

SELECT 

    id, 

    'Tran Thi Lan Anh', 

    '52200002@student.tdtu.edu.vn', 

    '0911000002', 

    '52200002', 

    'Khoa Ngoại ngữ', 

    'Ngôn ngữ Anh (Khóa 25)', 

    'Quận 1, TP. Hồ Chí Minh', 

    'active'

FROM users 

WHERE email = '52200002@student.tdtu.edu.vn'

ON CONFLICT (user_id) DO UPDATE SET

    fullname = EXCLUDED.fullname,

    student_code = EXCLUDED.student_code,

    faculty = EXCLUDED.faculty,

    major = EXCLUDED.major,

    address = EXCLUDED.address;




-- Insert/Update thông tin chi tiết vào bảng students

INSERT INTO students (

    user_id, 

    fullname, 

    email, 

    phone, 

    student_code, 

    faculty,      

    major,        

    address,      

    status

)

SELECT 

    id, 

    'Le Quoc Hung', 

    '52200003@student.tdtu.edu.vn', 

    '0911000003', 

    '52200003', 

    'Khoa Kinh tế - Quản trị', 

    'Quản trị kinh doanh (Khóa 25)', 

    'Quận Bình Thạnh, TP. Hồ Chí Minh', 

    'active'

FROM users 

WHERE email = '52200003@student.tdtu.edu.vn'

ON CONFLICT (user_id) DO UPDATE SET

    fullname = EXCLUDED.fullname,

    student_code = EXCLUDED.student_code,

    faculty = EXCLUDED.faculty,

    major = EXCLUDED.major,

    address = EXCLUDED.address;