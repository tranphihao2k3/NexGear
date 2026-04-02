---
description: Quy tắc bắt buộc khi sử dụng thông tin cá nhân của shop (tên cửa hàng, SĐT, email, địa chỉ, v.v.) trong NEXGEAR multi-tenant
---

# MULTI-SITE SHOP INFO RULE

## Nguyên tắc cốt lõi

> Hệ thống NEXGEAR deploy **MỘT bản code duy nhất** cho **NHIỀU cửa hàng** khác nhau (nexgear, laptopthanhhvo, v.v.).  
> **TUYỆT ĐỐI KHÔNG** hard-code tên shop, số điện thoại, email, địa chỉ, hay bất kỳ thông tin nào đặc thù của một cửa hàng cụ thể.  
> **KHÔNG** dùng `process.env.NEXT_PUBLIC_SITE_ID` để lấy thông tin shop — biến này chỉ dùng làm fallback khi không detect được domain.

---

## Cách lấy thông tin shop ĐÚNG

### 1. SERVER COMPONENT / SERVER ACTION / Route Handler

Luôn dùng `headers()` để lấy domain hiện tại, rồi gọi `getSiteSettings(host)`:

```tsx
// ✅ ĐÚNG — Server Component
import { headers } from 'next/headers';
import { getSiteSettings } from '@/lib/site-config';

export default async function MyPage() {
  const headersList = await headers();
  const host = headersList.get('host') || '';
  const s = await getSiteSettings(host);

  return <p>{s.storeName} — {s.storePhone}</p>;
}
```

```tsx
// ✅ ĐÚNG — generateMetadata
export async function generateMetadata(): Promise<Metadata> {
  const headersList = await headers();
  const host = headersList.get('host') || '';
  const s = await getSiteSettings(host);
  return { title: `Trang nào đó | ${s.storeName}` };
}
```

```ts
// ✅ ĐÚNG — Route Handler (API route)
import { headers } from 'next/headers';
import { getSiteSettings } from '@/lib/site-config';

export async function GET(req: Request) {
  const host = req.headers.get('host') || '';
  const s = await getSiteSettings(host);
  return Response.json({ store: s.storeName });
}
```

### 2. CLIENT COMPONENT

Client component không thể gọi `getSiteSettings` trực tiếp (server-only).  
Dùng `useSiteSettings()` hook — settings đã được truyền từ Layout Server Component qua Context:

```tsx
// ✅ ĐÚNG — Client Component
'use client';
import { useSiteSettings } from '@/contexts/SiteSettingsContext';

export function StorePhone() {
  const s = useSiteSettings();
  return <a href={`tel:${s.storePhone}`}>{s.storePhone}</a>;
}
```

> Settings trong Context đã được load theo `host` từ `RootLayout`.  
> KHÔNG cần và KHÔNG được gọi fetch thêm trong client component.

---

## Những gì CẤM làm

```tsx
// ❌ SAI — Hard-code tên shop
<p>NEXGEAR — 0901 234 567</p>

// ❌ SAI — Dùng NEXT_PUBLIC_SITE_ID để lấy thông tin shop
const siteId = process.env.NEXT_PUBLIC_SITE_ID;
const s = await getSiteSettings(siteId);

// ❌ SAI — Gọi getSiteSettings() không có host
const s = await getSiteSettings(); // Sẽ dùng NEXT_PUBLIC_SITE_ID làm fallback, không đúng khi deploy multi-domain

// ❌ SAI — Fetch API settings trong client component
useEffect(() => {
  fetch('/api/settings').then(...)
}, []);
```

---

## Danh sách thông tin PHẢI lấy từ getSiteSettings / useSiteSettings

| Field | Mô tả |
|---|---|
| `storeName` | Tên cửa hàng (NEXGEAR / Thành Võ Laptop / ...) |
| `storePhone` | Số điện thoại hotline |
| `storeEmail` | Email hỗ trợ |
| `storeAddress` | Địa chỉ cửa hàng |
| `siteDomain` | Tên miền chính của shop |
| `siteTitle` | Tiêu đề SEO |
| `siteDescription` | Mô tả SEO |
| `siteTagline` | Slogan |
| `logoUrl` | URL logo |
| `facebook` / `instagram` / `tiktok` | Mạng xã hội |

---

## Cơ chế hoạt động của getSiteSettings(host)

```
Request đến domain: laptopthanhhvo.com
        ↓
headers().get('host') = "laptopthanhhvo.com"
        ↓
getSiteSettings("laptopthanhhvo.com")
        ↓
[1] Tìm trong DB: Setting.findOne({ siteId: "laptopthanhhvo.com" })
[2] Nếu không có → tìm theo siteDomain chứa "laptopthanhhvo.com"
[3] Cache kết quả 60 giây theo key "laptopthanhhvo.com"
        ↓
Trả về đúng settings của shop đó → render đúng tên, SĐT, địa chỉ
```

---

## Checklist trước khi commit

```
[ ] Không có chuỗi tên shop hard-code trong JSX/TSX
[ ] Không có số điện thoại / email / địa chỉ hard-code
[ ] Server component: dùng headers() + getSiteSettings(host)
[ ] Client component: dùng useSiteSettings() từ context
[ ] generateMetadata: dùng headers() + getSiteSettings(host)
[ ] Không gọi getSiteSettings() không tham số trong production code
```
