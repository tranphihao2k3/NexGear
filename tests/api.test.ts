/**
 * NexGear API Integration Tests
 * Using Jest + Supertest for automated API testing
 * 
 * Run: npm test -- tests/api.test.ts
 */

import request from 'supertest';

const API_URL = process.env.API_URL || 'http://localhost:3000';

interface TestContext {
  jwtToken?: string;
  productId?: string;
  categoryId?: string;
  brandId?: string;
  orderId?: string;
  userId?: string;
  customerId?: string;
}

const ctx: TestContext = {};

describe('🔐 Authentication API Tests', () => {
  test('POST /api/auth/login - Should login with valid credentials', async () => {
    const res = await request(API_URL)
      .post('/api/auth/login')
      .send({
        email: 'admin@nexgear.vn',
        password: 'password123'
      });

    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('success', true);
    expect(res.body).toHaveProperty('data.token');
    expect(res.body).toHaveProperty('data.user');

    // Store token for other tests
    ctx.jwtToken = res.body.data.token;
  });

  test('POST /api/auth/login - Should fail with invalid credentials', async () => {
    const res = await request(API_URL)
      .post('/api/auth/login')
      .send({
        email: 'admin@nexgear.vn',
        password: 'wrongpassword'
      });

    expect(res.status).toBe(401);
    expect(res.body).toHaveProperty('success', false);
  });

  test('GET /api/auth/me - Should get current user', async () => {
    const res = await request(API_URL)
      .get('/api/auth/me')
      .set('Authorization', `Bearer ${ctx.jwtToken}`);

    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('success', true);
    expect(res.body.data).toHaveProperty('user');
  });

  test('GET /api/auth/me - Should fail without token', async () => {
    const res = await request(API_URL)
      .get('/api/auth/me');

    expect(res.status).toBe(401);
  });
});

describe('📦 Products API Tests', () => {
  test('GET /api/products - Should list products with pagination', async () => {
    const res = await request(API_URL)
      .get('/api/products')
      .query({ page: 1, limit: 10 });

    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('success', true);
    expect(res.body).toHaveProperty('data');
    expect(Array.isArray(res.body.data)).toBe(true);
    expect(res.body).toHaveProperty('pagination');

    if (res.body.data.length > 0) {
      ctx.productId = res.body.data[0]._id;
    }
  });

  test('GET /api/products?search=laptop - Should search products', async () => {
    const res = await request(API_URL)
      .get('/api/products')
      .query({ search: 'laptop', page: 1, limit: 10 });

    expect(res.status).toBe(200);
    expect(Array.isArray(res.body.data)).toBe(true);
  });

  test('GET /api/products/filter - Should filter with advanced options', async () => {
    const res = await request(API_URL)
      .get('/api/products/filter')
      .query({
        minPrice: 10000000,
        maxPrice: 50000000,
        condition: 'new',
        sortBy: 'price',
        page: 1,
        limit: 10
      });

    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('success', true);
  });

  test('GET /api/products/filter-options - Should get filter metadata', async () => {
    const res = await request(API_URL)
      .get('/api/products/filter-options');

    expect(res.status).toBe(200);
    expect(res.body.data).toHaveProperty('categories');
    expect(res.body.data).toHaveProperty('brands');
    expect(res.body.data).toHaveProperty('priceRange');
  });

  test('GET /api/products/:id - Should get product by ID', async () => {
    if (!ctx.productId) {
      console.warn('Skipping: No product ID available');
      return;
    }

    const res = await request(API_URL)
      .get(`/api/products/${ctx.productId}`);

    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('success', true);
    expect(res.body.data._id).toBe(ctx.productId);
  });

  test('GET /api/products/:id - Should return 404 for non-existent product', async () => {
    const res = await request(API_URL)
      .get('/api/products/000000000000000000000000');

    expect(res.status).toBe(404);
  });

  test('POST /api/products - Should create product (requires auth)', async () => {
    if (!ctx.jwtToken) {
      console.warn('Skipping: No JWT token available');
      return;
    }

    // First get a category
    const catRes = await request(API_URL)
      .get('/api/categories')
      .query({ limit: 1 });

    const categoryId = catRes.body.data[0]?._id;
    if (!categoryId) {
      console.warn('Skipping: No category available');
      return;
    }

    const res = await request(API_URL)
      .post('/api/products')
      .set('Authorization', `Bearer ${ctx.jwtToken}`)
      .send({
        name: 'Test Laptop ' + Date.now(),
        slug: 'test-laptop-' + Date.now(),
        sku: 'SKU-' + Date.now(),
        category: categoryId,
        brand: categoryId, // Simplified for test
        basePrice: 25000000,
        costPrice: 20000000,
        stock: 10,
        description: 'Test product',
        condition: 'new',
        isUsed: false
      });

    expect(res.status).toBeOneOf([201, 200]);
    expect(res.body.data).toHaveProperty('_id');
    ctx.productId = res.body.data._id;
  });

  test('PUT /api/products/:id - Should update product', async () => {
    if (!ctx.jwtToken || !ctx.productId) return;

    const res = await request(API_URL)
      .put(`/api/products/${ctx.productId}`)
      .set('Authorization', `Bearer ${ctx.jwtToken}`)
      .send({
        basePrice: 24000000,
        stock: 15
      });

    expect(res.status).toBeOneOf([200, 204]);
  });

  test('DELETE /api/products/:id - Should delete product', async () => {
    if (!ctx.jwtToken || !ctx.productId) return;

    const res = await request(API_URL)
      .delete(`/api/products/${ctx.productId}`)
      .set('Authorization', `Bearer ${ctx.jwtToken}`);

    expect(res.status).toBeOneOf([200, 204]);

    // Verify deletion
    const verifyRes = await request(API_URL)
      .get(`/api/products/${ctx.productId}`);

    expect(verifyRes.status).toBe(404);
  });
});

describe('📂 Categories API Tests', () => {
  test('GET /api/categories - Should list categories', async () => {
    const res = await request(API_URL)
      .get('/api/categories')
      .query({ page: 1, limit: 50 });

    expect(res.status).toBe(200);
    expect(Array.isArray(res.body.data)).toBe(true);

    if (res.body.data.length > 0) {
      ctx.categoryId = res.body.data[0]._id;
    }
  });

  test('GET /api/categories/:id - Should get category by ID', async () => {
    if (!ctx.categoryId) return;

    const res = await request(API_URL)
      .get(`/api/categories/${ctx.categoryId}`);

    expect(res.status).toBe(200);
    expect(res.body.data._id).toBe(ctx.categoryId);
  });

  test('POST /api/categories - Should create category', async () => {
    if (!ctx.jwtToken) return;

    const res = await request(API_URL)
      .post('/api/categories')
      .set('Authorization', `Bearer ${ctx.jwtToken}`)
      .send({
        name: 'Test Category ' + Date.now(),
        slug: 'test-cat-' + Date.now(),
        description: 'Test'
      });

    expect(res.status).toBeOneOf([201, 200]);
    ctx.categoryId = res.body.data._id;
  });

  test('PUT /api/categories/:id - Should update category', async () => {
    if (!ctx.jwtToken || !ctx.categoryId) return;

    const res = await request(API_URL)
      .put(`/api/categories/${ctx.categoryId}`)
      .set('Authorization', `Bearer ${ctx.jwtToken}`)
      .send({
        name: 'Updated Category'
      });

    expect(res.status).toBeOneOf([200, 204]);
  });

  test('DELETE /api/categories/:id - Should delete category', async () => {
    if (!ctx.jwtToken || !ctx.categoryId) return;

    const res = await request(API_URL)
      .delete(`/api/categories/${ctx.categoryId}`)
      .set('Authorization', `Bearer ${ctx.jwtToken}`);

    expect(res.status).toBeOneOf([200, 204]);
  });
});

describe('🏷️ Brands API Tests', () => {
  test('GET /api/brands - Should list brands', async () => {
    const res = await request(API_URL)
      .get('/api/brands')
      .query({ limit: 10 });

    expect(res.status).toBe(200);
    expect(Array.isArray(res.body.data)).toBe(true);

    if (res.body.data.length > 0) {
      ctx.brandId = res.body.data[0]._id;
    }
  });

  test('GET /api/brands/:id - Should get brand by ID', async () => {
    if (!ctx.brandId) return;

    const res = await request(API_URL)
      .get(`/api/brands/${ctx.brandId}`);

    expect(res.status).toBe(200);
  });
});

describe('👥 Users API Tests', () => {
  test('GET /api/users - Should list users (requires auth)', async () => {
    if (!ctx.jwtToken) return;

    const res = await request(API_URL)
      .get('/api/users')
      .set('Authorization', `Bearer ${ctx.jwtToken}`)
      .query({ page: 1, limit: 10 });

    expect(res.status).toBe(200);
    expect(Array.isArray(res.body.data)).toBe(true);

    if (res.body.data.length > 0) {
      ctx.userId = res.body.data[0]._id;
    }
  });

  test('GET /api/users/:id - Should get user by ID', async () => {
    if (!ctx.jwtToken || !ctx.userId) return;

    const res = await request(API_URL)
      .get(`/api/users/${ctx.userId}`)
      .set('Authorization', `Bearer ${ctx.jwtToken}`);

    expect(res.status).toBe(200);
  });
});

describe('👤 Customers API Tests', () => {
  test('GET /api/customers - Should list customers (requires auth)', async () => {
    if (!ctx.jwtToken) return;

    const res = await request(API_URL)
      .get('/api/customers')
      .set('Authorization', `Bearer ${ctx.jwtToken}`)
      .query({ page: 1, limit: 10 });

    expect(res.status).toBe(200);
    expect(Array.isArray(res.body.data)).toBe(true);

    if (res.body.data.length > 0) {
      ctx.customerId = res.body.data[0]._id;
    }
  });
});

describe('🛒 Orders API Tests', () => {
  test('GET /api/orders - Should list orders (requires auth)', async () => {
    if (!ctx.jwtToken) return;

    const res = await request(API_URL)
      .get('/api/orders')
      .set('Authorization', `Bearer ${ctx.jwtToken}`)
      .query({ page: 1, limit: 10 });

    expect(res.status).toBe(200);
    expect(Array.isArray(res.body.data)).toBe(true);

    if (res.body.data.length > 0) {
      ctx.orderId = res.body.data[0]._id;
    }
  });
});

describe('📊 Dashboard API Tests', () => {
  test('GET /api/dashboard - Should get dashboard stats (requires auth)', async () => {
    if (!ctx.jwtToken) return;

    const res = await request(API_URL)
      .get('/api/dashboard')
      .set('Authorization', `Bearer ${ctx.jwtToken}`);

    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('success', true);
  });
});

// Helper: Custom matcher
expect.extend({
  toBeOneOf(received: number, expected: number[]) {
    const pass = expected.includes(received);
    return {
      pass,
      message: () =>
        `expected HTTP status ${received} to be one of ${expected.join(', ')}`
    };
  }
});

declare global {
  namespace jest {
    interface Matchers<R> {
      toBeOneOf(expected: number[]): R;
    }
  }
}
