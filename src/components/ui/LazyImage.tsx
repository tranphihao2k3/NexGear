'use client';

import { useState, useRef, useEffect, CSSProperties } from 'react';
import styles from './LazyImage.module.scss';

interface LazyImageProps {
    src: string;
    alt: string;
    fill?: boolean;
    width?: number | string;
    height?: number | string;
    sizes?: string;
    className?: string;
    style?: CSSProperties;
    objectFit?: 'cover' | 'contain' | 'fill';
    borderRadius?: number;
    onClick?: () => void;
    onLoad?: () => void;
    unoptimized?: boolean;
}

export default function LazyImage({
    src,
    alt,
    fill,
    width,
    height,
    className = '',
    style,
    objectFit = 'cover',
    borderRadius,
    onClick,
    onLoad,
    unoptimized,
}: LazyImageProps) {
    const [loaded, setLoaded] = useState(false);
    const [error, setError] = useState(false);
    const [inView, setInView] = useState(false);
    const ref = useRef<HTMLDivElement>(null);

    // IntersectionObserver for true lazy loading
    useEffect(() => {
        const el = ref.current;
        if (!el) return;
        const observer = new IntersectionObserver(
            ([entry]) => {
                if (entry.isIntersecting) {
                    setInView(true);
                    observer.disconnect();
                }
            },
            { rootMargin: '200px' }
        );
        observer.observe(el);
        return () => observer.disconnect();
    }, []);

    const wrapStyle: CSSProperties = {
        ...style,
        borderRadius,
        ...(fill
            ? { position: 'absolute', inset: 0, width: '100%', height: '100%' }
            : { width, height }),
    };

    return (
        <div
            ref={ref}
            className={`${styles.wrapper} ${className}`}
            style={wrapStyle}
            onClick={onClick}
        >
            {/* Shimmer placeholder — visible until image loads */}
            {!loaded && !error && (
                <div className={styles.shimmer} aria-hidden="true" />
            )}

            {/* Actual image — only start loading when in viewport */}
            {inView && !error && (
                <img
                    src={src}
                    alt={alt}
                    loading="lazy"
                    decoding="async"
                    className={`${styles.img} ${loaded ? styles.imgVisible : styles.imgHidden}`}
                    style={{ objectFit, borderRadius }}
                    onLoad={() => {
                        setLoaded(true);
                        onLoad?.();
                    }}
                    onError={() => setError(true)}
                />
            )}

            {/* Error fallback */}
            {error && (
                <div className={styles.fallback} aria-label="Image failed to load">
                    <span>📷</span>
                </div>
            )}
        </div>
    );
}
