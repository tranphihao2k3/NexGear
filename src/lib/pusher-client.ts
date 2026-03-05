import PusherClient from 'pusher-js';

// Khởi tạo mềm - chỉ khởi tạo nếu có key để tránh lỗi init
export const pusherClient = typeof window !== 'undefined' && process.env.NEXT_PUBLIC_PUSHER_KEY
    ? new PusherClient(process.env.NEXT_PUBLIC_PUSHER_KEY, {
        cluster: process.env.NEXT_PUBLIC_PUSHER_CLUSTER || 'ap1',
    })
    : null;
