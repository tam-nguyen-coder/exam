Tôi muốn xây dựng một ứng dụng web cho phép người dùng có thể thi thử các bài thi từ kho câu hỏi có sẵn.
Ứng dụng sẽ sử dụng PostgreSQL database để lưu trữ dữ liệu và có hệ thống xác thực người dùng.
Các câu hỏi được lưu trực tiếp trong database, mỗi bộ câu hỏi (question pool) sẽ có nhiều câu hỏi (questions) và mỗi câu hỏi có nhiều đáp án (answers).
Khi người dùng vào trang web thì sẽ có một số tuỳ chọn sau:
1. Chọn bộ câu hỏi, cho phép user chọn bộ câu hỏi muốn thi thử từ danh sách có sẵn trong database.
2. Chọn số lượng câu hỏi mỗi bài thi, default là tổng số câu hỏi trong bộ câu hỏi đã chọn.
3. Chọn thời gian làm bài tính bằng phút, default là số phút bằng số lượng câu hỏi.
4. Hệ thống xác thực người dùng:
   - Đăng ký/Đăng nhập với email và mật khẩu
   - Quản lý phiên đăng nhập (session management)
   - Bảo mật với JWT tokens
   - Middleware xác thực cho các route bảo vệ

5. Khi nộp bài, cần lưu lại hết các câu trả lời của user vào PostgreSQL database:
   - Bảng users: lưu thông tin người dùng
   - Bảng exam_sessions: lưu thông tin các lần thi
   - Bảng user_answers: lưu câu trả lời chi tiết của từng câu hỏi
   - Bảng question_stats: thống kê hiệu suất của user với từng câu hỏi
   Mỗi lần làm bài thì sẽ cập nhật lại vào database, nếu làm đúng thì tăng countTrue, làm sai thì tăng countFalse.
6. Khi tạo bài test, các câu hỏi sẽ là ngẫu nhiên trong bộ câu hỏi, nhưng phải tạo ra thuật toán để ưu tiên các câu chưa làm và câu làm sai nhiều lần. Thuật toán cần tính điểm ưu tiên (score) theo công thức:
   - `score = (count_true * correct_weight) - (count_false * incorrect_weight)`
   - Các hệ số `correct_weight` và `incorrect_weight` được cấu hình qua environment variables (`QUESTION_SCORE_WEIGHT_CORRECT`, `QUESTION_SCORE_WEIGHT_INCORRECT`), nếu không khai báo sẽ dùng giá trị mặc định `1.0` và `2.0`
   - Các câu hỏi có `score` thấp hơn (đặc biệt là âm) phải được ưu tiên xuất hiện trước
   - Các câu chưa từng làm (count_true = count_false = 0) vẫn cần được đưa vào để đảm bảo user làm hết câu hỏi trong pool
   - Thuật toán cần bảo đảm trải đều câu hỏi và tái xuất hiện những câu đã sai nhiều lần để hỗ trợ việc học hiệu quả hơn

7. Sau khi làm bài thi thì sẽ có thể preview lại các câu đã làm và kết quả.

8. Nếu hết giờ mà làm chưa xong thì sẽ tự động nộp bài.

9. Thời gian đếm ngược phải dễ thấy, 1 phút cuối cùng thì hãy hiển thị số giây to hơn và hiển thị màu đỏ, bình thường sẽ là xanh lá.

10. Danh sách câu hỏi cần hiển thị rõ ràng để người dùng có thể dễ dàng chuyển qua lại các câu hỏi, các câu chưa làm thì sẽ có viền màu đỏ, làm rồi thì sẽ màu xanh.

11. UI phải được thiết kế bắt mắt, có các hiệu ứng animation, và phải responsive hỗ trợ mobile dễ dàng thao tác.

12. Code phải dễ bảo trì, phát triển và reuseable.

## Cấu trúc Database

### Bảng users
- id (PRIMARY KEY)
- email (UNIQUE)
- password_hash
- name
- created_at
- updated_at

### Bảng question_pools
- id (PRIMARY KEY)
- name (UNIQUE) - tên bộ câu hỏi
- description - mô tả bộ câu hỏi
- created_at
- updated_at

### Bảng questions
- id (PRIMARY KEY)
- question_pool_id (FOREIGN KEY)
- content - nội dung câu hỏi
- explanation - giải thích đáp án
- created_at
- updated_at

### Bảng answers
- id (PRIMARY KEY)
- question_id (FOREIGN KEY)
- content - nội dung đáp án
- is_correct - đáp án đúng hay sai
- created_at

### Bảng exam_sessions
- id (PRIMARY KEY)
- user_id (FOREIGN KEY)
- question_pool_id (FOREIGN KEY)
- question_count
- time_limit
- start_time
- end_time
- score
- total_questions
- created_at

### Bảng user_answers
- id (PRIMARY KEY)
- exam_session_id (FOREIGN KEY)
- question_id (FOREIGN KEY)
- answer_ids (JSON array) - các ID đáp án đã chọn
- is_correct
- created_at

### Bảng question_stats
- id (PRIMARY KEY)
- user_id (FOREIGN KEY)
- question_id (FOREIGN KEY)
- count_true
- count_false
- last_attempted_at
- created_at
- updated_at

## API Endpoints

### Authentication
- POST /api/auth/register - Đăng ký
- POST /api/auth/login - Đăng nhập
- POST /api/auth/logout - Đăng xuất
- GET /api/auth/me - Lấy thông tin user hiện tại

### Question Pool Management
- GET /api/question-pools - Lấy danh sách bộ câu hỏi
- GET /api/question-pools/[id] - Lấy chi tiết bộ câu hỏi
- GET /api/question-pools/[id]/questions - Lấy câu hỏi của bộ câu hỏi

### Exam Management
- GET /api/exam/sessions - Lấy danh sách lần thi của user
- POST /api/exam/sessions - Tạo session thi mới
- GET /api/exam/sessions/[id] - Lấy chi tiết session thi
- POST /api/exam/sessions/[id]/submit - Nộp bài thi
- GET /api/exam/stats - Lấy thống kê của user

## Tech Stack
- Frontend: Next.js 15, TypeScript, Tailwind CSS
- Backend: Next.js API Routes
- Database: Neon (PostgreSQL)
- Authentication: JWT
- ORM: Prisma
- Deployment: Vercel

## Deployment với Vercel

### Quy trình triển khai:
1. Kết nối GitHub repository với Vercel
3. Cấu hình environment variables
4. Deploy tự động

### Environment Variables cần thiết:
- `DATABASE_URL` - Connection string cho PostgreSQL database
- `JWT_SECRET` - Secret key cho JWT authentication

## Seeding Data
- Tạo script để seed các bộ câu hỏi từ JSON files hiện có vào database
- Script sẽ đọc tất cả JSON files trong thư mục `data/question-pool/` và import vào database
- Hỗ trợ thêm bộ câu hỏi mới thông qua seeding script
