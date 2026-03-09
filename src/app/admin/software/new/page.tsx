'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Save, ArrowLeft, Upload, X, Box, Info, Settings, Image as ImageIcon, Send, FileText } from 'lucide-react';
import { useToast } from '@/components/ui/Toast';
import { Button, Input } from '@/components/ui';
import ImageUploader from '@/components/admin/ImageUploader';
import s from './page.module.scss';

export default function NewSoftwarePage() {
    const router = useRouter();
    const { success: showSuccess, error: showError } = useToast();
    const [loading, setLoading] = useState(false);
    const [formData, setFormData] = useState({
        title: '',
        slug: '',
        excerpt: '',
        content: '',
        featuredImage: '',
        downloadUrl: '',
        version: '',
        developer: '',
        category: 'Tiện ích',
        fileSize: '',
        platform: 'Windows',
        type: 'Free',
        tags: '',
        status: 'draft',
    });

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));

        // Auto slug if title changes
        if (name === 'title') {
            const slug = value
                .toLowerCase()
                .normalize('NFD')
                .replace(/[\u0300-\u036f]/g, '')
                .replace(/đ/g, 'd')
                .replace(/[^a-z0-9\s-]/g, '')
                .trim()
                .replace(/\s+/g, '-')
                .replace(/-+/g, '-');
            setFormData(prev => ({ ...prev, title: value, slug }));
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        try {
            const tagsArray = formData.tags.split(',').map(t => t.trim()).filter(Boolean);

            const res = await fetch('/api/software', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    ...formData,
                    tags: tagsArray
                }),
            });

            const result = await res.json();

            if (result.success) {
                showSuccess('Đã thêm phần mềm mới vào kho!');
                setTimeout(() => {
                    router.push('/admin/software');
                }, 1000);
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
            <div className={s.breadcrumb}>
                <Link href="/admin/software">
                    <Button variant="ghost" size="sm">
                        <ArrowLeft size={18} /> QUAY LẠI
                    </Button>
                </Link>
                <h1>THÊM PHẦN MỀM MỚI</h1>
            </div>

            <form onSubmit={handleSubmit} className={s.formGrid}>
                <div className={s.mainColumn}>
                    {/* Basic Info */}
                    <div className={s.card}>
                        <h2 className={s.cardTitle}><Info size={18} color="#00C4AD" /> THÔNG TIN CƠ BẢN</h2>
                        <div className={s.fieldGroup}>
                            <Input
                                label="Tên phần mềm / Driver *"
                                name="title"
                                value={formData.title}
                                onChange={handleChange}
                                placeholder="VD: Razer Synapse 3 Setup"
                                required
                            />
                            <Input
                                label="Đường dẫn tĩnh (Slug)"
                                name="slug"
                                value={formData.slug}
                                onChange={handleChange}
                                placeholder="vd: razer-synapse-3"
                            />
                            <div className={s.labelWrapper}>
                                <span className={s.label}>Mô tả ngắn (Excerpt)</span>
                                <textarea
                                    name="excerpt"
                                    value={formData.excerpt}
                                    onChange={handleChange}
                                    placeholder="Một vài dòng giới thiệu về phần mềm..."
                                    style={{ minHeight: '80px', width: '100%', padding: '12px' }}
                                />
                            </div>
                        </div>
                    </div>

                    {/* Content */}
                    <div className={s.card}>
                        <h2 className={s.cardTitle}><FileText size={18} color="#00C4AD" /> NỘI DUNG CHI TIẾT</h2>
                        <div className={s.editorWrapper}>
                            <textarea
                                name="content"
                                value={formData.content}
                                onChange={handleChange}
                                placeholder="Nhập nội dung hướng dẫn cài đặt... (Hỗ trợ HTML)"
                                style={{
                                    width: '100%',
                                    height: '400px',
                                    padding: '16px',
                                    fontFamily: 'JetBrains Mono',
                                    fontSize: '13px',
                                    backgroundColor: '#f9f9f9'
                                }}
                            />
                            <p style={{ fontSize: '11px', color: '#7A7870', marginTop: '8px' }}>
                                Hỗ trợ các thẻ HTML: &lt;p&gt;, &lt;h2&gt;, &lt;ul&gt;, &lt;img&gt;, &lt;strong&gt;, ...
                            </p>
                        </div>
                    </div>
                </div>

                <div className={s.sideColumn}>
                    {/* Publish Section */}
                    <div className={s.publishCard}>
                        <h2 className={s.cardTitle}><Send size={18} color="#00C4AD" /> ĐĂNG TẢI</h2>
                        <div className={s.statusBox}>
                            <span>Trạng thái</span>
                            <select name="status" value={formData.status} onChange={handleChange}>
                                <option value="draft">Bản nháp</option>
                                <option value="published">Công khai</option>
                            </select>
                        </div>
                        <Button
                            variant="primary"
                            fullWidth
                            size="lg"
                            type="submit"
                            loading={loading}
                            leftIcon={<Save size={20} />}
                        >
                            LƯU PHẦN MỀM
                        </Button>
                    </div>

                    {/* Technical Specs */}
                    <div className={s.card}>
                        <h2 className={s.cardTitle}><Settings size={18} color="#7B3FF2" /> THỐNG SỐ KỸ THUẬT</h2>
                        <div className={s.fieldGroup}>
                            <Input
                                label="Link tải xuống (URL) *"
                                name="downloadUrl"
                                value={formData.downloadUrl}
                                onChange={handleChange}
                                placeholder="Google Drive, Fshare, official link..."
                                required
                            />
                            <div className={s.techGrid}>
                                <Input
                                    label="Phiên bản"
                                    name="version"
                                    value={formData.version}
                                    onChange={handleChange}
                                    placeholder="v1.0"
                                />
                                <Input
                                    label="Dung lượng"
                                    name="fileSize"
                                    value={formData.fileSize}
                                    onChange={handleChange}
                                    placeholder="85MB"
                                />
                            </div>
                            <div className={s.labelWrapper}>
                                <span className={s.label}>Chuyên mục</span>
                                <select name="category" value={formData.category} onChange={handleChange}>
                                    <option value="Drivers">Drivers Gear / Laptop</option>
                                    <option value="Văn phòng">Phần mềm văn phòng</option>
                                    <option value="Đồ họa">Thiết kế & Đồ họa</option>
                                    <option value="Hệ thống">Công cụ hệ thống</option>
                                    <option value="Tiện ích">Tiện ích khác</option>
                                </select>
                            </div>
                            <div className={s.techGrid}>
                                <div className={s.labelWrapper}>
                                    <span className={s.label}>Loại bản quyền</span>
                                    <select name="type" value={formData.type} onChange={handleChange}>
                                        <option value="Free">Miễn phí</option>
                                        <option value="Crack">Full Crack</option>
                                        <option value="License">Trả phí</option>
                                        <option value="Portable">Portable</option>
                                    </select>
                                </div>
                                <div className={s.labelWrapper}>
                                    <span className={s.label}>Hệ điều hành</span>
                                    <select name="platform" value={formData.platform} onChange={handleChange}>
                                        <option value="Windows">Windows</option>
                                        <option value="macOS">macOS</option>
                                        <option value="Linux">Linux</option>
                                        <option value="Android">Android</option>
                                    </select>
                                </div>
                            </div>
                            <Input
                                label="Tags (Phân cách bằng dấu phẩy)"
                                name="tags"
                                value={formData.tags}
                                onChange={handleChange}
                                placeholder="driver, setup, razer..."
                            />
                        </div>
                    </div>

                    {/* Image */}
                    <div className={s.card}>
                        <h2 className={s.cardTitle}><ImageIcon size={18} color="#F0356A" /> ẢNH ĐẠI DIỆN</h2>
                        <ImageUploader
                            value={formData.featuredImage ? [formData.featuredImage] : []}
                            onChange={(urls) => setFormData(prev => ({ ...prev, featuredImage: urls[0] || '' }))}
                            maxImages={1}
                        />
                    </div>
                </div>
            </form>
        </div>
    );
}
