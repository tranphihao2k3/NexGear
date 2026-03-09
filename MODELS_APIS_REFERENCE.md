# 📊 NexGear Models & APIs - Complete Reference

**Generated:** 2026-03-08  
**Total Models:** 43  
**Total API Resources:** 42 (InventoryLog is read-only)  
**Total Endpoints:** 130+  

---

## 🎯 Quick Reference Table

| # | Model | API Route | Methods | Status | Priority |
|---|-------|-----------|---------|--------|----------|
| **PRODUCT MANAGEMENT** | | | | | |
| 1 | Product | `/api/products` | GET/POST/PUT/DELETE | ✅ | 🔴 HIGH |
| 2 | Category | `/api/categories` | GET/POST/PUT/DELETE | ✅ | 🔴 HIGH |
| 3 | Brand | `/api/brands` | GET/POST/PUT/DELETE | ✅ | 🔴 HIGH |
| 4 | ProductUnit | `/api/product-units` | GET/POST/PUT/DELETE | ✅ | 🟡 MEDIUM |
| 5 | ProductHistory | `/api/product-history` | GET/POST/PUT/DELETE | ✅ | 🟢 LOW |
| 6 | Component | `/api/components` | GET/POST/PUT/DELETE | ✅ | 🟡 MEDIUM |
| 7 | Review | `/api/reviews` | GET/POST/PUT/DELETE | ✅ | 🟡 MEDIUM |
| 8 | Coupon | `/api/coupons` | GET/POST/PUT/DELETE | ✅ | 🟡 MEDIUM |
| **ORDER MANAGEMENT** | | | | | |
| 9 | Order | `/api/orders` | GET/POST/PUT/DELETE | ✅ | 🔴 HIGH |
| 10 | PurchaseOrder | `/api/purchase-orders` | GET/POST/PUT/DELETE | ✅ | 🟡 MEDIUM |
| 11 | BuybackOrder | `/api/buyback-orders` | GET/POST/PUT/DELETE | ✅ | 🟡 MEDIUM |
| 12 | Return | `/api/returns` | GET/POST/PUT/DELETE | ✅ | 🟡 MEDIUM |
| 13 | Shipping | `/api/shippings` | GET/POST/PUT/DELETE | ✅ | 🟡 MEDIUM |
| 14 | WarrantyCard | `/api/warranty-cards` | GET/POST/PUT/DELETE | ✅ | 🟡 MEDIUM |
| 15 | Transaction | `/api/transactions` | GET/POST/PUT/DELETE | ✅ | 🟡 MEDIUM |
| 16 | Service | `/api/services` | GET/POST/PUT/DELETE | ✅ | 🟡 MEDIUM |
| 17 | Inventory | `/api/inventories` | GET/POST/PUT/DELETE | ✅ | 🟡 MEDIUM |
| **USER MANAGEMENT** | | | | | |
| 18 | User | `/api/users` | GET/POST/PUT/DELETE | ✅ | 🔴 HIGH |
| 19 | Customer | `/api/customers` | GET/POST/PUT/DELETE | ✅ | 🔴 HIGH |
| 20 | Employee | `/api/employees` | GET/POST/PUT/DELETE | ✅ | 🟡 MEDIUM |
| 21 | Attendance | `/api/attendance` | GET/POST/PUT/DELETE | ✅ | 🟡 MEDIUM |
| 22 | Salary | `/api/salaries` | GET/POST/PUT/DELETE | ✅ | 🟡 MEDIUM |
| **CONTENT MANAGEMENT** | | | | | |
| 23 | Blog | `/api/blog` | GET/POST/PUT/DELETE | ✅ | 🟡 MEDIUM |
| 24 | Banner | `/api/banners` | GET/POST/PUT/DELETE | ✅ | 🟡 MEDIUM |
| 25 | PopupBanner | `/api/popup-banners` | GET/POST/PUT/DELETE | ✅ | 🟡 MEDIUM |
| 26 | FAQ | `/api/faqs` | GET/POST/PUT/DELETE | ✅ | 🟡 MEDIUM |
| 27 | Feedback | `/api/feedback` | GET/POST/PUT/DELETE | ✅ | 🟡 MEDIUM |
| 28 | Notification | `/api/notifications` | GET/POST/PUT/DELETE | ✅ | 🟡 MEDIUM |
| 29 | Promotion | `/api/promotions` | GET/POST/PUT/DELETE | ✅ | 🟡 MEDIUM |
| 30 | LoyaltyPoints | `/api/loyalty-points` | GET/POST/PUT/DELETE | ✅ | 🟡 MEDIUM |
| **INVENTORY & WAREHOUSE** | | | | | |
| 31 | Warehouse | `/api/warehouses` | GET/POST/PUT/DELETE | ✅ | 🟡 MEDIUM |
| 32 | Debt | `/api/debts` | GET/POST/PUT/DELETE | ✅ | 🟡 MEDIUM |
| 33 | Supplier | `/api/suppliers` | GET/POST/PUT/DELETE | ✅ | 🟡 MEDIUM |
| **ADMIN & SYSTEM** | | | | | |
| 34 | AuditLog | `/api/audit-logs` | GET (read-only) | ✅ | 🟡 MEDIUM |
| 35 | Setting | `/api/settings` | GET/POST/PUT | ✅ | 🟡 MEDIUM |
| 36 | License | `/api/licenses` | GET/POST/PUT/DELETE | ✅ | 🟢 LOW |
| 37 | Software | `/api/software` | GET/POST/PUT/DELETE | ✅ | 🟢 LOW |
| 38 | Visitor | `/api/visitors` | GET/POST/PUT/DELETE | ✅ | 🟢 LOW |
| 39 | CommunityListing | `/api/community` | GET/POST/PUT/DELETE | ✅ | 🟡 MEDIUM |
| **SPECIAL** | | | | | |
| - | Authentication | `/api/auth/login` | POST | ✅ | 🔴 HIGH |
| - | Authentication | `/api/auth/me` | GET | ✅ | 🔴 HIGH |
| - | Authentication | `/api/auth/register` | POST | ✅ | 🔴 HIGH |
| - | Dashboard | `/api/dashboard` | GET | ✅ | 🟡 MEDIUM |
| - | Upload | `/api/upload` | POST | ✅ | 🟡 MEDIUM |
| - | AI Parse | `/api/ai-parse-product` | POST | ✅ | 🟢 LOW |
| - | Product Filter | `/api/products/filter` | GET | ✅ | 🔴 HIGH |
| - | Filter Options | `/api/products/filter-options` | GET | ✅ | 🔴 HIGH |

---

## 📈 Statistics

### By Category
```
Product Management:    8 models ×  3 endpoints = 24 endpoints (18%)
Order Management:      9 models ×  3 endpoints = 27 endpoints (21%)
User Management:       5 models ×  3 endpoints = 15 endpoints (12%)
Content Management:    8 models ×  3 endpoints = 24 endpoints (18%)
Inventory & Warehouse: 3 models ×  3 endpoints = 9 endpoints (7%)
Admin & System:        6 models × 2.5 endpoints = 15 endpoints (12%)
Special Endpoints:     -          6 endpoints = 6 endpoints (5%)
─────────────────────────────────────────────────────
TOTAL:                43 models              130+ endpoints
```

### By Priority
```
🔴 HIGH Priority (Critical):   60 test cases
🟡 MEDIUM Priority (Important): 100+ test cases
🟢 LOW Priority (Optional):     40+ test cases
─────────────────────────────────────────────────
TOTAL:                          200+ test cases
```

### Common Endpoints Per Resource
```
GET /api/{resource}              → List with pagination & filters
GET /api/{resource}/:id          → Get single item
POST /api/{resource}             → Create item
PUT /api/{resource}/:id          → Update item
DELETE /api/{resource}/:id       → Delete item

Total typical endpoints = 5 per model ×  42 models = 210 endpoints
Minus read-only models & special cases = ~130+ actual endpoints
```

---

## 🧪 Test Plan Summary

### Phase 1: Critical (HIGH Priority)
**Est Time:** 2-3 days | **Test Cases:** 60 | **Pass Rate Target:** 100%

✅ Must test for MVP launch:
- Products (list, filter, create, read, update, delete)
- Categories (all CRUD ops)
- Brands (all CRUD ops)
- Orders (all CRUD ops)
- Users (all CRUD ops)
- Customers (all CRUD ops)
- Auth (login, register, verify)

**Example Tests:**
```
GET /api/products → 200 ✅
GET /api/products?search=laptop → 200 ✅
GET /api/products/invalid-id → 404 ❌
POST /api/products {valid data} → 201 ✅
POST /api/products {missing fields} → 400 ❌
PUT /api/products/:id {valid data} → 200 ✅
DELETE /api/products/:id → 200 ✅
```

---

### Phase 2: Important (MEDIUM Priority)
**Est Time:** 3-4 days | **Test Cases:** 100+ | **Pass Rate Target:** 90%+

✅ Should test for production release:
- Product Units, Purchase Orders, Buyback Orders
- Returns, Warranty Cards, Services, Inventory
- Employees, Attendance, Salary tracking
- Blog, FAQs, Promotions, Loyalty Points
- Warehouses, Dashboard
- Community listings

---

### Phase 3: Optional (LOW Priority)
**Est Time:** 1-2 days | **Test Cases:** 40+ | **Pass Rate Target:** 80%+

✅ Nice to have before full release:
- Product History, Components
- Licenses, Software tracking
- Visitors, Transactions analytics
- Debts tracking
- AI product parsing

---

## 🛠️ Testing Tools & Files

| Tool | File | Usage |
|------|------|-------|
| **Manual Testing** | `postman_collection.json` | Import to Postman, test manually |
| **Automated Testing** | `tests/api.test.ts` | Run with Jest + Supertest |
| **Test Plan** | `API_TEST_PLAN.md` | Detailed testing strategy |
| **Testing Guide** | `API_TESTING_GUIDE.md` | Step-by-step instructions |
| **Load Testing** | k6 script | Performance & stress testing |

---

## 🔄 Testing Workflow

```
1. Setup Phase
   ├─ Install Postman
   ├─ Import postman_collection.json
   └─ Configure environment variables

2. Manual Testing (Quick Validation)
   ├─ Test auth endpoints
   ├─ Test CRUD for each model
   └─ Document failures

3. Automated Testing (Regression)
   ├─ npm install supertest
   ├─ npm test -- tests/api.test.ts
   └─ Generate coverage report

4. Load Testing (Performance)
   ├─ k6 run tests/load.js
   ├─ Monitor response times
   └─ Identify bottlenecks

5. Integration Testing (LapLap)
   ├─ Point LapLap to NexGear API
   ├─ Test data sync
   └─ End-to-end user journey

6. Final Report
   ├─ Pass/Fail summary
   ├─ Performance metrics
   └─ Recommendations
```

---

## 📝 Test Execution Checklist

- [ ] **Setup** (.env, database, fixtures)
- [ ] **Phase 1 Tests** (Critical endpoints)
  - [ ] Products
  - [ ] Categories
  - [ ] Brands
  - [ ] Orders
  - [ ] Users
  - [ ] Customers
  - [ ] Auth
- [ ] **Phase 2 Tests** (Important endpoints)
  - [ ] Product Units through Community
- [ ] **Phase 3 Tests** (Optional endpoints)
  - [ ] Licenses, Software, Visitors, etc.
- [ ] **Performance Baseline** (avg response time)
- [ ] **Load Testing** (concurrent requests)
- [ ] **Integration Test** (LapLap ↔ NexGear)
- [ ] **Final Report** (pass rate, issues, recommendations)

---

## 🚀 Ready to Begin?

1. **Read:** [API_TESTING_GUIDE.md](./API_TESTING_GUIDE.md)
2. **Import:** `postman_collection.json` to Postman
3. **Test:** Phase 1 endpoints (Products, Categories, Orders, Users)
4. **Automate:** Run `npm test -- tests/api.test.ts`
5. **Report:** Document results and any failures

**Start with Phase 1 (Critical)** → Ensure MVP quality ✅

---

**Questions? Check the testing guide or API_TEST_PLAN.md**
