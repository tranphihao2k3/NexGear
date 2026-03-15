import type { Metadata } from 'next'
import dbConnect from '@/lib/mongodb'
import Blog from '@/models/Blog'

export async function generateMetadata({
    params,
}: {
    params: Promise<{ slug: string }>
}): Promise<Metadata> {
    const { slug } = await params

    try {
        await dbConnect()
        const blog = await Blog.findOne({ slug, isPublished: true }).lean()

        if (!blog) {
            return {
                title: 'Bài viết không tìm thấy — NexGear',
                description: 'Bài viết này không tồn tại hoặc đã bị xóa.',
            }
        }

        const title = blog.seoTitle || `${blog.title} — Blog Công Nghệ NexGear`
        const description = (blog.seoDesc || blog.excerpt || 'Đọc bài viết mới nhất trên NexGear Blog. Cập nhật tin tức công nghệ và đánh giá gear.').substring(0, 160)

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
                url: `https://nexgzone.top/blog/${slug}`,
                siteName: 'NexGear',
                locale: 'vi_VN',
                type: 'article',
                publishedTime: blog.publishedAt?.toISOString(),
                authors: [blog.author || 'NexGear'],
                tags: blog.tags || [],
                images: blog.featuredImage ? [{ url: blog.featuredImage, width: 1200, height: 630 }] : [{ url: '/og-image.jpg', width: 1200, height: 630 }],
            },
            twitter: {
                card: 'summary_large_image',
                title,
                description,
                images: blog.featuredImage ? [blog.featuredImage] : ['/og-image.jpg'],
            },
            alternates: {
                canonical: `https://nexgzone.top/blog/${slug}`,
            },
        }
    } catch {
        return {
            title: 'NexGear Blog',
        }
    }
}

export default function BlogDetailLayout({ children }: { children: React.ReactNode }) {
    return <>{children}</>
}
