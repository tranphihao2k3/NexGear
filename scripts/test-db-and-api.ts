/**
 * Script kiểm tra kết nối MongoDB và test các API hiện có
 * Chạy: npx tsx scripts/test-db-and-api.ts
 */

import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';

// Load env
dotenv.config({ path: path.resolve(__dirname, '../.env.local') });

const MONGODB_URI = process.env.MONGODB_URI;

// ============ COLORS ============
const green = (s: string) => `\x1b[32m${s}\x1b[0m`;
const red = (s: string) => `\x1b[31m${s}\x1b[0m`;
const yellow = (s: string) => `\x1b[33m${s}\x1b[0m`;
const cyan = (s: string) => `\x1b[36m${s}\x1b[0m`;
const bold = (s: string) => `\x1b[1m${s}\x1b[0m`;

function divider(title: string) {
  console.log(`\n${cyan('═'.repeat(60))}`);
  console.log(bold(`  ${title}`));
  console.log(`${cyan('═'.repeat(60))}`);
}

// ============ 1. TEST MONGODB CONNECTION ============
async function testConnection() {
  divider('1. KIỂM TRA KẾT NỐI MONGODB');

  if (!MONGODB_URI) {
    console.log(red('✗ MONGODB_URI chưa được định nghĩa trong .env.local'));
    return false;
  }

  // Mask password for display
  const maskedUri = MONGODB_URI.replace(/:([^@]+)@/, ':****@');
  console.log(`  URI: ${yellow(maskedUri)}`);

  try {
    await mongoose.connect(MONGODB_URI, {
      bufferCommands: false,
      serverSelectionTimeoutMS: 10000
    });
    console.log(green('✓ Kết nối MongoDB thành công!'));
    console.log(`  Database: ${yellow(mongoose.connection.db?.databaseName || 'default (test)')}`);
    console.log(`  Host: ${yellow(mongoose.connection.host)}`);
    console.log(`  ReadyState: ${yellow(String(mongoose.connection.readyState))} (1 = connected)`);
    return true;
  } catch (error: any) {
    console.log(red('✗ Kết nối MongoDB thất bại!'));
    console.log(red(`  Lỗi: ${error.message}`));

    if (error.message.includes('bad auth') || error.message.includes('Authentication failed')) {
      console.log(yellow('\n  💡 Gợi ý: Password có thể chứa ký tự đặc biệt (@, #, %, ...).'));
      console.log(yellow('  Hãy encode password bằng encodeURIComponent().'));
      console.log(yellow(`  Ví dụ: "Phihao@2003" → "${encodeURIComponent('Phihao@2003')}"`));
    }
    return false;
  }
}

// ============ 2. CHECK COLLECTIONS & DATA ============
async function checkCollections() {
  divider('2. KIỂM TRA COLLECTIONS & DỮ LIỆU');

  const db = mongoose.connection.db;
  if (!db) {
    console.log(red('  ✗ Chưa kết nối database'));
    return;
  }

  const collections = await db.listCollections().toArray();

  if (collections.length === 0) {
    console.log(yellow('  ⚠ Database trống - chưa có collection nào!'));
    return;
  }

  console.log(`  Tìm thấy ${green(String(collections.length))} collections:\n`);

  for (const col of collections.sort((a, b) => a.name.localeCompare(b.name))) {
    const count = await db.collection(col.name).countDocuments();
    const status = count > 0 ? green(`${count} documents`) : yellow('trống');
    console.log(`  📦 ${bold(col.name.padEnd(20))} → ${status}`);

    // Show sample document if exists
    if (count > 0) {
      const sample = await db.collection(col.name).findOne();
      if (sample) {
        const keys = Object.keys(sample).filter(k => k !== '_id' && k !== '__v').slice(0, 5);
        console.log(`     Fields: ${cyan(keys.join(', '))}${keys.length < Object.keys(sample).length ? ', ...' : ''}`);
      }
    }
  }
}

// ============ 3. TEST APIs ============
async function testAPIs() {
  divider('3. TEST CÁC API ENDPOINTS');

  const BASE_URL = 'http://localhost:3000';

  const endpoints = [
    { method: 'GET', path: '/api/products', desc: 'Lấy danh sách sản phẩm' },
    { method: 'GET', path: '/api/brands', desc: 'Lấy danh sách brands' },
    { method: 'GET', path: '/api/categories', desc: 'Lấy danh sách categories' },
    { method: 'GET', path: '/api/orders', desc: 'Lấy danh sách orders' },
    { method: 'GET', path: '/api/users', desc: 'Lấy danh sách users' },
    { method: 'GET', path: '/api/reviews', desc: 'Lấy danh sách reviews' },
    { method: 'GET', path: '/api/coupons', desc: 'Lấy danh sách coupons' },
    { method: 'GET', path: '/api/suppliers', desc: 'Lấy danh sách suppliers' },
    { method: 'GET', path: '/api/transactions', desc: 'Lấy danh sách transactions' },
    { method: 'GET', path: '/api/inventory', desc: 'Lấy danh sách inventory' },
  ];

  // Check if server is running
  try {
    const check = await fetch(`${BASE_URL}/api/products`, {
      signal: AbortSignal.timeout(5000)
    });
    console.log(green('  ✓ Server đang chạy tại ' + BASE_URL));
  } catch {
    console.log(yellow('  ⚠ Server chưa chạy tại ' + BASE_URL));
    console.log(yellow('  Bỏ qua test API. Hãy chạy "npm run dev" trước.'));
    return;
  }

  console.log('');

  for (const ep of endpoints) {
    try {
      const start = Date.now();
      const res = await fetch(`${BASE_URL}${ep.path}`, {
        method: ep.method,
        signal: AbortSignal.timeout(10000),
      });
      const elapsed = Date.now() - start;
      const body = await res.json().catch(() => null);

      const statusColor = res.ok ? green : red;
      const timeColor = elapsed > 2000 ? red : elapsed > 500 ? yellow : green;

      console.log(
        `  ${statusColor(`${res.status}`)} ${ep.method.padEnd(4)} ${ep.path.padEnd(25)} ` +
        `${timeColor(`${elapsed}ms`.padEnd(8))} ${ep.desc}`
      );

      if (body) {
        if (body.data && Array.isArray(body.data)) {
          console.log(`       → ${cyan(`${body.data.length} items`)}${body.pagination ? `, total: ${body.pagination.total}` : ''}`);
        } else if (body.error || body.message) {
          console.log(`       → ${yellow(body.error || body.message)}`);
        }
      }
    } catch (error: any) {
      console.log(
        `  ${red('ERR')} ${ep.method.padEnd(4)} ${ep.path.padEnd(25)} ${red(error.message?.substring(0, 50))}`
      );
    }
  }
}

// ============ MAIN ============
async function main() {
  console.log(bold('\n🔧 NEXGEAR - Database & API Health Check\n'));

  const connected = await testConnection();

  if (connected) {
    await checkCollections();
  }

  await testAPIs();

  divider('KẾT QUẢ');
  if (connected) {
    console.log(green('  ✓ MongoDB kết nối OK'));
  } else {
    console.log(red('  ✗ MongoDB kết nối THẤT BẠI'));
    console.log(yellow('\n  📋 HƯỚNG DẪN SỬA:'));
    console.log(yellow('  1. Kiểm tra MONGODB_URI trong .env.local'));
    console.log(yellow('  2. Encode password nếu có ký tự đặc biệt'));
    console.log(yellow('  3. Kiểm tra IP whitelist trên MongoDB Atlas'));
    console.log(yellow('  4. Kiểm tra user/password trên MongoDB Atlas'));
  }

  console.log('');
  await mongoose.disconnect();
  process.exit(0);
}

main().catch((err) => {
  console.error(red(`\nFatal error: ${err.message}`));
  process.exit(1);
});
