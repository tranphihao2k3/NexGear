import { Metadata } from 'next';
import CommunityClient from './CommunityClient';

export const metadata: Metadata = {
    title: 'Thanh Ly Cong Dong — NexGear',
    description: 'Mua ban thanh ly gaming gear da qua su dung. Ket noi cong dong game thu, tim kiem gear gia tot.',
    openGraph: {
        title: 'Thanh Ly Cong Dong — NexGear',
        description: 'San thanh ly gaming gear cong dong NexGear. Tim mua ban phim, chuot, tai nghe da qua su dung.',
        url: 'https://nexgear.vn/community',
    },
};

export default function CommunityPage() {
    return <CommunityClient />;
}
