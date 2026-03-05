// ============================================================
// NEXGEAR — Badge Component
// File: components/ui/Badge.tsx
// ============================================================
import styles from './Badge.module.scss'

type BadgeVariant = 'cyan' | 'magenta' | 'gold' | 'green' | 'red' | 'gray' | 'ink' | 'purple'

interface BadgeProps {
  variant?: BadgeVariant
  children: React.ReactNode
  className?: string
}

export default function Badge({ variant = 'gray', children, className = '' }: BadgeProps) {
  return (
    <span className={`${styles.badge} ${styles[`badge--${variant}`]} ${className}`}>
      {children}
    </span>
  )
}

// ── STATUS BADGES (preset) ───────────────────────────────────
export function OrderStatusBadge({ status }: { status: string }) {
  const map: Record<string, { label: string; variant: BadgeVariant }> = {
    pending:    { label: '⏳ Chờ xác nhận', variant: 'gold' },
    confirmed:  { label: '✅ Đã xác nhận',  variant: 'cyan' },
    packing:    { label: '📦 Đang đóng gói',variant: 'cyan' },
    shipped:    { label: '🚚 Đang giao',    variant: 'purple' },
    delivered:  { label: '✅ Đã giao',      variant: 'green' },
    cancelled:  { label: '❌ Đã hủy',       variant: 'red' },
    refunded:   { label: '↩ Đã hoàn tiền', variant: 'gray' },
  }
  const cfg = map[status] ?? { label: status, variant: 'gray' as BadgeVariant }
  return <Badge variant={cfg.variant}>{cfg.label}</Badge>
}

export function StockBadge({ stock }: { stock: number }) {
  if (stock === 0) return <Badge variant="red">HẾT HÀNG</Badge>
  if (stock <= 5)  return <Badge variant="gold">⚠ Còn {stock}</Badge>
  return <Badge variant="green">CÒN HÀNG</Badge>
}