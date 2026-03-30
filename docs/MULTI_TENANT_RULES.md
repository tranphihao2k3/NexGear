---
name: multi-tenant-rules
description: >
  Skill bắt buộc đọc khi làm chức năng ảnh hưởng đến nhiều cửa hàng (NexGear, LapLap Thành Võ).
  Quy tắc tuyệt đối để không phá vỡ tính năng Multi-Site của dự án.
---

# 🌐 NEXGEAR MULTI-TENANT RULESET (MULTI-SITE CỦA LAPLAP & NEXGEAR)

Dự án này là hệ thống **Multi-Tenant** (Nhiều cửa hàng dùng chung 1 mã nguồn nhưng độc lập về giao diện và UI/UX). Hiện tại có **NEXGEAR** (Bán Gear) và **LAPLAP THÀNH VÕ** (Bán Laptop).

Để giữ hệ thống ổn định và dễ mở rộng, **BAO GIỜ CŨNG PHẢI TUÂN THỦ CÁC LUẬT SAU**:

---

## ⛔ 1. TUYỆT ĐỐI KHÔNG HARDCODE TÊN CỬA HÀNG

- **Sai (Cấm tuyệt đối):** `<h1>Chào mừng đến với NexGear</h1>` hoặc `if (store === 'NexGear')`
- **Đúng:** `<h1>Chào mừng đến với {siteSettings.storeName}</h1>`

Chìa khóa nằm ở `useSiteSettings()`. Mọi Text tĩnh liên quan đến định danh cửa hàng (Tên, địa chỉ, hotline, slogan) phải được bốc từ Setting Context, không được gõ cứng vào Code.

## 🗃️ 2. DATABASE BẮT BUỘC PHẢI DỰA VÀO `siteId` HOẶC DÙNG CHUNG CÓ CHỦ ĐÍCH

1. **Với dữ liệu Configuration (Settings, Appearance, Giao diện):** 
   - Phải đi kèm `siteId` (Ví dụ: `laptopthanhvo` hoặc `nexgear`).
   - Khi Query config: Luôn Query theo `siteId = process.env.NEXT_PUBLIC_SITE_ID`.

2. **Với dữ liệu Sản Phẩm / Đơn Hàng (Products, Orders):**
   - Hai shop hiện đang dùng chung Bể Sản Phẩm (Shared Inventory).
   - Nếu trong tương lai cần tách riêng, mọi Schema phải được bổ sung `siteId: string`.

## 📦 3. SỬ DỤNG REACT QUERY (TanStack) THAY VÌ USEEFFECT ĐỂ LOAD DỮ LIỆU ĐỘNG

Khi gọi API các dữ liệu dùng chung bốc từ DB (Danh mục, Sản phẩm nổi bật):
- **CẤM** dùng `useEffect + fetch + useState` chay. Điều này sẽ cản trở hiệu năng do Next.js hydrate lại State về `undefined`.
- **BẮT BUỘC** dùng `@tanstack/react-query`:
  ```tsx
  const { data: products = [], isLoading } = useQuery({
    queryKey: ['storefront-products', category.slug],
    queryFn: () => fetchProducts(category.slug),
    staleTime: 5 * 60 * 1000 // Cache sống ít nhất 5 phút
  });
  ```
- **Tại sao?** Vì React Query sẽ giữ Cache trên Ram của trình duyệt. Khách hàng lướt từ trang Sản phẩm về lại Trang chủ sẽ thấy liền ngay lập tức mà không phải nhìn Loading Skeleton nữa.

## 🎨 4. QUẢN LÝ GIAO DIỆN (UI/UX) LINH HOẠT THEO CỐT LÕI (CORE TÍNH NĂNG)

2 Shop có trải nghiệm khác nhau (NexGear cần 3D Cyberpunk, Thành Võ cần E-commerce thô). Bất cứ lúc nào phát triển tính năng mới:
1. Đặt biến cấu hình (Toggles) vào `Settings` DB. (Ví dụ: `showLandingPage: boolean`).
2. Code React Component sử dụng cấu hình đó:
   ```tsx
   if (siteSettings.showLandingPage) return <CyberGlobe3D />;
   return <StorefrontGrid />;
   ```
3. Đừng dùng Router Redirect (`redirect('/products')`) để "lái" trải nghiệm của khách hàng, hãy trả về Layout tĩnh tương ứng. Redirect làm chậm tốc độ phản hồi máy chủ.

## 🔗 5. NEXT.JS LINK PREFETCHING CONTROL

Trong các Header Mega Menu chứa quá nhiều danh mục (Ví dụ 50+ đường dẫn con):
- Cấm để thả rông `<Link href="...">`. Next.js sẽ ngầm tải 50 file JSON cùng lúc làm nghẽn cổ chai Network.
- Phải thêm: `<Link href="..." prefetch={false}>`.

## 🇻🇳 6. FONT CHỮ VÀ TIẾNG VIỆT
NexGear dùng Font Sci-fi (Orbitron) và nó thiếu mất dấu Tiếng Việt ở một số ký tự.
LapLap Thành Võ xài Tiếng Việt chuẩn.
- Bất cứ khi nào móc tên Shop vào làm Logo dạng chữ (`<span data-text>`), phải có hàm kiểm tra Regex:
  `const isVietnamese = /[àáãạ...]/i.test(siteSettings.storeName);`
- Đổ `fontFamily` fallback về `var(--font-body)` nếu là Tiếng Việt.

---

**🔥 CHECKLIST TRƯỚC KHI PUSH CODE CHO MULTI-TENANT:**
[ ] Đã xóa sổ hoàn toàn mọi chuỗi "NexGear" hoặc "Thành Võ" hardcode trong file TSX/SCSS.
[ ] Các lời gọi API dạng danh sách tại Client đã xài `useQuery` và bật `staleTime`.
[ ] Component có hiển thị đúng theo Logic của Settings.
[ ] Giao diện rỗng (`isLoading`) đã có `<Skeleton />` bảo kê khung hình để không bị lạch cạch Layout.
