'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { ChevronLeft, Save, Globe } from 'lucide-react';
import Toast from '@/components/admin/Toast';
import ImageUploader from '@/components/admin/ImageUploader';
import RichTextEditor from '@/components/admin/RichTextEditor';
import { Button } from '@/components/ui';
import s from '../../form.module.scss';

export default function EditBlogPage() {
    const params = useParams();
    const router = useRouter();
    const id = params.id as string;

    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [formData, setFormData] = useState({
        title: '',
        slug: '',
        excerpt: '',
        content: '',
        featuredImage: '',
        author: '',
        tags: '',
        metaTitle: '',
        metaDescription: '',
        status: 'draft',
    });

    const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' | 'info'; isVisible: boolean }>({
        message: '',
        type: 'info',
        isVisible: false
    });

    const showToast = (message: string, type: 'success' | 'error' | 'info' = 'success') => {
        setToast({ message, type, isVisible: true });
    };

    useEffect(() => {
        if (id) {
            fetchBlog();
        }
    }, [id]);

    const fetchBlog = async () => {
        try {
            const res = await fetch(`/api/blog/${id}`);
            const data = await res.json();

            if (data.success) {
                const blog = data.data;
                setFormData({
                    title: blog.title,
                    slug: blog.slug,
                    excerpt: blog.excerpt || '',
                    content: blog.content,
                    featuredImage: blog.featuredImage || '',
                    author: blog.author,
                    tags: blog.tags.join(', '),
                    metaTitle: blog.metaTitle || '',
                    metaDescription: blog.metaDescription || '',
                    status: blog.status,
                });
            }
        } catch (error) {
            showToast('Có lỗi khi tải bài viết', 'error');
        } finally {
            setLoading(false);
        }
    };

    const handleSubmit = async (status: string) => {
        if (!formData.title || !formData.content) {
            showToast('Vui lòng nhập tiêu đề và nội dung', 'error');
            return;
        }

        setSaving(true);

        try {
            const tagsArray = formData.tags
                .split(',')
                .map(tag => tag.trim())
                .filter(tag => tag.length > 0);

            const res = await fetch(`/api/blog/${id}`, {
                method: 'PUT',
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
                showToast('Đã cập nhật bài viết!', 'success');
                setTimeout(() => {
                    router.push('/admin/blog');
                }, 1000);
            } else {
                showToast('Lỗi: ' + data.error, 'error');
            }
        } catch (error) {
            showToast('Có lỗi xảy ra khi cập nhật bài viết', 'error');
        } finally {
            setSaving(false);
        }
    };

    if (loading) {
        return (
            <div className={s.container}>
                <div className={s.loading}>
                    <div className={s.spinner}></div>
                    <p>Đang tải bài viết...</p>
                </div>
            </div>
        );
    }

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
                <h1>Chỉnh sửa bài viết</h1>
            </div>

            <form className={s.form} onSubmit={(e) => e.preventDefault()}>
                <div className={s.section}>
                    <h2>Nội dung chính</h2>

                    <div className={s.field}>
                        <label>Tiêu đề <span>*</span></label>
                        <input
                            type="text"
                            value={formData.title}
                            onChange={(e) => setFormData({ ...formData, title: e.target.value })}
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
                        <label>Nội dung chi tiết <span>*</span></label>
                        <RichTextEditor
                            value={formData.content}
                            onChange={(html) => setFormData({ ...formData, content: html })}
                            placeholder="Bắt đầu viết bài..."
                        />
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
                            placeholder="Tiêu đề SEO"
                        />
                    </div>

                    <div className={s.field}>
                        <label>Meta Description</label>
                        <textarea
                            value={formData.metaDescription}
                            onChange={(e) => setFormData({ ...formData, metaDescription: e.target.value })}
                            rows={2}
                            placeholder="Mô tả SEO"
                        />
                    </div>
                </div>

                <div className={s.actions}>
                    <Button
                        variant="primary"
                        size="xl"
                        onClick={() => handleSubmit('draft')}
                        disabled={saving}
                    >
                        <Save size={20} /> {saving ? 'ĐANG LƯU...' : 'LƯU NHÁP'}
                    </Button>
                    <Button
                        variant="cyan"
                        size="xl"
                        onClick={() => handleSubmit('published')}
                        disabled={saving}
                    >
                        <Globe size={20} /> {saving ? 'ĐANG CẬP NHẬT...' : 'CẬP NHẬT & XUẤT BẢN'}
                    </Button>
                </div>
            </form>
        </div>
    );
}
