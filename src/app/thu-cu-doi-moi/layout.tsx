import { Metadata } from 'next';
import { getSiteSettings } from '@/lib/site-config';

export async function generateMetadata(): Promise<Metadata> {
    const s = await getSiteSettings();
    return {
        title: 'Thu Cũ Đổi Mới Laptop & Gear Phụ Kiện',
        description: `Chương trình thu cũ đổi mới laptop, bàn phím, chuột và gaming gear tại ${s.storeName} Cần Thơ. Giá thu cao, trợ giá lên đời đến 2 triệu đồng.`,
        keywords: [
            'thu cũ đổi mới laptop',
            'thu cũ đổi mới máy tính',
            'thu mua laptop cũ Cần Thơ',
            'thu cũ đổi mới gear',
            'trade in laptop',
            `${s.storeName} Cần Thơ`
        ],
        openGraph: {
            title: `Thu Cũ Đổi Mới Laptop & Gear Phụ Kiện — ${s.storeName}`,
            description: `Chương trình thu cũ đổi mới tại ${s.storeName} Cần Thơ. Định giá nhanh 15 phút, trợ giá siêu khủng.`,
            url: `${s.siteDomain}/thu-cu-doi-moi`,
        },
    };
}

export default function TradeInLayout({ children }: { children: React.ReactNode }) {
    return <>{children}</>;
}
