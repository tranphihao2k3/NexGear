'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ChevronLeft, Save, Globe } from 'lucide-react';
import Toast from '@/components/admin/Toast';
import ImageUploader from '@/components/admin/ImageUploader';
import { Button } from '@/components/ui';
import s from '../form.module.scss';

export default function NewBlogPage() {
    const router = useRouter();
    const [loading, setLoading] = useState(false);
    const [formData, setFormData] = useState({
        title: '',
        slug: '',
        excerpt: '',
        content: '',
        featuredImage: '',
        author: 'NexGear Team',
        tags: '',
        metaTitle: '',
        metaDescription: '',
    });

    const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' | 'info'; isVisible: boolean }>({
        message: '',
        type: 'info',
        isVisible: false
    });

    const showToast = (message: string, type: 'success' | 'error' | 'info' = 'success') => {
        setToast({ message, type, isVisible: true });
    };

    // Auto-generate slug from title
    const generateSlug = (title: string) => {
        return title
            .toLowerCase()
            .normalize('NFD')
            .replace(/[\u0300-\u036f]/g, '')
            .replace(/đ/g, 'd')
            .replace(/[^a-z0-9\s-]/g, '')
            .trim()
            .replace(/\s+/g, '-')
            .replace(/-+/g, '-');
    };

    const handleTitleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const title = e.target.value;
        setFormData({
            ...formData,
            title,
            slug: generateSlug(title),
        });
    };

    const handleSubmit = async (status: 'draft' | 'published') => {
        if (!formData.title || !formData.content) {
            showToast('Vui lòng nhập tiêu đề và nội dung', 'error');
            return;
        }

        setLoading(true);

        try {
            const tagsArray = formData.tags
                .split(',')
                .map(tag => tag.trim())
                .filter(tag => tag.length > 0);

            const res = await fetch('/api/blog', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    ...formData,
                    tags: tagsArray,
                    status,
                }),
            });

            const data = await res.json();

            if (data.success) {
                showToast(status === 'published' ? 'Đã xuất bản bài viết!' : 'Đã lưu bản nháp!', 'success');
                setTimeout(() => {
                    router.push('/admin/blog');
                }, 1000);
            } else {
                showToast('Lỗi: ' + data.error, 'error');
            }
        } catch (error) {
            showToast('Có lỗi xảy ra khi tạo bài viết', 'error');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className={s.container}>
            <Toast
                message={toast.message}
                type={toast.type}
                isVisible={toast.isVisible}
                onClose={() => setToast(prev => ({ ...prev, isVisible: false }))}
            />

            <div className={s.header}>
                <Link href="/admin/blog" className={s.backLink}>
                    <ChevronLeft size={16} /> Quay lại danh sách
                </Link>
                <h1>Viết bài mới</h1>
            </div>

            <form className={s.form} onSubmit={(e) => e.preventDefault()}>
                <div className={s.section}>
                    <h2>Nội dung chính</h2>

                    <div className={s.field}>
                        <label>Tiêu đề <span>*</span></label>
                        <input
                            type="text"
                            value={formData.title}
                            onChange={handleTitleChange}
                            placeholder="Nhập tiêu đề hấp dẫn..."
                            required
                        />
                    </div>

                    <div className={s.field}>
                        <label>Slug (URL Path)</label>
                        <input
                            type="text"
                            value={formData.slug}
                            onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
                            className={s.mono}
                            placeholder="tieu-de-bai-viet"
                        />
                        <p className={s.hint}>Đường dẫn: /blog/{formData.slug || '...'}</p>
                    </div>

                    <div className={s.field}>
                        <label>Mô tả ngắn (Excerpt)</label>
                        <textarea
                            value={formData.excerpt}
                            onChange={(e) => setFormData({ ...formData, excerpt: e.target.value })}
                            rows={3}
                            placeholder="Tóm tắt ngắn gọn nội dung bài viết..."
                        />
                    </div>

                    <div className={s.field}>
                        <label>Nội dung chi tiết (HTML/Text) <span>*</span></label>
                        <textarea
                            value={formData.content}
                            onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                            className={s.mono}
                            rows={15}
                            placeholder="Nhập nội dung bài viết. Bạn có thể sử dụng các thẻ HTML cơ bản..."
                            required
                        />
                        <p className={s.hint}>Mẹo: Sử dụng &lt;p&gt;, &lt;h2&gt;, &lt;ul&gt;, &lt;li&gt;, &lt;img&gt; để định dạng.</p>
                    </div>
                </div>

                <div className={s.section}>
                    <h2>Media & Tag</h2>

                    <div className={s.field}>
                        <label>Ảnh đại diện (Featured Image)</label>
                        <ImageUploader
                            value={formData.featuredImage ? [formData.featuredImage] : []}
                            onChange={(urls) => setFormData({ ...formData, featuredImage: urls[0] || '' })}
                            maxImages={1}
                        />
                    </div>

                    <div className={s.field}>
                        <label>Tác giả</label>
                        <input
                            type="text"
                            value={formData.author}
                            onChange={(e) => setFormData({ ...formData, author: e.target.value })}
                            placeholder="Tên tác giả hiển thị"
                        />
                    </div>

                    <div className={s.field}>
                        <label>Tags (Phân cách bởi dấu phẩy)</label>
                        <input
                            type="text"
                            value={formData.tags}
                            onChange={(e) => setFormData({ ...formData, tags: e.target.value })}
                            placeholder="gear, gaming, review"
                        />
                    </div>
                </div>

                <div className={s.section}>
                    <h2>Tối ưu SEO</h2>

                    <div className={s.field}>
                        <label>Meta Title</label>
                        <input
                            type="text"
                            value={formData.metaTitle}
                            onChange={(e) => setFormData({ ...formData, metaTitle: e.target.value })}
                            placeholder="Tiêu đề hiển thị trên Google (Mặc định dùng tiêu đề bài viết)"
                        />
                    </div>

                    <div className={s.field}>
                        <label>Meta Description</label>
                        <textarea
                            value={formData.metaDescription}
                            onChange={(e) => setFormData({ ...formData, metaDescription: e.target.value })}
                            rows={2}
                            placeholder="Mô tả hiển thị trên Google (Mặc định dùng mô tả ngắn)"
                        />
                    </div>
                </div>

                <div className={s.actions}>
                    <Button
                        variant="primary"
                        size="xl"
                        onClick={() => handleSubmit('draft')}
                        disabled={loading}
                    >
                        <Save size={20} /> {loading ? 'ĐANG LƯU...' : 'LƯU NHÁP'}
                    </Button>
                    <Button
                        variant="cyan"
                        size="xl"
                        onClick={() => handleSubmit('published')}
                        disabled={loading}
                    >
                        <Globe size={20} /> {loading ? 'ĐANG XUẤT BẢN...' : 'XUẤT BẢN NGAY'}
                    </Button>
                </div>
            </form>
        </div>
    );
}
