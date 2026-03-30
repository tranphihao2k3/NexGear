import { Metadata } from 'next';
import { getSiteSettings } from '@/lib/site-config';

export async function generateMetadata(): Promise<Metadata> {
    const s = await getSiteSettings();
    return {
        title: 'Công Cụ Test Laptop & PC Online Miễn Phí',
        description: 'Bộ công cụ kiểm tra sức khỏe laptop, PC toàn diện: test bàn phím, test mic, test webcam, test loa, test màn hình điểm chết. Miễn phí 100%.',
        keywords: [
            'test laptop',
            'kiểm tra laptop',
            'keyboard test',
            'test bàn phím online',
            'mic test',
            'webcam test',
            'kiểm tra điểm chết màn hình',
            'test loa laptop'
        ],
        openGraph: {
            title: `Công Cụ Test Laptop & PC Online Miễn Phí — ${s.storeName}`,
            description: `Kiểm tra toàn diện chức năng máy tính trước khi mua bán. Dễ dàng test bàn phím, camera, loa, mic, màn hình tại ${s.storeName}.`,
            url: `${s.siteDomain}/test-laptop`,
        },
    };
}

export default function TestLaptopLayout({ children }: { children: React.ReactNode }) {
    return <>{children}</>;
}
