// ============================================================
// NEXGEAR — Input Component
// File: components/ui/Input.tsx
// ============================================================
import { forwardRef, InputHTMLAttributes } from 'react'
import styles from './Input.module.scss'

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
    label?: string
    hint?: string
    error?: string
    success?: string
    leftIcon?: React.ReactNode
    rightIcon?: React.ReactNode
    required?: boolean
}

const Input = forwardRef<HTMLInputElement, InputProps>(
    ({ label, hint, error, success, leftIcon, rightIcon, required, className = '', id, ...rest }, ref) => {
        const inputId = id ?? label?.toLowerCase().replace(/\s+/g, '-')
        const state = error ? 'error' : success ? 'success' : ''

        return (
            <div className={styles.fieldGroup}>
                {label && (
                    <label htmlFor={inputId} className={styles.label}>
                        {label}
                        {required && <span className={styles.required} aria-label="bắt buộc"> *</span>}
                    </label>
                )}

                <div className={styles.inputWrap}>
                    {leftIcon && <span className={`${styles.icon} ${styles['icon--left']}`}>{leftIcon}</span>}
                    <input
                        id={inputId}
                        ref={ref}
                        className={[
                            styles.input,
                            state && styles[`input--${state}`],
                            leftIcon && styles['input--has-left'],
                            rightIcon && styles['input--has-right'],
                            className,
                        ].filter(Boolean).join(' ')}
                        aria-invalid={!!error}
                        aria-describedby={
                            error ? `${inputId}-error`
                                : hint ? `${inputId}-hint`
                                    : undefined
                        }
                        {...rest}
                    />
                    {rightIcon && <span className={`${styles.icon} ${styles['icon--right']}`}>{rightIcon}</span>}
                </div>

                {hint && !error && !success && (
                    <span id={`${inputId}-hint`} className={styles.hint}>{hint}</span>
                )}
                {error && (
                    <span id={`${inputId}-error`} className={styles.errorMsg} role="alert">❌ {error}</span>
                )}
                {success && !error && (
                    <span className={styles.successMsg}>✅ {success}</span>
                )}
            </div>
        )
    }
)

Input.displayName = 'Input'
export default Input