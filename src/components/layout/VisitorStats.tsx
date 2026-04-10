'use client';

import { useState, useEffect, useRef } from 'react';
import PusherClient from 'pusher-js';
import styles from './Footer.module.scss';

const FB_FOLLOWERS = '3,9K';

export default function VisitorStats() {
    const [onlineCount, setOnlineCount] = useState(0);
    const [totalVisits, setTotalVisits] = useState(0);
    const pusherRef = useRef<PusherClient | null>(null);

    useEffect(() => {
        const tracked = sessionStorage.getItem('_v_tracked');
        if (!tracked) {
            sessionStorage.setItem('_v_tracked', '1');
            fetch('/api/visitors', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ label: 'total_visitors' }),
            })
                .then(r => r.json())
                .then(d => { if (d.success) setTotalVisits(d.data.count); })
                .catch(() => {});
        } else {
            fetch('/api/visitors?label=total_visitors')
                .then(r => r.json())
                .then(d => { if (d.success) setTotalVisits(d.data.count || 0); })
                .catch(() => {});
        }

        const key = process.env.NEXT_PUBLIC_PUSHER_KEY;
        const cluster = process.env.NEXT_PUBLIC_PUSHER_CLUSTER || 'ap1';
        if (!key) return;

        const pusher = new PusherClient(key, {
            cluster,
            channelAuthorization: {
                endpoint: '/api/pusher/auth',
                transport: 'ajax',
            },
        });
        pusherRef.current = pusher;

        const channel = pusher.subscribe('presence-visitors');

        channel.bind('pusher:subscription_succeeded', (members: any) => {
            setOnlineCount(members.count);
        });
        channel.bind('pusher:member_added', () => {
            setOnlineCount(prev => prev + 1);
        });
        channel.bind('pusher:member_removed', () => {
            setOnlineCount(prev => Math.max(0, prev - 1));
        });

        return () => {
            channel.unbind_all();
            pusher.unsubscribe('presence-visitors');
            pusher.disconnect();
            pusherRef.current = null;
        };
    }, []);

    return (
        <div className={styles.visitorStats}>
            <div className={styles.statCard}>
                <span className={styles.statDot} />
                <span className={styles.statNumber}>{onlineCount}</span>
                <span className={styles.statText}>đang online</span>
            </div>
            <div className={styles.statCard}>
                <svg className={styles.statSvg} width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
                <span className={styles.statNumber}>{totalVisits.toLocaleString('vi-VN')}</span>
                <span className={styles.statText}>lượt truy cập</span>
            </div>
            <div className={styles.statCard}>
                <svg className={styles.statSvg} width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z"/></svg>
                <span className={styles.statNumber}>{FB_FOLLOWERS}</span>
                <span className={styles.statText}>followers</span>
            </div>
        </div>
    );
}
