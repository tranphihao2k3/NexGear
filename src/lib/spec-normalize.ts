/**
 * SPEC NORMALIZATION
 * ------------------
 * Chuẩn hóa giá trị specs từ DB trước khi dùng cho bộ lọc.
 * Mục tiêu: gom các giá trị trùng ý nghĩa thành 1 nhóm duy nhất.
 *
 * Cách hoạt động:
 *   - rawValue từ DB → chạy qua normalizer → trả về filterValue ngắn gọn
 *   - Filter UI hiện filterValue
 *   - Khi query, tìm tất cả rawValues map về cùng filterValue
 */

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// CPU — Chỉ lấy tên chip, bỏ hậu tố (nhân, luồng, GHz, CPUs)
// "Intel Core i5-12450H (8 nhân 12 luồng)" → "Intel Core i5-12450H"
// "I5-12450H (12cpus)" → "Intel Core i5-12450H"
// "R7-6800H" → "AMD Ryzen 7 6800H"
// "Apple M1" / "M1" → "Apple M1"
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
function normalizeCPU(raw: string): string {
    let v = raw.trim();

    // Strip parenthetical info: (8 nhân 12 luồng), (12 CPUs), (10 nhân...), (up to 4.4GHz...)
    v = v.replace(/\s*\(.*\)\s*/g, '').trim();

    // Strip trailing clock speeds: 2.6GHz, up to 4.4GHz
    v = v.replace(/\s*\d+\.?\d*\s*GHz.*$/i, '').trim();

    // Normalize short forms like "I5-12450H" → "Intel Core i5-12450H"
    const intelShort = v.match(/^[Ii]([3579])-(\w+)$/);
    if (intelShort) {
        return `Intel Core i${intelShort[1]}-${intelShort[2]}`;
    }

    // Normalize "R5-...", "R7-..." → "AMD Ryzen 5/7 ..."
    const amdShort = v.match(/^R([3579])-(\w+)$/);
    if (amdShort) {
        return `AMD Ryzen ${amdShort[1]} ${amdShort[2]}`;
    }

    // "M1", "M2", "M3" without Apple prefix
    if (/^M[1-4](\s+(Pro|Max|Ultra))?$/i.test(v)) {
        return `Apple ${v}`;
    }

    // Already has "Intel Core" → just ensure consistent casing on i-prefix
    v = v.replace(/Intel\s+Core\s+[Ii](\d)/i, (_, n) => `Intel Core i${n}`);

    // "Intel Xeon" — keep as-is but strip parenthetical (already done above)

    return v;
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// RAM — Chỉ lấy dung lượng, bỏ loại/bus
// "16GB DDR5 4800MHz" → "16GB"
// "8GB LPDDR4x" → "8GB"
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
function normalizeRAM(raw: string): string {
    const match = raw.match(/(\d+)\s*GB/i);
    if (match) return `${match[1]}GB`;
    return raw.trim();
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// GPU — Lấy tên chip, bỏ VRAM chi tiết
// "NVIDIA RTX 4060 8GB GDDR6" → "NVIDIA RTX 4060"
// "Intel Iris Xe Graphics" → "Intel Iris Xe"
// "AMD Radeon RX 7600M XT 8GB" → "AMD Radeon RX 7600M XT"
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
function normalizeGPU(raw: string): string {
    let v = raw.trim();
    // Strip VRAM: "8GB GDDR6", "6GB", etc.
    v = v.replace(/\s+\d+\s*GB(\s+GDDR\d+\w*)?/i, '').trim();
    // Strip "Graphics" suffix
    v = v.replace(/\s+Graphics$/i, '').trim();
    return v;
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// MÀN HÌNH — Tách thành: Kích thước + Độ phân giải
// "15.6 inch FHD IPS chống chói" → "15.6 inch FHD"
// "14 inch Full HD IPS (đã dán chống trầy)" → "14 inch FHD"
// "16 inch 2K 165Hz" → "16 inch 2K"
// "13.3 inch Retina 2.5K" → "13.3 inch 2.5K"
//
// Filter sẽ tách thành 2 spec key:
//   - "Kích thước màn hình": 13.3 inch, 14 inch, 15.6 inch, 16 inch
//   - "Độ phân giải": FHD, 2K, 2.5K, 3K, 4K
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
interface ScreenParsed {
    size: string;       // "15.6 inch"
    resolution: string; // "FHD"
}

function parseScreen(raw: string): ScreenParsed | null {
    const v = raw.trim();

    // Extract size: "15.6 inch", "14 inch", etc.
    const sizeMatch = v.match(/([\d.]+)\s*inch/i);
    if (!sizeMatch) return null;
    const size = `${sizeMatch[1]} inch`;

    // Extract resolution
    let resolution = '';

    // Check for explicit resolution keywords
    if (/4K|UHD/i.test(v)) resolution = '4K';
    else if (/3K/i.test(v)) resolution = '3K';
    else if (/2\.5K/i.test(v)) resolution = '2.5K';
    else if (/\b2K\b/i.test(v)) resolution = '2K';
    else if (/QHD/i.test(v)) resolution = 'QHD';
    else if (/FHD\+|Full\s*HD\+/i.test(v)) resolution = 'FHD+';
    else if (/FHD|Full\s*HD|FullHD|1080p/i.test(v)) resolution = 'FHD';
    else if (/HD\+|1600/i.test(v)) resolution = 'HD+';
    else if (/HD|720p/i.test(v)) resolution = 'HD';
    else if (/Retina/i.test(v)) resolution = 'Retina';

    if (!resolution) resolution = 'Khác';

    return { size, resolution };
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// TẦN SỐ QUÉT — Trích từ màn hình hoặc field riêng
// "15.6 inch FHD 144Hz" → "144Hz"
// "165Hz" → "165Hz"
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
function normalizeRefreshRate(raw: string): string {
    const match = raw.match(/(\d+)\s*Hz/i);
    if (match) return `${match[1]}Hz`;
    return raw.trim();
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// Ổ CỨNG — Chỉ lấy dung lượng
// "512GB SSD NVMe PCIe Gen4" → "512GB SSD"
// "1TB HDD" → "1TB HDD"
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
function normalizeStorage(raw: string): string {
    const match = raw.match(/([\d.]+\s*[TG]B)\s*(SSD|HDD)?/i);
    if (match) {
        const capacity = match[1].replace(/\s+/g, '');
        const type = (match[2] || 'SSD').toUpperCase();
        return `${capacity} ${type}`;
    }
    return raw.trim();
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// KẾT NỐI (tai nghe, chuột, bàn phím, loa)
// Chuẩn hóa: "Bluetooth 5.0" → "Bluetooth", "USB Type-C" → "USB-C"
// "2.4GHz Wireless + Bluetooth" → "Wireless + Bluetooth"
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
function normalizeConnection(raw: string): string {
    const v = raw.trim().toLowerCase();

    if (/wireless.*bluetooth|bluetooth.*wireless|2\.4.*bluetooth/i.test(v))
        return 'Wireless + Bluetooth';
    if (/2\.4\s*g(hz)?|wireless|không dây/i.test(v)) return 'Wireless 2.4GHz';
    if (/bluetooth/i.test(v)) return 'Bluetooth';
    if (/usb[- ]?c|type[- ]?c/i.test(v)) return 'USB-C';
    if (/usb/i.test(v)) return 'USB';
    if (/3\.5\s*mm|jack|aux/i.test(v)) return 'Jack 3.5mm';
    if (/có dây|wired/i.test(v)) return 'Có dây';

    return raw.trim();
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// SWITCH (bàn phím)
// "Gateron Yellow Pro" → "Gateron Yellow"
// "Cherry MX Red" → "Cherry MX Red"
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
function normalizeSwitch(raw: string): string {
    let v = raw.trim();
    // Strip "Pro", "V2", "V3", "Lubed" suffixes for grouping
    v = v.replace(/\s+(Pro|V\d|Lubed|Pre-lubed)$/i, '').trim();
    return v;
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// LAYOUT (bàn phím)
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
function normalizeLayout(raw: string): string {
    const v = raw.trim().toUpperCase();
    if (/FULL|100%/.test(v)) return 'Full-size (100%)';
    if (/TKL|80%|TENKEYLESS/.test(v)) return 'TKL (80%)';
    if (/75%/.test(v)) return '75%';
    if (/65%/.test(v)) return '65%';
    if (/60%/.test(v)) return '60%';
    if (/40%/.test(v)) return '40%';
    if (/96%|1800/.test(v)) return '96%';
    return raw.trim();
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// DPI (chuột) — Group theo khoảng
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
function normalizeDPI(raw: string): string {
    const match = raw.match(/([\d,]+)\s*DPI/i) || raw.match(/([\d,]+)/);
    if (match) {
        const dpi = parseInt(match[1].replace(/,/g, ''));
        if (dpi <= 6000) return 'Đến 6,000 DPI';
        if (dpi <= 12000) return 'Đến 12,000 DPI';
        if (dpi <= 20000) return 'Đến 20,000 DPI';
        if (dpi <= 26000) return 'Đến 26,000 DPI';
        return 'Trên 26,000 DPI';
    }
    return raw.trim();
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// CÂN NẶNG (chuột) — Group theo khoảng
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
function normalizeWeight(raw: string): string {
    const match = raw.match(/([\d.]+)\s*g/i);
    if (match) {
        const g = parseFloat(match[1]);
        if (g < 60) return 'Siêu nhẹ (< 60g)';
        if (g < 80) return 'Nhẹ (60-80g)';
        if (g < 100) return 'Trung bình (80-100g)';
        return 'Nặng (> 100g)';
    }
    return raw.trim();
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// PIN — Chuẩn hóa giá trị pin
// "4000mAh" → "4000mAh"
// "Không" / "Không có" → null (bỏ qua)
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
function normalizeBattery(raw: string): string | null {
    const v = raw.trim().toLowerCase();
    if (/không|none|n\/a/i.test(v)) return null;
    const match = raw.match(/([\d,]+)\s*mAh/i);
    if (match) return `${match[1]}mAh`;
    return raw.trim();
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// DRIVER (tai nghe) — Kích thước driver
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
function normalizeDriver(raw: string): string {
    const match = raw.match(/([\d.]+)\s*mm/i);
    if (match) return `${match[1]}mm`;
    return raw.trim();
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// CÔNG SUẤT (loa) — Chuẩn hóa watt
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
function normalizePower(raw: string): string {
    const match = raw.match(/([\d.]+)\s*W/i);
    if (match) return `${match[1]}W`;
    return raw.trim();
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// MASTER NORMALIZER MAP
// Key = tên spec trong DB (case-sensitive)
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
type NormalizerFn = (raw: string) => string | null;

const NORMALIZERS: Record<string, NormalizerFn> = {
    'CPU': normalizeCPU,
    'RAM': normalizeRAM,
    'GPU': normalizeGPU,
    'Ổ cứng': normalizeStorage,
    'Tần số quét': normalizeRefreshRate,
    'Kết nối': normalizeConnection,
    'Switch': normalizeSwitch,
    'Layout': normalizeLayout,
    'DPI': normalizeDPI,
    'Cân nặng': normalizeWeight,
    'Pin': normalizeBattery,
    'Driver': normalizeDriver,
    'Công suất': normalizePower,
};

// Spec "Màn hình" gets special treatment — split into 2 filter keys
const SCREEN_SPEC_KEY = 'Màn hình';

/**
 * Normalize một tập hợp spec values cho 1 key.
 * Trả về: Map<normalizedValue, rawValues[]>
 * Dùng normalizedValue cho UI, rawValues cho query.
 */
export function normalizeSpecValues(
    specKey: string,
    rawValues: string[]
): Map<string, string[]> {
    const normalizer = NORMALIZERS[specKey];
    const map = new Map<string, string[]>();

    for (const raw of rawValues) {
        const normalized = normalizer ? normalizer(String(raw)) : String(raw).trim();
        if (normalized === null) continue; // skip null (e.g. "Không có pin")
        if (!map.has(normalized)) map.set(normalized, []);
        map.get(normalized)!.push(String(raw));
    }

    return map;
}

/**
 * Normalize "Màn hình" spec → tách thành nhiều filter keys.
 * Trả về: Record<filterKey, Map<normalizedValue, rawValues[]>>
 */
export function normalizeScreenSpec(
    rawValues: string[]
): Record<string, Map<string, string[]>> {
    const sizeMap = new Map<string, string[]>();
    const resMap = new Map<string, string[]>();

    for (const raw of rawValues) {
        const parsed = parseScreen(String(raw));
        if (!parsed) continue;

        if (!sizeMap.has(parsed.size)) sizeMap.set(parsed.size, []);
        sizeMap.get(parsed.size)!.push(String(raw));

        if (!resMap.has(parsed.resolution)) resMap.set(parsed.resolution, []);
        resMap.get(parsed.resolution)!.push(String(raw));
    }

    return {
        'Kích thước màn hình': sizeMap,
        'Độ phân giải': resMap,
    };
}

export { SCREEN_SPEC_KEY };

/**
 * Cho 1 normalized filter value, trả về tất cả raw values tương ứng.
 * Dùng để build MongoDB query.
 */
export function getRawValuesForFilter(
    specKey: string,
    allRawValues: string[],
    selectedNormalized: string[]
): string[] {
    const map = normalizeSpecValues(specKey, allRawValues);
    const result: string[] = [];
    for (const norm of selectedNormalized) {
        const raws = map.get(norm);
        if (raws) result.push(...raws);
    }
    return result;
}
