# Hướng Dẫn Sử Dụng API Ảnh NEXGEAR

Dự án sử dụng **API ảnh external** trên server cPanel. Upload qua **multipart form-data** với API key trong form field (bypass LiteSpeed strip header).

---

## 1. Thông số API Server

- **URL:** `http://hard-mauve-chihuahua.202-92-4-12.cpanel.site`
- **API Key:** `X-API-Key: nexgear_api_D9#k2m!P`

---

## 2. Các endpoint API

### A. Upload ảnh (base64 — dùng cách này)
- **POST** `/upload-base64`
- **Content-Type:** `application/json`
- **Header:** `X-API-Key`
- **Body single:**
```json
{ "image": "data:image/jpeg;base64,/9j/4AA...", "folder": "products" }
```
- **Body multi:**
```json
{ "images": [
    { "data": "data:image/jpeg;base64,...", "folder": "products" },
    { "data": "data:image/png;base64,...", "folder": "products" }
]}
```
- **Response:**
```json
{ "success": 2, "errors": 0, "data": [{ "name": "...", "url": "http://..." }], "failed": [] }
```

### B. Upload ảnh (multipart — bị ModSecurity chặn trên cPanel)
- **POST** `/upload` — có thể dùng qua Postman nhưng server-to-server bị 403

### C. Xóa 1 ảnh
- **DELETE** `/images/{TEN_FILE_ANH}`

### D. Xóa nhiều ảnh
- **POST** `/delete-multiple`
- **Body:** `{ "filenames": ["img-xxx.jpg", "img-yyy.png"] }`
- **Response:** `{ "success": 2, "errors": 0, "deleted": [...], "failed": [...] }`

### E. Danh sách ảnh
- **GET** `/images?page=1&limit=20`

### F. Health check
- **GET** `/health`

---

## 3. Kiến trúc tích hợp

```
Client (browser) --> /api/upload (Next.js proxy) --> /upload (cPanel multipart)
```

- Tất cả client code gọi `/api/upload` bình thường (FormData)
- Route Next.js forward multipart trực tiếp sang cPanel (không convert base64)
- API key gửi qua form field `api_key` (bypass LiteSpeed strip X-API-Key header trên POST)
- Client không cần biết chi tiết — mọi thứ transparent

### File quan trọng

| File | Vai trò |
|------|---------|
| `src/app/api/upload/route.ts` | Proxy: nhận FormData → forward multipart → gửi cPanel |
| `src/app/api/ai/generate-image/route.ts` | Tạo ảnh AI → upload multipart → trả URL |
| `.env.local` | `NEXT_PUBLIC_IMAGE_SERVER_URL`, `IMAGE_SERVER_KEY` |
| `next.config.ts` | `remotePatterns` cho domain ảnh external |

### Server PHP (deploy lên cPanel)

| File | Vai trò |
|------|---------|
| `index.php` | Router chính |
| `handlers/upload-base64.php` | Upload qua JSON base64 (single + multi) |
| `handlers/delete-multiple.php` | Xóa nhiều ảnh cùng lúc |
| `handlers/upload.php` | Upload multipart (backup) |
| `handlers/delete.php` | Xóa 1 ảnh |
| `config.php` | API key, limits, settings |

---

## 4. Deploy server lên cPanel

1. Upload toàn bộ thư mục `image-server/` lên cPanel (bao gồm files mới)
2. Đảm bảo `uploads/` có quyền ghi (755)
3. Test: `GET /health` phải trả về `{ "status": "ok" }`
4. Test upload: `POST /upload-base64` với JSON body

---

## 5. Biến môi trường (.env.local)

```env
NEXT_PUBLIC_IMAGE_SERVER_URL=http://hard-mauve-chihuahua.202-92-4-12.cpanel.site
IMAGE_SERVER_KEY=nexgear_api_D9#k2m!P
```
