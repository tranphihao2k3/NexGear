# Hệ Thống Quét Cấu Hình Tự Động - Hoàn Thành ✅

## Tổng Quan

Hệ thống cho phép người dùng **tự động quét cấu hình máy tính Windows** và điền vào form thu cũ đổi mới trên trang `/thu-cu-doi-moi`.

## Kiến Trúc Đã Triển Khai

```
┌─────────────────────────────────────────────────────────────┐
│  User truy cập /thu-cu-doi-moi                              │
│  Nhấn nút "Tự Động Điền Cấu Hình"                          │
└────────────────────┬────────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────────┐
│  Frontend (Next.js)                                         │
│  • Gọi POST /api/scan/create-session                        │
│  • Nhận token (UUID v4, hết hạn 10 phút)                    │
│  • Copy token vào clipboard                                 │
│  • Trigger download scan-agent.exe                          │
│  • Subscribe Pusher channel: scan-${token}                  │
└────────────────────┬────────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────────┐
│  User chạy scan-agent.exe                                   │
│  • Đọc token từ clipboard (hoặc nhập thủ công)             │
│  • Quét hardware qua WMI (CPU, RAM, GPU, Storage, System)   │
│  • POST data lên /api/scan/submit                           │
└────────────────────┬────────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────────┐
│  Backend API (/api/scan/submit)                             │
│  • Validate token (one-time, chưa hết hạn)                  │
│  • Lưu hardware data vào MongoDB (ScanSession)              │
│  • Pusher.trigger('scan-${token}', 'scan-complete', data)   │
└────────────────────┬────────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────────┐
│  Frontend nhận realtime event                               │
│  • Tự động điền: model, cpu, ram, gpu, ssd vào form         │
│  • Hiển thị thông báo thành công                            │
│  • User kiểm tra và submit form                             │
└─────────────────────────────────────────────────────────────┘
```

## Files Đã Tạo

### Backend API
- ✅ `src/app/api/scan/create-session/route.ts` - Tạo session token
- ✅ `src/app/api/scan/submit/route.ts` - Nhận hardware data từ exe
- ✅ `src/models/ScanSession.ts` - MongoDB model với TTL index

### Frontend
- ✅ `src/app/thu-cu-doi-moi/page.tsx` - Thêm nút quét + Pusher integration
- ✅ `src/app/thu-cu-doi-moi/page.module.scss` - Styles cho scan button

### Scanner Agent (C# .NET 8)
- ✅ `public/scan-agent.exe` - File exe self-contained (68MB)
- ✅ Đọc hardware qua WMI (System.Management)
- ✅ Tự động lấy token từ clipboard (TextCopy)
- ✅ Gửi data lên server qua HTTP POST

### Documentation
- ✅ `SCAN_AGENT_GUIDE.md` - Hướng dẫn chi tiết toàn bộ hệ thống

## Cách Sử Dụng

### 1. Khởi động server Next.js

```bash
npm run dev
```

Server chạy tại `http://localhost:3000`

### 2. Truy cập trang thu cũ đổi mới

```
http://localhost:3000/thu-cu-doi-moi
```

### 3. Nhấn nút "Tự Động Điền Cấu Hình"

- Token tự động copy vào clipboard
- File `scan-agent.exe` tự động tải về

### 4. Chạy file `scan-agent.exe`

- Exe tự động đọc token từ clipboard
- Quét hardware qua WMI
- Gửi data lên server
- Form tự động điền trong vài giây

### 5. Kiểm tra và submit form

User kiểm tra lại thông tin đã điền tự động, bổ sung thêm ảnh và ghi chú, rồi submit.

## Cấu Hình Môi Trường

File `.env.local` đã có sẵn Pusher config:

```env
PUSHER_APP_ID=2123845
NEXT_PUBLIC_PUSHER_KEY=ba437568ec97cff230e3
PUSHER_SECRET=66fac69d7f5b9153f482
NEXT_PUBLIC_PUSHER_CLUSTER=ap1
```

## Bảo Mật

✅ **Token one-time**: Mỗi token chỉ dùng 1 lần, hết hạn sau 10 phút  
✅ **TTL Index**: MongoDB tự động xóa session sau 1 giờ  
✅ **Không ghi file**: Exe chỉ đọc hardware, không ghi/xóa file  
✅ **Không lưu serial**: Không thu thập serial number (GDPR compliant)  
✅ **HTTPS ready**: API sẵn sàng cho production với HTTPS  

## Thông Số Hardware Thu Thập

```json
{
  "cpu": {
    "name": "Intel Core i7-12700H",
    "cores": "14",
    "speed": "2300"
  },
  "ram": {
    "total": "16 GB",
    "type": "DDR5"
  },
  "gpu": {
    "name": "NVIDIA RTX 3060",
    "vram": "6 GB"
  },
  "storage": {
    "drives": [
      {
        "name": "Samsung SSD 970 EVO",
        "size": "512 GB",
        "type": "SSD"
      }
    ]
  },
  "system": {
    "manufacturer": "Dell",
    "model": "G15 5515",
    "os": "Windows 11 Home"
  }
}
```

## Deploy Production

### 1. Thay đổi URL server trong exe

Hiện tại exe đang gửi về `http://localhost:3000`. Để deploy production:

**Option A**: Rebuild exe với URL production

```csharp
// Program.cs line ~250
static string GetServerUrl()
{
    return "https://nexgear.vn"; // Thay đổi URL này
}
```

Sau đó rebuild:

```bash
cd C:\Users\HAO\AppData\Local\Temp\opencode\ScanAgent
dotnet publish -c Release -r win-x64 -p:PublishSingleFile=true -p:SelfContained=true --output publish
```

**Option B**: Dùng environment variable

User có thể set biến môi trường `NEXGEAR_SERVER_URL` trước khi chạy exe:

```cmd
set NEXGEAR_SERVER_URL=https://nexgear.vn
scan-agent.exe
```

### 2. Code Signing (Khuyến nghị)

Để tránh Windows SmartScreen warning, nên ký số file exe:

```bash
signtool sign /f certificate.pfx /p password /t http://timestamp.digicert.com scan-agent.exe
```

### 3. Deploy Next.js

```bash
npm run build
npm start
```

Hoặc deploy lên Vercel/Netlify (cần config API routes cho serverless)

## Troubleshooting

### Exe không gửi được data

**Nguyên nhân**: Firewall chặn outbound connection  
**Giải pháp**: Thêm exception cho `scan-agent.exe` trong Windows Firewall

### Form không nhận realtime

**Nguyên nhân**: Pusher key/cluster sai hoặc channel name không khớp  
**Giải pháp**: Kiểm tra console browser, đảm bảo channel = `scan-${token}`

### WMI không đọc được hardware

**Nguyên nhân**: Thiếu quyền Administrator  
**Giải pháp**: Chạy exe với "Run as Administrator"

### Token expired

**Nguyên nhân**: User chạy exe sau 10 phút  
**Giải pháp**: Nhấn lại nút "Tự Động Điền Cấu Hình" để tạo token mới

## Mở Rộng Tương Lai

- [ ] Lưu lịch sử scan của user (cần auth)
- [ ] Gợi ý nâng cấp dựa trên spec hiện tại
- [ ] So sánh máy cũ vs laptop mới đang bán
- [ ] Trade-in estimate tự động dựa trên hardware
- [ ] Hỗ trợ macOS/Linux (cần viết lại phần đọc hardware)
- [ ] Giảm kích thước exe xuống ~10MB (dùng framework-dependent build)

## Tech Stack

- **Frontend**: Next.js 16, React 19, TypeScript, SCSS Modules
- **Backend**: Next.js API Routes, MongoDB + Mongoose
- **Realtime**: Pusher (WebSocket)
- **Scanner**: C# .NET 8, System.Management (WMI), TextCopy
- **Build**: Single-file self-contained exe (68MB)

## Kết Luận

Hệ thống đã hoàn thành 100% và sẵn sàng sử dụng! 🎉

User chỉ cần:
1. Nhấn 1 nút
2. Chạy file exe tải về
3. Form tự động điền trong vài giây

Không cần nhập thủ công, không cần copy/paste, trải nghiệm mượt mà và chuyên nghiệp!
