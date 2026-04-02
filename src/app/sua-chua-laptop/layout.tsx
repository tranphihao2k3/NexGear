import { Metadata } from 'next';
import { getSiteSettings } from '@/lib/site-config';

export async function generateMetadata(): Promise<Metadata> {
    const s = await getSiteSettings();
    return {
        title: 'Sửa Chữa Laptop & Vệ Sinh PC Uy Tín',
        description: `Dịch vụ sửa chữa laptop, máy tính bản, vệ sinh PC uy tín tại ${s.storeAddress}. Bắt bệnh chuẩn xác, linh kiện chính hãng, bảo hành dài hạn.`,
        keywords: [
            `sửa chữa laptop ${s.storeAddress}`,
            `sửa máy tính ${s.storeAddress}`,
            'vệ sinh laptop',
            'vệ sinh PC trọn gói',
            `cài win ${s.storeAddress}`,
            'thay màn hình laptop',
            `thay pin laptop ${s.storeAddress}`
        ],
        openGraph: {
            title: `Sửa Chữa Laptop & Vệ Sinh PC Uy Tín — ${s.storeName}`,
            description: `Trung tâm sửa chữa laptop ${s.storeAddress} chuyên nghiệp. Kỹ thuật viên 10 năm kinh nghiệm xử lý mọi vấn đề phần cứng, phần mềm.`,
            url: `${s.siteDomain}/sua-chua-laptop`,
        },
    };
}

export default function RepairLayout({ children }: { children: React.ReactNode }) {
    return <>{children}</>;
}
