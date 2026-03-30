import { Metadata } from 'next';
import { getSiteSettings } from '@/lib/site-config';

export async function generateMetadata(): Promise<Metadata> {
    const s = await getSiteSettings();
    return {
        title: 'Blog Công Nghệ & Review Gear',
        description: `Cập nhật tin tức công nghệ mới nhất, đánh giá chi tiết gaming gear, hướng dẫn build PC và mẹo sử dụng máy tính hiệu quả từ ${s.storeName}.`,
        keywords: [
            'tin công nghệ',
            'review bàn phím cơ',
            'đánh giá chuột gaming',
            'hướng dẫn build PC',
            'mẹo sử dụng laptop',
            'thủ thuật máy tính'
        ],
        openGraph: {
            title: `Blog Công Nghệ & Review Gear — ${s.storeName}`,
            description: 'Góc chia sẻ kiến thức, mẹo vặt và đánh giá sản phẩm gaming gear hot nhất thị trường.',
            url: `${s.siteDomain}/blog`,
        },
    };
}

export default function BlogListLayout({ children }: { children: React.ReactNode }) {
    return <>{children}</>;
}
