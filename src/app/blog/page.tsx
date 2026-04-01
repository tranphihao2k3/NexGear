"use client";

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { Button, Badge, Skeleton } from '@/components/ui';
import LazyImage from '@/components/ui/LazyImage';
import styles from './page.module.scss';
import { IBlog } from '@/models/Blog';

interface PaginatedResponse {
    success: boolean;
    data: IBlog[];
    pagination: {
        total: number;
        page: number;
        limit: number;
        totalPages: number;
    };
}

export default function BlogPage() {
    const [blogs, setBlogs] = useState<IBlog[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        const fetchBlogs = async () => {
            try {
                setLoading(true);
                // Fetch only published blogs
                const res = await fetch('/api/blog?status=published');
                if (!res.ok) throw new Error('Failed to fetch blogs');
                const result: PaginatedResponse = await res.json();
                
                if (result.success) {
                    setBlogs(result.data);
                } else {
                    setError('Failed to load blog posts.');
                }
            } catch (err: any) {
                setError(err.message || 'An error occurred while fetching blogs.');
            } finally {
                setLoading(false);
            }
        };

        fetchBlogs();
    }, []);

    const formatDate = (dateString?: Date | null) => {
        if (!dateString) return '';
        return new Intl.DateTimeFormat('vi-VN', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        }).format(new Date(dateString));
    };

    return (
        <div className={styles.wrapper}>
            <div className={styles.header}>
                <h1 className={styles.title}>NexGzone Blog</h1>
                <p className={styles.subtitle}>
                    Khám phá các bài viết mới nhất về công nghệ, gear và xu hướng từ NexGzone
                </p>
            </div>

            {error && (
                <div className={styles.error}>
                    <p>{error}</p>
                    <Button variant="outline" onClick={() => window.location.reload()}>Thử lại</Button>
                </div>
            )}

            <div className={styles.productGrid}>
                {loading ? (
                    // Skeleton loading (4 items)
                    Array.from({ length: 4 }).map((_, i) => (
                        <div key={i} className={styles.card}>
                            <Skeleton height={200} />
                            <div className={styles.cardContent}>
                                <Skeleton width="30%" height={24} />
                                <div style={{ margin: '16px 0' }}>
                                    <Skeleton width="80%" height={28} />
                                </div>
                                <Skeleton width="100%" height={16} />
                                <div style={{ marginTop: '8px' }}>
                                    <Skeleton width="60%" height={16} />
                                </div>
                            </div>
                        </div>
                    ))
                ) : blogs.length > 0 ? (
                    blogs.map((blog) => (
                        <Link href={`/blog/${blog.slug}`} key={String(blog._id)} className={styles.card}>
                            <div className={styles.cardTopBar}></div>
                            {blog.featuredImage ? (
                                <div className={styles.imageWrapper}>
                                    <LazyImage src={blog.featuredImage} alt={blog.title} className={styles.image} objectFit="cover" />
                                </div>
                            ) : (
                                <div className={styles.imagePlaceholder}>NexGzone</div>
                            )}
                            <div className={styles.cardContent}>
                                <div className={styles.tags}>
                                    {blog.tags && blog.tags.map(tag => (
                                        <Badge key={tag} variant="magenta">{tag}</Badge>
                                    ))}
                                    <Badge variant="ink">{formatDate(blog.publishedAt)}</Badge>
                                </div>
                                <h3 className={styles.blogTitle}>{blog.title}</h3>
                                <p className={styles.excerpt}>{blog.excerpt}</p>
                                <div className={styles.footer}>
                                    <span className={styles.author}>Bởi <strong>{blog.author || 'Admin'}</strong></span>
                                    <span className={styles.readMore}>Đọc tiếp &rarr;</span>
                                </div>
                            </div>
                        </Link>
                    ))
                ) : (
                    <div className={styles.empty}>
                        <p>Chưa có bài viết nào được xuất bản.</p>
                    </div>
                )}
            </div>
        </div>
    );
}
