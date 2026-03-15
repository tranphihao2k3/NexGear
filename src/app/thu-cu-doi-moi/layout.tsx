import { Metadata } from 'next';

export const metadata: Metadata = {
    title: 'Thu Cũ Đổi Mới Laptop & Gear Phụ Kiện',
    description: 'Chương trình thu cũ đổi mới laptop, bàn phím, chuột và gaming gear tại NexGear Cần Thơ. Giá thu cao, trợ giá lên đời đến 2 triệu đồng.',
    keywords: [
        'thu cũ đổi mới laptop',
        'thu cũ đổi mới máy tính',
        'thu mua laptop cũ Cần Thơ',
        'thu cũ đổi mới gear',
        'trade in laptop',
        'NexGear Cần Thơ'
    ],
    openGraph: {
        title: 'Thu Cũ Đổi Mới Laptop & Gear Phụ Kiện — NexGear',
        description: 'Chương trình thu cũ đổi mới tại NexGear Cần Thơ. Định giá nhanh 15 phút, trợ giá siêu khủng.',
        url: 'https://nexgzone.top/thu-cu-doi-moi',
    },
};

export default function TradeInLayout({ children }: { children: React.ReactNode }) {
    return <>{children}</>;
}
