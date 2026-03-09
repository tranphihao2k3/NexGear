# NexGear API Testing Guide

**Created:** 2026-03-08  
**Last Updated:** 2026-03-08  
**Status:** Ready for testing

---

## 📋 Quick Summary

| Resource | File | Purpose |
|----------|------|---------|
| **Test Plan** | `API_TEST_PLAN.md` | Comprehensive test strategy for 43 models, 130+ endpoints |
| **Postman Collection** | `postman_collection.json` | Ready-to-import API collection for manual testing |
| **Jest Tests** | `tests/api.test.ts` | Automated API tests using Jest + Supertest |

---

## 🗂️ Models & Endpoints Summary

**Total:** 43 models, 42 API resources, 130+ endpoints

### By Category:

| Category | Models | Endpoints | Priority |
|----------|--------|-----------|----------|
| **Product Management** | 8 | 25+ | 🔴 HIGH |
| **Order Management** | 9 | 30+ | 🔴 HIGH |
| **User & Customer** | 5 | 15+ | 🔴 HIGH |
| **Content Management** | 8 | 24+ | 🟡 MEDIUM |
| **Inventory & Warehouse** | 3 | 9+ | 🟡 MEDIUM |
| **Admin & System** | 6 | 18+ | 🟡 MEDIUM |
| **Special Endpoints** | - | 6+ | 🔴 HIGH |

---

## 🧪 Testing Approaches

### 1️⃣ Manual Testing (Postman)

**Recommended for:** Quick testing, exploratory testing, debugging

**Steps:**
1. Open Postman
2. Import `postman_collection.json`
3. Set environment variables:
   - `base_url`: http://localhost:3000/api
   - `jwt_token`: (auto-filled after login)
   - `product_id`, `category_id`, etc.
4. Click "Login (JWT)" first to get token
5. Test endpoints in order

**Pros:**
- Visual, user-friendly
- Easy to debug
- Can test invalid scenarios manually

**Cons:**
- Manual, time-consuming
- Not automated
- Hard to track results

---

### 2️⃣ Automated Testing (Jest + Supertest)

**Recommended for:** CI/CD, regression testing, coverage

**Steps:**
1. Install dependencies (if not already):
   ```bash
   npm install --save-dev jest @types/jest supertest @types/supertest
   ```

2. Configure Jest in `package.json`:
   ```json
   {
     "jest": {
       "preset": "ts-jest",
       "testEnvironment": "node",
       "testMatch": ["**/tests/**/*.test.ts"]
     }
   }
   ```

3. Run tests:
   ```bash
   npm test -- tests/api.test.ts
   ```

4. With coverage:
   ```bash
   npm test -- tests/api.test.ts --coverage
   ```

**Pros:**
- Fully automated
- Fast execution
- Can run in CI/CD
- Reproducible results
- Easy regression detection

**Cons:**
- Requires setup
- Less visual debugging
- Needs test database

---

## 📊 Test Coverage

### Phase 1: Critical (HIGH) — Must Pass for MVP
- ✅ Products (list, create, read, update, delete)
- ✅ Categories (list, create, read, update, delete)
- ✅ Brands (list, create, read, update, delete)
- ✅ Orders (list, create, read, update, delete)
- ✅ Users (list, create, read, update, delete)
- ✅ Customers (list, create, read, update, delete)
- ✅ Auth (login, register, verify token)

**Estimated Cases:** 60 tests  
**Target Pass Rate:** 100%  
**Estimated Time:** 2-3 days

---

### Phase 2: Important (MEDIUM) — Production Ready
- Product Units, Purchase Orders, Buyback Orders
- Returns, Warranty Cards, Services, Inventory
- Employees, Attendance, Blog, FAQs, Banners
- Promotions, Loyalty Points, Warehouses, Dashboard

**Estimated Cases:** 100+ tests  
**Target Pass Rate:** 90%+  
**Estimated Time:** 3-4 days

---

### Phase 3: Optional (LOW) — Nice to Have
- Product History, Components, Licenses
- Software, Visitors, Transactions, Debts, Salaries
- AI Parse Product

**Estimated Cases:** 40+ tests  
**Target Pass Rate:** 80%+  
**Estimated Time:** 1-2 days

---

## 🔍 API Testing Checklist

### For Each Endpoint

- [ ] **GET List** (pagination, filtering, sorting)
  - [ ] Default pagination (page=1, limit=10)
  - [ ] Custom pagination (page=N, limit=M)
  - [ ] Search functionality
  - [ ] Filtering by fields
  - [ ] Sorting (asc/desc)
  - [ ] Status codes: 200 ✅

- [ ] **GET by ID** (single resource)
  - [ ] Valid ID returns resource
  - [ ] Invalid ID returns 404 ❌
  - [ ] Missing ID returns 400 ❌
  - [ ] Response schema validation

- [ ] **POST Create** (new resource)
  - [ ] Valid data creates resource
  - [ ] Missing required fields returns 400 ❌
  - [ ] Invalid data types returns 400 ❌
  - [ ] Duplicate unique fields returns 400/409 ❌
  - [ ] Response includes created ID
  - [ ] Timestamps (createdAt, updatedAt) set
  - [ ] Status codes: 201 or 200 ✅

- [ ] **PUT Update** (modify resource)
  - [ ] Valid data updates resource
  - [ ] Partial update works
  - [ ] Non-existent ID returns 404 ❌
  - [ ] Invalid UUID format returns 400 ❌
  - [ ] updatedAt timestamp changes
  - [ ] Unmodified fields stay unchanged
  - [ ] Status codes: 200 or 204 ✅

- [ ] **DELETE** (remove resource)
  - [ ] Valid ID deletes resource
  - [ ] Non-existent ID returns 404 ❌
  - [ ] GET after delete returns 404 ❌
  - [ ] Referential integrity respected
  - [ ] Cascade delete if applicable
  - [ ] Status codes: 200 or 204 ✅

---

## 🛠️ Advanced Testing Scenarios

### 1. **Pagination Testing**
```bash
GET /api/products?page=1&limit=10
GET /api/products?page=2&limit=20
GET /api/products?page=100&limit=10  # Should handle gracefully
```

### 2. **Filter Testing**
```bash
GET /api/products/filter?minPrice=10000000&maxPrice=50000000
GET /api/products/filter?condition=new&sortBy=price&sortDir=asc
GET /api/products/filter?category=XYZ&brand=ABC
```

### 3. **Search Testing**
```bash
GET /api/products?search=laptop
GET /api/products?q=dell  # Alternative param
GET /api/products?search=xyz  # Empty results
```

### 4. **Authorization Testing**
```bash
GET /api/orders  # Without token → 401
GET /api/orders + Bearer token  # With token → 200
GET /api/orders + Invalid token  # → 401
```

### 5. **Validation Testing**
```bash
POST /api/products { name: "" }  # Empty required field → 400
POST /api/products { price: "abc" }  # Wrong type → 400
POST /api/products { price: -100 }  # Invalid value → 400
```

### 6. **Concurrency Testing**
```bash
Parallel POST requests to same endpoint
Concurrent PUT to same resource
Race condition detection
```

### 7. **Data Integrity Testing**
```bash
Create → Read → Verify
Update → Read → Verify
Delete → Read → Verify not exists
```

---

## 📈 Performance Testing

### Load Testing with k6

```typescript
// tests/load.js
import http from 'k6/http';
import { check } from 'k6';

export let options = {
  vus: 10,
  duration: '30s',
};

export default function () {
  let response = http.get('http://localhost:3000/api/products?page=1&limit=10');
  check(response, {
    'status is 200': (r) => r.status === 200,
    'response time < 200ms': (r) => r.timings.duration < 200,
  });
}
```

Run: `k6 run tests/load.js`

---

## 🚨 Common Issues & Fixes

| Issue | Cause | Fix |
|-------|-------|-----|
| 401 Unauthorized | Missing JWT token | Login first, store token in header |
| 400 Bad Request | Invalid request body | Check JSON schema, validate types |
| 404 Not Found | Invalid/non-existent ID | Verify ID exists, use correct format |
| 500 Server Error | Server crash/exception | Check server logs, database connection |
| CORS Error | Origins not allowed | Check CORS config in `lib/cors.ts` |
| Connection refused | Server not running | Start server: `npm run dev` |

---

## 📝 Test Results Template

```markdown
# Test Results - [Date]

## Summary
- Total Tests: X
- Passed: X ✅
- Failed: X ❌
- Skipped: X ⏭️
- Pass Rate: X%

## Phase 1: Critical
- Products: ✅ 8/8
- Categories: ✅ 5/5
- Orders: ❌ 4/5 (1 delete failed)
- ...

## Issues Found
1. **Issue #1:** Description
   - Endpoint: POST /api/orders
   - Expected: 201 Created
   - Got: 400 Bad Request
   - Fix: Validate request schema

## Performance
- Avg Response Time: 145ms
- Slowest Endpoint: GET /api/products (245ms)
- Fastest Endpoint: GET /api/categories (42ms)

## Recommendations
1. Optimize product listing query
2. Add indexes for category filter
3. Implement caching for filter-options
```

---

## 🔗 Integration with LapLap

Once NexGear APIs are fully tested:

1. **Update LapLap environment:** Point to NexGear API base URL
2. **Test authentication:** LapLap → NexGear JWT login
3. **Test data flow:** Create order on LapLap → Verify in NexGear
4. **Test sync:** Product updates on NexGear → Visible on LapLap
5. **End-to-end:** Full user journey (browse → order → track)

---

## 📚 Resources

- [API_TEST_PLAN.md](./API_TEST_PLAN.md) — Detailed test strategy
- [postman_collection.json](./postman_collection.json) — Postman import file
- [tests/api.test.ts](./tests/api.test.ts) — Jest test suite
- [Postman Documentation](https://learning.postman.com/)
- [Supertest GitHub](https://github.com/visionmedia/supertest)
- [Jest Testing](https://jestjs.io/)

---

## ✅ Next Steps

1. ✅ Review this guide
2. ✅ Import Postman collection
3. ⬜ Run Phase 1 tests (manually or automated)
4. ⬜ Document any failures
5. ⬜ Fix bugs and re-test
6. ⬜ Run Phase 2 tests
7. ⬜ Run Phase 3 tests
8. ⬜ Generate final test report
9. ⬜ Integrate with LapLap

---

**Ready to test? Let's go! 🚀**
