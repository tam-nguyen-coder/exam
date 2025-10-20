Tôi muốn xây dựng một ứng dụng web cho phép người dùng có thể thi thử các bài thi từ kho câu hỏi có sẵn.
Ứng dụng sẽ sử dụng PostgreSQL database để lưu trữ dữ liệu và có hệ thống xác thực người dùng.
Các câu hỏi được lưu dưới dạng JSON ở thư mục question-pool, mỗi file sẽ là một bộ câu hỏi.
Khi người dùng vào trang web thì sẽ có một số tuỳ chọn sau:
1. Chọn bộ câu hỏi, cho phép user chọn bộ câu hỏi muốn thi thử, hãy lấy tên file JSON làm label.
2. Chọn số lượng câu hỏi mỗi bài thi, default là tổng số câu hỏi trong file.
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
6. Khi tạo bài test, các câu hỏi sẽ là ngẫu nhiên trong bộ câu hỏi, nhưng phải tạo ra thuật toán để ưu tiên các câu chưa làm và câu làm sai nhiều lần được tính dựa trên hiệu của countTrue và countFalse, nếu hiệu là số Âm thì nên ưu tiên hiện các câu đó trong bài thi.

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

### Bảng exam_sessions
- id (PRIMARY KEY)
- user_id (FOREIGN KEY)
- question_pool
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
- question_id
- answer_ids (JSON array)
- is_correct
- created_at

### Bảng question_stats
- id (PRIMARY KEY)
- user_id (FOREIGN KEY)
- question_pool
- question_id
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

### Ưu điểm của Vercel:
- ✅ Tích hợp native với Next.js
- ✅ Hỗ trợ đầy đủ Prisma + Neon PostgreSQL
- ✅ Setup đơn giản, không cần cấu hình phức tạp
- ✅ Serverless Functions và Edge Functions
- ✅ Tích hợp sẵn với Neon từ Vercel Marketplace
- ✅ Hỗ trợ tất cả tính năng Next.js 15
- ✅ Auto-deployment từ GitHub

### Quy trình triển khai:
1. Kết nối GitHub repository với Vercel
2. Thêm Neon database từ Vercel Marketplace
3. Cấu hình environment variables
4. Deploy tự động

### Environment Variables cần thiết:
- `DATABASE_HOST`
- `DATABASE_USERNAME`
- `DATABASE_PASSWORD`
- `DATABASE_NAME`
- `DATABASE_PORT`
- `JWT_SECRET`
