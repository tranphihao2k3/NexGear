import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

// CORS đã được xử lý bởi next.config headers()
// Middleware này chỉ pass-through để tránh conflict
export function middleware(request: NextRequest) {
  return NextResponse.next()
}

// Không match bất kỳ route nào → middleware không chạy
// Nhưng file vẫn phải tồn tại để Next.js build đúng
export const config = {
  matcher: [],
}
