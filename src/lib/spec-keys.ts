/**
 * DANH SÁCH SPEC KEYS CHUẨN THEO TỪNG DANH MỤC
 * ───────────────────────────────────────────────
 * - Key phải viết CHÍNH XÁC như trong file này khi nhập sản phẩm.
 * - Admin form sẽ dùng file này để hiện dropdown thay vì nhập tay.
 * - Nếu cần thêm key mới → thêm vào đây, KHÔNG tự nhập trong form.
 *
 * Mỗi entry: { key: tên hiển thị, placeholder: gợi ý giá trị }
 * Keys are mapped by NORMALIZED category name (lowercase, no diacritics).
 */

export interface SpecKeyDef {
    key: string;
    placeholder: string;
}

function normalize(str: string): string {
    return str
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/đ/g, 'd')
        .replace(/Đ/g, 'd')
        .replace(/\s+/g, '-')
        .trim();
}

/** Spec keys chuẩn theo normalized category name */
const CATEGORY_SPEC_KEYS: Record<string, SpecKeyDef[]> = {
    "laptop": [
        { key: "CPU", placeholder: "VD: Intel Core i5-12450H" },
        { key: "RAM", placeholder: "VD: 16GB DDR5 4800MHz" },
        { key: "GPU", placeholder: "VD: NVIDIA RTX 4060" },
        { key: "Màn hình", placeholder: "VD: 15.6 inch FHD 144Hz IPS" },
        { key: "Ổ cứng", placeholder: "VD: 512GB SSD NVMe PCIe Gen4" },
        { key: "Tần số quét", placeholder: "VD: 144Hz" },
        { key: "Pin", placeholder: "VD: 70Wh" },
        { key: "Hệ điều hành", placeholder: "VD: Windows 11 Home" },
        { key: "Cân nặng", placeholder: "VD: 1.8kg" },
        { key: "Kết nối", placeholder: "VD: WiFi 6, Bluetooth 5.2" },
    ],
    "ban-phim": [
        { key: "Switch", placeholder: "VD: Gateron Yellow" },
        { key: "Layout", placeholder: "VD: 75%, TKL, Full-size" },
        { key: "Kết nối", placeholder: "VD: Wireless + Bluetooth, USB-C" },
        { key: "Đèn LED", placeholder: "VD: RGB, Đơn màu, Không" },
        { key: "Keycap", placeholder: "VD: PBT doubleshot, ABS" },
        { key: "Pin", placeholder: "VD: 4000mAh" },
        { key: "Phần mềm", placeholder: "VD: QMK/VIA, Có phần mềm riêng" },
        { key: "Hotswap", placeholder: "VD: Có, Không" },
    ],
    "chuot": [
        { key: "Sensor", placeholder: "VD: PixArt PAW3395" },
        { key: "DPI", placeholder: "VD: 26000 DPI" },
        { key: "Kết nối", placeholder: "VD: Wireless 2.4GHz + Bluetooth" },
        { key: "Cân nặng", placeholder: "VD: 63g" },
        { key: "Pin", placeholder: "VD: 70 giờ" },
        { key: "Số nút", placeholder: "VD: 6 nút" },
        { key: "Polling rate", placeholder: "VD: 1000Hz, 4000Hz" },
        { key: "Kiểu cầm", placeholder: "VD: Claw, Palm, Fingertip" },
    ],
    "tai-nghe": [
        { key: "Driver", placeholder: "VD: 50mm" },
        { key: "Kết nối", placeholder: "VD: Wireless 2.4GHz + Bluetooth" },
        { key: "ANC", placeholder: "VD: Có, Không" },
        { key: "Pin", placeholder: "VD: 60 giờ" },
        { key: "Microphone", placeholder: "VD: Có mic boom, Mic inbuilt" },
        { key: "Trọng lượng", placeholder: "VD: 280g" },
        { key: "Tần số", placeholder: "VD: 20Hz - 20kHz" },
    ],
    "loa-mic": [
        { key: "Công suất", placeholder: "VD: 20W" },
        { key: "Kết nối", placeholder: "VD: Bluetooth 5.3, USB-C, Jack 3.5mm" },
        { key: "Pin", placeholder: "VD: 12 giờ" },
        { key: "Driver", placeholder: "VD: 2x 45mm" },
        { key: "Chống nước", placeholder: "VD: IP67, IPX5, Không" },
        { key: "Loại mic", placeholder: "VD: Condenser, Dynamic" },
        { key: "Tần số thu", placeholder: "VD: 20Hz - 20kHz" },
        { key: "Polar pattern", placeholder: "VD: Cardioid, Omnidirectional" },
    ],
    "phu-kien": [
        { key: "Loại", placeholder: "VD: Keycap, Lót chuột, Cable" },
        { key: "Chất liệu", placeholder: "VD: PBT, Vải, Nhôm" },
        { key: "Kích thước", placeholder: "VD: 900x400mm, 65%" },
        { key: "Kết nối", placeholder: "VD: USB-C, USB-A" },
        { key: "Tương thích", placeholder: "VD: Cherry MX, Mọi switch cơ" },
    ],
};

/** Lấy danh sách spec keys cho 1 category name (tự normalize). Fallback → mảng rỗng */
export function getSpecKeysForCategory(categoryName: string): SpecKeyDef[] {
    const key = normalize(categoryName);
    return CATEGORY_SPEC_KEYS[key] || [];
}
