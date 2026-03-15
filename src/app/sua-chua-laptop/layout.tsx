import { Metadata } from 'next';

export const metadata: Metadata = {
    title: 'Sửa Chữa Laptop & Vệ Sinh PC Uy Tín',
    description: 'Dịch vụ sửa chữa laptop, máy tính bản, vệ sinh PC uy tín tại Cần Thơ. Bắt bệnh chuẩn xác, linh kiện chính hãng, bảo hành dài hạn.',
    keywords: [
        'sửa chữa laptop Cần Thơ',
        'sửa máy tính Cần Thơ',
        'vệ sinh laptop',
        'vệ sinh PC trọn gói',
        'cài win Cần Thơ',
        'thay màn hình laptop',
        'thay pin laptop Cần Thơ'
    ],
    openGraph: {
        title: 'Sửa Chữa Laptop & Vệ Sinh PC Uy Tín — NexGear',
        description: 'Trung tâm sửa chữa laptop Cần Thơ chuyên nghiệp. Kỹ thuật viên 10 năm kinh nghiệm xử lý moi vấn đề phần cứng, phần mềm.',
        url: 'https://nexgzone.top/sua-chua-laptop',
    },
};

export default function RepairLayout({ children }: { children: React.ReactNode }) {
    return <>{children}</>;
}
