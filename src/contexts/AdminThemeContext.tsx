'use client'

import { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react'

type Theme = 'light' | 'dark'

interface AdminThemeContextType {
    theme: Theme
    toggleTheme: () => void
}

const AdminThemeContext = createContext<AdminThemeContextType>({
    theme: 'dark',
    toggleTheme: () => {},
})

export function AdminThemeProvider({
    children,
    layoutRef,
}: {
    children: React.ReactNode
    layoutRef: React.RefObject<HTMLDivElement | null>
}) {
    const [theme, setTheme] = useState<Theme>('dark')
    const [mounted, setMounted] = useState(false)

    useEffect(() => {
        const stored = localStorage.getItem('nexgear_admin_theme') as Theme | null
        if (stored === 'dark' || stored === 'light') {
            setTheme(stored)
        }
        setMounted(true)
    }, [])

    useEffect(() => {
        if (!mounted) return
        layoutRef.current?.setAttribute('data-admin-theme', theme)
        // Also set on documentElement so :root-level vars get overridden for admin
        document.documentElement.setAttribute('data-admin-theme', theme)
        localStorage.setItem('nexgear_admin_theme', theme)
        return () => {
            document.documentElement.removeAttribute('data-admin-theme')
        }
    }, [theme, mounted, layoutRef])

    const toggleTheme = useCallback(() => {
        setTheme(prev => (prev === 'dark' ? 'light' : 'dark'))
    }, [])

    return (
        <AdminThemeContext.Provider value={{ theme, toggleTheme }}>
            {children}
        </AdminThemeContext.Provider>
    )
}

export const useAdminTheme = () => useContext(AdminThemeContext)
