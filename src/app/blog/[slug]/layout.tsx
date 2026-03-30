import type { Metadata } from 'next'
import dbConnect from '@/lib/mongodb'
import Blog from '@/models/Blog'
import { getSiteSettings } from '@/lib/site-config'

export async function generateMetadata({
    params,
}: {
    params: Promise<{ slug: string }>
}): Promise<Metadata> {
    const { slug } = await params
    const s = await getSiteSettings()

    try {
        await dbConnect()
        const blog = await Blog.findOne({ slug, isPublished: true }).lean()

        if (!blog) {
            return {
                title: `Bài viết không tìm thấy — ${s.storeName}`,
                description: 'Bài viết này không tồn tại hoặc đã bị xóa.',
            }
        }

        const title = blog.seoTitle || `${blog.title} — Blog Công Nghệ ${s.storeName}`
        const description = (blog.seoDesc || blog.excerpt || `Đọc bài viết mới nhất trên ${s.storeName} Blog. Cập nhật tin tức công nghệ và đánh giá gear.`).substring(0, 160)

        // Build spec-based keywords
        const keywords = [
            'blog công nghệ',
            'tin tức gear',
            'review gaming gear',
            ...(blog.tags || [])
        ]

        return {
            title,
            description,
            keywords,
            openGraph: {
                title,
                description,
                url: `${s.siteDomain}/blog/${slug}`,
                siteName: s.storeName,
                locale: 'vi_VN',
                type: 'article',
                publishedTime: blog.publishedAt?.toISOString(),
                authors: [blog.author || s.storeName],
                tags: blog.tags || [],
                images: blog.featuredImage ? [{ url: blog.featuredImage, width: 1200, height: 630 }] : [{ url: s.ogImage, width: 1200, height: 630 }],
            },
            twitter: {
                card: 'summary_large_image',
                title,
                description,
                images: blog.featuredImage ? [blog.featuredImage] : [s.ogImage],
            },
            alternates: {
                canonical: `${s.siteDomain}/blog/${slug}`,
            },
        }
    } catch {
        return {
            title: `${s.storeName} Blog`,
        }
    }
}

export default function BlogDetailLayout({ children }: { children: React.ReactNode }) {
    return <>{children}</>
}
