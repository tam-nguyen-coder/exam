# Deployment Guide

## Vercel Deployment với Neon Database

### 1. Chuẩn bị Database

1. **Tạo Neon Database:**
   - Truy cập [Neon Console](https://console.neon.tech/)
   - Tạo project mới
   - Copy connection string

2. **Setup Database Schema:**
   ```bash
   # Cập nhật DATABASE_URL trong .env hoặc Vercel
   DATABASE_URL="postgresql://username:password@host:5432/database"

   # Push schema lên database
   npm run db:push
   ```

### 2. Deploy lên Vercel

1. **Kết nối GitHub:**
   - Đăng nhập [Vercel](https://vercel.com)
   - Import project từ GitHub repository

2. **Cấu hình Environment Variables:**
   - `DATABASE_URL`: Connection string từ Neon
   - `JWT_SECRET`: Secret key cho JWT (tạo random string)

3. **Deploy:**
   - Vercel sẽ tự động build và deploy
   - Build command: `prisma generate && next build`

### 3. Environment Variables

Sử dụng một biến duy nhất cho database (`DATABASE_URL`):

**Production (Vercel):**
```
DATABASE_URL=postgresql://username:password@host:port/database
JWT_SECRET=your-super-secret-jwt-key-here
```

**Development (.env.local):**
```
DATABASE_URL=postgresql://username:password@localhost:5432/exam_db
JWT_SECRET=your-super-secret-jwt-key-here
```

### 4. Database Commands

```bash
# Generate Prisma client (with auto DATABASE_URL setup)
npm run db:generate

# Push schema changes to database
npm run db:push

# Create and run migrations
npm run db:migrate

# Open Prisma Studio
npm run db:studio
```

**Lưu ý**: Hãy đảm bảo `DATABASE_URL` luôn được set trước khi chạy các lệnh.

### 5. Troubleshooting

#### Build Errors
- Đảm bảo tất cả database environment variables được set đúng
- Chạy `npx prisma generate` trước khi build
- Kiểm tra Prisma schema syntax

#### Database Connection
- Kiểm tra tất cả database environment variables
- Đảm bảo database server đang chạy
- Kiểm tra firewall settings
- Verify database credentials

#### Authentication Issues
- Đảm bảo `JWT_SECRET` được set
- Kiểm tra token expiration settings (mặc định 7 ngày)
- Verify CORS settings

### 6. Monitoring

- **Vercel Dashboard**: Monitor deployments và performance
- **Neon Console**: Monitor database usage và performance
- **Prisma Studio**: Quản lý database data

### 7. Security Notes

- Không commit `.env` files
- Sử dụng strong JWT secrets
- Enable HTTPS trong production
- Regular database backups
- Monitor for suspicious activity
