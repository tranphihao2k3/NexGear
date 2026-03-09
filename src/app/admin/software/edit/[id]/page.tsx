'use client';

import { useState, useEffect, use } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Save, ArrowLeft, Box, Info, Settings, Image as ImageIcon, Send, FileText, RefreshCw } from 'lucide-react';
import { useToast } from '@/components/ui/Toast';
import { Button, Input } from '@/components/ui';
import ImageUploader from '@/components/admin/ImageUploader';
import s from '../new/page.module.scss';

export default function EditSoftwarePage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = use(params);
    const router = useRouter();
    const { success: showSuccess, error: showError } = useToast();

    const [loading, setLoading] = useState(false);
    const [fetching, setFetching] = useState(true);
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

    useEffect(() => {
        const fetchSoftware = async () => {
            try {
                const res = await fetch(`/api/software/${id}`);
                const result = await res.json();
                if (result.success) {
                    const sw = result.data;
                    setFormData({
                        ...sw,
                        tags: Array.isArray(sw.tags) ? sw.tags.join(', ') : sw.tags || ''
                    });
                } else {
                    showError('Không tìm thấy phần mềm');
                    router.push('/admin/software');
                }
            } catch (error) {
                showError('Lỗi khi tải dữ liệu');
            } finally {
                setFetching(false);
            }
        };

        fetchSoftware();
    }, [id, router, showError]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        try {
            const tagsArray = formData.tags.split(',').map(t => t.trim()).filter(Boolean);

            const res = await fetch(`/api/software/${id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    ...formData,
                    tags: tagsArray
                }),
            });

            const result = await res.json();

            if (result.success) {
                showSuccess('Cập nhật thông tin phần mềm thành công!');
                router.push('/admin/software');
            } else {
                showError(result.error || 'Có lỗi xảy ra khi cập nhật');
            }
        } catch (error) {
            showError('Lỗi kết nối server');
        } finally {
            setLoading(false);
        }
    };

    if (fetching) {
        return (
            <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: '#F4F2ED' }}>
                <RefreshCw className="animate-spin" size={48} color="#00C4AD" />
            </div>
        );
    }

    return (
        <div className={s.page}>
            <div className={s.breadcrumb}>
                <Link href="/admin/software">
                    <Button variant="ghost" size="sm">
                        <ArrowLeft size={18} /> QUAY LẠI
                    </Button>
                </Link>
                <h1>CHỈNH SỬA PHẦN MỀM</h1>
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
                                required
                            />
                            <Input
                                label="Đường dẫn tĩnh (Slug)"
                                name="slug"
                                value={formData.slug}
                                onChange={handleChange}
                            />
                            <div className={s.labelWrapper}>
                                <span className={s.label}>Mô tả ngắn (Excerpt)</span>
                                <textarea
                                    name="excerpt"
                                    value={formData.excerpt}
                                    onChange={handleChange}
                                    rows={3}
                                    style={{ width: '100%', padding: '12px' }}
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
                                style={{
                                    width: '100%',
                                    height: '400px',
                                    padding: '16px',
                                    fontFamily: 'JetBrains Mono',
                                    fontSize: '13px',
                                    backgroundColor: '#f9f9f9'
                                }}
                            />
                        </div>
                    </div>
                </div>

                <div className={s.sideColumn}>
                    {/* Publish Action */}
                    <div className={s.publishCard}>
                        <h2 className={s.cardTitle}><Send size={18} color="#00C4AD" /> CẬP NHẬT</h2>
                        <div className={s.statusBox}>
                            <span>Trạng thái</span>
                            <select name="status" value={formData.status} onChange={handleChange}>
                                <option value="draft">Bản nháp</option>
                                <option value="published">Công khai</option>
                            </select>
                        </div>
                        <Button
                            variant="cyan"
                            fullWidth
                            size="lg"
                            type="submit"
                            loading={loading}
                            leftIcon={<Save size={20} />}
                        >
                            CẬP NHẬT THAY ĐỔI
                        </Button>
                    </div>

                    {/* Technical Specs */}
                    <div className={s.card}>
                        <h2 className={s.cardTitle}><Settings size={18} color="#7B3FF2" /> THỐNG SỐ KỸ THUẬT</h2>
                        <div className={s.fieldGroup}>
                            <Input label="Link tải xuống (URL) *" name="downloadUrl" value={formData.downloadUrl} onChange={handleChange} required />
                            <div className={s.techGrid}>
                                <Input label="Phiên bản" name="version" value={formData.version} onChange={handleChange} />
                                <Input label="Dung lượng" name="fileSize" value={formData.fileSize} onChange={handleChange} />
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
                            <Input label="Tags" name="tags" value={formData.tags} onChange={handleChange} />
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
