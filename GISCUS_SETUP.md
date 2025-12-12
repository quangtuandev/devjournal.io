# Hướng Dẫn Cài Đặt Giscus Comments

Component Giscus đã được tạo và tích hợp vào blog! Bây giờ bạn cần cấu hình GitHub Discussions để kích hoạt tính năng comment.

## Bước 1: Kích Hoạt GitHub Discussions

1. Truy cập repository của bạn: https://github.com/quangtuandev/devjournal.io
2. Vào **Settings** → **General**
3. Cuộn xuống phần **Features**
4. Tích vào ô **Discussions** để kích hoạt

## Bước 2: Cài Đặt Giscus App

1. Truy cập: https://github.com/apps/giscus
2. Click **Install**
3. Chọn repository `quangtuandev/devjournal.io`
4. Click **Install & Authorize**

## Bước 3: Lấy Repository ID và Category ID

1. Truy cập: https://giscus.app
2. Nhập repository: `quangtuandev/devjournal.io`
3. Chọn Discussion Category: **General** (hoặc tạo category mới)
4. Chọn Page ↔️ Discussions Mapping: **Discussion title contains page pathname**
5. Cuộn xuống phần **Enable giscus**
6. Copy các giá trị:
   - `data-repo-id="..."` → Đây là **repoId**
   - `data-category-id="..."` → Đây là **categoryId**

## Bước 4: Cập Nhật Config

Mở file `src/config.ts` và cập nhật:

```typescript
export const giscusConfig: GiscusConfig = {
  enable: true,
  repo: "quangtuandev/devjournal.io",
  repoId: "PASTE_YOUR_REPO_ID_HERE", // ← Paste repo ID từ giscus.app
  category: "General",
  categoryId: "PASTE_YOUR_CATEGORY_ID_HERE", // ← Paste category ID từ giscus.app
  mapping: "pathname",
  reactionsEnabled: true,
  lang: "vi",
};
```

## Bước 5: Kiểm Tra

1. Chạy dev server: `pnpm dev`
2. Mở một bài blog bất kỳ
3. Cuộn xuống cuối bài → Bạn sẽ thấy Giscus comment box!

## Tính Năng

✅ **Auto theme switching** - Tự động chuyển đổi theme theo dark/light mode của blog
✅ **Vietnamese language** - Giao diện tiếng Việt
✅ **Reactions enabled** - Người đọc có thể react với emoji
✅ **Lazy loading** - Chỉ load khi cần để tăng performance
✅ **GitHub authentication** - Người dùng đăng nhập bằng GitHub để comment

## Tắt Comments

Nếu muốn tắt comments, chỉ cần set `enable: false` trong `src/config.ts`:

```typescript
export const giscusConfig: GiscusConfig = {
  enable: false, // ← Tắt comments
  // ... các config khác
};
```

## Troubleshooting

**Không thấy comment box?**
- Kiểm tra đã enable GitHub Discussions chưa
- Kiểm tra repoId và categoryId có đúng không
- Mở DevTools Console xem có lỗi gì không

**Theme không đổi?**
- Component đã có script tự động đổi theme, chỉ cần đợi vài giây

Chúc bạn thành công! 🎉
