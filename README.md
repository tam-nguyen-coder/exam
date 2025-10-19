# 🎯 Hệ Thống Thi Thử Online

Ứng dụng web cho phép người dùng thi thử các bài thi từ kho câu hỏi có sẵn với tính năng thông minh ưu tiên câu hỏi dựa trên lịch sử làm bài.

## ✨ Tính năng chính

- **Chọn bộ câu hỏi**: Hỗ trợ nhiều bộ câu hỏi khác nhau
- **Tùy chỉnh bài thi**: Chọn số lượng câu hỏi và thời gian làm bài
- **Thuật toán thông minh**: Ưu tiên các câu hỏi chưa làm hoặc làm sai nhiều lần
- **Timer đếm ngược**: Hiển thị thời gian còn lại với cảnh báo màu đỏ khi còn 1 phút
- **Navigation dễ dàng**: Danh sách câu hỏi với màu sắc phân biệt trạng thái
- **Lưu trữ kết quả**: Tự động lưu kết quả vào localStorage
- **Thống kê chi tiết**: Xem lịch sử thi và độ chính xác theo từng câu hỏi
- **Responsive design**: Hỗ trợ đầy đủ trên mobile và desktop
- **UI/UX hiện đại**: Giao diện đẹp mắt với animations mượt mà

## 🚀 Cài đặt và chạy

### Yêu cầu hệ thống
- Node.js 18+ 
- npm hoặc yarn

### Cài đặt
```bash
# Clone repository
git clone <repository-url>
cd exam

# Cài đặt dependencies
npm install

# Chạy development server
npm run dev
```

Mở [http://localhost:3000](http://localhost:3000) để xem ứng dụng.

## 📁 Cấu trúc dự án

```
src/
├── app/                    # Next.js App Router
│   ├── page.tsx           # Trang chủ
│   ├── exam/              # Trang thi
│   ├── result/            # Trang kết quả
│   └── globals.css        # CSS global
├── components/            # React components
│   └── StatsModal.tsx     # Modal thống kê
├── dto/                   # TypeScript interfaces
│   └── question-dto.ts    # Định nghĩa types
└── utils/                 # Utility functions
    ├── storage.ts         # Xử lý localStorage
    ├── question-selection.ts # Thuật toán chọn câu hỏi
    └── timer.ts           # Xử lý timer
```

## 📊 Cấu trúc dữ liệu

### Câu hỏi (JSON)
```json
[
  {
    "id": 1,
    "content": "Nội dung câu hỏi",
    "answers": [
      {
        "id": 1,
        "content": "Đáp án A",
        "correct": true
      }
    ],
    "reason": "Giải thích (tùy chọn)"
  }
]
```

### Lưu trữ kết quả
```json
[
  {
    "questionId": 1,
    "countTrue": 2,
    "countFalse": 1
  }
]
```

## 🎮 Cách sử dụng

1. **Chọn cấu hình thi**: Chọn bộ câu hỏi, số lượng câu hỏi và thời gian
2. **Bắt đầu thi**: Click "Bắt đầu thi" để vào trang thi
3. **Làm bài**: Chọn đáp án và sử dụng navigation để chuyển câu
4. **Nộp bài**: Click "Nộp bài" hoặc chờ hết thời gian
5. **Xem kết quả**: Xem điểm số và đáp án chi tiết
6. **Xem thống kê**: Theo dõi tiến độ học tập

## 🔧 Tùy chỉnh

### Thêm bộ câu hỏi mới
1. Tạo file JSON trong `public/question-pool/`
2. Cập nhật logic load trong `src/app/page.tsx`

### Thay đổi thuật toán ưu tiên
Chỉnh sửa function `selectQuestions` trong `src/utils/question-selection.ts`

### Tùy chỉnh giao diện
- CSS: `src/app/globals.css`
- Tailwind config: `tailwind.config.js`

## 🛠️ Công nghệ sử dụng

- **Next.js 15**: React framework
- **TypeScript**: Type safety
- **Tailwind CSS**: Styling
- **LocalStorage**: Lưu trữ dữ liệu
- **Responsive Design**: Mobile-first approach

## 📱 Responsive Design

Ứng dụng được thiết kế responsive hoàn toàn:
- **Mobile**: Tối ưu cho màn hình nhỏ
- **Tablet**: Layout 2 cột
- **Desktop**: Layout đầy đủ với sidebar

## 🎨 UI/UX Features

- **Animations**: Fade in, slide in, hover effects
- **Color coding**: Màu sắc phân biệt trạng thái
- **Loading states**: Spinner và skeleton loading
- **Error handling**: Xử lý lỗi graceful
- **Accessibility**: Hỗ trợ keyboard navigation

## 📈 Performance

- **Code splitting**: Tự động split code theo route
- **Image optimization**: Next.js Image component
- **Lazy loading**: Load components khi cần
- **Efficient re-renders**: React optimization

## 🔒 Bảo mật

- **Client-side only**: Không có backend, dữ liệu lưu local
- **No sensitive data**: Không lưu thông tin cá nhân
- **XSS protection**: React built-in protection

## 🚀 Deployment

### Vercel (Recommended)
```bash
npm run build
# Deploy to Vercel
```

### Static Export
```bash
npm run build
npm run export
```

## 🤝 Contributing

1. Fork repository
2. Tạo feature branch
3. Commit changes
4. Push to branch
5. Tạo Pull Request

## 📄 License

MIT License - xem file LICENSE để biết thêm chi tiết.

## 🆘 Support

Nếu gặp vấn đề, vui lòng tạo issue trên GitHub repository.
