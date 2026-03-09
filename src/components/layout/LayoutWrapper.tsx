// ============================================================
// NEXGEAR — Layout Wrapper (conditionally hide Navbar/Footer)
// File: components/layout/LayoutWrapper.tsx
// ============================================================
'use client'

import { usePathname } from 'next/navigation'
import Navbar from '@/components/layout/Navbar'
import Footer from '@/components/layout/Footer'
import { CartProvider, useCart } from '@/contexts/CartContext'
import { ThemeProvider } from '@/contexts/ThemeContext'
import styles from './LayoutWrapper.module.scss'

function InnerLayout({ children }: { children: React.ReactNode }) {
    const { totalItems } = useCart()
    return (
        <div className={styles.clientWrapper}>
            <div className={styles.scanline} aria-hidden />
            <div className={styles.clientContent}>
                <Navbar cartCount={totalItems} />
                <main style={{ minHeight: '80vh' }}>
                    {children}
                </main>
                <Footer />
            </div>
        </div>
    )
}

export default function LayoutWrapper({ children }: { children: React.ReactNode }) {
    const pathname = usePathname()
    const isAdmin = pathname.startsWith('/admin')

    if (isAdmin) {
        return <CartProvider>{children}</CartProvider>
    }

    return (
        <ThemeProvider>
            <CartProvider>
                <InnerLayout>{children}</InnerLayout>
            </CartProvider>
        </ThemeProvider>
    )
}
