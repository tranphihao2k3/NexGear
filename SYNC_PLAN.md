# PLAN: NexGear (BE chính) ↔ LapLap (Frontend gọi API)

> **Kiến trúc**: NexGear giữ toàn bộ DB + BE. LapLap bỏ hết BE/models, chỉ giữ frontend và gọi API sang NexGear.
> Giống như 2 bộ vỏ, 1 bộ não. NexGear là não.

---

## KIẾN TRÚC

```
┌─────────────────┐         ┌─────────────────────────┐
│   LapLap App    │         │      NexGear App         │
│  (Frontend UI)  │  ────►  │  (BE + API + DB chính)   │
│  Next.js SSR    │  API    │  Next.js Full-stack       │
│  Tailwind CSS   │  calls  │  MongoDB                  │
│  Không có DB    │         │  Mongoose Models          │
└─────────────────┘         └─────────────────────────┘
```

**LapLap sẽ:**
- Bỏ toàn bộ thư mục `models/`
- Bỏ toàn bộ `app/api/` (hoặc chỉ giữ proxy routes)
- Bỏ `lib/mongodb.ts`
- Gọi API NexGear qua fetch/axios
- Giữ nguyên UI, components, pages

**NexGear sẽ:**
- Mở rộng API để phục vụ cả LapLap
- Mở rộng models để chứa data laptop (isUsed, warranty, specs...)
- Thêm tính năng LapLap cần (warranty, service, loyalty...) vào BE

---

## PHÂN LOẠI CÔNG VIỆC

### 🟢 NHÓM A: Mở rộng NexGear BE (thêm features từ LapLap)

NexGear cần thêm các model + API mà LapLap đang có:

**Models cần thêm vào NexGear:**

| Model mới | Mục đích | Từ LapLap |
|-----------|----------|-----------|
| `Customer` | Tách KH khỏi User, loyalty/VIP | `models/Customer.ts` |
| `Employee` | Quản lý nhân sự | `models/Employee.ts` |
| `Warehouse` | Multi-warehouse | `models/Warehouse.ts` |
| `Inventory` | Tồn kho theo warehouse | `models/Inventory.ts` |
| `ProductUnit` | Serial number tracking | `models/ProductUnit.ts` |
| `ProductHistory` | Lịch sử thay đổi SP | `models/ProductHistory.ts` |
| `PurchaseOrder` | Đơn nhập hàng | `models/PurchaseOrder.ts` |
| `WarrantyCard` | Phiếu bảo hành | `models/WarrantyCard.ts` |
| `Service` | Sửa chữa/bảo trì | `models/Service.ts` |
| `ServiceItem` | Chi tiết dịch vụ | `models/ServiceItem.ts` |
| `BuybackOrder` | Thu mua máy cũ | `models/BuybackOrder.ts` |
| `Attendance` | Chấm công | `models/Attendance.ts` |
| `Salary` | Bảng lương | `models/Salary.ts` |
| `Debt` | Công nợ | `models/Debt.ts` |
| `AuditLog` | Audit trail | `models/AuditLog.ts` |
| `Blog` | Bài viết | `models/Blog.ts` |
| `Banner` | Banner quảng cáo | `models/Banner.ts` |
| `PopupBanner` | Popup marketing | `models/PopupBanner.ts` |
| `Notification` | Thông báo | `models/Notification.ts` |
| `LoyaltyPoints` | Tích điểm | `models/LoyaltyPoints.ts` |
| `Promotion` | Khuyến mãi tự động | `models/Promotion.ts` |
| `FAQ` | Câu hỏi thường gặp | `models/FAQ.ts` |
| `Feedback` | Phản hồi KH | `models/Feedback.ts` |
| `Shipping` | Vận chuyển chi tiết | `models/Shipping.ts` |
| `Return/ReturnItem` | Đổi trả | `models/Return.ts` |
| `License` | License phần mềm | `models/License.ts` |
| `Software` | Phần mềm đi kèm | `models/Software.ts` |
| `Visitor` | Analytics | `models/Visitor.ts` |
| `Component` | Linh kiện PC | `models/Component.ts` |

**Models NexGear đã có - cần mở rộng:**

| Model | Cần thêm fields |
|-------|-----------------|
| `Product` | `isUsed`, `condition`, `usedGrade`, `warranty`, `viewCount`, `gift`, `conditionNote` |
| `Category` | `image`, `metaTitle`, `metaDescription` |
| `Brand` | `website`, `metaTitle`, `metaDescription` |
| `Order` | `tax`, `depositAmount`, `customerType`, `installmentInfo`, `deliveryDate` |
| `Supplier` | `supplierCode`, `contactPerson`, `taxCode`, `totalDebt`, `rating` |
| `Setting` | Merge config từ LapLap (hotline, warranty policy, etc.) |

### 🟡 NHÓM B: NexGear thêm API endpoints cho LapLap

NexGear cần expose thêm các API routes mà LapLap frontend sẽ gọi:

| API Group | Endpoints cần thêm |
|-----------|-------------------|
| **Public Products** | `GET /api/products` (filter by isUsed, condition, specs), `GET /api/products/[slug]`, `GET /api/products/filter-options` |
| **Public Content** | `GET /api/blog`, `GET /api/faq`, `GET /api/banners`, `GET /api/promotions` |
| **Warranty** | `GET /api/warranty/check`, `POST /api/warranty/claim` |
| **Service** | `GET /api/services`, `POST /api/services/booking` |
| **Buyback** | `POST /api/buyback`, `GET /api/buyback/status` |
| **Loyalty** | `GET /api/loyalty/points`, `POST /api/loyalty/redeem` |
| **Reviews** | `GET /api/reviews`, `POST /api/reviews` |
| **Feedback** | `POST /api/feedback` |
| **Admin (all)** | Toàn bộ admin CRUD cho models mới |

### 🔵 NHÓM C: Chuyển LapLap sang Frontend-only

| Việc cần làm | Chi tiết |
|--------------|----------|
| Xóa `models/` | Bỏ toàn bộ 44 model files |
| Xóa `app/api/` | Bỏ toàn bộ 149 API routes |
| Xóa `lib/mongodb.ts` | Không cần DB connection |
| Xóa `lib/auth.config.ts` | Auth qua NexGear API |
| Tạo `lib/api.ts` | API client gọi NexGear BE |
| Cập nhật pages | Đổi từ DB query → API call |
| Cập nhật admin | Đổi từ DB query → API call |
| Cập nhật auth | Login/register qua NexGear API |

---

## CÁC PHASE THỰC HIỆN

### ✅ PHASE 0: Nghiên cứu & Lập kế hoạch
- [x] Đọc cấu trúc dự án NexGear
- [x] Đọc cấu trúc dự án LapLap
- [x] So sánh chi tiết tất cả models
- [x] Xác định kiến trúc: NexGear = BE, LapLap = FE
- [x] Viết plan document

---

### ✅ PHASE 1: Mở rộng NexGear Models (HOÀN TẤT 2026-03-07)
> **Làm ở dự án**: NexGear (`src/models/`)
> **Tổng cộng**: 30 model files mới + 6 models mở rộng

- [x] **1.1** Mở rộng Product model (thêm isUsed, condition, usedGrade, conditionNote, warranty, warrantyMonths, viewCount, gift, source)
- [x] **1.2** Mở rộng Category model (thêm image, metaTitle, metaDescription)
- [x] **1.3** Mở rộng Brand model (thêm website, metaTitle, metaDescription)
- [x] **1.4** Mở rộng Order model (thêm tax, depositAmount, customerType, installmentInfo, deliveryDate, source)
- [x] **1.5** Mở rộng Supplier model (thêm supplierCode, contactPerson, taxCode, totalDebt, rating)
- [ ] **1.6** Mở rộng Setting model (merge LapLap config) — **CHƯA LÀM, không critical**
- [x] **1.7** Thêm model mới: Customer, Employee, Warehouse, Inventory
- [x] **1.8** Thêm model mới: ProductUnit, ProductHistory, PurchaseOrder
- [x] **1.9** Thêm model mới: WarrantyCard, Service, ServiceItem, BuybackOrder
- [x] **1.10** Thêm model mới: Attendance, Salary, Debt, AuditLog
- [x] **1.11** Thêm model mới: Blog, Banner, PopupBanner, Notification
- [x] **1.12** Thêm model mới: LoyaltyPoints, Promotion, FAQ, Feedback
- [x] **1.13** Thêm model mới: Shipping, Return, ReturnItem, License, Software
- [x] **1.14** Thêm model mới: Visitor, Component
- [x] **1.15** Cập nhật `models/index.ts` export tất cả 43 models

---

### ✅ PHASE 2: Thêm API routes vào NexGear (HOÀN TẤT 2026-03-08)
> **Làm ở dự án**: NexGear (`src/app/api/`)
> **Tổng cộng**: 60+ API route files (2.1-2.25) + 2 advanced routes + JWT auth + automations
> **Hoàn tất**: Tất cả CRUD routes cho 25 models + filter API + JWT auth + business logic automations

#### NexGear API Pattern (QUAN TRỌNG - AI MỚI LÀM PHẢI ĐỌC)

```
Đường dẫn: src/app/api/
Helpers: import { apiSuccess, apiError, apiPaginated, parsePagination } from '@/lib/api-helpers';
DB connect: import dbConnect from '@/lib/mongodb';
Model import: import Xyz from '@/models/Xyz';
Params type: interface Params { params: Promise<{ id: string }> }

Response format:
- apiSuccess(data, statusCode)    → { success: true, data }
- apiError(message, statusCode)   → { success: false, error }
- apiPaginated(data, total, page, limit) → { success: true, data, pagination }

Mỗi route file có: GET (list+filter), POST (create) trong route.ts
Mỗi [id]/route.ts có: GET (by id/slug), PUT (update), DELETE
```

#### NexGear đã CÓ SẴN 30 routes:
- ✅ products/, products/[id]/, products/specs/
- ✅ categories/, categories/[id]/
- ✅ brands/, brands/[id]/
- ✅ orders/, orders/[id]/
- ✅ reviews/, reviews/[id]/
- ✅ coupons/, coupons/[id]/
- ✅ suppliers/, suppliers/[id]/
- ✅ transactions/, transactions/[id]/
- ✅ inventory/
- ✅ users/, users/[id]/, users/[id]/reset-password/
- ✅ settings/
- ✅ dashboard/
- ✅ upload/
- ✅ auth/[...nextauth]/, auth/register/
- ✅ community/, community/[id]/, community/[id]/report/
- ✅ ai-parse-product/

#### CẦN THÊM MỚI (theo thứ tự ưu tiên):

- [x] **2.1** CORS middleware cho LapLap cross-origin
  > Tạo `src/middleware.ts` hoặc `src/lib/cors.ts`
  > Cho phép origin từ env `LAPLAP_ORIGIN`
  > Thêm API key validation header `x-api-key`

- [x] **2.2** CRUD routes cho Customer:
  - [x] `src/app/api/customers/route.ts` (GET list+filter, POST create)
  - [x] `src/app/api/customers/[id]/route.ts` (GET, PUT, DELETE)

- [x] **2.3** CRUD routes cho Employee:
  - [x] `src/app/api/employees/route.ts`
  - [x] `src/app/api/employees/[id]/route.ts`

- [x] **2.4** CRUD routes cho Warehouse:
  - [x] `src/app/api/warehouses/route.ts`
  - [x] `src/app/api/warehouses/[id]/route.ts`

- [x] **2.5** CRUD routes cho Inventory:
  - [x] `src/app/api/inventories/route.ts` (mở rộng inventory/ hiện có)
  - [x] `src/app/api/inventories/[id]/route.ts`

- [x] **2.6** CRUD routes cho ProductUnit:
  - [x] `src/app/api/product-units/route.ts`
  - [x] `src/app/api/product-units/[id]/route.ts`

- [x] **2.7** CRUD routes cho PurchaseOrder:
  - [x] `src/app/api/purchase-orders/route.ts`
  - [x] `src/app/api/purchase-orders/[id]/route.ts`

- [x] **2.8** CRUD routes cho WarrantyCard:
  - [x] `src/app/api/warranty-cards/route.ts`
  - [x] `src/app/api/warranty-cards/[id]/route.ts`

- [x] **2.9** CRUD routes cho Service + ServiceItem:
  - [x] `src/app/api/services/route.ts`
  - [x] `src/app/api/services/[id]/route.ts`

- [x] **2.10** CRUD routes cho BuybackOrder:
  - [x] `src/app/api/buyback-orders/route.ts`
  - [x] `src/app/api/buyback-orders/[id]/route.ts`

- [x] **2.11** CRUD routes cho Attendance:
  - [x] `src/app/api/attendance/route.ts`
  - [x] `src/app/api/attendance/[id]/route.ts`

- [x] **2.12** CRUD routes cho Salary:
  - [x] `src/app/api/salaries/route.ts`
  - [x] `src/app/api/salaries/[id]/route.ts`

- [x] **2.13** CRUD routes cho Debt:
  - [x] `src/app/api/debts/route.ts`
  - [x] `src/app/api/debts/[id]/route.ts`

- [x] **2.14** CRUD routes cho AuditLog:
  - [x] `src/app/api/audit-logs/route.ts` (GET only, no POST/PUT/DELETE)

- [x] **2.15** CRUD routes cho Blog:
  - [x] `src/app/api/blog/route.ts`
  - [x] `src/app/api/blog/[id]/route.ts`

- [x] **2.16** CRUD routes cho Banner + PopupBanner:
  - [x] `src/app/api/banners/route.ts`
  - [x] `src/app/api/banners/[id]/route.ts`
  - [x] `src/app/api/popup-banners/route.ts`
  - [x] `src/app/api/popup-banners/[id]/route.ts`

- [x] **2.17** CRUD routes cho Notification:
  - [x] `src/app/api/notifications/route.ts`
  - [x] `src/app/api/notifications/[id]/route.ts`

- [x] **2.18** CRUD routes cho LoyaltyPoints:
  - [x] `src/app/api/loyalty-points/route.ts`
  - [x] `src/app/api/loyalty-points/[id]/route.ts`

- [x] **2.19** CRUD routes cho Promotion:
  - [x] `src/app/api/promotions/route.ts`
  - [x] `src/app/api/promotions/[id]/route.ts`

- [x] **2.20** CRUD routes cho FAQ:
  - [x] `src/app/api/faqs/route.ts`
  - [x] `src/app/api/faqs/[id]/route.ts`

- [x] **2.21** CRUD routes cho Feedback:
  - [x] `src/app/api/feedback/route.ts`
  - [x] `src/app/api/feedback/[id]/route.ts`

- [x] **2.22** CRUD routes cho Shipping:
  - [x] `src/app/api/shippings/route.ts`
  - [x] `src/app/api/shippings/[id]/route.ts`

- [x] **2.23** CRUD routes cho Return + ReturnItem:
  - [x] `src/app/api/returns/route.ts`
  - [x] `src/app/api/returns/[id]/route.ts`

- [x] **2.24** CRUD routes cho Software + License:
  - [x] `src/app/api/software/route.ts`
  - [x] `src/app/api/software/[id]/route.ts`
  - [x] `src/app/api/licenses/route.ts`
  - [x] `src/app/api/licenses/[id]/route.ts`

- [x] **2.25** CRUD routes còn lại:
  - [x] `src/app/api/visitors/route.ts`
  - [x] `src/app/api/components/route.ts`
  - [x] `src/app/api/components/[id]/route.ts`
  - [x] `src/app/api/product-history/route.ts`

- [x] **2.26** Thêm API cho filter nâng cao (products):
  - [x] `src/app/api/products/filter/route.ts` — Advanced filter endpoint với support price range, condition, warranty, ratings, tags, sorting
  - [x] `src/app/api/products/filter-options/route.ts` — Get available categories, brands, price range, conditions, warranty options, tags

- [x] **2.27** Auth API cho LapLap:
  - [x] `src/lib/jwt.ts` — JWT utilities (generateToken, verifyToken, extractTokenFromHeader)
  - [x] `POST /api/auth/login` → trả JWT token (cho LapLap FE dùng)
  - [x] `GET /api/auth/me` → verify token, trả user info
  > NexGear dual auth: NextAuth (session) + JWT (stateless for LapLap)

- [x] **2.28** Automation logic (copy từ LapLap `lib/automations.ts`):
  - [x] Tạo `src/lib/automations.ts`
  - [x] onOrderDelivered: auto warranty card + loyalty points + inventory deduct
  - [x] onBuybackApproved: auto voucher
  - [x] onReturnApproved: restore inventory
  - [x] processExpiredLoyaltyPoints: cron job để xử lý điểm hết hạn

---

### ✅ PHASE 3: Tạo API Client cho LapLap (HOÀN TẤT 2026-03-08)
> **Làm ở dự án**: LapLap
> **Hoàn tất**: Tất cả 6 files + guide document

- [x] **3.1** Tạo `lib/api.ts` - API client wrapper:
  ```ts
  // Base URL từ env: NEXT_PUBLIC_NEXGEAR_API_URL
  // Tự động attach token từ cookies
  // Error handling & standardized responses
  // Type-safe responses với ApiResponse<T>
  // Exports: ApiClient, apiClient, callApi()
  ```

- [x] **3.2** Tạo `lib/api/products.ts` - Product API calls
  - getProducts, filterProducts, getFilterOptions
  - getProduct, createProduct, updateProduct, deleteProduct
  - getCategories, getBrands, getProductReviews
  - createReview, updateReview, deleteReview

- [x] **3.3** Tạo `lib/api/orders.ts` - Order API calls
  - getOrders, filterOrders, getOrder, getMyOrders
  - createOrder, updateOrder, updateOrderStatus, cancelOrder
  - confirmOrderPayment, generateTrackingNumber, getOrderStats
  - getPurchaseOrders, createPurchaseOrder

- [x] **3.4** Tạo `lib/api/auth.ts` - Auth API calls
  - login, authMe, verifyToken
  - storeToken, getToken, clearToken
  - isTokenExpired, isAuthenticated

- [x] **3.5** Tạo `lib/api/admin.ts` - Admin API calls
  - getUsers, createUser, updateUser, deleteUser
  - getCustomers, searchCustomers, addLoyaltyPoints
  - getCoupons, validateCouponCode
  - getInventory, restockProduct, getLowStockProducts
  - getBlogs, createBlog, updateBlog, deleteBlog
  - getDashboardStats, getSalesReport

- [x] **3.6** Tạo types file `types/api.ts` - Response types
  - Product, Category, Brand, Review types
  - Order, OrderItem, Address types
  - Customer, User types
  - LoginRequest, LoginResponse, AuthMeResponse
  - Filter parameter types
  - Generic ApiResponse, PaginationMeta types

- [x] **3.7** Tạo `lib/api/index.ts` - Central export hub
  - Re-export all API functions
  - Re-export all types
  - Convenience barrel file

- [x] **3.8** Tạo `PHASE_3_API_CLIENT_GUIDE.md` - Comprehensive documentation
  - Architecture overview
  - File-by-file explanation
  - Usage examples (components, hooks, server actions)
  - Error handling patterns
  - Advanced features (retry, caching, token refresh)
  - Testing examples
  - Migration guide from direct API calls
  - Troubleshooting guide

---

### ✅ PHASE 4: Chuyển LapLap Frontend sang gọi API (BẮT ĐẦU 2026-03-08)
> **Làm ở dự án**: NexGear (cập nhật UI admin trước)
> **Hoàn tất**: Cập nhật AdminSidebar + 5 admin pages mẫu

#### 4.0 **Cập nhật NexGear Admin UI** (HOÀN TẤT 2026-03-08)
- [x] **4.0.1** Cập nhật AdminSidebar: Thêm 25+ menu items từ LapLap
  - Linh kiện, Blog, Phiếu bảo hành, Dịch vụ, Thu mua máy cũ
  - Marketing, Banner, Popup Banner, FAQ, Khuyến mãi
  - Điểm tích lũy, Phản hồi, Đổi trả, Phần mềm, Bản quyền
  - Đơn nhập hàng, Kho bãi, Serial Numbers, Lịch sử SP
  - Công nợ, Chấm công, Bảng lương, Nhân viên
  - Audit Logs, Thông báo, Khách truy cập
- [x] **4.0.2** Tạo admin pages mẫu cho 5 chức năng quan trọng:
  - [x] `/admin/components` - Quản lý linh kiện
  - [x] `/admin/blog` - Quản lý bài viết
  - [x] `/admin/warranty-cards` - Quản lý phiếu bảo hành
  - [x] `/admin/services` - Quản lý dịch vụ sửa chữa
  - [x] `/admin/buyback-orders` - Quản lý thu mua máy cũ
- [x] **4.0.3** Test: Server chạy thành công, không có lỗi TypeScript

#### 4.1 **Xóa models/ directory (44 files)** - **CHƯA LÀM**
- [ ] Xóa toàn bộ `models/` directory từ LapLap
- [ ] Xóa `lib/mongodb.ts`, `lib/auth.config.ts`, `lib/audit.ts`

#### 4.2 **Cập nhật trang public LapLap** - **CHƯA LÀM**
- [ ] Home page → fetch API từ NexGear
- [ ] Product listing → fetch API
- [ ] Product detail → fetch API
- [ ] Checkout → POST API
- [ ] Search → fetch API
- [ ] Blog, FAQ, Reviews → fetch API
- [ ] Warranty check, Service booking → API
- [ ] Trade-in/Buyback → API

#### 4.3 **Cập nhật trang admin LapLap** - **CHƯA LÀM**
- [ ] Login → NexGear auth API
- [ ] All 37 admin pages → CRUD qua API
- [ ] Dashboard stats → API

#### 4.4 **Cập nhật contexts LapLap** - **CHƯA LÀM**
- [ ] CartContext → persist local + sync API
- [ ] ComparisonContext → giữ local
- [ ] Auth context → JWT token từ NexGear

#### 4.5 **Cập nhật auth LapLap** - **CHƯA LÀM**
- [ ] Bỏ NextAuth local
- [ ] Dùng JWT token từ NexGear API
- [ ] Lưu token trong cookie/localStorage

---

### ⬜ PHASE 5: Migration Data
> **Ước lượng**: ~5 script files

- [ ] **5.1** Backup LapLap DB hiện tại
- [ ] **5.2** Viết migration script: LapLap Products → NexGear Product format
- [ ] **5.3** Viết migration script: Categories, Brands
- [ ] **5.4** Viết migration script: Orders, Users, Customers
- [ ] **5.5** Viết migration script: Các model LapLap-only import vào NexGear DB
- [ ] **5.6** Run migration trên staging

---

### ⬜ PHASE 6: Testing & Deploy

- [ ] **6.1** Test: Đăng SP trên NexGear admin → LapLap hiển thị
- [ ] **6.2** Test: Đặt hàng trên LapLap → NexGear admin thấy order
- [ ] **6.3** Test: Login/register từ LapLap → qua NexGear auth
- [ ] **6.4** Test: Admin LapLap quản lý qua NexGear API
- [ ] **6.5** Test: LapLap-only features (warranty, service, buyback)
- [ ] **6.6** Deploy NexGear với API mở rộng
- [ ] **6.7** Deploy LapLap (frontend-only) trỏ tới NexGear API
- [ ] **6.8** Config CORS, API key, rate limiting production

---

## FIELD MAPPING CHI TIẾT

### Product: LapLap → NexGear

```
LapLap                    →  NexGear (target)
─────────────────────────────────────────────
name                      →  name ✓
model                     →  sku (hoặc thêm field)
slug                      →  slug ✓
price                     →  basePrice
costPrice                 →  costPrice ✓
(không có)                →  salePrice
categoryId                →  category
brandId                   →  brand
image + images            →  images (array)
specs.cpu/gpu/ram/...     →  specs (Mixed) ✓
isUsed                    →  isUsed (THÊM)
condition                 →  condition (THÊM)
usedGrade                 →  usedGrade (THÊM)
description               →  description ✓
status=='active'          →  isActive: true
isFeatured                →  isFeatured ✓
averageRating             →  ratings.average
reviewCount               →  ratings.count
viewCount                 →  viewCount (THÊM)
warranty                  →  warranty (THÊM)
gift                      →  gift (THÊM)
(không có)                →  variants (NexGear feature, giữ)
(không có)                →  stock (NexGear, giữ)
(không có)                →  tags (NexGear, giữ)
(không có)                →  seoTitle, seoDesc (NexGear, giữ)
```

---

## ENV VARIABLES

### NexGear (thêm)
```env
# CORS cho LapLap
LAPLAP_ORIGIN=https://laplap.vn
API_SECRET_KEY=xxx  # cho LapLap authenticate
```

### LapLap (đổi)
```env
# Bỏ MONGODB_URI (không cần DB nữa)
# Thêm:
NEXT_PUBLIC_NEXGEAR_API_URL=https://api.nexgear.vn
NEXGEAR_API_SECRET_KEY=xxx
```

---

## THỨ TỰ ƯU TIÊN

1. **Phase 1** → Phase 2 (NexGear BE phải xong trước)
2. **Phase 3** (tạo API client - nhỏ, nhanh)
3. **Phase 4** (chuyển LapLap FE - tốn thời gian nhất)
4. **Phase 5** (migration data)
5. **Phase 6** (testing)

> Phase 1+2 có thể cho 1 người làm NexGear
> Phase 3+4 có thể cho người khác làm LapLap (sau khi Phase 2 xong API spec)

---

## LƯU Ý QUAN TRỌNG

1. **Backup DB** cả 2 project trước khi bắt đầu
2. **API spec/contract** nên định nghĩa trước (request/response format) để 2 người làm song song
3. **CORS** phải config đúng trên NexGear
4. **Rate limiting** cho API public
5. **API versioning** nên có `/api/v1/` để sau này dễ nâng cấp
6. **NexGear admin** cần phân biệt được order đến từ web nào (thêm field `source: 'nexgear' | 'laplap'`)

---

## FILE PATHS QUAN TRỌNG

### NexGear (BE chính)
- Models: `C:/Users/HAO/Documents/nexgear/nexgear/src/models/`
- API: `C:/Users/HAO/Documents/nexgear/nexgear/src/app/api/`
- Config: `C:/Users/HAO/Documents/nexgear/nexgear/src/proxy.ts`

### LapLap (FE gọi API)
- Pages: `C:/Users/HAO/Documents/LapLap/app/`
- Components: `C:/Users/HAO/Documents/LapLap/components/`
- Contexts: `C:/Users/HAO/Documents/LapLap/context/`
- Types: `C:/Users/HAO/Documents/LapLap/types/`
- Models (SẼ XÓA): `C:/Users/HAO/Documents/LapLap/models/`
- API routes (SẼ XÓA): `C:/Users/HAO/Documents/LapLap/app/api/`
- DB conn (SẼ XÓA): `C:/Users/HAO/Documents/LapLap/lib/mongodb.ts`

---

---

## HƯỚNG DẪN CHO NGƯỜI TIẾP NHẬN

1. Đọc file này trước, hiểu kiến trúc tổng thể
2. Phase 1 đã xong → models NexGear đã có đủ 43 models
3. Phase 2 đang làm → cần tạo ~60 API route files theo pattern ở trên
4. Mỗi CRUD route theo mẫu file `src/app/api/products/route.ts` và `src/app/api/products/[id]/route.ts`
5. Luôn dùng helpers: `apiSuccess`, `apiError`, `apiPaginated`, `parsePagination` từ `@/lib/api-helpers`
6. Luôn gọi `await dbConnect()` đầu mỗi handler
7. Tham khảo code LapLap gốc tại `C:/Users/HAO/Documents/LapLap/app/api/` để xem logic business

---

*Tạo ngày: 2026-03-07*
*Cập nhật: 2026-03-08 - Phase 1 ✅ | Phase 2 ✅ | Phase 3 ✅ | Phase 4.0 ✅ (Admin UI cập nhật)*
*Trạng thái: Phase 1 ✅ | Phase 2 ✅ | Phase 3 ✅ | Phase 4.0 ✅ | Phase 4.1-6 ⬜*
