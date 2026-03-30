import { Metadata } from 'next';
import { getSiteSettings } from '@/lib/site-config';

export async function generateMetadata(): Promise<Metadata> {
    const s = await getSiteSettings();
    return {
        title: 'So Sánh Sản Phẩm Gaming Gear',
        description: `So sánh chi tiết cấu hình, tính năng, giá bán của các sản phẩm gaming gear. Giúp bạn tìm được bàn phím, chuột, tai nghe ưng ý nhất tại ${s.storeName}.`,
        keywords: [
            'so sánh bàn phím cơ',
            'so sánh chuột gaming',
            'so sánh tai nghe',
            'đánh giá gear gaming',
            'cấu hình gaming gear'
        ],
        openGraph: {
            title: `So Sánh Sản Phẩm Gaming Gear — ${s.storeName}`,
            description: 'Bảng so sánh chi tiết tính năng, giá cả của các mẫu mã gaming gear hot nhất.',
            url: `${s.siteDomain}/compare`,
        },
    };
}

export default function CompareLayout({ children }: { children: React.ReactNode }) {
    return <>{children}</>;
}
