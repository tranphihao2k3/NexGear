'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Laptop, Monitor, Battery, HardDrive,
    ArrowRight, Upload, X, CheckCircle,
    RefreshCcw, Smartphone, MessageSquare,
    Cpu, Layout, Save, Send, Loader2
} from 'lucide-react';
import { Button, Input, useToast } from '@/components/ui';
import s from './page.module.scss';

const CONDITION_OPTIONS = [
    { id: '99', label: '99%', title: 'Loại 1', desc: 'Đẹp keng, không trầy xước', emoji: '✨' },
    { id: '98', label: '98%', title: 'Loại 2', desc: 'Màn đẹp, xước dăm nhẹ', emoji: '👍' },
    { id: '95', label: '95%', title: 'Loại 3', desc: 'Trầy rõ, cấn móp nhẹ', emoji: '⚡' },
    { id: '90', label: '90%', title: 'Loại 4', desc: 'Lỗi chức năng, màn ám', emoji: '🔧' },
];

export default function TradeInPage() {
    const { success: showSuccess, error: showError } = useToast();

    const [formData, setFormData] = useState({
        name: '',
        contact: '',
        model: '',
        cpu: '',
        ram: '',
        ssd: '',
        gpu: '',
        condition: '99',
        battery: '',
        notes: '',
    });

    const [imageFiles, setImageFiles] = useState<File[]>([]);
    const [imagePreviews, setImagePreviews] = useState<string[]>([]);
    const [loading, setLoading] = useState(false);
    const [submitted, setSubmitted] = useState(false);
    const [orderCode, setOrderCode] = useState('');

    const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = e.target.files;
        if (!files) return;

        const newFiles = Array.from(files).slice(0, 5 - imageFiles.length);
        setImageFiles(prev => [...prev, ...newFiles]);

        newFiles.forEach(file => {
            const reader = new FileReader();
            reader.onloadend = () => {
                setImagePreviews(prev => [...prev, reader.result as string]);
            };
            reader.readAsDataURL(file);
        });
    };

    const removeImage = (index: number) => {
        setImageFiles(prev => prev.filter((_, i) => i !== index));
        setImagePreviews(prev => prev.filter((_, i) => i !== index));
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        try {
            // 1. Upload Images
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

            // 2. Submit Order
            const res = await fetch('/api/buyback-orders', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    sellerName: formData.name,
                    sellerPhone: formData.contact,
                    productInfo: {
                        model: formData.model,
                        condition: `${formData.condition}%`,
                        specs: {
                            cpu: formData.cpu,
                            ram: formData.ram,
                            ssd: formData.ssd,
                            gpu: formData.gpu,
                        }
                    },
                    images: imageUrls,
                    inspectionNotes: `Pin/Màn: ${formData.battery}. Ghi chú: ${formData.notes}`,
                    status: 'pending'
                }),
            });

            const result = await res.json();
            if (result.success) {
                setOrderCode(result.data.buybackNumber);
                setSubmitted(true);
                showSuccess('Gửi yêu cầu thành công! Chúng tôi sẽ liên hệ lại sớm.');

                // Background notification/email can be triggered here or in API
            } else {
                showError(result.error || 'Có lỗi xảy ra');
            }
        } catch (error) {
            showError('Lỗi kết nối server');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className={s.page}>
            {/* Hero */}
            <section className={s.hero}>
                <div className={s.container}>
                    <div className={s.content}>
                        <div className={s.label}>Chương trình đặc biệt</div>
                        <h1>THU CŨ ĐỔI MỚI <span>LÊN ĐỜI SIÊU PHẨM</span></h1>
                        <p>Định giá laptop cũ siêu nhanh. Trợ giá lên đời lên đến 2.000.000đ. Nhận máy mới chỉ trong 30 phút.</p>
                    </div>
                    <div className={s.graphic}>
                        <div className={s.exchangeIcon}>
                            <RefreshCcw size={64} className="animate-spin-slow" />
                        </div>
                    </div>
                </div>
            </section>

            <main className={s.mainSection}>
                {/* Step 1: Health Check */}
                <div className={s.card}>
                    <div className={s.cardHeader}>
                        <div className={s.stepNum}>1</div>
                        <h2>KIỂM TRA SỨC KHỎE MÁY</h2>
                    </div>
                    <div className={s.testGrid}>
                        <div className={s.testItem}>
                            <div className={s.icon}><Monitor size={24} /></div>
                            <div className={s.info}>
                                <h4>Test Màn hình/Loa/Phím</h4>
                                <a href="/test-hardware" target="_blank">TRUY CẬP CÔNG CỤ TEST →</a>
                            </div>
                        </div>
                        <div className={s.testItem}>
                            <div className={s.icon}><Battery size={24} /></div>
                            <div className={s.info}>
                                <h4>Kiểm tra độ chai Pin</h4>
                                <a href="/software/BatteryMon.zip" download>TẢI BATTERYMON (8MB) ↓</a>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Step 2: Form */}
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
                                <h3>GỬI YÊU CẦU ĐỊNH GIÁ</h3>
                                <p>Cung cấp cấu hình chính xác để nhận giá tốt nhất</p>
                            </div>

                            <form onSubmit={handleSubmit}>
                                <div className={s.inputGrid}>
                                    <Input label="Họ tên khách hàng" name="name" value={formData.name} onChange={handleChange} placeholder="VD: Nguyễn Văn A" />
                                    <Input label="Số điện thoại / Zalo *" name="contact" value={formData.contact} onChange={handleChange} placeholder="09xx..." required />
                                </div>

                                <Input label="Tên máy (Model) *" name="model" value={formData.model} onChange={handleChange} placeholder="VD: Dell XPS 15 9520" required />

                                <div className={s.specGrid}>
                                    <Input label="CPU (i5/R5...)" name="cpu" value={formData.cpu} onChange={handleChange} />
                                    <Input label="RAM (8/16GB...)" name="ram" value={formData.ram} onChange={handleChange} />
                                    <Input label="SSD/HDD" name="ssd" value={formData.ssd} onChange={handleChange} />
                                    <Input label="VGA (Nếu có)" name="gpu" value={formData.gpu} onChange={handleChange} />
                                </div>

                                <div>
                                    <label className={s.uploadLabel}>Tình trạng ngoại hình</label>
                                    <div className={s.conditionGrid}>
                                        {CONDITION_OPTIONS.map(opt => (
                                            <div
                                                key={opt.id}
                                                className={`${s.conditionBtn} ${formData.condition === opt.id ? s.active : ''}`}
                                                onClick={() => setFormData({ ...formData, condition: opt.id })}
                                            >
                                                <span className={s.emoji}>{opt.emoji}</span>
                                                <div className={s.label}>{opt.label}</div>
                                                <div className={s.desc}>{opt.desc}</div>
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                <div className={s.inputGrid}>
                                    <Input label="Tình trạng Pin / Màn" name="battery" value={formData.battery} onChange={handleChange} placeholder="VD: Chai 10%, ám nhẹ..." />
                                    <Input label="Ghi chú thêm" name="notes" value={formData.notes} onChange={handleChange} placeholder="Thiếu sạc, cấn góc..." />
                                </div>

                                <div className={s.uploadArea}>
                                    <label className={s.uploadLabel}>Ảnh chụp thực tế (Tối đa 5 ảnh)</label>
                                    <input type="file" multiple accept="image/*" onChange={handleImageChange} className={s.fileInput} />

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

                                <Button variant="cyan" fullWidth size="xl" type="submit" loading={loading} leftIcon={<Send size={20} />}>
                                    GỬI YÊU CẦU ĐỊNH GIÁ NGAY
                                </Button>
                            </form>
                        </motion.div>
                    ) : (
                        <motion.div
                            key="success"
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            className={s.successBox}
                        >
                            <div className={s.icon}><CheckCircle size={40} /></div>
                            <h2>GỬI YÊU CẦU THÀNH CÔNG!</h2>
                            <p>Chuyên viên NexGear sẽ định giá và phản hồi cho bạn trong 15 phút.</p>

                            <div className={s.orderCode}>
                                <div className={s.codeLabel}>Mã yêu cầu của bạn</div>
                                <div className={s.code}>{orderCode}</div>
                            </div>

                            <div className={s.actions}>
                                <Button variant="primary" size="lg" onClick={() => window.open('https://zalo.me/0978648720', '_blank')}>
                                    CHAT ZALO NHẬN BÁO GIÁ
                                </Button>
                                <Button variant="ghost" size="lg" onClick={() => setSubmitted(false)}>
                                    GỬI YÊU CẦU KHÁC
                                </Button>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </main>
        </div>
    );
}
