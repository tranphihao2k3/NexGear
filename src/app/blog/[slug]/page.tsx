"use client";

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { Button, Badge, Skeleton } from '@/components/ui';
import LazyImage from '@/components/ui/LazyImage';
import styles from './page.module.scss';
import { IBlog } from '@/models/Blog';

export default function BlogDetailPage() {
    const params = useParams();
    const router = useRouter();
    const [blog, setBlog] = useState<IBlog | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        const fetchBlog = async () => {
            if (!params.slug) return;
            try {
                setLoading(true);
                const res = await fetch(`/api/blog/${params.slug}`);
                if (!res.ok) {
                    if (res.status === 404) {
                        throw new Error('Không tìm thấy bài viết này.');
                    }
                    throw new Error('Có lỗi xảy ra khi tải bài viết.');
                }
                const result = await res.json();
                if (result.success) {
                    setBlog(result.data);
                } else {
                    throw new Error(result.message || 'Lỗi dữ liệu.');
                }
            } catch (err: any) {
                setError(err.message || 'Lỗi không xác định.');
            } finally {
                setLoading(false);
            }
        };

        fetchBlog();
    }, [params.slug]);

    const formatDate = (dateString?: Date | null) => {
        if (!dateString) return '';
        return new Intl.DateTimeFormat('vi-VN', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        }).format(new Date(dateString));
    };

    if (loading) {
        return (
            <div className={styles.wrapper}>
                <div className={styles.container}>
                    <div className={styles.skeletonHeader}>
                        <Skeleton height={40} width="70%" />
                        <div className={styles.skeletonMeta}>
                            <Skeleton height={20} width="20%" />
                            <Skeleton height={20} width="20%" />
                            <Skeleton height={20} width="20%" />
                        </div>
                    </div>
                    <Skeleton height={400} />
                    <div className={styles.skeletonContent}>
                        <Skeleton height={20} />
                        <Skeleton height={20} />
                        <Skeleton height={20} />
                        <Skeleton height={20} width="80%" />
                    </div>
                </div>
            </div>
        );
    }

    if (error || !blog) {
        return (
            <div className={styles.wrapper}>
                <div className={styles.container}>
                    <div className={styles.error}>
                        <h2>Oops!</h2>
                        <p>{error || 'Bài viết không tồn tại.'}</p>
                        <Button variant="primary" onClick={() => router.push('/blog')}>
                            &larr; Quay lại Blog
                        </Button>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <article className={styles.wrapper}>
            <div className={styles.container}>
                <Link href="/blog" className={styles.backLink}>
                    &larr; Xem tất cả bài viết
                </Link>

                <header className={styles.header}>
                    <div className={styles.tags}>
                        {blog.tags && blog.tags.map(tag => (
                            <Badge key={tag} variant="magenta">{tag}</Badge>
                        ))}
                    </div>
                    
                    <h1 className={styles.title}>{blog.title}</h1>
                    
                    <div className={styles.meta}>
                        <div className={styles.metaItem}>
                            <strong>Tác giả:</strong> {blog.author || 'Admin'}
                        </div>
                        <div className={styles.metaDivider}></div>
                        <div className={styles.metaItem}>
                            <strong>Đăng ngày:</strong> {formatDate(blog.publishedAt)}
                        </div>
                        <div className={styles.metaDivider}></div>
                        <div className={styles.metaItem}>
                            <strong>Lượt xem:</strong> {blog.viewCount || 0}
                        </div>
                    </div>
                </header>

                {blog.featuredImage && (
                    <div className={styles.featuredImage}>
                        <LazyImage src={blog.featuredImage} alt={blog.title} fill objectFit="cover" />
                    </div>
                )}

                <div 
                    className={styles.content}
                    dangerouslySetInnerHTML={{ __html: blog.content }} 
                />
            </div>
        </article>
    );
}
