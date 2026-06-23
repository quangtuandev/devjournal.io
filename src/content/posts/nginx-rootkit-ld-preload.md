---
title: 'Hành Trình Săn Rootkit: Khi nginx -T Nói Dối'
published: 2026-06-23
description: 'Ghi lại quá trình điều tra một cuộc tấn công Parasite SEO tinh vi — từ lúc bất lực không hiểu tại sao config nginx "sạch" nhưng block độc hại vẫn tồn tại, cho đến khi tìm ra một shared library rootkit ẩn mình dưới tên hệ thống.'
tags: ['Security', 'Linux', 'Nginx', 'Rootkit', 'Forensics']
category: 'Security'
draft: false
lang: 'vi'
---

# Hành Trình Săn Rootkit: Khi `nginx -T` Nói Dối

> *Bài viết ghi lại quá trình điều tra một cuộc tấn công Parasite SEO tinh vi — từ lúc bất lực không hiểu tại sao config nginx "sạch" nhưng block độc hại vẫn tồn tại, cho đến khi tìm ra một shared library rootkit ẩn mình dưới tên hệ thống.*

---

## Bối cảnh

Một ngày bình thường, tôi nhận ra website xuất hiện trên Google với các tiêu đề hoàn toàn không liên quan — nội dung cờ bạc, gái gọi, casino. Đây là dấu hiệu điển hình của **Parasite SEO** (hay còn gọi là SEO Hijacking): hacker inject content vào domain uy tín để tận dụng authority SEO.

Tôi đã xử lý dạng tấn công này trước đây. Thông thường chỉ cần tìm file PHP backdoor, xóa đi, thêm rule 410 vào nginx là xong. Lần này thì khác.

---

## Giai đoạn 1: Triệu chứng bất thường

Kiểm tra đầu tiên — thử truy cập trực tiếp:

```bash
curl -I https://example.com/virtuals/
# HTTP/2 404
```

404. Bình thường. Nhưng khi truy cập qua link Google hoặc giả lập Googlebot:

```bash
curl -A "Googlebot/2.1" -I https://example.com/virtuals/test
# HTTP/2 301 → redirect sang domain spam
```

Đây là **cloaking** — kỹ thuật phục vụ nội dung khác nhau tùy theo người dùng. Admin thấy 404 bình thường. Google thấy trang casino.

Kiểm tra log nginx:

```
66.249.74.x - Googlebot - "GET /virtuals/63178642" 200 143432
```

Googlebot đang đọc được trang nặng 143KB. Trang này **vẫn đang sống**.

---

## Giai đoạn 2: Tìm thấy block độc hại trong nginx config

Dump toàn bộ config nginx đang chạy:

```bash
nginx -T | grep -A5 -B5 "virtuals\|referer"
```

Tìm thấy ngay — block này được inject vào **tất cả** các server block:

```nginx
# Auto-injected for Nginx
location ~* (virtuals|casinoet|jackpots|...) {
    set $is_googlebot 0;
    if ($http_user_agent ~* "googlebot|...") {
        set $is_googlebot 1;
    }
    set $from_google 0;
    if ($http_referer ~* "google\.com") {
        set $from_google 1;
    }
    set $redirect_type "${is_googlebot}${from_google}";
    if ($redirect_type = "10") {
        rewrite ^ /internal_proxy_bot last;
    }
    ...
}
```

Logic rất tinh vi:
- Nếu là **Googlebot** (`is_googlebot=1`) + **không từ Google** (`from_google=0`) → `redirect_type = "10"` → redirect sang trang spam (để Google index)
- Nếu người dùng click từ Google (`from_google=1`) → redirect sang trang spam (người dùng thấy nội dung xấu)
- Tất cả trường hợp còn lại → 404 bình thường (admin không phát hiện)

Block này xuất hiện trong tất cả các file config trên server. Toàn bộ server bị nhiễm.

---

## Giai đoạn 3: Bắt đầu bất lực

Tôi làm điều hiển nhiên nhất — tìm block đó trong file:

```bash
grep -r "Auto-injected" /etc/nginx/
# (không có kết quả)
```

Trống. Không có gì.

Đọc từng file một:

```bash
cat /etc/nginx/conf.d/mysite.conf
# File sạch hoàn toàn, không có block nào
```

Reload nginx:

```bash
systemctl reload nginx
nginx -T | grep "Auto-injected"
# Vẫn còn đầy
```

Stop rồi start lại:

```bash
systemctl stop nginx
systemctl start nginx
nginx -T | grep "Auto-injected"
# Vẫn còn
```

Reinstall nginx hoàn toàn:

```bash
dnf reinstall nginx -y
nginx -T | grep "Auto-injected"
# VẪN CÒN
```

Lúc này thực sự bối rối. Nginx binary đã được reinstall từ repo chính thức, file conf trên disk không chứa gì, nhưng `nginx -T` vẫn kiên trì show block độc hại.

---

## Giai đoạn 4: Loại trừ từng khả năng

**Kiểm tra file có hidden character không?**

```bash
cat -A /etc/nginx/conf.d/mysite.conf | grep -i "inject"
xxd /etc/nginx/conf.d/mysite.conf | grep "inject"
# Không có gì
```

**Kiểm tra bind mount?**

```bash
mount | grep nginx
findmnt /etc/nginx/conf.d/
# Không có mount gì lạ
```

**Kiểm tra inode?**

```bash
ls -lai /etc/nginx/conf.d/
stat /etc/nginx/conf.d/mysite.conf
wc -c /etc/nginx/conf.d/mysite.conf
# Size khớp, inode bình thường, không có hardlink lạ
```

**Kiểm tra nginx binary bị patch không?**

```bash
rpm -V nginx
# S.5....T.  c /etc/nginx/nginx.conf  ← chỉ file conf bị sửa, binary ok
```

**Kiểm tra shared library nginx link đến:**

```bash
ldd /usr/sbin/nginx
# /lib64/libsystemd-shared-251.so ← trông bình thường
```

**Tắt PHP để kiểm tra:**

```bash
systemctl stop php-fpm php81-php-fpm
pkill -9 php
systemctl restart nginx
nginx -T | grep "Auto-injected"
# Vẫn còn — không phải PHP
```

Mọi hướng điều tra đều bế tắc.

---

## Giai đoạn 5: Breakthrough — `strace` tiết lộ sự thật

Trong lúc gần như hết phương án, tôi chạy `strace` để xem nginx đang mở file gì khi khởi động:

```bash
strace nginx -T 2>&1 | grep openat | head -5
```

Dòng đầu tiên trong output:

```
openat(AT_FDCWD, "/etc/ld.so.preload", O_RDONLY|O_CLOEXEC) = 3
```

**`/etc/ld.so.preload` tồn tại.**

File này là một cơ chế của Linux dynamic linker — bất kỳ shared library nào được liệt kê trong `/etc/ld.so.preload` sẽ được **inject vào mọi process** trên hệ thống trước khi process đó chạy.

```bash
cat /etc/ld.so.preload
# /lib64/libsystemd-shared-251.so
```

Tên rất thông minh — `libsystemd-shared-251.so` nghe như một library systemd hợp lệ. Nhưng:

```bash
rpm -qf /lib64/libsystemd-shared-251.so
# file /lib64/libsystemd-shared-251.so is not owned by any package
```

Không thuộc package nào. Kiểm tra exported functions:

```bash
nm -D /lib64/libsystemd-shared-251.so | grep -i "nginx\|inject\|conf"
```

```
00000000002040e8 D APACHE_INJECTED_CONFIG
0000000000001680 T hijack_config_file
00000000000013f0 T inject_apache_config
0000000000001240 T inject_nginx_config
00000000000011b0 T is_apache_config
0000000000001120 T is_nginx_config
0000000000000fe0 T is_nginx_process
00000000002040f0 D NGINX_INJECTED_CONFIG
```

Đây rồi. **Đây chính là rootkit.**

---

## Giai đoạn 6: Hiểu cơ chế hoạt động

Rootkit hoạt động như sau:

```
Process khởi động (nginx, apache, bất kỳ)
    ↓
Linux dynamic linker đọc /etc/ld.so.preload
    ↓
Load /lib64/libsystemd-shared-251.so vào memory của process
    ↓
Library hook vào các hàm đọc file config
    ↓
is_nginx_process() → true
    ↓
inject_nginx_config() → chèn block cloaking vào output
    ↓
nginx -T show config "ảo" — không có trong file thật
```

Đây giải thích tại sao:
- `grep` không tìm thấy gì trong file — vì block không có trong file
- Reinstall nginx không giúp được — vì library được inject vào mọi process
- Stop/start nginx không giúp — vì library được load lại mỗi lần nginx khởi động
- Ngay cả binary nginx mới cũng bị nhiễm — vì hook xảy ra ở tầng dynamic linker

---

## Giai đoạn 7: Dọn dẹp

```bash
# Xóa ld.so.preload — ngắt cơ chế inject
rm -f /etc/ld.so.preload

# Xóa rootkit library
rm -f /lib64/libsystemd-shared-251.so

# Restart nginx
systemctl restart nginx

# Verify
nginx -T | grep "Auto-injected"
# (không có gì — sạch hoàn toàn)
```

Kiểm tra cloaking đã hết:

```bash
curl -s -o /dev/null -w "%{http_code}" \
  -A "Googlebot/2.1" \
  https://example.com/virtuals/test
# 410
```

---

## Những gì đã bị bỏ qua ban đầu

Nhìn lại, có một số dấu hiệu tôi đã thấy nhưng không để ý đúng mức:

**1. Webshell PHP trong WordPress site**

```
/usr/share/nginx/mysite/4343fe80/about.php  ← thư mục tên random hash
/usr/share/nginx/mysite/wp-crom.php         ← giả danh wp-cron
/usr/share/nginx/mysite/wp-content/themes/twentytwenty/radio.php
```

File `about.php` giả mạo header của Monarx Security (một công ty bảo mật thật), nhưng bên trong là PHP obfuscated với hàng nghìn ký tự base64 encoded — webshell hoàn chỉnh cho phép thực thi lệnh từ xa.

**2. Login history có IP lạ**

```
root  x.x.x.x  Mon Jun 22 01:04 - 03:17
root  x.x.x.x  Sat Jun 20 22:40 - 00:56
```

**3. PHP process với tên file lạ đang chạy**

```
php /usr/share/nginx/site-a/scripts/l.php
php /usr/share/nginx/site-b/l.php
```

File đã tự xóa sau khi chạy (anti-forensic) nhưng process vẫn còn trong memory.

---

## Bài học

**Về kỹ thuật:**

- `nginx -T` không nhất thiết phản ánh file trên disk — nó phản ánh những gì process **thực sự đang chạy**, có thể bị hook ở tầng thấp hơn
- `/etc/ld.so.preload` là một attack vector cực kỳ mạnh — một dòng duy nhất trong file này có thể compromise mọi process trên hệ thống
- Rootkit đặt tên giống system library (`libsystemd-shared-251.so`) để tránh bị phát hiện khi nhìn lướt qua
- `rpm -qf <file>` là cách nhanh nhất để phát hiện file không thuộc package nào

**Về quy trình điều tra:**

- Khi grep không tìm thấy gì trong file nhưng process vẫn show output — hãy nghĩ đến hook ở tầng thấp hơn (LD_PRELOAD, kernel module)
- `strace` là công cụ cuối cùng nhưng hiệu quả nhất để xem process thực sự làm gì
- `nm -D <library>` để xem exported symbols — tên hàm thường tiết lộ mục đích thật

**Về bảo mật:**

- Server có PHP-FPM đang chạy dù ứng dụng chính là Node.js — attack surface không cần thiết
- WordPress site trên cùng server là điểm vào — WordPress cần được update và hardened
- Root SSH bằng password nên được thay bằng SSH key only
- Nên monitor `/etc/ld.so.preload` và `/lib64/` cho các file không thuộc package nào

---

## Checklist dọn dẹp sau sự cố

```bash
# 1. Xóa rootkit
rm -f /etc/ld.so.preload
rm -f /lib64/libsystemd-shared-251.so

# 2. Xóa webshell
# Tìm và xóa các file PHP lạ trong thư mục web
find /usr/share/nginx/ -name "*.php" -newer /etc/nginx/nginx.conf

# 3. Thêm rule 410 cho các path bị tấn công
# Trong nginx server block:
location ^~ /virtuals/ {
    return 410;
}

# 4. Đổi credentials
passwd root
# Xem và xóa SSH key lạ
cat /root/.ssh/authorized_keys

# 5. Kiểm tra file không thuộc package nào trong /lib64
for f in /lib64/*.so*; do
    rpm -qf "$f" &>/dev/null || echo "NOT OWNED: $f"
done

# 6. Submit URL removal trong Google Search Console
```

---

## Kết

Cuộc điều tra này mất nhiều giờ và trải qua không ít lúc bế tắc hoàn toàn. Điều khiến nó khó không phải là kỹ thuật phức tạp — mà là hacker đã chọn đúng điểm mù: tầng dynamic linker, nơi mà hầu hết các công cụ forensic thông thường không nhìn tới.

`nginx -T` nói dối. Không phải vì nginx bị hack. Mà vì thứ chạy *trước* nginx đã quyết định nginx sẽ "thấy" gì.

---

*Nếu server của bạn có dấu hiệu tương tự, hãy kiểm tra ngay:*

```bash
cat /etc/ld.so.preload
rpm -qf /lib64/libsystemd-shared-251.so
```

*Một dòng. Đó là tất cả những gì hacker cần.*
