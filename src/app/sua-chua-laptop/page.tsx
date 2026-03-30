'use client';

import React, { useState, useRef, useEffect, Suspense, lazy } from 'react';
import { AnimatePresence, motion, useScroll, useTransform, useSpring, useInView } from 'framer-motion';
import {
    Wrench, CheckCircle, Send, X, Monitor, Battery,
    Cpu, Wifi, Keyboard, HardDrive, Shield, Clock, Search, Phone,
    Zap, Star, Award, ArrowRight, ChevronDown, Laptop, Settings,
    ThumbsUp, MessageCircle, MapPin, PhoneCall, Timer
} from 'lucide-react';
import { Button, useToast } from '@/components/ui';
import ScrollReveal, { ScrollStagger } from '@/components/animations/ScrollReveal';
import { useSiteSettings } from '@/contexts/SiteSettingsContext';
import s from './page.module.scss';

// ── TYPING EFFECT ────────────────────────────────────────────
function useTyping(texts: string[], speed = 80, pause = 2000) {
    const [display, setDisplay] = useState('');
    const [idx, setIdx] = useState(0);
    const [charIdx, setCharIdx] = useState(0);
    const [deleting, setDeleting] = useState(false);

    useEffect(() => {
        const text = texts[idx];
        const timeout = deleting ? speed / 2 : speed;
        if (!deleting && charIdx === text.length) {
            const t = setTimeout(() => setDeleting(true), pause);
            return () => clearTimeout(t);
        }
        if (deleting && charIdx === 0) {
            setDeleting(false);
            setIdx((i) => (i + 1) % texts.length);
            return;
        }
        const timer = setTimeout(() => {
            setDisplay(text.substring(0, deleting ? charIdx - 1 : charIdx + 1));
            setCharIdx((c) => c + (deleting ? -1 : 1));
        }, timeout);
        return () => clearTimeout(timer);
    }, [charIdx, deleting, idx, texts, speed, pause]);

    return display;
}

// ── COUNTER ──────────────────────────────────────────────────
function Counter({ target, suffix = '' }: { target: number; suffix?: string }) {
    const [count, setCount] = useState(0);
    const ref = useRef<HTMLSpanElement>(null);
    const inView = useInView(ref, { once: true });

    useEffect(() => {
        if (!inView) return;
        const dur = 2000;
        const start = Date.now();
        const animate = () => {
            const p = Math.min((Date.now() - start) / dur, 1);
            setCount(Math.round((1 - Math.pow(1 - p, 3)) * target));
            if (p < 1) requestAnimationFrame(animate);
        };
        animate();
    }, [inView, target]);

    return <span ref={ref}>{count}{suffix}</span>;
}

// ── SECTION WRAPPER ──────────────────────────────────────────
function Section({ children, className = '', dark = false, id }: { children: React.ReactNode; className?: string; dark?: boolean; id?: string }) {
    const ref = useRef(null);
    const inView = useInView(ref, { once: true, margin: '-100px' });
    return (
        <motion.section
            ref={ref}
            id={id}
            className={`${s.section} ${dark ? s.sectionDark : ''} ${className}`}
            initial={{ opacity: 0 }}
            animate={inView ? { opacity: 1 } : {}}
            transition={{ duration: 0.8 }}
        >
            {children}
        </motion.section>
    );
}

// ── DATA ─────────────────────────────────────────────────────
const COMMON_ISSUES = [
    { icon: <Battery size={28} />, title: 'Lỗi Nguồn', desc: 'Máy không lên nguồn, tự tắt, sạc không vào điện hoặc chập chờn.', color: '#FF6B6B' },
    { icon: <Monitor size={28} />, title: 'Lỗi Màn Hình', desc: 'Màn hình xọc, nhòe màu, điểm chết hoặc không hiển thị.', color: '#4ECDC4' },
    { icon: <Keyboard size={28} />, title: 'Lỗi Bàn Phím', desc: 'Bàn phím liệt nút, kẹt phím, nhảy chữ hoặc Touchpad không nhận.', color: '#45B7D1' },
    { icon: <HardDrive size={28} />, title: 'Lỗi Phần Cứng', desc: 'Hư ổ cứng, RAM không nhận, quạt kêu to hoặc gãy bản lề.', color: '#96CEB4' },
    { icon: <Wifi size={28} />, title: 'Lỗi Kết Nối', desc: 'Không bắt Wifi, lỗi Bluetooth, hỏng cổng USB/HDMI.', color: '#FFEAA7' },
    { icon: <Cpu size={28} />, title: 'Lỗi Phần Mềm', desc: 'Nhiễm Virus, lỗi Windows, đóng máy khi chạy ứng dụng nặng.', color: '#DDA0DD' },
];

const PROCESS_STEPS = [
    { num: '01', emoji: '🔍', title: 'TIẾP NHẬN', desc: 'Kiểm tra miễn phí, chẩn đoán chính xác nguyên nhân lỗi bằng thiết bị chuyên dụng.' },
    { num: '02', emoji: '💰', title: 'BÁO GIÁ', desc: 'Báo giá minh bạch trước khi sửa. Không phát sinh chi phí ngoài cam kết.' },
    { num: '03', emoji: '🔧', title: 'SỬA CHỮA', desc: 'Linh kiện chính hãng, kỹ thuật viên tay nghề cao xử lý nhanh chóng.' },
    { num: '04', emoji: '✅', title: 'BÀN GIAO', desc: 'Test kỹ lưỡng trước khi giao. Bảo hành rõ ràng, hỗ trợ sau sửa chữa.' },
];

const SERVICES = [
    { icon: <Settings size={24} />, title: 'Sửa Main / VGA', price: 'Từ 300K', desc: 'Sửa lỗi chip, VGA, nạp BIOS, thay chip cầu bắc/nam' },
    { icon: <Monitor size={24} />, title: 'Thay Màn Hình', price: 'Từ 800K', desc: 'Thay màn LED/LCD, cáp màn hình các loại laptop' },
    { icon: <Battery size={24} />, title: 'Thay Pin / Sạc', price: 'Từ 250K', desc: 'Pin zin theo máy, sạc chính hãng có bảo hành' },
    { icon: <Keyboard size={24} />, title: 'Thay Bàn Phím', price: 'Từ 200K', desc: 'Bàn phím theo dòng máy, lắp đặt nhanh trong ngày' },
    { icon: <HardDrive size={24} />, title: 'Nâng Cấp SSD/RAM', price: 'Từ 400K', desc: 'Nâng SSD NVMe, RAM DDR4/DDR5 chính hãng' },
    { icon: <Cpu size={24} />, title: 'Cài Win / Phần Mềm', price: 'Từ 150K', desc: 'Cài Windows, driver, phần mềm bản quyền đầy đủ' },
];

const USP_ITEMS = [
    { icon: '🛡️', title: 'Bảo Hành Dài Hạn', desc: 'Bảo hành lên đến 12 tháng cho mọi linh kiện thay thế', value: 12, suffix: ' Tháng' },
    { icon: '⚡', title: 'Sửa Nhanh Trong Ngày', desc: 'Lỗi đơn giản sửa trong 1-2 giờ, lỗi nặng 24h', value: 2, suffix: 'H' },
    { icon: '💯', title: 'Linh Kiện Chính Hãng', desc: '100% linh kiện chính hãng, có tem bảo hành rõ ràng', value: 100, suffix: '%' },
    { icon: '🏆', title: 'Kinh Nghiệm', desc: 'Đội ngũ kỹ thuật viên 10+ năm kinh nghiệm sửa chữa', value: 10, suffix: '+ Năm' },
];

const REVIEWS = [
    { name: 'Nguyễn Văn Hùng', avatar: '👨‍💼', rating: 5, service: 'Sửa main laptop', text: 'Máy bị chết main tưởng phải thay, anh kỹ thuật sửa lại ngon lành. Giá rẻ hơn rất nhiều so với hãng!' },
    { name: 'Trần Thị Lan', avatar: '👩‍🏫', rating: 5, service: 'Thay màn hình', text: 'Thay màn hình cho Dell XPS rất nhanh, xong trong 2 tiếng. Màn đẹp không khác gì hàng mới.' },
    { name: 'Lê Minh Đức', avatar: '🧑‍💻', rating: 5, service: 'Nâng cấp SSD', text: 'Nâng SSD NVMe 1TB, máy khởi động nhanh gấp 5 lần. Tư vấn nhiệt tình, giá tốt!' },
];

const FAQS = [
    { q: 'Kiểm tra lỗi laptop có mất phí không?', a: 'Hoàn toàn MIỄN PHÍ! Chúng tôi kiểm tra, chẩn đoán lỗi và báo giá trước. Bạn đồng ý mới tiến hành sửa chữa.' },
    { q: 'Thời gian sửa chữa mất bao lâu?', a: 'Lỗi đơn giản (cài Win, thay RAM/SSD) sửa trong 1-2 giờ. Lỗi phức tạp (sửa main, thay chip) từ 24-48 giờ.' },
    { q: 'Bảo hành sau sửa chữa như thế nào?', a: 'Linh kiện thay thế bảo hành 3-12 tháng tuỳ loại. Bảo hành tại shop, đổi mới nếu lỗi do linh kiện.' },
    { q: 'Có nhận sửa laptop ngoại tỉnh không?', a: 'Có! Bạn gửi máy qua bưu điện, chúng tôi nhận sửa và gửi lại. Phí ship 2 chiều chỉ từ 50K.' },
];

const BRANDS_REPAIR = ['Dell', 'HP', 'Lenovo', 'Asus', 'Acer', 'MSI', 'Apple', 'Thinkpad', 'Samsung', 'LG', 'Razer', 'Gigabyte'];

const ISSUE_OPTIONS = ['Sửa chữa', 'Thay linh kiện', 'Cài đặt phần mềm', 'Nâng cấp', 'Khác'];
const SEVERITY_OPTIONS = ['Bình thường', 'Gấp', 'Rất gấp'];

// ══════════════════════════════════════════════════════════════
export default function RepairPage() {
    const siteSettings = useSiteSettings();
    const { success: showSuccess, error: showError } = useToast();
    const typingText = useTyping(['Sửa main laptop', 'Thay màn hình', 'Nâng cấp SSD', 'Cài Win bản quyền', 'Thay pin chính hãng'], 90, 2500);

    const heroRef = useRef<HTMLDivElement>(null);
    const { scrollYProgress } = useScroll({ target: heroRef, offset: ['start start', 'end start'] });
    const { scrollYProgress: globalScroll } = useScroll();
    const scaleX = useSpring(globalScroll, { stiffness: 100, damping: 30, restDelta: 0.001 });
    const heroOpacity = useTransform(scrollYProgress, [0, 1], [1, 0]);
    const heroY = useTransform(scrollYProgress, [0, 1], [0, 150]);

    const [formData, setFormData] = useState({
        name: '', phone: '', brand: '', model: '',
        issueType: 'Sửa chữa', severity: 'Bình thường', description: '',
    });
    const [imageFiles, setImageFiles] = useState<File[]>([]);
    const [imagePreviews, setImagePreviews] = useState<string[]>([]);
    const [loading, setLoading] = useState(false);
    const [submitted, setSubmitted] = useState(false);
    const [orderCode, setOrderCode] = useState('');
    const [activeFaq, setActiveFaq] = useState<number | null>(0);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = e.target.files;
        if (!files) return;
        const newFiles = Array.from(files).slice(0, 5 - imageFiles.length);
        setImageFiles(prev => [...prev, ...newFiles]);
        newFiles.forEach(file => {
            const reader = new FileReader();
            reader.onloadend = () => setImagePreviews(prev => [...prev, reader.result as string]);
            reader.readAsDataURL(file);
        });
    };

    const removeImage = (index: number) => {
        setImageFiles(prev => prev.filter((_, i) => i !== index));
        setImagePreviews(prev => prev.filter((_, i) => i !== index));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!formData.phone || !formData.description) {
            showError('Vui lòng nhập SĐT và mô tả lỗi');
            return;
        }
        setLoading(true);
        try {
            let imageUrls: string[] = [];
            if (imageFiles.length > 0) {
                const uploadPromises = imageFiles.map(async file => {
                    const fd = new FormData();
                    fd.append('file', file);
                    const res = await fetch('/api/upload', { method: 'POST', body: fd });
                    const data = await res.json();
                    return data.data?.url || '';
                });
                imageUrls = await Promise.all(uploadPromises);
            }

            const res = await fetch('/api/repair-orders', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    customerName: formData.name,
                    customerPhone: formData.phone,
                    deviceInfo: { brand: formData.brand, model: formData.model },
                    issueType: formData.issueType,
                    severity: formData.severity,
                    description: formData.description,
                    images: imageUrls,
                    status: 'pending',
                }),
            });
            const result = await res.json();
            if (result.success) {
                setOrderCode(result.data?.repairNumber || result.data?._id || 'N/A');
                setSubmitted(true);
                showSuccess('Gửi yêu cầu sửa chữa thành công!');
            } else {
                showError(result.error || 'Có lỗi xảy ra');
            }
        } catch {
            showError('Lỗi kết nối server');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className={s.page}>
            {/* ═══ SCROLL PROGRESS ═══ */}
            <motion.div className={s.progressBar} style={{ scaleX }} />

            {/* ═══ HERO ═══ */}
            <motion.div ref={heroRef} className={s.hero} style={{ opacity: heroOpacity }}>
                <div className={s.heroGrid} />
                <div className={s.heroOverlay} />
                <div className={s.heroBottom} />

                {/* Floating repair icons */}
                <div className={s.heroFloating}>
                    {[Wrench, Cpu, Monitor, HardDrive, Settings, Zap].map((Icon, i) => (
                        <span key={i} className={s.floatIcon} style={{ '--fi': i } as React.CSSProperties}>
                            <Icon size={20} />
                        </span>
                    ))}
                </div>

                <motion.div className={s.heroContent} style={{ y: heroY }}>
                    <motion.div className={s.heroBadge} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
                        <span className={s.heroDot} />
                        {siteSettings.storeName} REPAIR CENTER
                    </motion.div>

                    <motion.h1 className={s.heroTitle} initial={{ opacity: 0, y: 40 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4, duration: 0.8 }}>
                        <span className={s.heroGradient}>SỬA CHỮA</span>
                        <span className={s.heroDotSep}>·</span>
                        <span className={s.heroTitleEn}>LAPTOP</span>
                    </motion.h1>

                    <motion.p className={s.heroSub} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.7 }}>
                        Chuyên nghiệp — Uy tín — Giá tốt nhất Cần Thơ<br />
                        <span className={s.heroHighlight}>{typingText}</span>
                        <span className={s.heroCursor}>|</span>
                    </motion.p>

                    <motion.div className={s.heroCTA} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.9 }}>
                        <a href="#repair-form" className={s.btnPrimary}><Search size={16} /> KIỂM TRA MIỄN PHÍ</a>
                        <a href="tel:0978648720" className={s.btnOutline}><Phone size={16} /> GỌI NGAY: 0978.648.720</a>
                    </motion.div>

                    <motion.div className={s.heroStats} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 1.2 }}>
                        {[
                            { v: '5000+', l: 'Máy đã sửa' },
                            { v: '98%', l: 'Hài lòng' },
                            { v: '2H', l: 'Sửa nhanh' },
                            { v: '12T', l: 'Bảo hành' },
                        ].map((stat) => (
                            <div key={stat.l} className={s.stat}>
                                <span className={s.statV}>{stat.v}</span>
                                <span className={s.statL}>{stat.l}</span>
                            </div>
                        ))}
                    </motion.div>

                    <motion.div className={s.scrollHint} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 1.5 }}>
                        <span className={s.scrollMouse}><span className={s.scrollDot} /></span>
                        <span className={s.scrollLabel}>SCROLL</span>
                    </motion.div>
                </motion.div>
            </motion.div>

            {/* ═══ COMMON ISSUES ═══ */}
            <Section dark>
                <div className={s.container}>
                    <ScrollReveal>
                        <p className={s.label}>// CÁC LỖI THƯỜNG GẶP</p>
                        <h2 className={s.heading}>LAPTOP BẠN ĐANG<br />GẶP VẤN ĐỀ GÌ?</h2>
                    </ScrollReveal>

                    <ScrollStagger className={s.issuesGrid}>
                        {COMMON_ISSUES.map((issue, i) => (
                            <div key={i} className={s.issueCard}>
                                <div className={s.issueIconWrap} style={{ '--ic': issue.color } as React.CSSProperties}>
                                    {issue.icon}
                                </div>
                                <h3 className={s.issueTitle}>{issue.title}</h3>
                                <p className={s.issueDesc}>{issue.desc}</p>
                                <a href="#repair-form" className={s.issueLink}>
                                    Gửi yêu cầu <ArrowRight size={14} />
                                </a>
                            </div>
                        ))}
                    </ScrollStagger>
                </div>
            </Section>

            {/* ═══ SERVICES & PRICING ═══ */}
            <Section>
                <div className={s.container}>
                    <ScrollReveal>
                        <p className={s.label}>// BẢNG GIÁ DỊCH VỤ</p>
                        <h2 className={s.heading}>DỊCH VỤ SỬA CHỮA<br />& NÂNG CẤP LAPTOP</h2>
                    </ScrollReveal>

                    <ScrollStagger className={s.servicesGrid}>
                        {SERVICES.map((svc, i) => (
                            <div key={i} className={s.serviceCard}>
                                <div className={s.serviceIcon}>{svc.icon}</div>
                                <div className={s.serviceInfo}>
                                    <h3>{svc.title}</h3>
                                    <p>{svc.desc}</p>
                                </div>
                                <div className={s.servicePrice}>{svc.price}</div>
                            </div>
                        ))}
                    </ScrollStagger>

                    <ScrollReveal delay={0.3}>
                        <p className={s.priceNote}>* Giá chỉ mang tính tham khảo. Báo giá chính xác sau khi kiểm tra máy.</p>
                    </ScrollReveal>
                </div>
            </Section>

            {/* ═══ PROCESS TIMELINE ═══ */}
            <Section dark>
                <div className={s.container}>
                    <ScrollReveal>
                        <p className={s.label}>// QUY TRÌNH</p>
                        <h2 className={s.heading}>TỪ NHẬN MÁY ĐẾN<br />BÀN GIAO HOÀN HẢO</h2>
                    </ScrollReveal>

                    <ScrollStagger className={s.timeline}>
                        <div className={s.timelineLine} />
                        {PROCESS_STEPS.map((step, i) => (
                            <div key={step.num} className={s.timelineItem}>
                                <div className={s.timelineOrb}>
                                    <span className={s.timelineEmoji}>{step.emoji}</span>
                                </div>
                                <div className={s.timelineNum}>{step.num}</div>
                                <h3 className={s.timelineTitle}>{step.title}</h3>
                                <p className={s.timelineDesc}>{step.desc}</p>
                            </div>
                        ))}
                    </ScrollStagger>
                </div>
            </Section>

            {/* ═══ USP / COMMITMENTS ═══ */}
            <Section>
                <div className={s.container}>
                    <ScrollReveal>
                        <p className={s.label}>{`// TẠI SAO CHỌN ${siteSettings.storeName}`}</p>
                        <h2 className={s.heading}>CAM KẾT CỦA<br />CHÚNG TÔI</h2>
                    </ScrollReveal>

                    <ScrollStagger className={s.uspGrid}>
                        {USP_ITEMS.map((item) => (
                            <div key={item.title} className={s.uspCard}>
                                <div className={s.uspIcon}>{item.icon}</div>
                                <div className={s.uspBig}><Counter target={item.value} suffix={item.suffix} /></div>
                                <h3 className={s.uspTitle}>{item.title}</h3>
                                <p className={s.uspDesc}>{item.desc}</p>
                            </div>
                        ))}
                    </ScrollStagger>
                </div>
            </Section>

            {/* ═══ BRANDS WE REPAIR ═══ */}
            <Section dark>
                <div className={s.container}>
                    <ScrollReveal>
                        <p className={s.label} style={{ textAlign: 'center' }}>// THƯƠNG HIỆU HỖ TRỢ</p>
                    </ScrollReveal>
                    <div className={s.marqueeTrack}>
                        <div className={s.marquee}>
                            {[...BRANDS_REPAIR, ...BRANDS_REPAIR].map((b, i) => (
                                <div key={i} className={s.brandItem}>{b}</div>
                            ))}
                        </div>
                    </div>
                </div>
            </Section>

            {/* ═══ REPAIR FORM ═══ */}
            <Section className={s.formSectionWrap} id="repair-form">
                <div className={s.container}>
                    <div className={s.formLayout}>
                        <ScrollReveal className={s.formLeft} direction="left">
                            <p className={s.label}>// ĐĂNG KÝ SỬA CHỮA</p>
                            <h2 className={s.heading}>GỬI YÊU CẦU<br />NGAY HÔM NAY</h2>
                            <p className={s.formLeftDesc}>
                                Điền thông tin bên dưới, kỹ thuật viên {siteSettings.storeName} sẽ liên hệ bạn trong vòng <strong>15 phút</strong> để tư vấn và báo giá miễn phí.
                            </p>

                            <div className={s.formLeftFeatures}>
                                {[
                                    { icon: <CheckCircle size={18} />, text: 'Kiểm tra & báo giá MIỄN PHÍ' },
                                    { icon: <Shield size={18} />, text: 'Bảo hành lên đến 12 tháng' },
                                    { icon: <Zap size={18} />, text: 'Sửa nhanh trong ngày' },
                                    { icon: <ThumbsUp size={18} />, text: 'Không sửa — Không tính phí' },
                                ].map((f, i) => (
                                    <div key={i} className={s.formFeature}>
                                        <span className={s.formFeatureIcon}>{f.icon}</span>
                                        <span>{f.text}</span>
                                    </div>
                                ))}
                            </div>

                            <div className={s.formLeftContact}>
                                <a href="tel:0978648720" className={s.contactItem}>
                                    <PhoneCall size={18} /> 0978.648.720
                                </a>
                                <a href="https://zalo.me/0978648720" target="_blank" rel="noopener noreferrer" className={s.contactItem}>
                                    <MessageCircle size={18} /> Chat Zalo
                                </a>
                            </div>
                        </ScrollReveal>

                        <ScrollReveal direction="right" className={s.formRight}>
                            <AnimatePresence mode="wait">
                                {!submitted ? (
                                    <motion.div
                                        key="form"
                                        initial={{ opacity: 0, y: 20 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        exit={{ opacity: 0, scale: 0.95 }}
                                        className={s.formBox}
                                    >
                                        <form onSubmit={handleSubmit} className={s.formBody}>
                                            <div className={s.inputGrid}>
                                                <div className={s.fieldGroup}>
                                                    <label>Tên của bạn</label>
                                                    <input type="text" name="name" value={formData.name} onChange={handleChange} placeholder="VD: Nguyễn Văn A" />
                                                </div>
                                                <div className={s.fieldGroup}>
                                                    <label>SĐT / Zalo *</label>
                                                    <input type="text" name="phone" value={formData.phone} onChange={handleChange} placeholder="VD: 0978..." required />
                                                </div>
                                            </div>

                                            <div className={s.inputGrid}>
                                                <div className={s.fieldGroup}>
                                                    <label>Hãng máy</label>
                                                    <input type="text" name="brand" value={formData.brand} onChange={handleChange} placeholder="VD: Dell, HP, Asus..." />
                                                </div>
                                                <div className={s.fieldGroup}>
                                                    <label>Model máy</label>
                                                    <input type="text" name="model" value={formData.model} onChange={handleChange} placeholder="VD: XPS 15, Nitro 5..." />
                                                </div>
                                            </div>

                                            <div className={s.inputGrid}>
                                                <div className={s.fieldGroup}>
                                                    <label>Loại dịch vụ</label>
                                                    <select name="issueType" value={formData.issueType} onChange={handleChange}>
                                                        {ISSUE_OPTIONS.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                                                    </select>
                                                </div>
                                                <div className={s.fieldGroup}>
                                                    <label>Mức độ khẩn</label>
                                                    <select name="severity" value={formData.severity} onChange={handleChange}>
                                                        {SEVERITY_OPTIONS.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                                                    </select>
                                                </div>
                                            </div>

                                            <div className={s.fieldGroup}>
                                                <label>Mô tả lỗi / yêu cầu *</label>
                                                <textarea
                                                    name="description"
                                                    value={formData.description}
                                                    onChange={handleChange}
                                                    placeholder="VD: Máy không lên nguồn, màn hình bị vỡ..."
                                                    rows={4}
                                                    required
                                                />
                                            </div>

                                            <div className={s.fieldGroup}>
                                                <label>Ảnh máy / Lỗi (Tối đa 5)</label>
                                                <input type="file" multiple accept="image/*" onChange={handleImageChange} className={s.fileInput} />

                                                {imagePreviews.length > 0 && (
                                                    <div className={s.previews}>
                                                        {imagePreviews.map((src, idx) => (
                                                            <div key={idx} className={s.preview}>
                                                                <img src={src} alt="Preview" />
                                                                <div className={s.removeBtn} onClick={() => removeImage(idx)}><X size={12} /></div>
                                                            </div>
                                                        ))}
                                                    </div>
                                                )}
                                            </div>

                                            <button type="submit" className={s.submitBtn} disabled={loading}>
                                                {loading ? (
                                                    <><Timer size={18} /> Đang gửi...</>
                                                ) : (
                                                    <><Wrench size={18} /> Gửi Yêu Cầu Sửa Chữa</>
                                                )}
                                            </button>

                                            <p className={s.formNote}>Chúng tôi sẽ liên hệ bạn trong vòng 15 phút</p>
                                        </form>
                                    </motion.div>
                                ) : (
                                    <motion.div
                                        key="success"
                                        initial={{ opacity: 0, scale: 0.95 }}
                                        animate={{ opacity: 1, scale: 1 }}
                                        className={s.successBox}
                                    >
                                        <div className={s.successIcon}><CheckCircle size={48} /></div>
                                        <h2>Đăng ký thành công!</h2>
                                        <p>Kỹ thuật viên sẽ liên hệ bạn trong 15 phút.</p>
                                        <div className={s.orderCode}>
                                            <div className={s.codeLabel}>Mã yêu cầu</div>
                                            <div className={s.code}>{orderCode}</div>
                                        </div>
                                        <div className={s.successActions}>
                                            <Button variant="cyan" size="lg" onClick={() => window.open('https://zalo.me/0978648720', '_blank')}>
                                                CHAT ZALO TƯ VẤN
                                            </Button>
                                            <Button variant="ghost" size="lg" onClick={() => setSubmitted(false)}>
                                                GỬI YÊU CẦU KHÁC
                                            </Button>
                                        </div>
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </ScrollReveal>
                    </div>
                </div>
            </Section>

            {/* ═══ REVIEWS ═══ */}
            <Section dark>
                <div className={s.container}>
                    <ScrollReveal>
                        <p className={s.label}>// ĐÁNH GIÁ KHÁCH HÀNG</p>
                        <h2 className={s.heading}>KHÁCH HÀNG<br />NÓI GÌ VỀ CHÚNG TÔI</h2>
                    </ScrollReveal>

                    <ScrollStagger className={s.reviewGrid}>
                        {REVIEWS.map((rev) => (
                            <div key={rev.name} className={s.reviewCard}>
                                <div className={s.reviewTop}>
                                    <span className={s.reviewAvatar}>{rev.avatar}</span>
                                    <div>
                                        <div className={s.reviewName}>{rev.name}</div>
                                        <div className={s.reviewService}>{rev.service}</div>
                                    </div>
                                </div>
                                <div className={s.reviewStars}>{'★'.repeat(rev.rating)}{'☆'.repeat(5 - rev.rating)}</div>
                                <p className={s.reviewText}>&ldquo;{rev.text}&rdquo;</p>
                            </div>
                        ))}
                    </ScrollStagger>
                </div>
            </Section>

            {/* ═══ FAQ ═══ */}
            <Section>
                <div className={s.container}>
                    <div className={s.faqWrapper}>
                        <ScrollReveal className={s.faqLeft} direction="left">
                            <p className={s.label}>// HỎI ĐÁP</p>
                            <h2 className={s.heading}>CÂU HỎI<br />THƯỜNG GẶP</h2>
                            <p className={s.faqSub}>Bạn có thắc mắc khác? Liên hệ trực tiếp qua Zalo hoặc Hotline để được tư vấn miễn phí.</p>
                            <a href="https://zalo.me/0978648720" target="_blank" rel="noopener noreferrer" className={s.btnPrimary}>LIÊN HỆ NGAY</a>
                        </ScrollReveal>

                        <div className={s.faqRight}>
                            {FAQS.map((faq, i) => (
                                <ScrollReveal key={i} delay={i * 0.1} direction="right">
                                    <div className={`${s.faqItem} ${activeFaq === i ? s.faqActive : ''}`} onClick={() => setActiveFaq(activeFaq === i ? null : i)}>
                                        <div className={s.faqQuestion}>
                                            <span>{faq.q}</span>
                                            <span className={s.faqToggle}>{activeFaq === i ? '−' : '+'}</span>
                                        </div>
                                        <AnimatePresence>
                                            {activeFaq === i && (
                                                <motion.div
                                                    initial={{ height: 0, opacity: 0 }}
                                                    animate={{ height: 'auto', opacity: 1 }}
                                                    exit={{ height: 0, opacity: 0 }}
                                                    className={s.faqAnswer}
                                                >
                                                    <p>{faq.a}</p>
                                                </motion.div>
                                            )}
                                        </AnimatePresence>
                                    </div>
                                </ScrollReveal>
                            ))}
                        </div>
                    </div>
                </div>
            </Section>

            {/* ═══ CTA ═══ */}
            <section className={s.cta}>
                <div className={s.ctaParticles}>
                    {Array.from({ length: 15 }).map((_, i) => (
                        <span key={i} className={s.ctaDot} style={{ '--i': i } as React.CSSProperties} />
                    ))}
                </div>
                <div className={s.container} style={{ position: 'relative', zIndex: 1 }}>
                    <ScrollReveal>
                        <h2 className={s.ctaTitle}>Laptop hỏng? Đừng lo!</h2>
                    </ScrollReveal>
                    <ScrollReveal delay={0.2}>
                        <p className={s.ctaDesc}>Kiểm tra miễn phí — Báo giá minh bạch — Sửa nhanh trong ngày — Bảo hành dài hạn.</p>
                    </ScrollReveal>
                    <ScrollReveal delay={0.4}>
                        <div className={s.ctaActions}>
                            <a href="#repair-form" className={s.btnPrimary}>ĐĂNG KÝ SỬA CHỮA</a>
                            <a href="https://zalo.me/0978648720" target="_blank" rel="noopener noreferrer" className={s.btnGhost}>CHAT ZALO TƯ VẤN</a>
                        </div>
                    </ScrollReveal>
                </div>
            </section>
        </div>
    );
}
