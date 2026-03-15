'use client';

import { useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import {
    Wrench, CheckCircle, Send, X, Monitor, Battery,
    Cpu, Wifi, Keyboard, HardDrive, Shield, Clock, Search, Phone
} from 'lucide-react';
import { Button, useToast } from '@/components/ui';
import s from './page.module.scss';

const COMMON_ISSUES = [
    { icon: <Battery size={28} />, title: 'Lỗi Nguồn', desc: 'Máy không lên nguồn, máy tự đóng tắt, sạc không vào điện hoặc bị chập chờn.' },
    { icon: <Monitor size={28} />, title: 'Lỗi Màn Hình', desc: 'Màn hình bị xọc, nhòe màu, có điểm chết hoặc không hiển thị (màn hình đen).' },
    { icon: <Keyboard size={28} />, title: 'Lỗi Bàn Phím/Chuột', desc: 'Bàn phím bị liệt nút, kẹt phím, nhảy chữ hoặc Touchpad không nhận.' },
    { icon: <HardDrive size={28} />, title: 'Lỗi Phần Cứng', desc: 'Hư hỏng ổ cứng, RAM không nhận, quạt tản nhiệt kêu to hoặc bị gãy bản lề.' },
    { icon: <Wifi size={28} />, title: 'Lỗi Kết Nối', desc: 'Không bắt được Wifi, lỗi Bluetooth, hỏng cổng USB hoặc cổng HDMI.' },
    { icon: <Cpu size={28} />, title: 'Lỗi Phần Mềm', desc: 'Máy tự nhiễm Virus, lỗi Windows, đóng máy khi mở ứng dụng nặng.' },
];

const PROCESS_STEPS = [
    { num: 1, title: 'Tiếp nhận & Kiểm tra', desc: 'Kiểm tra miễn phí, báo lỗi chi tiết' },
    { num: 2, title: 'Báo giá & Xác nhận', desc: 'Báo giá trước khi sửa, không phát sinh' },
    { num: 3, title: 'Sửa chữa & Thay thế', desc: 'Linh kiện chính hãng, thợ chuyên nghiệp' },
    { num: 4, title: 'Kiểm tra & Bàn giao', desc: 'Test kỹ trước khi giao, bảo hành rõ ràng' },
];

const ISSUE_OPTIONS = [
    'Sửa chữa', 'Thay linh kiện', 'Cài đặt phần mềm', 'Nâng cấp', 'Khác'
];

const SEVERITY_OPTIONS = [
    'Bình thường', 'Gấp', 'Rất gấp'
];

export default function RepairPage() {
    const { success: showSuccess, error: showError } = useToast();
    const [formData, setFormData] = useState({
        name: '', phone: '', brand: '', model: '',
        issueType: 'Sửa chữa', severity: 'Bình thường', description: '',
    });
    const [imageFiles, setImageFiles] = useState<File[]>([]);
    const [imagePreviews, setImagePreviews] = useState<string[]>([]);
    const [loading, setLoading] = useState(false);
    const [submitted, setSubmitted] = useState(false);
    const [orderCode, setOrderCode] = useState('');

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
            {/* ── HERO ── */}
            <section className={s.hero}>
                <div className={s.heroInner}>
                    <div className={s.heroBadge}>
                        <Wrench size={14} /> Khắc phục mọi sự cố
                    </div>
                    <h1 className={s.heroTitle}>
                        Sửa Chữa Laptop<br />
                        <span>Uy Tín & Chuyên Nghiệp</span>
                    </h1>
                    <p className={s.heroDesc}>
                        Chẩn đoán chính xác — Sửa chữa tận tâm.<br />
                        Đội ngũ kỹ thuật viên giàu kinh nghiệm tại Cần Thơ.
                    </p>
                    <div className={s.heroCtas}>
                        <a href="#repair-form" className={s.heroBtn}>
                            <Search size={16} /> Kiểm tra miễn phí
                        </a>
                        <a href="tel:0978648720" className={s.heroBtnGhost}>
                            <Shield size={16} /> Bảo hành uy tín
                        </a>
                    </div>
                </div>
                <div className={s.heroGraphic}>
                    <div className={s.heroIconCircle}>
                        <Wrench size={56} />
                    </div>
                </div>
            </section>

            {/* ── COMMON ISSUES ── */}
            <section className={s.issuesSection}>
                <div className={s.issuesInner}>
                    <h2 className={s.sectionTitle}>
                        <span className={s.titleIcon}>⚠️</span>
                        Các lỗi Laptop thường gặp cần xử lý ngay
                    </h2>
                    <div className={s.issuesGrid}>
                        {COMMON_ISSUES.map((issue, i) => (
                            <div key={i} className={s.issueCard}>
                                <div className={s.issueIcon}>{issue.icon}</div>
                                <div>
                                    <h3>{issue.title}</h3>
                                    <p>{issue.desc}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* ── REPAIR FORM ── */}
            <section className={s.formSection} id="repair-form">
                <AnimatePresence mode="wait">
                    {!submitted ? (
                        <motion.div
                            key="form"
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.95 }}
                            className={s.formBox}
                        >
                            <div className={s.formHeader}>
                                <h3>Đăng Ký Sửa Chữa</h3>
                                <p>Nhận tư vấn miễn phí ngay</p>
                            </div>

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
                                        placeholder="VD: Máy không lên nguồn, màn hình bị vỡ, bàn phím kẹt phím..."
                                        rows={4}
                                        required
                                    />
                                </div>

                                <div className={s.fieldGroup}>
                                    <label>Ảnh máy / Lỗi (Tối đa 5 ảnh)</label>
                                    <input type="file" multiple accept="image/*" onChange={handleImageChange} className={s.fileInput} />
                                    <span className={s.fileHint}>Chụp ảnh máy và lỗi để được tư vấn chính xác hơn</span>

                                    {imagePreviews.length > 0 && (
                                        <div className={s.previews}>
                                            {imagePreviews.map((src, idx) => (
                                                <div key={idx} className={s.preview}>
                                                    <img src={src} alt="Preview" />
                                                    <div className={s.remove} onClick={() => removeImage(idx)}><X size={12} /></div>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>

                                <button type="submit" className={s.submitBtn} disabled={loading}>
                                    {loading ? '⏳ Đang gửi...' : '🔧 Gửi Yêu Cầu Sửa Chữa'}
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
                            <h2>Đăng ký sửa chữa thành công!</h2>
                            <p>Kỹ thuật viên sẽ liên hệ bạn trong 15 phút để tư vấn.</p>
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
            </section>

            {/* ── REPAIR PROCESS ── */}
            <section className={s.processSection}>
                <div className={s.processInner}>
                    <h2 className={s.sectionTitle}>Quy trình sửa chữa minh bạch tại NexGear</h2>
                    <div className={s.processGrid}>
                        {PROCESS_STEPS.map((step) => (
                            <div key={step.num} className={s.processCard}>
                                <div className={s.processNum}>{step.num}</div>
                                <h3>{step.title}</h3>
                                <p>{step.desc}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </section>
        </div>
    );
}
