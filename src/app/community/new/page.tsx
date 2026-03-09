'use client';

import React, { useState, useRef } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import styles from './page.module.scss';

const CATEGORIES = [
    { value: 'keyboard', label: 'Bàn phím' },
    { value: 'mouse', label: 'Chuột' },
    { value: 'headphone', label: 'Tai nghe' },
    { value: 'speaker', label: 'Loa' },
    { value: 'accessory', label: 'Phụ kiện' },
    { value: 'combo', label: 'Combo' },
    { value: 'other', label: 'Khác' },
];

const CONDITIONS = [
    { value: 'like_new', label: 'Mới 99%' },
    { value: 'used', label: 'Đã sử dụng' },
    { value: 'warranty', label: 'Còn bảo hành' },
    { value: 'minor_defect', label: 'Lỗi nhẹ' },
];

const LOCATIONS = [
    'Hà Nội', 'TP. Hồ Chí Minh', 'Đà Nẵng', 'Hải Phòng', 'Cần Thơ',
    'Biên Hoà', 'Nha Trang', 'Huế', 'Vũng Tàu', 'Khác',
];

export default function NewListingPage() {
    const { data: session, status } = useSession();
    const router = useRouter();
    const fileInputRef = useRef<HTMLInputElement>(null);

    const [form, setForm] = useState({
        title: '',
        category: 'keyboard',
        condition: 'like_new',
        price: '',
        description: '',
        phone: '',
        zalo: '',
        location: '',
    });
    const [images, setImages] = useState<{ url: string; file?: File }[]>([]);
    const [uploading, setUploading] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState('');

    if (status === 'loading') {
        return <div className={styles.loading}>Đang tải...</div>;
    }

    if (!session) {
        return (
            <div className={styles.authGuard}>
                <h2>Bạn cần đăng nhập để đăng bán</h2>
                <Link href="/login">Đăng nhập</Link>
            </div>
        );
    }

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
        setForm({ ...form, [e.target.name]: e.target.value });
    };

    const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = e.target.files;
        if (!files) return;

        const remaining = 5 - images.length;
        const toUpload = Array.from(files).slice(0, remaining);

        setUploading(true);
        try {
            for (const file of toUpload) {
                const formData = new FormData();
                formData.append('file', file);
                const res = await fetch('/api/upload', { method: 'POST', body: formData });
                const data = await res.json();
                if (data.success) {
                    setImages((prev) => [...prev, { url: data.data.url }]);
                }
            }
        } finally {
            setUploading(false);
            if (fileInputRef.current) fileInputRef.current.value = '';
        }
    };

    const removeImage = (index: number) => {
        setImages((prev) => prev.filter((_, i) => i !== index));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');

        if (!form.title.trim() || !form.description.trim() || !form.price) {
            setError('Vui lòng điền đầy đủ thông tin bắt buộc');
            return;
        }

        if (!form.phone && !form.zalo) {
            setError('Vui lòng nhập ít nhất SĐT hoặc Zalo');
            return;
        }

        setSubmitting(true);
        try {
            const res = await fetch('/api/community', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    ...form,
                    price: Number(form.price),
                    images: images.map((img) => img.url),
                    contact: { phone: form.phone, zalo: form.zalo },
                }),
            });
            const data = await res.json();
            if (data.success) {
                router.push(`/community/${data.data.slug}`);
            } else {
                setError(data.error || 'Có lỗi xảy ra');
            }
        } catch {
            setError('Lỗi kết nối máy chủ');
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <div className={styles.page}>
            <div className={styles.header}>
                <h1 className={styles.title}>ĐĂNG BÁN</h1>
                <p className={styles.subtitle}>Đăng tin thanh lý gaming gear của bạn</p>
            </div>

            <form className={styles.form} onSubmit={handleSubmit}>
                {error && <div className={styles.error}>{error}</div>}

                <div className={styles.formGroup}>
                    <label className={styles.label}>Tiêu đề *</label>
                    <input
                        type="text"
                        name="title"
                        className={styles.input}
                        placeholder="VD: Bàn phím cơ Keychron K8 Pro"
                        value={form.title}
                        onChange={handleChange}
                        maxLength={120}
                    />
                </div>

                <div className={styles.formRow}>
                    <div className={styles.formGroup}>
                        <label className={styles.label}>Danh mục</label>
                        <select name="category" className={styles.input} value={form.category} onChange={handleChange}>
                            {CATEGORIES.map((c) => (
                                <option key={c.value} value={c.value}>{c.label}</option>
                            ))}
                        </select>
                    </div>
                    <div className={styles.formGroup}>
                        <label className={styles.label}>Tình trạng</label>
                        <select name="condition" className={styles.input} value={form.condition} onChange={handleChange}>
                            {CONDITIONS.map((c) => (
                                <option key={c.value} value={c.value}>{c.label}</option>
                            ))}
                        </select>
                    </div>
                </div>

                <div className={styles.formRow}>
                    <div className={styles.formGroup}>
                        <label className={styles.label}>Giá (VNĐ) *</label>
                        <input
                            type="number"
                            name="price"
                            className={styles.input}
                            placeholder="500000"
                            value={form.price}
                            onChange={handleChange}
                            min={0}
                        />
                    </div>
                    <div className={styles.formGroup}>
                        <label className={styles.label}>Khu vực</label>
                        <select name="location" className={styles.input} value={form.location} onChange={handleChange}>
                            <option value="">Chọn khu vực</option>
                            {LOCATIONS.map((loc) => (
                                <option key={loc} value={loc}>{loc}</option>
                            ))}
                        </select>
                    </div>
                </div>

                <div className={styles.formGroup}>
                    <label className={styles.label}>Mô tả *</label>
                    <textarea
                        name="description"
                        className={styles.textarea}
                        placeholder="Mô tả chi tiết tình trạng sản phẩm, lý do bán, phụ kiện đi kèm..."
                        value={form.description}
                        onChange={handleChange}
                        rows={5}
                        maxLength={2000}
                    />
                </div>

                {/* Images */}
                <div className={styles.formGroup}>
                    <label className={styles.label}>Hình ảnh (tối đa 5)</label>
                    <div className={styles.imageGrid}>
                        {images.map((img, i) => (
                            <div key={i} className={styles.imagePreview}>
                                <Image src={img.url} alt="" fill sizes="120px" className={styles.previewImg} unoptimized />
                                <button type="button" className={styles.removeImg} onClick={() => removeImage(i)}>✕</button>
                            </div>
                        ))}
                        {images.length < 5 && (
                            <button
                                type="button"
                                className={styles.uploadBtn}
                                onClick={() => fileInputRef.current?.click()}
                                disabled={uploading}
                            >
                                {uploading ? '...' : '+ Thêm ảnh'}
                            </button>
                        )}
                    </div>
                    <input
                        ref={fileInputRef}
                        type="file"
                        accept="image/*"
                        multiple
                        onChange={handleImageUpload}
                        style={{ display: 'none' }}
                    />
                </div>

                {/* Contact */}
                <div className={styles.formRow}>
                    <div className={styles.formGroup}>
                        <label className={styles.label}>Số điện thoại</label>
                        <input
                            type="tel"
                            name="phone"
                            className={styles.input}
                            placeholder="0912345678"
                            value={form.phone}
                            onChange={handleChange}
                        />
                    </div>
                    <div className={styles.formGroup}>
                        <label className={styles.label}>Zalo</label>
                        <input
                            type="tel"
                            name="zalo"
                            className={styles.input}
                            placeholder="Số Zalo"
                            value={form.zalo}
                            onChange={handleChange}
                        />
                    </div>
                </div>

                <div className={styles.formActions}>
                    <Link href="/community" className={styles.cancelBtn}>Huỷ</Link>
                    <button type="submit" className={styles.submitBtn} disabled={submitting}>
                        {submitting ? 'Đang đăng...' : 'Đăng bán'}
                    </button>
                </div>
            </form>
        </div>
    );
}
