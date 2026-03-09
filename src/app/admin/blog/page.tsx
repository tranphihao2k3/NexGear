'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Plus, Edit2, Trash2, Eye, FileText, ChevronLeft, Calendar, User, RefreshCw } from 'lucide-react';
import { useToast } from '@/components/ui/Toast';
import { Button, Badge } from '@/components/ui';
import s from './page.module.scss';

interface Blog {
    _id: string;
    title: string;
    slug: string;
    excerpt: string;
    author: string;
    tags: string[];
    status: 'draft' | 'published';
    publishedAt: string;
    viewCount: number;
    createdAt: string;
    updatedAt: string;
}

export default function AdminBlogPage() {
    const { success, error, info } = useToast();
    const [blogs, setBlogs] = useState<Blog[]>([]);
    const [loading, setLoading] = useState(true);
    const [filterStatus, setFilterStatus] = useState<string>('');

    useEffect(() => {
        fetchBlogs();
    }, [filterStatus]);

    const fetchBlogs = async () => {
        try {
            setLoading(true);
            const url = filterStatus
                ? `/api/blog?status=${filterStatus}`
                : '/api/blog';
            const res = await fetch(url);
            const data = await res.json();
            if (data.success) {
                setBlogs(data.data);
            }
        } catch (err) {
            error('Lỗi tải danh sách bài viết');
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async (id: string, title: string) => {
        if (!confirm(`Bạn có chắc muốn xóa bài viết "${title}"?`)) {
            return;
        }

        try {
            const res = await fetch(`/api/blog/${id}`, {
                method: 'DELETE',
            });
            const data = await res.json();

            if (data.success) {
                success('Đã xóa bài viết thành công!');
                fetchBlogs();
            } else {
                error('Lỗi: ' + data.error);
            }
        } catch (err) {
            error('Có lỗi xảy ra khi xóa bài viết');
        }
    };

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleDateString('vi-VN');
    };

    return (
        <div className={s.page}>
            <div className={s.header}>
                <div>
                    <h1>Quản lý Blog</h1>
                    <p>Hệ thống biên tập và quản lý nội dung bài viết tin tức</p>
                </div>
                <div style={{ display: 'flex', gap: '8px' }}>
                    <Button variant="ghost" onClick={fetchBlogs}>
                        <RefreshCw size={20} className={loading ? 'animate-spin' : ''} />
                    </Button>
                    <Link href="/admin/blog/new">
                        <Button variant="cyan">
                            <Plus size={18} /> VIẾT BÀI MỚI
                        </Button>
                    </Link>
                </div>
            </div>

            <div className={s.filtersBar}>
                <div className={s.filterLabel}>Trạng thái:</div>
                <div className={s.filterTabs}>
                    <button
                        onClick={() => setFilterStatus('')}
                        className={`${s.tab} ${filterStatus === '' ? s.active : ''}`}
                    >
                        Tất cả ({blogs.length})
                    </button>
                    <button
                        onClick={() => setFilterStatus('published')}
                        className={`${s.tab} ${filterStatus === 'published' ? s.active : ''}`}
                    >
                        Đã xuất bản
                    </button>
                    <button
                        onClick={() => setFilterStatus('draft')}
                        className={`${s.tab} ${filterStatus === 'draft' ? s.active : ''}`}
                    >
                        Bản nháp
                    </button>
                </div>
            </div>

            <div className={s.list}>
                <div className={s.desktopHeader}>
                    <span>Thông tin bài viết</span>
                    <span>Tác giả</span>
                    <span style={{ textAlign: 'center' }}>Trạng thái</span>
                    <span style={{ textAlign: 'center' }}>Lượt xem</span>
                    <span style={{ textAlign: 'right' }}>Thao tác</span>
                </div>

                {loading ? (
                    <div className={s.loading}>
                        <div className={s.spinner}></div>
                        <p style={{ marginTop: '12px', fontFamily: 'var(--font-mono)', fontSize: '11px', color: 'var(--color-ink3)' }}>ĐANG TẢI DỮ LIỆU...</p>
                    </div>
                ) : blogs.length === 0 ? (
                    <div className={s.empty}>
                        <FileText size={64} strokeWidth={1} color="var(--color-bg3)" />
                        <h3>Chưa có bài viết nào</h3>
                        <p>Bắt đầu xây dựng nội dung cho website của bạn bằng cách tạo bài viết mới ngay bây giờ!</p>
                        <Link href="/admin/blog/new">
                            <Button variant="cyan">VIẾT BÀI NGAY</Button>
                        </Link>
                    </div>
                ) : (
                    blogs.map((blog) => (
                        <div key={blog._id} className={s.card}>
                            <div className={s.postInfo}>
                                <div className={s.iconWrap}>
                                    <FileText size={20} />
                                </div>
                                <div className={s.details}>
                                    <h3>{blog.title}</h3>
                                    <div className={s.meta}>
                                        <span className={s.date}>
                                            <Calendar size={12} style={{ marginRight: 4 }} />
                                            {formatDate(blog.createdAt)}
                                        </span>
                                        <div className={s.tags}>
                                            {blog.tags.slice(0, 2).map(tag => (
                                                <Badge key={tag} variant="cyan" size="sm">
                                                    {tag}
                                                </Badge>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div className={s.author}>
                                <User size={14} style={{ marginRight: 6 }} className="lg:hidden" />
                                {blog.author}
                            </div>

                            <div className={s.statusWrap}>
                                <Badge variant={blog.status === 'published' ? 'green' : 'gold'}>
                                    {blog.status === 'published' ? 'XUẤT BẢN' : 'BẢN NHÁP'}
                                </Badge>
                            </div>

                            <div className={s.stats}>
                                <Eye size={14} />
                                {blog.viewCount || 0}
                            </div>

                            <div className={s.actions}>
                                {blog.status === 'published' && (
                                    <a
                                        href={`/blog/${blog.slug}`}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        title="Xem trên Web"
                                    >
                                        <Button variant="ghost" size="sm">
                                            <Eye size={18} />
                                        </Button>
                                    </a>
                                )}
                                <Link href={`/admin/blog/edit/${blog._id}`} title="Chỉnh sửa">
                                    <Button variant="ghost" size="sm">
                                        <Edit2 size={18} color="var(--color-cyan)" />
                                    </Button>
                                </Link>
                                <Button variant="ghost" size="sm" onClick={() => handleDelete(blog._id, blog.title)} title="Xóa">
                                    <Trash2 size={18} color="var(--color-magenta)" />
                                </Button>
                            </div>
                        </div>
                    ))
                )}
            </div>

            <div className={s.footer}>
                <Link href="/admin" className={s.backBtn}>
                    <ChevronLeft size={16} /> Quay lại trang chính
                </Link>
            </div>
        </div>
    );
}
