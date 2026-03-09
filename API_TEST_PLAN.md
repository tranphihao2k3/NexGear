# NexGear API Test Plan - 2026-03-08

> Danh sách đầy đủ 43 models, các API endpoints tương ứng, và plan kiểm thử tất cả phương thức (GET, POST, PUT, DELETE)

---

## 📊 TỔNG QUAN

| Loại | Số lượng | Ghi chú |
|------|---------|--------|
| **Models** | 43 | Core + LapLap integrated models |
| **API Resources** | 42 | 1 model (InventoryLog) chỉ read-only |
| **Endpoints** | ~130+ | Avg 3 routes/resource (GET list, GET by ID, POST, PUT, DELETE) |
| **Special Endpoints** | 5+ | Filter, Auth, Dashboard, Upload, AI Parse |

---

## 🗂️ DANH SÁCH MODELS & API ENDPOINTS

### 1️⃣ **Product Management** (8 models)

| # | Model | API Route | GET List | GET [id] | POST | PUT | DELETE | Test Priority |
|----|-------|-----------|----------|----------|------|-----|--------|---|
| 1 | Product | `/api/products` | ✅ | ✅ | ✅ | ✅ | ✅ | 🔴 HIGH |
| 2 | Category | `/api/categories` | ✅ | ✅ | ✅ | ✅ | ✅ | 🔴 HIGH |
| 3 | Brand | `/api/brands` | ✅ | ✅ | ✅ | ✅ | ✅ | 🔴 HIGH |
| 4 | ProductUnit | `/api/product-units` | ✅ | ✅ | ✅ | ✅ | ✅ | 🟡 MEDIUM |
| 5 | ProductHistory | `/api/product-history` | ✅ | ✅ | ✅ | ✅ | ✅ | 🟢 LOW |
| 6 | Component | `/api/components` | ✅ | ✅ | ✅ | ✅ | ✅ | 🟡 MEDIUM |
| 7 | Review | `/api/reviews` | ✅ | ✅ | ✅ | ✅ | ✅ | 🟡 MEDIUM |
| 8 | Coupon | `/api/coupons` | ✅ | ✅ | ✅ | ✅ | ✅ | 🟡 MEDIUM |

**Special Endpoints:**
- `GET /api/products/filter` — Advanced filter (price, condition, warranty, etc)
- `GET /api/products/filter-options` — Get available filter categories
- `GET /api/products/specs` — Product specifications

---

### 2️⃣ **Order Management** (9 models)

| # | Model | API Route | GET List | GET [id] | POST | PUT | DELETE | Test Priority |
|----|-------|-----------|----------|----------|------|-----|--------|---|
| 9 | Order | `/api/orders` | ✅ | ✅ | ✅ | ✅ | ✅ | 🔴 HIGH |
| 10 | PurchaseOrder | `/api/purchase-orders` | ✅ | ✅ | ✅ | ✅ | ✅ | 🟡 MEDIUM |
| 11 | BuybackOrder | `/api/buyback-orders` | ✅ | ✅ | ✅ | ✅ | ✅ | 🟡 MEDIUM |
| 12 | Return | `/api/returns` | ✅ | ✅ | ✅ | ✅ | ✅ | 🟡 MEDIUM |
| 13 | Shipping | `/api/shippings` | ✅ | ✅ | ✅ | ✅ | ✅ | 🟡 MEDIUM |
| 14 | WarrantyCard | `/api/warranty-cards` | ✅ | ✅ | ✅ | ✅ | ✅ | 🟡 MEDIUM |
| 15 | Transaction | `/api/transactions` | ✅ | ✅ | ✅ | ✅ | ✅ | 🟡 MEDIUM |
| 16 | Service | `/api/services` | ✅ | ✅ | ✅ | ✅ | ✅ | 🟡 MEDIUM |
| 17 | Inventory | `/api/inventories` | ✅ | ✅ | ✅ | ✅ | ✅ | 🟡 MEDIUM |

---

### 3️⃣ **User & Customer Management** (5 models)

| # | Model | API Route | GET List | GET [id] | POST | PUT | DELETE | Test Priority |
|----|-------|-----------|----------|----------|------|-----|--------|---|
| 18 | User | `/api/users` | ✅ | ✅ | ✅ | ✅ | ✅ | 🔴 HIGH |
| 19 | Customer | `/api/customers` | ✅ | ✅ | ✅ | ✅ | ✅ | 🔴 HIGH |
| 20 | Employee | `/api/employees` | ✅ | ✅ | ✅ | ✅ | ✅ | 🟡 MEDIUM |
| 21 | Attendance | `/api/attendance` | ✅ | ✅ | ✅ | ✅ | ✅ | 🟡 MEDIUM |
| 22 | Salary | `/api/salaries` | ✅ | ✅ | ✅ | ✅ | ✅ | 🟡 MEDIUM |

---

### 4️⃣ **Content Management** (8 models)

| # | Model | API Route | GET List | GET [id] | POST | PUT | DELETE | Test Priority |
|----|-------|-----------|----------|----------|------|-----|--------|---|
| 23 | Blog | `/api/blog` | ✅ | ✅ | ✅ | ✅ | ✅ | 🟡 MEDIUM |
| 24 | Banner | `/api/banners` | ✅ | ✅ | ✅ | ✅ | ✅ | 🟡 MEDIUM |
| 25 | PopupBanner | `/api/popup-banners` | ✅ | ✅ | ✅ | ✅ | ✅ | 🟡 MEDIUM |
| 26 | FAQ | `/api/faqs` | ✅ | ✅ | ✅ | ✅ | ✅ | 🟡 MEDIUM |
| 27 | Feedback | `/api/feedback` | ✅ | ✅ | ✅ | ✅ | ✅ | 🟡 MEDIUM |
| 28 | Notification | `/api/notifications` | ✅ | ✅ | ✅ | ✅ | ✅ | 🟡 MEDIUM |
| 29 | Promotion | `/api/promotions` | ✅ | ✅ | ✅ | ✅ | ✅ | 🟡 MEDIUM |
| 30 | LoyaltyPoints | `/api/loyalty-points` | ✅ | ✅ | ✅ | ✅ | ✅ | 🟡 MEDIUM |

---

### 5️⃣ **Inventory & Warehouse** (3 models)

| # | Model | API Route | GET List | GET [id] | POST | PUT | DELETE | Test Priority |
|----|-------|-----------|----------|----------|------|-----|--------|---|
| 31 | Warehouse | `/api/warehouses` | ✅ | ✅ | ✅ | ✅ | ✅ | 🟡 MEDIUM |
| 32 | Debt | `/api/debts` | ✅ | ✅ | ✅ | ✅ | ✅ | 🟡 MEDIUM |
| 33 | Supplier | `/api/suppliers` | ✅ | ✅ | ✅ | ✅ | ✅ | 🟡 MEDIUM |

---

### 6️⃣ **Admin & System** (6 models)

| # | Model | API Route | GET List | GET [id] | POST | PUT | DELETE | Test Priority |
|----|-------|-----------|----------|----------|------|-----|--------|---|
| 34 | AuditLog | `/api/audit-logs` | ✅ | ❌ | ❌ | ❌ | ❌ | 🟡 MEDIUM |
| 35 | Setting | `/api/settings` | ✅ | ✅ | ✅ | ✅ | ❌ | 🟡 MEDIUM |
| 36 | License | `/api/licenses` | ✅ | ✅ | ✅ | ✅ | ✅ | 🟢 LOW |
| 37 | Software | `/api/software` | ✅ | ✅ | ✅ | ✅ | ✅ | 🟢 LOW |
| 38 | Visitor | `/api/visitors` | ✅ | ✅ | ✅ | ✅ | ✅ | 🟢 LOW |
| 39 | CommunityListing | `/api/community` | ✅ | ✅ | ✅ | ✅ | ✅ | 🟡 MEDIUM |

---

### 7️⃣ **Special Endpoints**

| Endpoint | HTTP Method | Purpose | Priority |
|----------|-------------|---------|----------|
| `POST /api/auth/login` | POST | JWT login (LapLap) | 🔴 HIGH |
| `GET /api/auth/me` | GET | JWT verify (LapLap) | 🔴 HIGH |
| `POST /api/auth/register` | POST | User registration | 🔴 HIGH |
| `GET /api/dashboard` | GET | Admin dashboard stats | 🟡 MEDIUM |
| `POST /api/upload` | POST | Upload files/images | 🟡 MEDIUM |
| `POST /api/ai-parse-product` | POST | AI product parsing | 🟢 LOW |

---

## 🧪 TEST PLAN STRUCTURE

### Test Categories

#### **1. GET Requests (Read)**
- `GET /api/{resource}` — List with pagination, filtering, sorting
- `GET /api/{resource}/{id}` — Get single item by ID
- `GET /api/{resource}/filter` — Advanced filtering
- `GET /api/{resource}/filter-options` — Get filter metadata

**Test Scenarios:**
- ✅ List with default pagination (page=1, limit=10)
- ✅ List with custom pagination (page=2, limit=50)
- ✅ List with search query
- ✅ List with sorting (sortBy, sortDir)
- ✅ List with filters (category, brand, condition, etc)
- ✅ Get by valid ID
- ✅ Get by invalid ID (404)
- ✅ Get by non-existent ID (404)

---

#### **2. POST Requests (Create)**

**Test Scenarios:**
- ✅ Create with valid data
- ✅ Create with required fields missing
- ✅ Create with invalid data types
- ✅ Create with duplicate unique fields
- ✅ Create with invalid relationships (wrong ObjectId)
- ✅ Verify response includes created item with ID
- ✅ Verify timestamps (createdAt, updatedAt)

---

#### **3. PUT Requests (Update)**

**Test Scenarios:**
- ✅ Update with valid data
- ✅ Update partial fields
- ✅ Update non-existent ID (404)
- ✅ Update with invalid data types
- ✅ Update with duplicate unique fields
- ✅ Verify updatedAt timestamp changed
- ✅ Verify unmodified fields kept original values

---

#### **4. DELETE Requests (Delete)**

**Test Scenarios:**
- ✅ Delete existing item
- ✅ Delete non-existent ID (404)
- ✅ Verify item is actually deleted (GET returns 404)
- ✅ Delete with referential integrity (e.g., order with items)
- ✅ Verify soft delete if applicable (isDeleted flag)
- ✅ Verify cascade delete if needed

---

## 📝 PRIORITY-BASED TEST PHASES

### 🔴 **PHASE 1: Critical (HIGH Priority)** — Est 2-3 days

**Must test for MVP:**
- Products (list, create, read, update, delete)
- Categories (list, create, read, update, delete)
- Brands (list, create, read, update, delete)
- Orders (list, create, read, update, delete)
- Users (list, create, read, update, delete)
- Customers (list, create, read, update, delete)
- Auth (login, register, me)

**Coverage:** ~60 test cases

---

### 🟡 **PHASE 2: Important (MEDIUM Priority)** — Est 3-4 days

**Should test for production:**
- Product Units
- Purchase Orders
- Buyback Orders
- Returns
- Warranty Cards
- Services
- Inventory
- Employees
- Attendance
- Blog, FAQs, Banners
- Promotions, Loyalty Points
- Warehouses
- Community
- Dashboard
- Upload

**Coverage:** ~100+ test cases

---

### 🟢 **PHASE 3: Optional (LOW Priority)** — Est 1-2 days

**Nice to have:**
- Product History
- Components
- Licenses
- Software
- Visitors
- Transactions
- Debts
- Salaries
- AI Parse Product

**Coverage:** ~40+ test cases

---

## 🔧 TEST EXECUTION CHECKLIST

### Pre-Test Setup

- [ ] Postman collection created with all endpoints
- [ ] Environment variables configured (.env.test)
- [ ] Test database seeded with sample data
- [ ] CORS configured for test client
- [ ] Auth tokens generated for test users (admin, staff, customer)
- [ ] API base URL configured (http://localhost:3000/api)

### During Testing

- [ ] Test each endpoint (GET, POST, PUT, DELETE)
- [ ] Verify response status codes (200, 201, 400, 404, 500)
- [ ] Verify response body schema matches expected
- [ ] Check paging cursor/limit on list endpoints
- [ ] Verify filter/search functionality
- [ ] Test unauthorized access (401, 403)
- [ ] Test invalid input validation (400)
- [ ] Test database consistency after operations
- [ ] Test concurrent requests/race conditions

### Post-Test

- [ ] Generate test report
- [ ] Document any bugs/issues
- [ ] Performance baseline (response times)
- [ ] Coverage metrics
- [ ] Ready for integration testing with LapLap

---

## 📊 TEST METRICS

| Metric | Target | Current |
|--------|--------|---------|
| Total Endpoints | 130+ | - |
| Test Cases | 300+ | - |
| Pass Rate | 95%+ | - |
| Avg Response Time | <200ms | - |
| Critical (HIGH) | 100% | - |
| Important (MEDIUM) | 90%+ | - |
| Optional (LOW) | 80%+ | - |

---

## 🛠️ TOOLS & RESOURCES

### Recommended Tools

| Tool | Purpose | Link |
|------|---------|------|
| **Postman** | API testing & collection | https://www.postman.com |
| **Thunder Client** | VSCode extension | https://www.thunderclient.io |
| **Jest** | Unit testing | https://jestjs.io |
| **Supertest** | Integration testing | https://github.com/visionmedia/supertest |
| **k6** | Load testing | https://k6.io |

### Test Data Files

- `tests/fixtures/products.json` — Sample product data
- `tests/fixtures/orders.json` — Sample order data
- `tests/fixtures/users.json` — Sample user data
- `tests/fixtures/categories.json` — Sample category data
- `tests/seed-db.ts` — Database seeding script

---

## 🚀 NEXT STEPS

1. **Create Postman Collection** with all 130+ endpoints
2. **Setup Test Environment** (.env.test, database, fixtures)
3. **Phase 1 Testing** (Critical endpoints)
4. **Phase 2 Testing** (Important endpoints)
5. **Phase 3 Testing** (Optional endpoints)
6. **Load Testing** (k6 script)
7. **Integration Testing** (LapLap ↔ NexGear)
8. **Documentation** (API docs, test results)

---

## 📌 NOTES

- All timestamps are in UTC+7 (Vietnam timezone)
- Page numbering starts at 1 (not 0)
- Limit default: 10, maximum: 100
- All IDs are MongoDB ObjectIDs (24-character hex strings)
- Authentication: JWT token in Authorization header
- CORS enabled for specified origins only
- Rate limiting: 100 requests/minute for public, 1000 for authenticated

