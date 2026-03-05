// ============================================================
// NEXGEAR — Button Component
// File: components/ui/Button.tsx
// ============================================================

import { forwardRef, ButtonHTMLAttributes, AnchorHTMLAttributes } from 'react'
import Link from 'next/link'
import styles from './Button.module.scss'

type ButtonVariant = 'primary' | 'cyan' | 'outline' | 'outline-cyan' | 'ghost' | 'danger'
type ButtonSize = 'sm' | 'md' | 'lg' | 'xl'

interface BaseProps {
    variant?: ButtonVariant
    size?: ButtonSize
    loading?: boolean
    fullWidth?: boolean
    leftIcon?: React.ReactNode
    rightIcon?: React.ReactNode
    className?: string
    children: React.ReactNode
}

// Button hoặc Link
type AsButton = BaseProps & ButtonHTMLAttributes<HTMLButtonElement> & { href?: undefined }
type AsLink = BaseProps & AnchorHTMLAttributes<HTMLAnchorElement> & { href: string }
type ButtonProps = AsButton | AsLink

const Button = forwardRef<HTMLButtonElement | HTMLAnchorElement, ButtonProps>(
    (
        {
            variant = 'primary',
            size = 'md',
            loading = false,
            fullWidth = false,
            leftIcon,
            rightIcon,
            className = '',
            children,
            href,
            ...rest
        },
        ref
    ) => {
        const classes = [
            styles.btn,
            styles[`btn--${variant}`],
            styles[`btn--${size}`],
            fullWidth ? styles['btn--full'] : '',
            loading ? styles['btn--loading'] : '',
            className,
        ].filter(Boolean).join(' ')

        const content = (
            <>
                {loading && <span className={styles.spinner} aria-hidden />}
                {!loading && leftIcon && <span className={styles.icon}>{leftIcon}</span>}
                <span>{children}</span>
                {!loading && rightIcon && <span className={styles.icon}>{rightIcon}</span>}
            </>
        )

        // Render as Next.js Link nếu có href
        if (href) {
            return (
                <Link
                    href={href}
                    className={classes}
                    ref={ref as React.Ref<HTMLAnchorElement>}
                    {...(rest as AnchorHTMLAttributes<HTMLAnchorElement>)}
                >
                    {content}
                </Link>
            )
        }

        return (
            <button
                className={classes}
                disabled={loading || (rest as ButtonHTMLAttributes<HTMLButtonElement>).disabled}
                ref={ref as React.Ref<HTMLButtonElement>}
                {...(rest as ButtonHTMLAttributes<HTMLButtonElement>)}
            >
                {content}
            </button>
        )
    }
)

Button.displayName = 'Button'
export default Button