'use client';

import { useState, useEffect, useCallback } from 'react';
import styles from './ScrollButtons.module.scss';

export default function ScrollButtons() {
    const [showTop, setShowTop] = useState(false);
    const [showBottom, setShowBottom] = useState(true);

    const update = useCallback(() => {
        const scrollY = window.scrollY;
        const windowH = window.innerHeight;
        const docH = document.documentElement.scrollHeight;

        setShowTop(scrollY > 400);
        setShowBottom(scrollY + windowH < docH - 200);
    }, []);

    useEffect(() => {
        update();
        window.addEventListener('scroll', update, { passive: true });
        return () => window.removeEventListener('scroll', update);
    }, [update]);

    const scrollToTop = () => window.scrollTo({ top: 0, behavior: 'smooth' });
    const scrollToBottom = () => window.scrollTo({ top: document.documentElement.scrollHeight, behavior: 'smooth' });

    return (
        <div className={styles.wrap}>
            {showTop && (
                <button className={styles.btn} onClick={scrollToTop} aria-label="Lên đầu trang">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                        <polyline points="18 15 12 9 6 15" />
                    </svg>
                </button>
            )}
            {showBottom && (
                <button className={styles.btn} onClick={scrollToBottom} aria-label="Xuống cuối trang">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                        <polyline points="6 9 12 15 18 9" />
                    </svg>
                </button>
            )}
        </div>
    );
}
