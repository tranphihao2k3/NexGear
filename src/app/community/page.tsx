import { Metadata } from 'next';
import { getSiteSettings } from '@/lib/site-config';
import CommunityClient from './CommunityClient';

export async function generateMetadata(): Promise<Metadata> {
    const s = await getSiteSettings();
    return {
        title: `Thanh Ly Cong Dong — ${s.storeName}`,
        description: 'Mua ban thanh ly gaming gear da qua su dung. Ket noi cong dong game thu, tim kiem gear gia tot.',
        openGraph: {
            title: `Thanh Ly Cong Dong — ${s.storeName}`,
            description: `San thanh ly gaming gear cong dong ${s.storeName}. Tim mua ban phim, chuot, tai nghe da qua su dung.`,
            url: `${s.siteDomain}/community`,
        },
    };
}

export default function CommunityPage() {
    return <CommunityClient />;
}
