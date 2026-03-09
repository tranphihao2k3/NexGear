/**
 * Cung cấp các hàm chuẩn hóa chuỗi phục vụ tìm kiếm và xử lý dữ liệu.
 */

/**
 * Kiểm tra xem một chuỗi truy vấn có khớp với bất kỳ mục tiêu nào không.
 * @param query Chuỗi tìm kiếm
 * @param targets Các chuỗi mục tiêu để kiểm tra
 */
export function searchMatch(query: string, ...targets: (string | number | undefined | null)[]): boolean {
    if (!query) return true;

    const q = normalizeString(query);

    return targets.some(target => {
        if (target === undefined || target === null) return false;
        const t = normalizeString(String(target));
        return t.includes(q);
    });
}

/**
 * Chuẩn hóa chuỗi: viết thường, loại bỏ khoảng trắng thừa, loại bỏ dấu tiếng Việt.
 */
export function normalizeString(str: string): string {
    if (!str) return '';

    return str
        .toLowerCase()
        .trim()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '') // Loại bỏ dấu tiếng Việt
        .replace(/đ/g, 'd')
        .replace(/Đ/g, 'd');
}
