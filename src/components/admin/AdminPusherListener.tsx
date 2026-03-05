"use client";

import { useEffect } from 'react';
import { useToast } from '@/components/ui';
import { pusherClient } from '@/lib/pusher-client';

function playTingSound() {
    try {
        const AudioContext = window.AudioContext || (window as any).webkitAudioContext;
        if (!AudioContext) return;
        const ctx = new AudioContext();

        // Oscillator 1: High pitch
        const osc1 = ctx.createOscillator();
        osc1.type = 'sine';
        osc1.frequency.setValueAtTime(800, ctx.currentTime);
        osc1.frequency.exponentialRampToValueAtTime(1200, ctx.currentTime + 0.1);

        // Oscillator 2: Slightly detuned to make it sound like a bell
        const osc2 = ctx.createOscillator();
        osc2.type = 'triangle';
        osc2.frequency.setValueAtTime(804, ctx.currentTime);
        osc2.frequency.exponentialRampToValueAtTime(1204, ctx.currentTime + 0.1);

        const gainNode = ctx.createGain();
        gainNode.gain.setValueAtTime(0, ctx.currentTime);
        gainNode.gain.linearRampToValueAtTime(0.5, ctx.currentTime + 0.05);
        gainNode.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.8);

        osc1.connect(gainNode);
        osc2.connect(gainNode);
        gainNode.connect(ctx.destination);

        osc1.start();
        osc2.start();
        osc1.stop(ctx.currentTime + 0.8);
        osc2.stop(ctx.currentTime + 0.8);
    } catch (e) {
        // Trình duyệt chặn autoplay khi chưa có tương tác -> bỏ qua
        console.warn('Audio play restricted');
    }
}

export default function AdminPusherListener() {
    const { success } = useToast();

    useEffect(() => {
        if (!pusherClient) return;

        const channel = pusherClient.subscribe('admin-channel');

        channel.bind('new-order', (data: { orderCode: string, total: number, customerName: string }) => {
            const formattedTotal = new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(data.total);
            const msg = `⚡ Đơn mới ${data.orderCode} từ ${data.customerName || 'khách vãng lai'} trị giá ${formattedTotal}!`;

            playTingSound(); // Phát ra tiếng ting "thần thánh"

            // Hiện Toast góc màn hình
            success(msg);
        });

        return () => {
            if (pusherClient) {
                pusherClient.unsubscribe('admin-channel');
            }
        };
    }, [success]);

    return null; // Không cần render bất cứ giao diện gì
}
