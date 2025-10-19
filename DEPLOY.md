# 🚀 Hướng dẫn Deploy lên Cloudflare Pages

## 📋 Cấu hình Cloudflare Pages

### 1. **Build Settings:**
```
Framework preset: Next.js (Static HTML Export)
Build command: npm run build
Build output directory: out
Root directory: (để trống)
```

### 2. **Environment Variables:**
```
NODE_VERSION: 18
```

### 3. **Build Command:**
```bash
npm run build
```

### 4. **Output Directory:**
```
out
```

## 🔧 Cấu hình đã được thiết lập

### ✅ **next.config.ts:**
- `output: 'export'` - Tạo static files
- `trailingSlash: true` - Thêm slash vào URL
- `images: { unoptimized: true }` - Tối ưu cho static export

### ✅ **package.json:**
- Script `export` để build static files
- Tất cả dependencies cần thiết

### ✅ **Files hỗ trợ:**
- `_headers` - Cấu hình security headers
- `_redirects` - Xử lý client-side routing

## 🎯 Các bước deploy

### **Bước 1: Push code lên GitHub**
```bash
git add .
git commit -m "Configure for Cloudflare Pages deployment"
git push origin main
```

### **Bước 2: Cấu hình Cloudflare Pages**
1. Vào [Cloudflare Dashboard](https://dash.cloudflare.com/)
2. Chọn **Pages** → **Create a project**
3. Chọn **Connect to Git**
4. Chọn repository GitHub của bạn
5. Cấu hình build settings như trên

### **Bước 3: Deploy**
- Cloudflare sẽ tự động build và deploy
- Website sẽ có URL dạng: `https://your-project.pages.dev`

## 🔍 Troubleshooting

### **Lỗi thường gặp:**

1. **Build failed:**
   - Kiểm tra Node.js version (dùng 18)
   - Kiểm tra build command: `npm run build`
   - Kiểm tra output directory: `out`

2. **404 errors:**
   - Kiểm tra file `_redirects`
   - Đảm bảo `trailingSlash: true` trong next.config.ts

3. **Static files không load:**
   - Kiểm tra file `_headers`
   - Đảm bảo `images: { unoptimized: true }`

## 📊 Kết quả

Sau khi deploy thành công:
- ✅ Website hoạt động hoàn toàn
- ✅ Tất cả routes hoạt động
- ✅ Static files được cache
- ✅ Performance tốt
- ✅ SEO friendly

## 🎉 URL Production

Website sẽ có URL dạng:
```
https://your-project-name.pages.dev
```

Bạn có thể custom domain trong Cloudflare Pages settings.
