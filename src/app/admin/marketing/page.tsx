'use client';

import { useState, useEffect, useCallback } from 'react';
import {
    Share2,
    Copy,
    ExternalLink,
    CheckCircle,
    Plus,
    Trash2,
    Search,
    Rocket,
    Link as LinkIcon,
    Facebook,
    Sparkles,
    RefreshCw,
    Dices,
    X,
    Upload,
    ChevronLeft,
    MousePointer2,
    Zap,
    RotateCcw
} from 'lucide-react';
import Image from 'next/image';
import { useToast } from '@/components/ui/Toast';
import { Button, Badge, Input } from '@/components/ui';
import Link from 'next/link';
import s from './page.module.scss';

const PLACEHOLDER_IMAGE = 'https://res.cloudinary.com/defhezuhn/image/upload/v1705664165/placeholder-laptop.png';

interface Product {
    _id: string;
    name: string;
    price: number;
    image?: string;
    images?: string[];
    slug: string;
    specs?: {
        cpu?: string;
        gpu?: string;
        ram?: string;
        ssd?: string;
        screen?: string;
        resolution?: string;
        hz?: string;
    };
}

interface Group {
    _id: string;
    name: string;
    url: string;
    order?: number;
    isActive?: boolean;
}

export default function MarketingPage() {
    const { success: showSuccess, error: showError, info: showInfo } = useToast();
    const [products, setProducts] = useState<Product[]>([]);
    const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
    const [searchQuery, setSearchQuery] = useState('');
    const [groups, setGroups] = useState<Group[]>([]);
    const [newGroupUrl, setNewGroupUrl] = useState('');
    const [postContent, setPostContent] = useState('');
    const [copied, setCopied] = useState(false);
    const [loading, setLoading] = useState(false);
    const [genType, setGenType] = useState('standard'); // 'standard' or 'ai'
    const [activeTab, setActiveTab] = useState<'posting' | 'banner'>('posting');

    // Banner state
    const [bannerData, setBannerData] = useState<any>({
        title: '',
        imageUrl: '',
        link: '',
        isActive: false,
        displayDelay: 2000
    });
    const [isSavingBanner, setIsSavingBanner] = useState(false);
    const [isUploading, setIsUploading] = useState(false);
    const [isGeneratingAI, setIsGeneratingAI] = useState(false);

    // Posting Queue State
    const [currentGroupIndex, setCurrentGroupIndex] = useState(0);
    const [autoCopy, setAutoCopy] = useState(true);

    const fetchProducts = useCallback(async () => {
        try {
            const res = await fetch('/api/products');
            const data = await res.json();
            if (data.success) {
                setProducts(data.data.map((p: any) => ({
                    ...p,
                    price: p.salePrice || p.basePrice || 0,
                    image: p.images?.[0] || '',
                })));
            }
        } catch (error) {
            showError('Lỗi tải danh sách sản phẩm');
        }
    }, [showError]);

    const fetchGroups = useCallback(async () => {
        try {
            const res = await fetch('/api/admin/facebook-groups');
            const data = await res.json();
            if (data.success) {
                setGroups(data.data);
            }
        } catch (error) {
            showError('Lỗi tải danh sách hội nhóm');
        }
    }, [showError]);

    const fetchBanner = useCallback(async () => {
        try {
            const res = await fetch('/api/admin/banner');
            const data = await res.json();
            if (data.success) {
                setBannerData(data.data);
            }
        } catch (error) {
            // Ignore if not setup
        }
    }, []);

    useEffect(() => {
        fetchProducts();
        fetchGroups();
    }, [fetchProducts, fetchGroups]);

    useEffect(() => {
        if (activeTab === 'banner') {
            fetchBanner();
        }
    }, [activeTab, fetchBanner]);

    const generateContent = useCallback((product: Product, templateType = 'default', shouldReturn = false) => {
        const linkNexGear = `https://nexgzone.top/products/${product.slug || product._id}`;
        const linkNexGzone = `https://nexgzone.top/products/${product.slug || product._id}`;
        const link = `${linkNexGear}\n${linkNexGzone}`;
        const price = new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(product.price);
        const originalPrice = new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(product.price * 1.15);
        const nameUpper = product.name.toUpperCase();

        // ── Fuzzy spec lookup: tìm theo keyword dù key viết hoa/thường/tiếng Việt ──
        const specsObj: Record<string, string> = (product.specs && typeof product.specs === 'object')
            ? product.specs as Record<string, string>
            : {};

        const findSpec = (keywords: string[]): string => {
            const normalizeKey = (k: string) => k.toLowerCase()
                .replace(/[àáạảãâầấậẩẫăằắặẳẵ]/g, 'a')
                .replace(/[èéẹẻẽêềếệểễ]/g, 'e')
                .replace(/[ìíịỉĩ]/g, 'i')
                .replace(/[òóọỏõôồốộổỗơờớợởỡ]/g, 'o')
                .replace(/[ùúụủũưừứựửữ]/g, 'u')
                .replace(/[đ]/g, 'd')
                .replace(/[\s_\-\.]/g, '');

            for (const [k, v] of Object.entries(specsObj)) {
                const nk = normalizeKey(k);
                if (keywords.some(kw => nk.includes(normalizeKey(kw)))) {
                    return String(v);
                }
            }
            return '';
        };

        const cpuSpec  = findSpec(['cpu', 'vi xu ly', 'processor', 'chip']) || 'Mạnh mẽ, tốc độ cao';
        const ramSpec  = findSpec(['ram', 'bo nho', 'memory'])               || 'Đa nhiệm mượt mà';
        const ssdSpec  = findSpec(['ssd', 'hdd', 'o cung', 'storage', 'luu tru']) || 'Khởi động thần tốc';
        const gpuSpec  = findSpec(['gpu', 'card', 'do hoa', 'graphics', 'vga']);
        const screenRaw = findSpec(['man hinh', 'screen', 'display', 'lcd', 'oled', 'kich thuoc', 'inch']);

        const resolutionPart = product.specs?.resolution ? ` - ${product.specs.resolution}` : '';
        const hzPart = product.specs?.hz ? ` - ${product.specs.hz}` : '';
        const screenSpec = `${screenRaw || product.specs?.screen || 'Chân thực, sắc nét'}${resolutionPart}${hzPart}`;

        let content = '';
        let finalTemplateType = templateType;

        if (finalTemplateType === 'default') {
            const nameLower = product.name.toLowerCase();
            const isGaming = ['gaming', 'mechanic', 'rog', 'tuf', 'razer', 'logitech g'].some(kw => nameLower.includes(kw));
            const isPremium = ['premium', 'custom', 'pro', 'v2', 'elite'].some(kw => nameLower.includes(kw));

            if (isGaming) finalTemplateType = 'gaming';
            else if (isPremium) finalTemplateType = 'premium';
            else finalTemplateType = 'office';
        }

        // ── Specs block dùng chung — format nhất quán ──
        const pick = <T,>(arr: T[]) => arr[Math.floor(Math.random() * arr.length)];
        const gpuLine = gpuSpec ? `\n✅ GPU: ${gpuSpec}` : '';
        const specsBlock = `✅ CPU: ${cpuSpec}\n✅ RAM: ${ramSpec}${gpuLine}\n✅ SSD: ${ssdSpec}\n✅ Màn hình: ${screenSpec}`;

        const gamingVariants = [
            () => `🎮 ${nameUpper} — CON QUÁI VẬT GAMING VỪA VỀ KHO!

Anh em ơi hàng nóng mới về, cấu hình chiến mọi tựa game AAA không cần nghĩ:

⚙️ CẤU HÌNH CHI TIẾT:
${specsBlock}

💰 Giá: ${price}
📉 Giá thị trường: ${originalPrice}

Máy được test kỹ từng con ốc, chạy mượt Valo, CSGO, GTA V... thoải mái. Ai cần máy chiến game mà ngân sách có hạn thì đây là lựa chọn đáng tiền nhất!

🎁 Mua tại NexGear được tặng: Balo + Chuột + Lót chuột cao cấp
⚙️ Cài đặt game, driver FREE trọn đời
🚚 Giao hàng nhanh — Trả góp 0% duyệt 10 phút

👉 Xem ảnh thực tế & chốt: ${link}

📍 NexGear — Ninh Kiều, Cần Thơ
📞 0978.648.720 (Hào)
#NexGear #GamingGear #LaptopGaming #CanTho`,

            () => `🔥🔥 FLASH DEAL — ${nameUpper} 🔥🔥

Giá sốc chỉ ${price} (thị trường ${originalPrice})
Số lượng có hạn, ai nhanh tay người đó được!

📋 THÔNG SỐ MÁY:
${specsBlock}

Máy này chiến game cực đã — FPS cao, không giật lag, tản nhiệt tốt. Anh em nào đang tìm gear gaming giá hời thì inbox mình ngay!

🎁 Quà tặng: Full combo phụ kiện xịn
⚙️ Cài Win + Game + Driver MIỄN PHÍ
🚚 Ship COD toàn quốc — Trả góp easy

👉 ${link}

📍 NexGear — Ninh Kiều, Cần Thơ
📞 Hào — 0978.648.720
#NexGear #LaptopCanTho #GamingLaptop`,

            () => `⚡ VỪA TEST XONG CON NÀY — MÊ LUÔN!

${nameUpper}
Giá chỉ ${price} — rẻ hơn thị trường cả triệu đồng!

🔧 Cấu hình thực tế:
${specsBlock}

Mình vừa test chạy Valorant, CSGO full setting mượt lắm. Pin vẫn tốt, máy mát, ngoại hình còn đẹp. Ai cần máy gaming mà budget tầm này thì quá ngon!

🎁 Tặng kèm balo + chuột + lót chuột
⚙️ Cài phần mềm free trọn đời
💳 Trả góp 0% — Giao tận nơi

👉 Chi tiết: ${link}
📞 0978.648.720 (Hào) — NexGear, Cần Thơ
#NexGear #GamingSetup #LaptopGaming`,
        ];

        const officeVariants = [
            () => `💼 ${nameUpper} — LAPTOP VĂN PHÒNG / SINH VIÊN GIÁ TỐT!

Máy gọn nhẹ, mang đi học đi làm tiện lợi. Cấu hình đủ dùng cho Word, Excel, Zoom, xem phim...

📋 CẤU HÌNH MÁY:
${specsBlock}

💰 Chỉ: ${price}
📉 Thị trường: ${originalPrice}

🎁 Mua tại NexGear được tặng:
🎒 Balo + Chuột + Lót chuột + Túi chống sốc
⚙️ Cài Win, Office MIỄN PHÍ trọn đời
🚚 Ship tận nơi — Trả góp 0% duyệt 10 phút

👉 Xem máy: ${link}

📍 NexGear — Ninh Kiều, Cần Thơ
📞 0978.648.720 (Hào)
#NexGear #LaptopSinhVien #LaptopVanPhong`,

            () => `📚 SINH VIÊN ƠI — MÁY NÀY DÀNH CHO BẠN!

${nameUpper}
Giá sinh viên: ${price} (Ngoài bán ${originalPrice})

Cấu hình:
${specsBlock}

Mở 20 tab Chrome + Zoom + Word cùng lúc vẫn mượt. Pin trâu, màn đẹp, nhẹ dễ mang theo. Đi học đi làm đều okela!

🎁 Full quà: Balo, chuột, lót, túi chống sốc
⚙️ Cài đặt phần mềm free — Bảo hành chu đáo
💳 Trả góp 0% chỉ cần CCCD

👉 ${link}
📞 Hào — 0978.648.720 | NexGear, Cần Thơ
#NexGear #LaptopSinhVien #CanTho`,

            () => `✨ GỢI Ý MÁY NGON GIÁ HỜI CHO DÂN VĂN PHÒNG

${nameUpper} — ${price}

Mình recommend con này cho ai cần máy:
✔️ Soạn văn bản, bảng tính
✔️ Họp online, email
✔️ Xem phim, lướt web

📋 Thông số:
${specsBlock}

Máy đã được vệ sinh, thay keo tản nhiệt, cài sẵn Win + Office bản quyền. Bảo hành 6 tháng tại shop.

🎁 Tặng phụ kiện xịn khi mua
🚚 Giao hàng nhanh — Hỗ trợ trả góp

👉 ${link}
📍 NexGear — Ninh Kiều, Cần Thơ | 📞 0978.648.720
#NexGear #LaptopCanTho #LaptopCu`,
        ];

        const premiumVariants = [
            () => `💎 ${nameUpper} — MÁY CAO CẤP CHO DÂN CHUYÊN NGHIỆP

Dành cho anh em làm đồ họa, dựng phim, lập trình, kiến trúc... cần máy thật khỏe.

⚙️ CẤU HÌNH:
${specsBlock}

💰 Giá ưu đãi: ${price}
📉 Giá mới: ${originalPrice}

Máy chạy Adobe, AutoCAD, Blender... phà phà. Màn hình chuẩn màu, bàn phím gõ sướng tay.

🎁 Tặng: Balo + Chuột + Lót chuột pro
⚙️ Cài phần mềm chuyên ngành FREE
💳 Trả góp 0% — Giao hàng tận nơi

👉 ${link}
📍 NexGear — Ninh Kiều, Cần Thơ
📞 0978.648.720 (Hào)
#NexGear #LaptopDoHoa #PremiumLaptop`,

            () => `🖥️ ĐẲNG CẤP LÀM VIỆC KHÁC BIỆT!

${nameUpper}
Giá đặc biệt: ${price} (Tiết kiệm so với mua mới!)

Thông số chi tiết:
${specsBlock}

Ai đang tìm máy render, edit video, chạy nhiều phần mềm nặng thì con này là chân ái. Mình đã test và cam kết chất lượng!

🎁 Combo quà xịn + Cài phần mềm free
🚚 Ship nhanh — Trả góp 0%

👉 Xem thêm: ${link}
📞 0978.648.720 (Hào) — NexGear, Cần Thơ
#NexGear #WorkstationLaptop #CanTho`,
        ];

        const defaultVariants = [
            () => `🌟 ${nameUpper} — GIÁ CỰC TỐT TẠI NEXGEAR!

💰 Giá: ${price}
📉 Thị trường: ${originalPrice}

📋 Cấu hình chi tiết:
${specsBlock}

Máy đã qua kiểm tra kỹ lưỡng, chạy ổn định. Phù hợp cho cả học tập, làm việc và giải trí nhẹ nhàng.

🎁 Quà tặng: Balo + Chuột + Lót chuột + Túi chống sốc
⚙️ Cài đặt phần mềm & vệ sinh máy TRỌN ĐỜI
🚚 Ship COD toàn quốc — Trả góp 0%

👉 ${link}

📍 NexGear — Ninh Kiều, Cần Thơ
📞 0978.648.720 (Hào)
#NexGear #LaptopCanTho #LaptopGiaRe`,

            () => `📢 MÁY NGON GIÁ RẺ — ${nameUpper}

Chỉ ${price} thôi! (Nơi khác bán ${originalPrice})

📋 Cấu hình:
${specsBlock}

Máy còn đẹp, pin tốt, đã cài sẵn đầy đủ phần mềm. Bảo hành tận tâm tại shop.

🎁 Tặng full phụ kiện
🚚 Giao hàng nhanh — Trả góp dễ dàng

👉 ${link}
📞 0978.648.720 — NexGear, Cần Thơ
#NexGear #Laptop #CanTho`,
        ];


        if (finalTemplateType === 'gaming') {
            content = pick(gamingVariants)();
        } else if (finalTemplateType === 'office') {
            content = pick(officeVariants)();
        } else if (finalTemplateType === 'premium') {
            content = pick(premiumVariants)();
        } else {
            content = pick(defaultVariants)();
        }


        setPostContent(content);
        if (shouldReturn) return content;
    }, []);

    useEffect(() => {
        if (selectedProduct && genType === 'standard') {
            generateContent(selectedProduct);
        }
    }, [selectedProduct, genType, generateContent]);

    const generateWithAI = async (style: string) => {
        if (!selectedProduct) {
            showError('Vui lòng chọn sản phẩm trước!');
            return;
        }

        setIsGeneratingAI(true);
        try {
            const res = await fetch('/api/marketing/generate', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ product: selectedProduct, style })
            });

            const data = await res.json();
            if (data.success) {
                setPostContent(data.data);
                showSuccess('✨ AI đã tạo xong nội dung!');
            } else {
                showError(data.message || 'Lỗi khi gọi AI');
            }
        } catch (error) {
            showError('Không thể kết nối tới AI');
        } finally {
            setIsGeneratingAI(false);
        }
    };

    const copyToClipboard = useCallback(() => {
        if (!postContent) return;
        navigator.clipboard.writeText(postContent);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
        showSuccess('Đã sao chép nội dung!');
    }, [postContent, showSuccess]);

    const copyLinkOnly = () => {
        if (!selectedProduct) return;
        const link = `https://nexgzone.top/products/${selectedProduct.slug || selectedProduct._id}\nhttps://nexgzone.top/products/${selectedProduct.slug || selectedProduct._id}`;
        navigator.clipboard.writeText(link);
        showSuccess('🔗 Đã copy link sản phẩm!');
    };

    const handleRandomAndPost = () => {
        if (products.length === 0) {
            showError('Không có sản phẩm nào!');
            return;
        }
        if (groups.length === 0) {
            showError('Chưa có nhóm nào trong danh sách!');
            return;
        }

        const randomIndex = Math.floor(Math.random() * products.length);
        const product = products[randomIndex];
        setSelectedProduct(product);
        if (genType === 'ai') setGenType('standard');

        const content = generateContent(product, 'default', true);
        if (content) {
            navigator.clipboard.writeText(content);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
            showInfo(`🎲 Random: ${product.name}`);
        }

        const group = groups[currentGroupIndex];
        window.open(group.url, '_blank');

        const nextIndex = (currentGroupIndex + 1) % groups.length;
        setCurrentGroupIndex(nextIndex);

        if (nextIndex === 0) {
            showSuccess(`🎉 Đã mở: ${group.name}. Quay lại nhóm đầu.`);
        } else {
            showInfo(`Đã mở ${group.name}. Nhóm tiếp theo: ${groups[nextIndex].name}`);
        }
    };

    const openNextGroup = () => {
        if (groups.length === 0) {
            showError('Chưa có nhóm nào trong danh sách!');
            return;
        }

        if (autoCopy && postContent) {
            copyToClipboard();
        }

        const group = groups[currentGroupIndex];
        window.open(group.url, '_blank', 'noopener,noreferrer');

        const nextIndex = (currentGroupIndex + 1) % groups.length;
        setCurrentGroupIndex(nextIndex);

        if (nextIndex === 0) {
            showSuccess('🎉 Hết danh sách! Quay lại nhóm đầu.');
        } else {
            showInfo(`Đã mở ${group.name}. Nhóm tiếp theo: ${groups[nextIndex].name}`);
        }
    };

    const handleAddGroup = async () => {
        if (!newGroupUrl) {
            showError('Vui lòng nhập link nhóm Facebook!');
            return;
        }

        let name = 'Facebook Group';
        try {
            const urlObj = new URL(newGroupUrl);
            const pathParts = urlObj.pathname.split('/').filter(p => p);
            if (pathParts.length > 0) {
                const groupIndex = pathParts.indexOf('groups');
                if (groupIndex !== -1 && pathParts[groupIndex + 1]) {
                    const groupPart = pathParts[groupIndex + 1];
                    name = groupPart.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
                }
            }
        } catch (e) { }

        try {
            const res = await fetch('/api/admin/facebook-groups', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ name, url: newGroupUrl }),
            });

            const data = await res.json();
            if (data.success) {
                setNewGroupUrl('');
                fetchGroups();
                showSuccess('Đã thêm nhóm mới!');
            } else {
                showError(data.error || 'Không thể thêm nhóm!');
            }
        } catch (error) {
            showError('Lỗi khi thêm nhóm!');
        }
    };

    const handleRemoveGroup = async (id: string) => {
        if (!confirm('Bạn có chắc muốn xóa nhóm này?')) return;
        try {
            const res = await fetch(`/api/admin/facebook-groups/${id}`, { method: 'DELETE' });
            const data = await res.json();
            if (data.success) {
                fetchGroups();
                if (currentGroupIndex >= groups.length - 1) {
                    setCurrentGroupIndex(Math.max(0, groups.length - 2));
                }
                showSuccess('Đã xóa nhóm!');
            } else {
                showError(data.error || 'Không thể xóa nhóm!');
            }
        } catch (error) {
            showError('Lỗi khi xóa nhóm!');
        }
    };

    const handleSaveBanner = async () => {
        setIsSavingBanner(true);
        try {
            const res = await fetch('/api/admin/banner', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(bannerData)
            });
            const data = await res.json();
            if (data.success) {
                showSuccess('Đã cập nhật banner!');
                setBannerData(data.data);
            } else {
                showError('Lỗi khi cập nhật banner');
            }
        } catch (error) {
            showError('Lỗi kết nối');
        } finally {
            setIsSavingBanner(false);
        }
    };

    const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        if (!file.type.startsWith('image/')) {
            showError('Vui lòng chọn file ảnh!');
            return;
        }

        setIsUploading(true);
        const formData = new FormData();
        formData.append('file', file);

        try {
            const res = await fetch('/api/upload', {
                method: 'POST',
                body: formData
            });
            const data = await res.json();
            if (data.success) {
                setBannerData({ ...bannerData, imageUrl: data.data.url });
                showSuccess('Upload ảnh thành công!');
            } else {
                showError(data.message || 'Upload thất bại');
            }
        } catch (error) {
            showError('Lỗi kết nối khi upload');
        } finally {
            setIsUploading(false);
        }
    };

    const filteredProducts = products.filter(p =>
        p.name.toLowerCase().includes(searchQuery.toLowerCase())
    );

    return (
        <div className={s.page}>
            <div className={s.header}>
                <div>
                    <h1><Rocket size={32} /> Trợ lý Marketing</h1>
                    <p>Tự động hóa nội dung và quảng bá đa kênh</p>
                </div>
                <div className={s.version}>
                    <Facebook size={16} />
                    <span>NexGear Marketing v3.0</span>
                </div>
            </div>

            <div className={s.tabs}>
                <button
                    className={activeTab === 'posting' ? s.active : ''}
                    onClick={() => setActiveTab('posting')}
                >
                    ĐĂNG HỘI NHÓM
                </button>
                <button
                    className={activeTab === 'banner' ? s.active : ''}
                    onClick={() => setActiveTab('banner')}
                >
                    BANNER CHÀO MỪNG
                </button>
            </div>

            {activeTab === 'posting' ? (
                <div className={s.layout}>
                    <div className={s.sidebar}>
                        <h2><span>1</span> CHỌN SẢN PHẨM</h2>
                        <div className={s.searchBox}>
                            <Input
                                placeholder="Tìm sản phẩm..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                leftIcon={<Search size={18} />}
                            />
                        </div>
                        <div className={s.productList}>
                            {filteredProducts.map(product => (
                                <div
                                    key={product._id}
                                    className={`${s.productCard} ${selectedProduct?._id === product._id ? s.selected : ''}`}
                                    onClick={() => setSelectedProduct(product)}
                                >
                                    <div className={s.imgWrap}>
                                        <img src={product.image || product.images?.[0] || PLACEHOLDER_IMAGE} alt={product.name} />
                                    </div>
                                    <div className={s.pInfo}>
                                        <div className={s.pName}>{product.name}</div>
                                        <div className={s.pPrice}>
                                            {new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(product.price)}
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    <div className={s.mainContent}>
                        <div className={s.section}>
                            <div className={s.sectionHeader}>
                                <h2><span>2</span> NỘI DUNG BÀI ĐĂNG</h2>
                                <div className={s.genOptions}>
                                    <button
                                        className={genType === 'standard' ? s.active : ''}
                                        onClick={() => setGenType('standard')}
                                    >
                                        MẶC ĐỊNH
                                    </button>
                                    <button
                                        className={genType === 'ai' ? s.active : ''}
                                        onClick={() => setGenType('ai')}
                                    >
                                        SÁNG TẠO AI
                                    </button>
                                </div>
                            </div>

                            {genType === 'ai' && (
                                <div className={s.templates}>
                                    <button
                                        disabled={isGeneratingAI || !selectedProduct}
                                        className={`${s.templateBtn} ${s.ai}`}
                                        onClick={() => generateWithAI('persuasive')}
                                    >
                                        Thuyết phục ✨
                                    </button>
                                    <button
                                        disabled={isGeneratingAI || !selectedProduct}
                                        className={`${s.templateBtn} ${s.ai}`}
                                        onClick={() => generateWithAI('urgency')}
                                    >
                                        Hối thúc 🔥
                                    </button>
                                    <button
                                        disabled={isGeneratingAI || !selectedProduct}
                                        className={`${s.templateBtn} ${s.ai}`}
                                        onClick={() => generateWithAI('technical')}
                                    >
                                        Kỹ thuật 💻
                                    </button>
                                    {isGeneratingAI && (
                                        <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: '8px', color: '#7B3FF2', fontSize: '10px', fontWeight: 'bold' }}>
                                            <RefreshCw size={14} className="animate-spin" /> AI ĐANG SUY NGHĨ...
                                        </div>
                                    )}
                                </div>
                            )}

                            {/* Template buttons removed — auto-detect from product name */}

                            <div className={s.editorWrap}>
                                <textarea
                                    value={postContent}
                                    onChange={(e) => setPostContent(e.target.value)}
                                    placeholder="Nội dung bài đăng sẽ hiển thị ở đây..."
                                />
                                <div className={s.editorActions}>
                                    <Button variant="ghost" size="sm" onClick={copyLinkOnly} title="Copy Link">
                                        <LinkIcon size={16} /> Link
                                    </Button>
                                    <Button variant="outline-cyan" size="sm" onClick={copyToClipboard} title="Copy Nội dung">
                                        {copied ? <CheckCircle size={16} color="#1DB96A" /> : <Copy size={16} />}
                                        {copied ? 'XONG' : 'COPY'}
                                    </Button>
                                </div>
                            </div>
                            </div>

                        {/* Image Gallery */}
                        {selectedProduct && (selectedProduct.images?.length ?? 0) > 0 && (
                            <div className={s.section}>
                                <div className={s.sectionHeader}>
                                    <h2><span>📸</span> ẢNH SẢN PHẨM</h2>
                                    <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                                        <span style={{ fontSize: '11px', color: '#7A7870' }}>
                                            Click ảnh để copy → Paste vào Facebook
                                        </span>
                                    </div>
                                </div>

                                {/* Workflow hint */}
                                <div style={{
                                    background: 'rgba(0,196,173,0.06)',
                                    border: '1px dashed rgba(0,196,173,0.3)',
                                    borderRadius: '6px',
                                    padding: '10px 14px',
                                    marginBottom: '12px',
                                    fontSize: '12px',
                                    color: '#00C4AD',
                                    display: 'flex',
                                    gap: '16px',
                                    flexWrap: 'wrap'
                                }}>
                                    <span>📋 <b>Quy trình đăng nhanh:</b></span>
                                    <span>1️⃣ Copy status (nút COPY ở trên)</span>
                                    <span>→ 2️⃣ Click ảnh để copy ảnh</span>
                                    <span>→ 3️⃣ Vào FB: Paste status → Paste ảnh vào ô đính kèm</span>
                                </div>

                                <div className={s.imageGallery}>
                                    {(selectedProduct.images || []).map((img, idx) => (
                                        <div
                                            key={idx}
                                            className={s.imageThumb}
                                            title={`Click để copy ảnh ${idx + 1}`}
                                            onClick={async () => {
                                                try {
                                                    const res = await fetch(img);
                                                    const blob = await res.blob();
                                                    const item = new ClipboardItem({ [blob.type]: blob });
                                                    await navigator.clipboard.write([item]);
                                                    showSuccess(`✅ Đã copy ảnh ${idx + 1} vào clipboard!`);
                                                } catch {
                                                    // Fallback: open in new tab
                                                    window.open(img, '_blank');
                                                    showInfo('Trình duyệt chặn copy ảnh — đã mở ảnh mới để tải về');
                                                }
                                            }}
                                        >
                                            <img src={img} alt={`Ảnh ${idx + 1}`} />
                                            <div className={s.imageCopyOverlay}>
                                                <Copy size={20} />
                                                <span>COPY</span>
                                            </div>
                                            {idx === 0 && (
                                                <div className={s.imagePrimaryBadge}>CHÍNH</div>
                                            )}
                                        </div>
                                    ))}
                                </div>

                                {/* Open all images button */}
                                <div style={{ display: 'flex', gap: '8px', marginTop: '10px' }}>
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={() => {
                                            const imgs = selectedProduct.images || [];
                                            imgs.forEach(img => window.open(img, '_blank'));
                                        }}
                                    >
                                        <ExternalLink size={14} /> Mở tất cả ảnh
                                    </Button>
                                    <Button
                                        variant="outline-cyan"
                                        size="sm"
                                        onClick={async () => {
                                            // Step 1: copy text
                                            await navigator.clipboard.writeText(postContent);
                                            showSuccess('📋 Đã copy status! Giờ click vào ảnh muốn dùng để copy ảnh.');
                                        }}
                                        disabled={!postContent}
                                    >
                                        <Copy size={14} /> COPY STATUS TRƯỚC
                                    </Button>
                                </div>
                            </div>
                        )}

                        <div className={s.section}>

                            <div className={s.sectionHeader}>
                                <h2><span>3</span> QUẢN LÝ HỘI NHÓM</h2>
                            </div>

                            <div className={s.groupManager}>
                                <div className={s.addGroup}>
                                    <div style={{ flex: 1 }}>
                                        <Input
                                            placeholder="Dán link nhóm Facebook..."
                                            value={newGroupUrl}
                                            onChange={(e) => setNewGroupUrl(e.target.value)}
                                        />
                                    </div>
                                    <Button variant="cyan" onClick={handleAddGroup}>THÊM NHÓM</Button>
                                </div>

                                <div className={s.groupList}>
                                    {groups.length === 0 ? (
                                        <div style={{ textAlign: 'center', padding: '40px', color: '#7A7870', fontStyle: 'italic', fontSize: '11px' }}>
                                            Chưa có nhóm nào trong danh sách.
                                        </div>
                                    ) : (
                                        groups.map((group, index) => {
                                            const isNext = index === currentGroupIndex;
                                            return (
                                                <div key={group._id} className={`${s.groupItem} ${isNext ? s.current : ''}`}>
                                                    <div className={`${s.gInfo} ${isNext ? s.next : ''}`}>
                                                        <div className={s.gBadge}>{index + 1}</div>
                                                        <div className={s.gText}>
                                                            <div className={s.gName}>{group.name}</div>
                                                            <div className={s.gUrl}>{group.url}</div>
                                                        </div>
                                                    </div>
                                                    <div className={s.gActions}>
                                                        {isNext && (
                                                            <Button variant="primary" size="sm" disabled={!postContent} onClick={openNextGroup}>
                                                                TIẾP THEO <ChevronLeft size={16} style={{ rotate: '180deg' }} />
                                                            </Button>
                                                        )}
                                                        <Button variant="ghost" size="sm" onClick={() => handleRemoveGroup(group._id)}>
                                                            <Trash2 size={16} color="#F0356A" />
                                                        </Button>
                                                    </div>
                                                </div>
                                            );
                                        })
                                    )}
                                </div>

                                <div className={s.queuePanel}>
                                    <h3><Zap size={24} /> Trình đăng bài nhanh</h3>
                                    <p>Tự động xào bài &rarr; Copy &rarr; Mở Tab nhóm mới</p>
                                    <div className={s.queueActions}>
                                        <Button variant="cyan" fullWidth size="lg" onClick={handleRandomAndPost}>
                                            <Dices size={20} /> NGẪU NHIÊN & ĐĂNG
                                        </Button>
                                        <Button variant="outline-cyan" fullWidth size="lg" onClick={() => setCurrentGroupIndex(0)}>
                                            <RotateCcw size={20} /> LÀM MỚI TIẾN TRÌNH
                                        </Button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            ) : (
                <div className={s.bannerSection}>
                    <div className={s.bannerForm}>
                        <div>
                            <h2 className={s.fieldLabel}>CẤU HÌNH BANNER</h2>
                            <div className={s.formColumn}>
                                <Input
                                    label="Tiêu đề banner"
                                    value={bannerData.title}
                                    onChange={(e) => setBannerData({ ...bannerData, title: e.target.value })}
                                />
                                <Input
                                    label="Đường dẫn Link"
                                    value={bannerData.link}
                                    onChange={(e) => setBannerData({ ...bannerData, link: e.target.value })}
                                />
                                <div className={s.toggleRow}>
                                    <span className={s.toggleLabel}>TRẠNG THÁI HIỂN THỊ</span>
                                    <input
                                        type="checkbox"
                                        checked={bannerData.isActive}
                                        onChange={(e) => setBannerData({ ...bannerData, isActive: e.target.checked })}
                                        className={s.checkbox}
                                    />
                                </div>
                                <div style={{ marginTop: '24px' }}>
                                    <Button variant="primary" fullWidth loading={isSavingBanner} onClick={handleSaveBanner}>
                                        LƯU CÀI ĐẶT BANNER
                                    </Button>
                                </div>
                            </div>
                        </div>

                        <div className={s.bannerPreview}>
                            <h2 className={s.fieldLabel}>XEM TRƯỚC HÌNH ẢNH</h2>
                            {
                                bannerData.imageUrl ? (
                                    <img src={bannerData.imageUrl} alt="Banner preview" />
                                ) : (
                                    <div className={s.empty}>
                                        <Sparkles size={64} strokeWidth={1} />
                                        <p>Chưa có hình ảnh banner</p>
                                    </div>
                                )
                            }
                            <div className={s.uploadWrap}>
                                <input
                                    type="file"
                                    id="bannerFileUpload"
                                    hidden
                                    onChange={handleFileUpload}
                                    accept="image/*"
                                />
                                <Button
                                    variant="cyan"
                                    fullWidth
                                    onClick={() => document.getElementById('bannerFileUpload')?.click()}
                                    loading={isUploading}
                                >
                                    <Upload size={18} /> TẢI ẢNH LÊN
                                </Button>
                            </div>
                        </div >
                    </div >
                </div >
            )
            }
        </div >
    );
}
