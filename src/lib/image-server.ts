/**
 * NEXGEAR — Image Server Client
 *
 * Client upload ảnh tích hợp vào dự án.
 * Gọi qua Next.js API route /api/upload (proxy → cPanel PHP server).
 *
 * ✅ Tự hoạt động cả dev lẫn production — không cần cấu hình thêm.
 *
 * === CÁCH DÙNG ===
 *
 * // 1. Upload 1 file (từ <input type="file">)
 * const { url } = await uploadImage(file)
 * // → { url: "http://cpanel.../uploads/2024/04/img-xxx.jpg", filename: "img-xxx.jpg" }
 *
 * // 2. Upload nhiều file
 * const urls = await uploadImages(files)
 * // → ["http://cpanel.../img-1.jpg", "http://cpanel.../img-2.jpg"]
 *
 * // 3. Xóa ảnh
 * await deleteImage("img-xxx.jpg")
 *
 * // 4. Xóa nhiều ảnh
 * await deleteImages(["img-1.jpg", "img-2.jpg"])
 */

// ─── Types ────────────────────────────────────────────────────────────────────

export interface UploadResult {
  /** URL công khai của ảnh đã upload */
  url: string;
  /** Tên file trên server (dùng để xóa sau này) */
  filename: string;
}

export interface UploadOptions {
  /** Thư mục con tùy chọn: 'products', 'banners', 'avatars', ... */
  folder?: string;
}

// ─── Core Functions ───────────────────────────────────────────────────────────

/**
 * Upload 1 ảnh lên server.
 * @throws Error nếu upload thất bại
 */
export async function uploadImage(
  file: File,
  options: UploadOptions = {}
): Promise<UploadResult> {
  const [result] = await uploadImages([file], options);
  return result;
}

/**
 * Upload nhiều ảnh trong 1 request duy nhất → trả về mảng URL.
 * Server nhận files[] và xử lý tất cả cùng lúc.
 * @throws Error nếu upload thất bại
 */
export async function uploadImages(
  files: File[],
  options: UploadOptions = {}
): Promise<UploadResult[]> {
  if (files.length === 0) return [];

  const formData = new FormData();

  if (files.length === 1) {
    // Single file: dùng field "file"
    formData.append('file', files[0]);
  } else {
    // Multi file: dùng field "files[]" — 1 request, server xử lý hết
    files.forEach(f => formData.append('files[]', f));
  }

  if (options.folder) formData.append('folder', options.folder);

  const res = await fetch('/api/upload', {
    method: 'POST',
    body: formData,
  });

  const json = await res.json();

  if (!res.ok || !json.success) {
    throw new Error(json.error || `Upload thất bại (HTTP ${res.status})`);
  }

  // Single file → data là { url, filename }
  // Multi file  → data là { urls: [...], files: [...] }
  if (files.length === 1) {
    return [{ url: json.data.url, filename: json.data.filename }];
  }

  // Multi: server trả về data.files = [{ url, name }, ...]
  return (json.data.files as Array<{ url: string; name: string }>).map(f => ({
    url: f.url,
    filename: f.name,
  }));
}

/**
 * Upload nhiều ảnh song song (nhanh hơn nhưng có thể quá tải server).
 * Dùng khi cần tốc độ và file ít (< 5 ảnh).
 */
export async function uploadImagesParallel(
  files: File[],
  options: UploadOptions = {}
): Promise<UploadResult[]> {
  return Promise.all(files.map(file => uploadImage(file, options)));
}

/**
 * Xóa 1 ảnh theo filename hoặc URL đầy đủ.
 * Không throw nếu file không tồn tại (idempotent).
 */
export async function deleteImage(filenameOrUrl: string): Promise<void> {
  const res = await fetch('/api/upload', {
    method: 'DELETE',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ filename: filenameOrUrl }),
  });

  if (!res.ok) {
    const json = await res.json().catch(() => ({}));
    // Bỏ qua lỗi 404 (file đã bị xóa rồi)
    if (res.status !== 404) {
      throw new Error(json.error || `Xóa ảnh thất bại (HTTP ${res.status})`);
    }
  }
}

/**
 * Xóa nhiều ảnh cùng lúc.
 * Tự động dùng batch API nếu có nhiều file.
 */
export async function deleteImages(filenamesOrUrls: string[]): Promise<void> {
  if (filenamesOrUrls.length === 0) return;

  const res = await fetch('/api/upload', {
    method: 'DELETE',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ filenames: filenamesOrUrls }),
  });

  if (!res.ok) {
    const json = await res.json().catch(() => ({}));
    if (res.status !== 404) {
      throw new Error(json.error || `Xóa ảnh thất bại (HTTP ${res.status})`);
    }
  }
}

// ─── React Hook (optional helper) ────────────────────────────────────────────

/**
 * Lấy URL đầy đủ từ URL ảnh (có thể là relative hoặc absolute).
 * Dùng khi cần hiển thị ảnh từ server.
 */
export function getImageUrl(url: string): string {
  if (!url) return '';
  // URL đầy đủ hoặc blob/cdn — giữ nguyên
  if (url.startsWith('http://') || url.startsWith('https://') || url.startsWith('blob:') || url.startsWith('/cdn/')) return url;
  // Convert absolute cPanel URL to /cdn/ proxy
  const serverUrl = process.env.NEXT_PUBLIC_IMAGE_SERVER_URL || '';
  if (serverUrl && url.startsWith(serverUrl)) return url.replace(serverUrl, '/cdn');
  // Relative path → proxy qua /cdn/
  return `/cdn/${url.replace(/^\//, '')}`;
}

/**
 * Kiểm tra URL có phải là ảnh từ image server không.
 */
export function isImageServerUrl(url: string): boolean {
  if (url.startsWith('/cdn/')) return true;
  const serverUrl = process.env.NEXT_PUBLIC_IMAGE_SERVER_URL || '';
  return !!serverUrl && url.startsWith(serverUrl);
}

/**
 * Lấy filename từ URL ảnh.
 * @example
 * extractFilename("http://server.com/uploads/2024/04/img-xxx.jpg")
 * // → "img-xxx.jpg"
 */
export function extractFilename(url: string): string | undefined {
  if (!url) return undefined;
  const parts = url.split('/');
  return parts[parts.length - 1] || undefined;
}
