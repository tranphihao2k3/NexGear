'use client';

import React, { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import { AnimatePresence, motion, useScroll, useTransform, useSpring, useInView } from 'framer-motion';
import {
    RefreshCcw, CheckCircle, Send, X,
    Monitor, Battery, Cpu, ArrowRight, Shield, Clock, Zap, Star,
    Phone, MessageCircle, PhoneCall, ThumbsUp, Timer,
    TrendingUp, Gift, Banknote, Laptop, ArrowUpRight, HardDrive
} from 'lucide-react';
import { Button, useToast, LazyImage } from '@/components/ui';
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
const BENEFITS = [
    { icon: '💰', title: 'Giá Thu Cao Nhất', desc: 'Cam kết mức giá thu mua tốt nhất thị trường Cần Thơ', value: 100, suffix: '%' },
    { icon: '⚡', title: 'Định Giá 15 Phút', desc: 'Chuyên viên phản hồi báo giá nhanh chóng trong 15 phút', value: 15, suffix: ' Phút' },
    { icon: '🎁', title: 'Trợ Giá Lên Đời', desc: 'Hỗ trợ thêm đến 2.000.000đ khi đổi sang máy mới', value: 2, suffix: ' Triệu' },
    { icon: '🚀', title: 'Giao Dịch Nhanh', desc: 'Nhận máy mới chỉ trong 30 phút tại cửa hàng', value: 30, suffix: ' Phút' },
];

const PROCESS_STEPS = [
    { num: '01', emoji: '📱', title: 'GỬI THÔNG TIN', desc: 'Điền form với thông tin cấu hình, tình trạng máy và ảnh chụp.' },
    { num: '02', emoji: '💰', title: 'NHẬN BÁO GIÁ', desc: 'Chuyên viên định giá miễn phí, phản hồi trong 15 phút qua Zalo/SĐT.' },
    { num: '03', emoji: '🔍', title: 'KIỂM TRA MÁY', desc: 'Mang máy đến cửa hàng, kỹ thuật viên kiểm tra thực tế nhanh gọn.' },
    { num: '04', emoji: '🎉', title: 'NHẬN MÁY MỚI', desc: 'Hoàn tất giao dịch, nhận máy mới với giá ưu đãi cực hấp dẫn.' },
];

const CONDITION_OPTIONS = [
    { id: '99', label: '99%', title: 'Loại 1', desc: 'Đẹp keng, không trầy xước', emoji: '✨' },
    { id: '98', label: '98%', title: 'Loại 2', desc: 'Màn đẹp, xước dăm nhẹ', emoji: '👍' },
    { id: '95', label: '95%', title: 'Loại 3', desc: 'Trầy rõ, cấn móp nhẹ', emoji: '⚡' },
    { id: '90', label: '90%', title: 'Loại 4', desc: 'Lỗi chức năng, màn ám', emoji: '🔧' },
];

const TRADE_CATEGORIES = [
    { emoji: '💻', label: 'Laptop', desc: 'Dell, HP, Lenovo, Asus, Acer, MSI, Apple...' },
    { emoji: '🖥️', label: 'PC / Máy bàn', desc: 'Máy bộ gaming, workstation, mini PC...' },
    { emoji: '📱', label: 'Tablet', desc: 'iPad, Samsung Tab, Surface...' },
    { emoji: '⌨️', label: 'Linh kiện', desc: 'RAM, SSD, VGA, CPU rời...' },
];

const HEALTH_TOOLS = [
    { icon: <Monitor size={28} />, title: 'Test Màn Hình / Loa / Phím', desc: 'Kiểm tra nhanh các chức năng cơ bản trước khi gửi', link: '/test-hardware', linkText: 'TRUY CẬP CÔNG CỤ TEST' },
    { icon: <Battery size={28} />, title: 'Kiểm tra độ chai Pin', desc: 'Tải phần mềm BatteryMon miễn phí', link: '/software/BatteryMon.zip', linkText: 'TẢI BATTERYMON (8MB)', download: true },
];


const BRANDS = ['Dell', 'HP', 'Lenovo', 'Asus', 'Acer', 'MSI', 'Apple', 'Thinkpad', 'Samsung', 'LG', 'Razer', 'Gigabyte'];

// ══════════════════════════════════════════════════════════════
export default function TradeInPage() {
    const siteSettings = useSiteSettings();
    const { success: showSuccess, error: showError } = useToast();

    const FAQS = [
        { q: 'Máy cũ bị lỗi có thu không?', a: `Có! ${siteSettings.storeName} thu mua laptop ở mọi tình trạng, kể cả máy lỗi. Giá thu sẽ được điều chỉnh theo mức độ lỗi cụ thể.` },
        { q: 'Thời gian định giá mất bao lâu?', a: 'Chỉ 15 phút! Bạn gửi thông tin qua form, chuyên viên sẽ liên hệ báo giá nhanh chóng qua Zalo hoặc điện thoại.' },
        { q: 'Trợ giá lên đời áp dụng thế nào?', a: `Khi bạn thu cũ và mua máy mới tại ${siteSettings.storeName}, bạn được hỗ trợ thêm đến 2 triệu đồng tuỳ giá trị đơn hàng mới.` },
        { q: 'Có thu máy ngoại tỉnh không?', a: 'Có! Bạn gửi ảnh và thông tin qua form, chúng tôi báo giá online. Nếu đồng ý, gửi máy qua bưu điện, phí ship 2 chiều chỉ từ 50K.' },
    ];
    const typingText = useTyping(['Laptop cũ đổi mới', 'Thu mua giá cao', 'Trợ giá 2 triệu', 'Giao dịch 30 phút'], 90, 2500);

    const heroRef = useRef<HTMLDivElement>(null);
    const { scrollYProgress } = useScroll({ target: heroRef, offset: ['start start', 'end start'] });
    const { scrollYProgress: globalScroll } = useScroll();
    const scaleX = useSpring(globalScroll, { stiffness: 100, damping: 30, restDelta: 0.001 });
    const heroOpacity = useTransform(scrollYProgress, [0, 1], [1, 0]);
    const heroY = useTransform(scrollYProgress, [0, 1], [0, 150]);

    const [formData, setFormData] = useState({
        name: '', contact: '', model: '', cpu: '', ram: '', ssd: '', gpu: '',
        condition: '99', battery: '', notes: '',
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
        if (!formData.contact) {
            showError('Vui lòng nhập SĐT / Zalo');
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
            const res = await fetch('/api/buyback-orders', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    sellerName: formData.name,
                    sellerPhone: formData.contact,
                    productInfo: {
                        model: formData.model,
                        condition: `${formData.condition}%`,
                        specs: { cpu: formData.cpu, ram: formData.ram, ssd: formData.ssd, gpu: formData.gpu },
                    },
                    images: imageUrls,
                    inspectionNotes: `Pin/Màn: ${formData.battery}. Ghi chú: ${formData.notes}`,
                    status: 'pending',
                }),
            });
            const result = await res.json();
            if (result.success) {
                setOrderCode(result.data.buybackNumber);
                setSubmitted(true);
                showSuccess('Gửi yêu cầu thành công!');
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

                <div className={s.heroFloating}>
                    {[RefreshCcw, TrendingUp, Laptop, Banknote, Gift, ArrowUpRight].map((Icon, i) => (
                        <span key={i} className={s.floatIcon} style={{ '--fi': i } as React.CSSProperties}>
                            <Icon size={20} />
                        </span>
                    ))}
                </div>

                <motion.div className={s.heroContent} style={{ y: heroY }}>
                    <motion.div className={s.heroBadge} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
                        <span className={s.heroDot} />
                        {siteSettings.storeName} TRADE-IN
                    </motion.div>

                    <motion.h1 className={s.heroTitle} initial={{ opacity: 0, y: 40 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4, duration: 0.8 }}>
                        <span className={s.heroGradient}>THU CŨ</span>
                        <span className={s.heroDotSep}>·</span>
                        <span className={s.heroTitleEn}>ĐỔI MỚI</span>
                    </motion.h1>

                    <motion.p className={s.heroSub} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.7 }}>
                        Lên đời laptop — Tiết kiệm tối đa — Trợ giá đến 2 triệu<br />
                        <span className={s.heroHighlight}>{typingText}</span>
                        <span className={s.heroCursor}>|</span>
                    </motion.p>

                    <motion.div className={s.heroCTA} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.9 }}>
                        <a href="#form-section" className={s.btnPrimary}><Send size={16} /> GỬI YÊU CẦU NGAY</a>
                        <a href="tel:0978648720" className={s.btnOutline}><Phone size={16} /> GỌI NGAY: 0978.648.720</a>
                    </motion.div>

                    <motion.div className={s.heroStats} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 1.2 }}>
                        {[
                            { v: '2000+', l: 'Máy đã thu' },
                            { v: '15\'', l: 'Báo giá' },
                            { v: '2TR', l: 'Trợ giá' },
                            { v: '30\'', l: 'Giao dịch' },
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

            {/* ═══ USP / BENEFITS ═══ */}
            <Section dark>
                <div className={s.container}>
                    <ScrollReveal>
                        <p className={s.label}>{`// TẠI SAO CHỌN ${siteSettings.storeName}`}</p>
                        <h2 className={s.heading}>CAM KẾT CỦA<br />CHÚNG TÔI</h2>
                    </ScrollReveal>

                    <ScrollStagger className={s.uspGrid}>
                        {BENEFITS.map((item) => (
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

            {/* ═══ TRADE CATEGORIES ═══ */}
            <Section>
                <div className={s.container}>
                    <ScrollReveal>
                        <p className={s.label}>// DANH MỤC THU MUA</p>
                        <h2 className={s.heading}>{siteSettings.storeName} THU MUA<br />TẤT CẢ THIẾT BỊ</h2>
                    </ScrollReveal>

                    <ScrollStagger className={s.catGrid}>
                        {TRADE_CATEGORIES.map((cat) => (
                            <a key={cat.label} href="#form-section" className={s.catCard}>
                                <span className={s.catEmoji}>{cat.emoji}</span>
                                <span className={s.catName}>{cat.label}</span>
                                <span className={s.catDesc}>{cat.desc}</span>
                            </a>
                        ))}
                    </ScrollStagger>
                </div>
            </Section>

            {/* ═══ PROCESS TIMELINE ═══ */}
            <Section dark>
                <div className={s.container}>
                    <ScrollReveal>
                        <p className={s.label}>// QUY TRÌNH</p>
                        <h2 className={s.heading}>ĐƠN GIẢN CHỈ VỚI<br />4 BƯỚC</h2>
                    </ScrollReveal>

                    <ScrollStagger className={s.timeline}>
                        {PROCESS_STEPS.map((step) => (
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

            {/* ═══ HEALTH CHECK TOOLS ═══ */}
            <Section>
                <div className={s.container}>
                    <ScrollReveal>
                        <p className={s.label}>// CÔNG CỤ HỖ TRỢ</p>
                        <h2 className={s.heading}>KIỂM TRA SỨC KHỎE MÁY<br />TRƯỚC KHI GỬI</h2>
                    </ScrollReveal>

                    <ScrollStagger className={s.toolsGrid}>
                        {HEALTH_TOOLS.map((tool, i) => (
                            <div key={i} className={s.toolCard}>
                                <div className={s.toolIcon}>{tool.icon}</div>
                                <div className={s.toolInfo}>
                                    <h3>{tool.title}</h3>
                                    <p>{tool.desc}</p>
                                    <a href={tool.link} {...(tool.download ? { download: true } : { target: '_blank' })}>
                                        {tool.linkText} <ArrowRight size={14} />
                                    </a>
                                </div>
                            </div>
                        ))}
                    </ScrollStagger>
                </div>
            </Section>

            {/* ═══ BRANDS ═══ */}
            <Section dark>
                <div className={s.container}>
                    <ScrollReveal>
                        <p className={s.label} style={{ textAlign: 'center' }}>// THƯƠNG HIỆU THU MUA</p>
                    </ScrollReveal>
                    <div className={s.marqueeTrack}>
                        <div className={s.marquee}>
                            {[...BRANDS, ...BRANDS].map((b, i) => (
                                <div key={i} className={s.brandItem}>{b}</div>
                            ))}
                        </div>
                    </div>
                </div>
            </Section>

            {/* ═══ FORM ═══ */}
            <Section id="form-section">
                <div className={s.container}>
                    <div className={s.formLayout}>
                        <ScrollReveal className={s.formLeft} direction="left">
                            <p className={s.label}>// GỬI YÊU CẦU ĐỊNH GIÁ</p>
                            <h2 className={s.heading}>NHẬN BÁO GIÁ<br />MIỄN PHÍ NGAY</h2>
                            <p className={s.formLeftDesc}>
                                Điền thông tin máy cũ, chuyên viên {siteSettings.storeName} sẽ liên hệ bạn trong <strong>15 phút</strong> để báo giá thu mua tốt nhất.
                            </p>

                            <div className={s.formLeftFeatures}>
                                {[
                                    { icon: <CheckCircle size={18} />, text: 'Định giá MIỄN PHÍ, không cam kết' },
                                    { icon: <TrendingUp size={18} />, text: 'Giá thu cao nhất thị trường' },
                                    { icon: <Gift size={18} />, text: 'Trợ giá lên đời đến 2 triệu' },
                                    { icon: <Zap size={18} />, text: 'Giao dịch nhanh trong 30 phút' },
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
                                                    <input type="text" name="contact" value={formData.contact} onChange={handleChange} placeholder="VD: 0978..." required />
                                                </div>
                                            </div>

                                            <div className={s.inputGrid}>
                                                <div className={s.fieldGroup}>
                                                    <label>Hãng máy</label>
                                                    <input type="text" name="model" value={formData.model} onChange={handleChange} placeholder="VD: Dell, HP, Asus..." />
                                                </div>
                                                <div className={s.fieldGroup}>
                                                    <label>Model máy</label>
                                                    <input type="text" name="cpu" value={formData.cpu} onChange={handleChange} placeholder="VD: XPS 15, Nitro 5..." />
                                                </div>
                                            </div>

                                            <div className={s.inputGrid}>
                                                <div className={s.fieldGroup}>
                                                    <label>Tình trạng ngoại hình</label>
                                                    <select name="condition" value={formData.condition} onChange={handleChange}>
                                                        {CONDITION_OPTIONS.map(opt => (
                                                            <option key={opt.id} value={opt.id}>{opt.emoji} {opt.label} - {opt.desc}</option>
                                                        ))}
                                                    </select>
                                                </div>
                                                <div className={s.fieldGroup}>
                                                    <label>Tình trạng Pin / Màn</label>
                                                    <input type="text" name="battery" value={formData.battery} onChange={handleChange} placeholder="VD: Chai 10%, ám nhẹ..." />
                                                </div>
                                            </div>

                                            <div className={s.fieldGroup}>
                                                <label>Ghi chú thêm</label>
                                                <textarea
                                                    name="notes"
                                                    value={formData.notes}
                                                    onChange={handleChange}
                                                    placeholder="VD: Máy còn đẹp, muốn đổi sang laptop gaming..."
                                                    rows={4}
                                                />
                                            </div>

                                            <div className={s.fieldGroup}>
                                                <label>Ảnh máy (Tối đa 5)</label>
                                                <input type="file" multiple accept="image/*" onChange={handleImageChange} className={s.fileInput} />

                                                {imagePreviews.length > 0 && (
                                                    <div className={s.previews}>
                                                        {imagePreviews.map((src, idx) => (
                                                            <div key={idx} className={s.preview}>
                                                                <LazyImage src={src} alt="Preview" />
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
                                                    <><RefreshCcw size={18} /> Gửi Yêu Cầu Định Giá</>
                                                )}
                                            </button>

                                            <p className={s.formNote}>Chuyên viên sẽ liên hệ bạn trong vòng 15 phút</p>
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
                                        <h2>Gửi yêu cầu thành công!</h2>
                                        <p>Chuyên viên {siteSettings.storeName} sẽ định giá và phản hồi trong 15 phút.</p>
                                        <div className={s.orderCode}>
                                            <div className={s.codeLabel}>Mã yêu cầu</div>
                                            <div className={s.code}>{orderCode}</div>
                                        </div>
                                        <div className={s.successActions}>
                                            <Button variant="cyan" size="lg" onClick={() => window.open('https://zalo.me/0978648720', '_blank')}>
                                                CHAT ZALO NHẬN BÁO GIÁ
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

            {/* ═══ FAQ ═══ */}
            <Section dark>
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
                        <h2 className={s.ctaTitle}>Lên đời laptop ngay hôm nay!</h2>
                    </ScrollReveal>
                    <ScrollReveal delay={0.2}>
                        <p className={s.ctaDesc}>Thu cũ giá cao — Trợ giá 2 triệu — Giao dịch 30 phút — Bảo hành đầy đủ.</p>
                    </ScrollReveal>
                    <ScrollReveal delay={0.4}>
                        <div className={s.ctaActions}>
                            <a href="#form-section" className={s.btnPrimary}>GỬI YÊU CẦU ĐỊNH GIÁ</a>
                            <a href="https://zalo.me/0978648720" target="_blank" rel="noopener noreferrer" className={s.btnGhost}>CHAT ZALO TƯ VẤN</a>
                        </div>
                    </ScrollReveal>
                </div>
            </section>
        </div>
    );
}
