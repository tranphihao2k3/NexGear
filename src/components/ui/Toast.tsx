// ============================================================
// LTV — Toast Component
// File: components/ui/Toast.tsx
// Dùng: import { useToast } from '@/components/ui/Toast'
// ============================================================
'use client'
import { createContext, useContext, useState, useCallback, useId } from 'react'
import styles from './Toast.module.scss'

type ToastType = 'info' | 'success' | 'warning' | 'error'

interface Toast {
    id: string
    type: ToastType
    title?: string
    message: string
}

interface ToastContextValue {
    toast: (opts: Omit<Toast, 'id'>) => void
    info: (message: string, title?: string) => void
    success: (message: string, title?: string) => void
    warning: (message: string, title?: string) => void
    error: (message: string, title?: string) => void
}

const ToastContext = createContext<ToastContextValue | null>(null)

const ICONS: Record<ToastType, string> = {
    info: 'ℹ️',
    success: '✅',
    warning: '⚠️',
    error: '❌',
}

const DURATION = 3500 // ms

export function ToastProvider({ children }: { children: React.ReactNode }) {
    const [toasts, setToasts] = useState<Toast[]>([])

    const remove = useCallback((id: string) => {
        setToasts(prev => prev.filter(t => t.id !== id))
    }, [])

    const add = useCallback((opts: Omit<Toast, 'id'>) => {
        const id = Math.random().toString(36).slice(2)
        setToasts(prev => [...prev.slice(-2), { ...opts, id }]) // max 3 toasts
        setTimeout(() => remove(id), DURATION)
    }, [remove])

    const value: ToastContextValue = {
        toast: add,
        info: (m, t) => add({ type: 'info', message: m, title: t }),
        success: (m, t) => add({ type: 'success', message: m, title: t }),
        warning: (m, t) => add({ type: 'warning', message: m, title: t }),
        error: (m, t) => add({ type: 'error', message: m, title: t }),
    }

    return (
        <ToastContext.Provider value={value}>
            {children}
            <div className={styles.container} aria-live="polite" aria-atomic="false">
                {toasts.map(toast => (
                    <div key={toast.id} className={`${styles.toast} ${styles[`toast--${toast.type}`]}`}>
                        <span className={styles.icon}>{ICONS[toast.type]}</span>
                        <div className={styles.content}>
                            {toast.title && <div className={styles.title}>{toast.title}</div>}
                            <div className={styles.message}>{toast.message}</div>
                        </div>
                        <button
                            className={styles.close}
                            onClick={() => remove(toast.id)}
                            aria-label="Đóng"
                        >
                            ✕
                        </button>
                        <div className={styles.progress} style={{ animationDuration: `${DURATION}ms` }} />
                    </div>
                ))}
            </div>
        </ToastContext.Provider>
    )
}

export function useToast(): ToastContextValue {
    const ctx = useContext(ToastContext)
    if (!ctx) throw new Error('useToast phải dùng bên trong <ToastProvider>')
    return ctx
}