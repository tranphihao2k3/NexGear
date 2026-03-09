'use client'

import { useRef, createContext, useContext, useState, ReactNode } from 'react'
import { AdminThemeProvider, useAdminTheme } from '@/contexts/AdminThemeContext'
import AdminSidebar from '@/components/admin/AdminSidebar'
import AdminPusherListener from '@/components/admin/AdminPusherListener'
import { Menu, Sun, Moon, Bell } from 'lucide-react'
import styles from './layout.module.scss'

interface SidebarContextType {
    collapsed: boolean
    setCollapsed: React.Dispatch<React.SetStateAction<boolean>>
    menuOpen: boolean
    setMenuOpen: React.Dispatch<React.SetStateAction<boolean>>
}

const SidebarContext = createContext<SidebarContextType | undefined>(undefined)

export const useSidebar = () => {
    const context = useContext(SidebarContext)
    if (!context) {
        throw new Error('useSidebar must be used within AdminLayoutClient')
    }
    return context
}

function AdminHeader() {
    const { menuOpen, setMenuOpen } = useSidebar()
    const { theme, toggleTheme } = useAdminTheme()

    return (
        <header className={styles.topBar}>
            <div className={styles.topBarLeft}>
                <button
                    className={styles.topBarBtn}
                    onClick={() => setMenuOpen(!menuOpen)}
                    aria-label="Toggle menu (Ctrl+M)"
                    title="Mở menu (Ctrl+M)"
                >
                    <Menu className="w-5 h-5" />
                </button>
                <span className={styles.logoText}>
                    NEX<span className={styles.logoAccent}>GEAR</span>
                </span>
            </div>
            <div className={styles.topBarRight}>
                <button className={styles.topBarBtn} onClick={toggleTheme} title="Đổi theme">
                    {theme === 'dark' ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
                </button>
                <button className={styles.topBarBtn} title="Thông báo">
                    <Bell className="w-4 h-4" />
                    <span className={styles.notifDot} />
                </button>
            </div>
        </header>
    )
}

export default function AdminLayoutClient({
    children,
}: {
    children: React.ReactNode
}) {
    const layoutRef = useRef<HTMLDivElement>(null)
    const [collapsed, setCollapsed] = useState(false)
    const [menuOpen, setMenuOpen] = useState(false)

    return (
        <SidebarContext.Provider value={{ collapsed, setCollapsed, menuOpen, setMenuOpen }}>
            <AdminThemeProvider layoutRef={layoutRef}>
                <div className={styles.adminLayout} ref={layoutRef}>
                    <AdminSidebar />
                    <div className={styles.mainContent}>
                        <AdminHeader />
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
