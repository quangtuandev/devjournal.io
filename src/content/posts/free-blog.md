---
title: Cách blog này được tạo ra
published: 2025-12-12
description: 'Tạo blog miễn phí 100% với Astro và Cloudflare Workers? Nghe có vẻ điên rồ nhưng hoàn toàn có thật! Cùng khám phá cách mình làm điều đó với phong cách lập trình viên vui tính nhé! 🚀'
tags: ['Cloudflare', 'Astro', 'Free Blog']
category: 'Tech'
draft: false 
lang: 'vi'
---

# Blog Miễn Phí 100% Với Astro + Cloudflare Workers 🚀

Chào mừng đến với blog của mình! Hôm nay mình sẽ chia sẻ cách mình tạo ra blog này mà **KHÔNG TỐN MỘT XU NÀO** 💰 (đúng nghĩa đen luôn đó!).

## Tại sao lại chọn Astro? 🌟

Nếu bạn chưa biết về [Astro](https://astro.build), thì đây là một framework tuyệt vời để build static site. Điểm mạnh của nó là:

- ⚡ **Cực kỳ nhanh** - Astro chỉ ship JavaScript khi thực sự cần thiết
- 🎨 **Linh hoạt** - Có thể dùng React, Vue, Svelte... tùy thích (blog này dùng Svelte)
- 📝 **Perfect cho blog** - Hỗ trợ Markdown siêu tốt, có sẵn RSS, sitemap, v.v.
- 🎯 **SEO friendly** - Static HTML, search engine thích lắm!

Mình đang dùng template [Fuwari](https://github.com/saicaca/fuwari) - một template blog Astro cực đẹp và đầy đủ tính năng:
- Dark/Light mode
- Search với Pagefind
- Responsive design
- Markdown extended syntax
- Table of contents
- Và nhiều thứ hay ho khác!

## Cloudflare Workers - Hosting Miễn Phí Mãi Mãi! ☁️

Đây mới là phần **NGON** nhất! Thay vì phải trả tiền cho hosting, mình deploy blog lên **Cloudflare Workers** - và nó **HOÀN TOÀN MIỄN PHÍ**! 🎉

### Tại sao Cloudflare Workers lại xịn?

1. **Free tier cực hào phóng** 📊
   - 100,000 requests/ngày MIỄN PHÍ
   - Với blog cá nhân thì con số này quá đủ rồi!

2. **Tốc độ cực nhanh** ⚡
   - Deploy lên edge network toàn cầu của Cloudflare
   - Người đọc ở đâu cũng load nhanh như chớp

3. **Bảo mật tốt** 🔒
   - Tự động có HTTPS
   - DDoS protection miễn phí
   - Security headers đầy đủ

4. **Dễ deploy** 🚀
   - Chỉ cần 1 câu lệnh: `pnpm deploy`
   - Tự động build và deploy

## Cách Mình Setup Blog Này 🛠️

### Bước 1: Cài đặt Astro

```bash
# Clone template Fuwari
pnpm create fuwari@latest

# Hoặc fork từ GitHub
git clone https://github.com/saicaca/fuwari.git
cd fuwari
pnpm install
```

### Bước 2: Tùy chỉnh config

Sửa file `src/config.ts` để cá nhân hóa blog:

```typescript
export const siteConfig: SiteConfig = {
  title: "DevJournal",
  subtitle: "A place for my thoughts",
  lang: "vi",
  // ... các config khác
}
```

### Bước 3: Setup Cloudflare Workers

Mình đã tạo sẵn config cho Cloudflare Workers:

**File `wrangler.jsonc`:**
```json
{
  "name": "devjournal",
  "main": "src/worker/index.ts",
  "compatibility_date": "2024-12-01",
  "assets": {
    "directory": "./dist",
    "binding": "ASSETS"
  }
}
```

**Worker code** (`src/worker/index.ts`) xử lý:
- Serve static files từ Astro build
- Thêm security headers
- Smart caching cho performance
- Handle trailing slash routing

### Bước 4: Deploy lên Cloudflare

```bash
# Login vào Cloudflare (chỉ cần 1 lần)
npx wrangler login

# Build Astro site
pnpm build

# Deploy lên Cloudflare Workers
pnpm deploy
```

**BAM!** 💥 Blog của bạn đã live trên internet, hoàn toàn miễn phí!

## Chi Phí Thực Tế 💸

Để mình tính cho bạn xem:
- **Astro**: FREE ✅
- **Cloudflare Workers**: FREE ✅ (100k requests/ngày)
- **Domain**: ~$10/năm (nếu muốn custom domain)
- **Hosting**: FREE ✅
- **SSL Certificate**: FREE ✅ (Cloudflare tự động)
- **CDN**: FREE ✅ (Cloudflare edge network)

**Tổng cộng**: $0 nếu dùng subdomain `*.workers.dev`, hoặc ~$10/năm nếu muốn domain riêng!

## Kết Luận 🎯

Với combo **Astro + Cloudflare Workers**, bạn có thể:
- ✅ Tạo blog cực nhanh và đẹp
- ✅ Deploy miễn phí mãi mãi
- ✅ Performance tốt nhất (static + edge CDN)
- ✅ Không lo về scaling (Cloudflare lo hết)
- ✅ Tập trung vào viết content thay vì lo về infrastructure

Nếu bạn đang muốn tạo blog cá nhân mà không muốn tốn tiền hosting, thì đây chính là giải pháp hoàn hảo! 🎉

## Tài Nguyên Hữu Ích 📚

- [Astro Documentation](https://docs.astro.build)
- [Fuwari Template](https://github.com/saicaca/fuwari)
- [Cloudflare Workers Docs](https://developers.cloudflare.com/workers/)
- [Source code blog này](https://github.com/quangtuandev/devjournal.io)

Happy coding! 🚀✨

---

*P/S: Nếu bạn thấy bài viết này hữu ích, hãy star repo của mình trên GitHub nhé! 😊*
