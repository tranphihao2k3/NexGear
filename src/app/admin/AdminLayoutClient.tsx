'use client'

import { useRef, createContext, useContext, useState, ReactNode } from 'react'
import { AdminThemeProvider } from '@/contexts/AdminThemeContext'
import AdminSidebar from '@/components/admin/AdminSidebar'
import AdminPusherListener from '@/components/admin/AdminPusherListener'
import styles from './layout.module.scss'

interface SidebarContextType {
    collapsed: boolean
    setCollapsed: (collapsed: boolean) => void
}

const SidebarContext = createContext<SidebarContextType | undefined>(undefined)

export const useSidebar = () => {
    const context = useContext(SidebarContext)
    if (!context) {
        throw new Error('useSidebar must be used within AdminLayoutClient')
    }
    return context
}

export default function AdminLayoutClient({
    children,
}: {
    children: React.ReactNode
}) {
    const layoutRef = useRef<HTMLDivElement>(null)
    const [collapsed, setCollapsed] = useState(false)

    return (
        <SidebarContext.Provider value={{ collapsed, setCollapsed }}>
            <AdminThemeProvider layoutRef={layoutRef}>
                <div className={styles.adminLayout} ref={layoutRef}>
                    <AdminSidebar />
                    <div className={`${styles.mainContent} ${collapsed ? styles.mainContentCollapsed : ''}`}>
                        <AdminPusherListener />
                        <div className={styles.pageContent}>
                            {children}
                        </div>
                    </div>
                </div>
            </AdminThemeProvider>
        </SidebarContext.Provider>
    )
}
