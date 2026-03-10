// ============================================================
// NEXGEAR — Admin POS Page — Professional Edition
// Layout: Left = compact product list | Right = cart + checkout
// ============================================================
'use client'

import { useState, useEffect, useCallback, useRef, useLayoutEffect } from 'react'
import Image from 'next/image'
import styles from './page.module.scss'
import { CyberpunkLoader } from '@/components/ui'

// ─── Types ────────────────────────────────────────────────────
interface Product {
    _id: string
    name: string
    sku: string
    basePrice: number
    salePrice?: number
    stock: number
    images: string[]
    category?: { _id: string; name: string }
    isActive: boolean
}

interface Customer {
    _id: string
    name: string
    email: string
    phone?: string
}

interface CartItem {
    product: Product
    qty: number
    itemDiscount: number
    note: string
}

interface ParkedOrder {
    id: string
    label: string
    cart: CartItem[]
    customer: Customer | null
    custName: string
    custPhone: string
    discountType: 'percent' | 'fixed'
    discountValue: number
    couponCode: string
    orderNote: string
    payment: string
    parkedAt: Date
}

interface CouponResult {
    _id: string
    code: string
    type: 'percent' | 'fixed' | 'shipping'
    value: number
    maxDiscount: number | null
    minOrderValue: number
}

// ─── Helpers ──────────────────────────────────────────────────
function formatVND(amount: number) {
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(amount)
}
function genParkedId() {
    return `PARK-${Date.now().toString(36).toUpperCase()}`
}

// ─── Component ────────────────────────────────────────────────
export default function AdminPOSPage() {
    // Data
    const [products, setProducts] = useState<Product[]>([])
    const [categories, setCategories] = useState<{ _id: string; name: string }[]>([])
    const [loading, setLoading] = useState(true)

    // Filter
    const [search, setSearch] = useState('')
    const [category, setCategory] = useState('all')
    const searchRef = useRef<HTMLInputElement>(null)

    // Resizable panels
    const [rightWidth, setRightWidth] = useState(() => {
        if (typeof window !== 'undefined') {
            const saved = localStorage.getItem('pos-right-width')
            if (saved) return parseInt(saved, 10)
        }
        return 400
    })
    const layoutRef = useRef<HTMLDivElement>(null)
    const dragging = useRef(false)

    const onResizeStart = useCallback((e: React.MouseEvent) => {
        e.preventDefault()
        dragging.current = true
        document.body.style.cursor = 'col-resize'
        document.body.style.userSelect = 'none'

        const onMove = (ev: MouseEvent) => {
            if (!dragging.current || !layoutRef.current) return
            const rect = layoutRef.current.getBoundingClientRect()
            const newRight = Math.max(320, Math.min(rect.right - ev.clientX, rect.width - 320))
            setRightWidth(newRight)
        }
        const onUp = () => {
            dragging.current = false
            document.body.style.cursor = ''
            document.body.style.userSelect = ''
            document.removeEventListener('mousemove', onMove)
            document.removeEventListener('mouseup', onUp)
            setRightWidth(w => { localStorage.setItem('pos-right-width', String(w)); return w })
        }
        document.addEventListener('mousemove', onMove)
        document.addEventListener('mouseup', onUp)
    }, [])

    // Cart
    const [cart, setCart] = useState<CartItem[]>([])
    const [editItemDiscount, setEditItemDiscount] = useState<string | null>(null)
    const [editQtyId, setEditQtyId] = useState<string | null>(null)
    const [editQtyVal, setEditQtyVal] = useState('')

    // Customer
    const [custSearch, setCustSearch] = useState('')
    const [custResults, setCustResults] = useState<Customer[]>([])
    const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null)
    const [custName, setCustName] = useState('')
    const [custPhone, setCustPhone] = useState('')
    const [custDropOpen, setCustDropOpen] = useState(false)
    const custRef = useRef<HTMLDivElement>(null)

    // Discount
    const [discountType, setDiscountType] = useState<'percent' | 'fixed'>('percent')
    const [discountValue, setDiscountValue] = useState('')
    const [couponCode, setCouponCode] = useState('')
    const [appliedCoupon, setAppliedCoupon] = useState<CouponResult | null>(null)
    const [couponError, setCouponError] = useState('')
    const [couponLoading, setCouponLoading] = useState(false)

    // Collapsible panels
    const [showDiscount, setShowDiscount] = useState(false)
    const [showNote, setShowNote] = useState(false)
    const [showCustForm, setShowCustForm] = useState(false)

    // Mobile view toggle
    const [mobileView, setMobileView] = useState<'products' | 'cart'>('products')

    // Order
    const [orderNote, setOrderNote] = useState('')
    const [payment, setPayment] = useState('cash')
    const [cashInput, setCashInput] = useState('')

    // Park
    const [parkedOrders, setParkedOrders] = useState<ParkedOrder[]>([])
    const [parkLabel, setParkLabel] = useState('')

    // UI
    const [checkingOut, setCheckingOut] = useState(false)
    const [activePanel, setActivePanel] = useState<'cart' | 'parked'>('cart')

    // Receipt modal
    const [receiptOrder, setReceiptOrder] = useState<null | {
        orderCode: string
        items: CartItem[]
        grandTotal: number
        discount: number
        coupon: CouponResult | null
        payment: string
        cashAmount: number
        change: number
        customer: string
        phone: string
    }>(null)
    const receiptRef = useRef<HTMLDivElement>(null)

    // ── Fetch data
    const fetchData = useCallback(async () => {
        setLoading(true)
        try {
            const [prodRes, catRes] = await Promise.all([
                fetch('/api/products?limit=200&admin=true'),
                fetch('/api/categories?limit=50'),
            ])
            const prodJson = await prodRes.json()
            const catJson = await catRes.json()
            if (prodJson.success) setProducts(prodJson.data.filter((p: Product) => p.isActive))
            if (catJson.success) setCategories(catJson.data)
        } catch (err) {
            console.error('POS fetch error:', err)
        } finally {
            setLoading(false)
        }
    }, [])

    useEffect(() => { fetchData() }, [fetchData])

    // ── Customer search debounce
    useEffect(() => {
        if (custSearch.length < 2) { setCustResults([]); return }
        const t = setTimeout(async () => {
            try {
                const res = await fetch(`/api/users?search=${encodeURIComponent(custSearch)}&limit=8`)
                const json = await res.json()
                if (json.success) setCustResults(json.data)
            } catch { setCustResults([]) }
        }, 350)
        return () => clearTimeout(t)
    }, [custSearch])

    // Close customer dropdown outside click
    useEffect(() => {
        const h = (e: MouseEvent) => {
            if (custRef.current && !custRef.current.contains(e.target as Node)) setCustDropOpen(false)
        }
        document.addEventListener('mousedown', h)
        return () => document.removeEventListener('mousedown', h)
    }, [])

    // ── Keyboard shortcuts
    useEffect(() => {
        const h = (e: KeyboardEvent) => {
            const tag = (document.activeElement as HTMLElement)?.tagName
            if ((e.key === '/' || e.key === 'F2') && tag !== 'INPUT' && tag !== 'TEXTAREA') {
                e.preventDefault(); searchRef.current?.focus()
            }
            if (e.key === 'F1') { e.preventDefault(); setPayment('cash') }
            if (e.key === 'F3') { e.preventDefault(); setPayment('card') }
            if (e.key === 'F4') { e.preventDefault(); setPayment('transfer') }
            if (e.key === 'Escape') { setSearch(''); searchRef.current?.blur() }
        }
        window.addEventListener('keydown', h)
        return () => window.removeEventListener('keydown', h)
    }, [])

    // ── Filtering
    const filtered = products.filter(p => {
        const matchCat = category === 'all' || (typeof p.category === 'object' && p.category?._id === category)
        const q = search.toLowerCase()
        return matchCat && (p.name.toLowerCase().includes(q) || p.sku.toLowerCase().includes(q))
    })

    // ── Cart ops
    const addToCart = (product: Product) => {
        if (product.stock === 0) return
        setCart(prev => {
            const ex = prev.find(i => i.product._id === product._id)
            if (ex) {
                if (ex.qty >= product.stock) return prev
                return prev.map(i => i.product._id === product._id ? { ...i, qty: i.qty + 1 } : i)
            }
            return [...prev, { product, qty: 1, itemDiscount: 0, note: '' }]
        })
    }

    const updateQty = (id: string, delta: number) => {
        setCart(prev =>
            prev.map(i => i.product._id === id ? { ...i, qty: i.qty + delta } : i)
                .filter(i => i.qty > 0)
        )
    }

    const commitQtyEdit = (id: string) => {
        const val = parseInt(editQtyVal, 10)
        if (!isNaN(val) && val > 0) {
            const item = cart.find(i => i.product._id === id)
            const maxQty = item?.product.stock ?? val
            setCart(prev => prev.map(i =>
                i.product._id === id ? { ...i, qty: Math.min(val, maxQty) } : i
            ).filter(i => i.qty > 0))
        }
        setEditQtyId(null); setEditQtyVal('')
    }

    const removeFromCart = (id: string) => setCart(prev => prev.filter(i => i.product._id !== id))
    const setItemDiscount = (id: string, v: number) => setCart(prev => prev.map(i => i.product._id === id ? { ...i, itemDiscount: Math.max(0, v) } : i))
    const setItemNote = (id: string, note: string) => setCart(prev => prev.map(i => i.product._id === id ? { ...i, note } : i))

    // ── Calculations
    const subtotal = cart.reduce((sum, item) => {
        const price = item.product.salePrice || item.product.basePrice
        return sum + Math.max(0, price * item.qty - item.itemDiscount)
    }, 0)
    const computeOrderDiscount = () => {
        const v = parseFloat(discountValue) || 0
        return discountType === 'percent' ? Math.round(subtotal * v / 100) : v
    }
    const computeCouponDiscount = () => {
        if (!appliedCoupon) return 0
        if (appliedCoupon.type === 'percent') {
            const d = Math.round(subtotal * appliedCoupon.value / 100)
            return appliedCoupon.maxDiscount ? Math.min(d, appliedCoupon.maxDiscount) : d
        }
        if (appliedCoupon.type === 'fixed') return Math.min(appliedCoupon.value, subtotal)
        return 0
    }
    const totalDiscount = computeOrderDiscount() + computeCouponDiscount()
    const grandTotal = Math.max(0, subtotal - totalDiscount)
    const cashAmount = parseFloat(cashInput) || 0
    const change = Math.max(0, cashAmount - grandTotal)
    const totalItems = cart.reduce((s, i) => s + i.qty, 0)

    // ── Coupon
    const handleApplyCoupon = async () => {
        if (!couponCode.trim()) return
        setCouponLoading(true); setCouponError('')
        try {
            const res = await fetch(`/api/coupons?code=${couponCode.trim().toUpperCase()}&active=true`)
            const json = await res.json()
            if (json.success && json.data?.length > 0) {
                const cp: CouponResult = json.data[0]
                if (subtotal < cp.minOrderValue) {
                    setCouponError(`Đơn tối thiểu ${formatVND(cp.minOrderValue)}`)
                } else {
                    setAppliedCoupon(cp); setCouponError('')
                }
            } else {
                setCouponError('Mã không hợp lệ hoặc đã hết hạn'); setAppliedCoupon(null)
            }
        } catch { setCouponError('Lỗi kết nối') } finally { setCouponLoading(false) }
    }

    // ── Park
    const handleParkOrder = () => {
        if (cart.length === 0) return
        const label = parkLabel || `Đơn #${parkedOrders.length + 1} — ${new Date().toLocaleTimeString('vi-VN')}`
        setParkedOrders(prev => [...prev, {
            id: genParkedId(), label,
            cart: [...cart], customer: selectedCustomer,
            custName, custPhone, discountType,
            discountValue: parseFloat(discountValue) || 0,
            couponCode, orderNote, payment, parkedAt: new Date(),
        }])
        resetCart(); setParkLabel(''); setActivePanel('parked')
    }

    const handleRestoreParked = (p: ParkedOrder) => {
        setCart(p.cart); setSelectedCustomer(p.customer)
        setCustName(p.custName); setCustPhone(p.custPhone)
        setDiscountType(p.discountType); setDiscountValue(String(p.discountValue || ''))
        setCouponCode(p.couponCode); setOrderNote(p.orderNote); setPayment(p.payment)
        setParkedOrders(prev => prev.filter(x => x.id !== p.id))
        setActivePanel('cart')
    }

    const resetCart = () => {
        setCart([]); setSelectedCustomer(null)
        setCustName(''); setCustPhone(''); setCustSearch('')
        setDiscountValue(''); setCouponCode(''); setAppliedCoupon(null)
        setOrderNote(''); setCashInput(''); setPayment('cash')
    }

    // ── Print receipt (Isolated Window Approach — 100% safe from Admin CSS)
    const handlePrint = () => {
        const content = receiptRef.current?.innerHTML || ''

        // Remove Next.js injected classes to use raw tags & data attributes for styling
        // We do this by mapping the complex receipt DOM into pure print CSS

        const win = window.open('', '_blank', 'width=600,height=800')
        if (!win) return
        win.document.write(`<html><head><title>Hoá đơn NEXGEAR — ${receiptOrder?.orderCode || ''}</title>
        <link href="https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;600;700&family=Orbitron:wght@700;900&family=DM+Sans:wght@400;600&display=swap" rel="stylesheet">
        <style>
            /* Reset & Base */
            * { margin:0; padding:0; box-sizing:border-box; }
            @page { margin: 10mm; }
            body { font-family:'DM Sans',sans-serif; padding:0; color:#111; font-size:11px; max-width:100%; min-width: 400px; max-width: 500px; margin:0 auto; background: #fff; }
            
            /* Hide UI action buttons */
            div[class*="rcActions"], button { display: none !important; }
            
            /* Header */
            header, div[class*="rcHeader"] { display:flex; justify-content:space-between; align-items:flex-start; margin-bottom:16px; }
            div[class*="rcLogo"] { font-family:'Orbitron',sans-serif; font-size:24px; font-weight:900; color:#000; letter-spacing:0.05em; }
            div[class*="rcLogo"] em { color:#000; font-style:normal; } /* Force B&W for some printers, or keep color #00C4AD */
            div[class*="rcSlogan"] { font-family:'JetBrains Mono',monospace; font-size:8px; color:#666; letter-spacing:0.15em; margin-top:2px; }
            div[class*="rcInvoiceLabel"] { font-family:'Orbitron',sans-serif; font-size:12px; font-weight:700; color:#000; letter-spacing:0.1em; border:1px solid #000; padding:4px 8px; border-radius:2px; }
            
            /* Store info */
            div[class*="rcStoreInfo"] { font-size:10px; color:#555; line-height:1.6; margin-bottom:12px; }
            
            /* Dividers */
            div[class*="rcDivider"] { height:1px; background:repeating-linear-gradient(90deg,#ccc 0,#ccc 4px,transparent 4px,transparent 8px); margin:12px 0; border:none; }
            
            /* Order Info Grid */
            div[class*="rcInfoGrid"] { display:grid; grid-template-columns:1fr 1fr 1fr 1fr; gap:8px; margin-bottom:12px; }
            div[class*="rcInfoLabel"] { font-family:'JetBrains Mono',monospace; font-size:8px; color:#888; letter-spacing:0.1em; margin-bottom:2px; display:block; }
            div[class*="rcInfoValue"] { font-family:'JetBrains Mono',monospace; font-size:11px; font-weight:700; color:#000; display:block; }
            
            /* Customer Box */
            div[class*="rcCustomerBox"] { background:#f9f9f9; border:1px solid #ddd; border-radius:4px; padding:8px 12px; margin-bottom: 12px; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
            div[class*="rcCustDetail"] { display:flex; justify-content:space-between; align-items:center; margin-top:4px; }
            div[class*="rcCustName"] { font-weight:700; color:#000; font-size:12px; }
            div[class*="rcCustPhone"] { font-family:'JetBrains Mono',monospace; font-size:10px; color:#555; }
            
            /* Table */
            table { width:100%; border-collapse:collapse; margin:8px 0; }
            thead tr { border-bottom:1.5px solid #000; }
            th { font-family:'JetBrains Mono',monospace; font-size:9px; letter-spacing:0.1em; color:#666; padding:8px 4px; text-align:left; font-weight:700; }
            th:nth-child(1) { width:24px; text-align:center; }
            th:nth-child(3), th:nth-child(4), th:nth-child(5) { text-align:right; }
            td { font-size:11px; padding:8px 4px; border-bottom:1px solid #eee; vertical-align:top; }
            td:nth-child(1) { text-align:center; color:#888; font-family:'JetBrains Mono',monospace; font-size:10px; }
            td:nth-child(2) { font-weight: 500; color: #111; }
            td:nth-child(3) { text-align:right; font-family:'JetBrains Mono',monospace; font-weight:700; color:#111; }
            td:nth-child(4), td:nth-child(5) { text-align:right; font-family:'JetBrains Mono',monospace; }
            td:nth-child(5) { font-weight:700; color:#000; font-size:12px; }
            
            div[class*="rcItemSku"] { font-family:'JetBrains Mono',monospace; font-size:8px; color:#888; margin-top:2px; }
            div[class*="rcItemDiscNote"] { font-size:9px; color:#555; font-style: italic; margin-top:2px; }
            
            /* Summary */
            div[class*="rcSummary"] { margin:8px 0; }
            div[class*="rcSumRow"] { display:flex; justify-content:space-between; padding:4px 0; font-size:11px; color:#444; }
            div[class*="rcSumRow"] span:last-child { font-family:'JetBrains Mono',monospace; font-weight:600; color:#000; }
            div[class*="rcDisc"] { color:#444; }
            
            /* Grand Total */
            div[class*="rcGrandTotal"] { display:flex; justify-content:space-between; align-items:center; padding:12px 0 8px; border-top:2px solid #000; margin-top:4px; font-family:'Orbitron',sans-serif; font-size:14px; font-weight:700; color:#000; }
            div[class*="rcGrandTotal"] span:last-child { font-family:'JetBrains Mono',monospace; font-size:18px; color:#000; }
            
            /* Cash Box */
            div[class*="rcCashBox"] { display:flex; justify-content:space-between; align-items:center; background:#f9f9f9; border:1px solid #ddd; border-radius:4px; padding:8px 12px; margin:8px 0; -webkit-print-color-adjust: exact; print-color-adjust: exact; font-family:'DM Sans',sans-serif; font-size:11px; font-weight:600; color:#444; }
            div[class*="rcChangeVal"] { font-family:'JetBrains Mono',monospace; font-size:14px; font-weight:700; color:#000; }
            
            /* Signature */
            div[class*="rcSignature"] { display:flex; justify-content:space-around; margin:32px 0 16px; gap:24px; }
            div[class*="rcSigBlock"] { text-align:center; flex:1; }
            div[class*="rcSigLabel"] { font-family:'JetBrains Mono',monospace; font-size:9px; color:#666; letter-spacing:0.1em; margin-bottom:40px; }
            div[class*="rcSigLine"] { border-bottom:1px dotted #888; margin-bottom:4px; }
            div[class*="rcSigName"] { font-family:'JetBrains Mono',monospace; font-size:10px; color:#000; font-weight:700; }
            
            /* Stamp */
            div[class*="rcStamp"] { display:flex; justify-content:center; margin:16px 0; page-break-inside: avoid; }
            div[class*="rcStampCircle"] { width:80px; height:80px; border:2px solid #000; border-radius:50%; display:flex; flex-direction:column; align-items:center; justify-content:center; transform:rotate(-15deg); opacity:0.8; }
            div[class*="rcStampText"] { font-family:'Orbitron',sans-serif; font-size:10px; font-weight:900; color:#000; letter-spacing:0.1em; }
            div[class*="rcStampSub"] { font-family:'JetBrains Mono',monospace; font-size:7px; color:#000; letter-spacing:0.15em; margin-top:2px; }
            
            /* Footer */
            div[class*="rcFooter"] { text-align:center; margin-top:24px; border-top: 1px dotted #ccc; padding-top: 16px; page-break-inside: avoid; }
            div[class*="rcFooterLine"] { font-size:10px; color:#666; line-height:1.6; }
            div[class*="rcFooterBrand"] { font-family:'Orbitron',sans-serif; font-size:12px; font-weight:700; color:#000; margin-top:8px; letter-spacing:0.15em; }
            div[class*="rcFooterBrand"] em { color:#000; font-style:normal; }
        </style></head><body>
            ${content}
        </body></html>`)
        win.document.close(); win.focus()
        setTimeout(() => { win.print(); win.close() }, 500)
    }

    // ── Checkout
    const handleCheckout = async () => {
        if (cart.length === 0) return
        setCheckingOut(true)
        try {
            const items = cart.map(item => ({
                product: item.product._id,
                name: item.product.name,
                sku: item.product.sku || '',
                qty: item.qty,
                unitPrice: item.product.salePrice || item.product.basePrice,
                totalPrice: Math.max(0, (item.product.salePrice || item.product.basePrice) * item.qty - item.itemDiscount),
            }))
            const orderData = {
                channel: 'pos', items,
                customerInfo: selectedCustomer
                    ? { name: selectedCustomer.name, phone: selectedCustomer.phone || custPhone, email: selectedCustomer.email }
                    : { name: custName || 'Khách lẻ', phone: custPhone, email: '' },
                user: selectedCustomer?._id || null,
                subtotal, discount: totalDiscount, shippingFee: 0, total: grandTotal,
                coupon: appliedCoupon?._id || null,
                payment: { method: payment, status: 'paid', paidAt: new Date().toISOString() },
                status: 'delivered', notes: orderNote,
            }
            const res = await fetch('/api/orders', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(orderData),
            })
            const json = await res.json()
            if (json.success) {
                setReceiptOrder({
                    orderCode: json.data.orderCode,
                    items: [...cart], grandTotal, discount: totalDiscount,
                    coupon: appliedCoupon, payment,
                    cashAmount, change: Math.max(0, cashAmount - grandTotal),
                    customer: selectedCustomer?.name || custName || 'Khách lẻ',
                    phone: selectedCustomer?.phone || custPhone || '—',
                })
                resetCart(); fetchData()
            } else {
                alert(json.error || json.message || 'Thanh toán thất bại')
            }
        } catch { alert('Lỗi kết nối máy chủ') } finally { setCheckingOut(false) }
    }

    // ═════════════════════════════════════════
    // RENDER
    // ═════════════════════════════════════════
    return (
        <>
        {/* Mobile Tab Bar */}
        <div className={styles.mobileTabBar}>
            <button
                className={`${styles.mobileTab} ${mobileView === 'products' ? styles.mobileTabActive : ''}`}
                onClick={() => setMobileView('products')}
            >
                🛍️ Sản phẩm
            </button>
            <button
                className={`${styles.mobileTab} ${mobileView === 'cart' ? styles.mobileTabActive : ''}`}
                onClick={() => setMobileView('cart')}
            >
                🛒 Giỏ hàng {cart.length > 0 && <span className={styles.mobileCartBadge}>{cart.length}</span>}
            </button>
        </div>

        <div className={styles.posLayout} ref={layoutRef} style={{ gridTemplateColumns: `1fr 6px ${rightWidth}px` }}>

            {/* ══════ LEFT: PRODUCT BROWSER ══════ */}
            <div className={`${styles.leftPanel} ${mobileView !== 'products' ? styles.mobileHidden : ''}`}>

                {/* Search + Category bar */}
                <div className={styles.leftToolbar}>
                    <div className={styles.searchBar}>
                        <span className={styles.searchIcon}>🔍</span>
                        <input
                            ref={searchRef}
                            type="text"
                            className={styles.searchInput}
                            placeholder="Tên sản phẩm, SKU… (/) để focus"
                            value={search}
                            onChange={e => setSearch(e.target.value)}
                        />
                        {search && (
                            <button className={styles.clearBtn} onClick={() => setSearch('')}>✕</button>
                        )}
                    </div>
                    <div className={styles.catBar}>
                        <button
                            className={`${styles.catChip} ${category === 'all' ? styles.active : ''}`}
                            onClick={() => setCategory('all')}
                        >Tất cả</button>
                        {categories.map(cat => (
                            <button
                                key={cat._id}
                                className={`${styles.catChip} ${category === cat._id ? styles.active : ''}`}
                                onClick={() => setCategory(cat._id)}
                            >{cat.name}</button>
                        ))}
                    </div>
                </div>

                {/* Product list */}
                {loading ? (
                    <CyberpunkLoader message="Đang tải sản phẩm..." />
                ) : (
                    <div className={styles.productList}>
                        {/* Header row */}
                        <div className={styles.listHeader}>
                            <span className={styles.colImg} />
                            <span className={styles.colName}>Sản phẩm</span>
                            <span className={styles.colPrice}>Giá</span>
                            <span className={styles.colStock}>Kho</span>
                            <span className={styles.colAdd} />
                        </div>

                        {filtered.map(product => {
                            const price = product.salePrice || product.basePrice
                            const inCart = cart.find(i => i.product._id === product._id)
                            const imgSrc = product.images?.[0] || ''
                            const outOfStock = product.stock === 0

                            return (
                                <div
                                    key={product._id}
                                    className={`${styles.productRow} ${outOfStock ? styles.rowOos : ''} ${inCart ? styles.rowInCart : ''}`}
                                    onClick={() => addToCart(product)}
                                >
                                    {/* Thumbnail */}
                                    <div className={styles.colImg}>
                                        <div className={styles.thumb}>
                                            {imgSrc ? (
                                                <Image src={imgSrc} alt={product.name} fill style={{ objectFit: 'cover' }} sizes="40px" unoptimized />
                                            ) : <span className={styles.thumbEmoji}>📦</span>}
                                            {inCart && <span className={styles.cartBadge}>{inCart.qty}</span>}
                                        </div>
                                    </div>

                                    {/* Name + SKU + category */}
                                    <div className={styles.colName}>
                                        <div className={styles.prodName}>{product.name}</div>
                                        <div className={styles.prodMeta}>
                                            {product.sku}
                                            {product.category && typeof product.category === 'object' && (
                                                <span className={styles.catTag}>{product.category.name}</span>
                                            )}
                                        </div>
                                    </div>

                                    {/* Price */}
                                    <div className={styles.colPrice}>
                                        <div className={styles.prodPrice}>{formatVND(price)}</div>
                                        {product.salePrice && product.salePrice < product.basePrice && (
                                            <div className={styles.prodOriginal}>{formatVND(product.basePrice)}</div>
                                        )}
                                    </div>

                                    {/* Stock */}
                                    <div className={styles.colStock}>
                                        <span className={`${styles.stockBadge} ${product.stock === 0 ? styles.oos : product.stock <= 5 ? styles.low : styles.ok}`}>
                                            {product.stock === 0 ? 'Hết' : product.stock <= 5 ? `⚠ ${product.stock}` : product.stock}
                                        </span>
                                    </div>

                                    {/* Add button */}
                                    <div className={styles.colAdd}>
                                        <button
                                            className={styles.addBtn}
                                            disabled={outOfStock}
                                            onClick={e => { e.stopPropagation(); addToCart(product) }}
                                        >+</button>
                                    </div>
                                </div>
                            )
                        })}

                        {filtered.length === 0 && (
                            <div className={styles.emptyState}>
                                <span>🔍</span>
                                <span>Không tìm thấy sản phẩm</span>
                            </div>
                        )}
                    </div>
                )}
            </div>

            {/* ══════ RESIZER ══════ */}
            <div className={styles.resizer} onMouseDown={onResizeStart} />

            {/* ══════ RIGHT: CART + CHECKOUT ══════ */}
            <div className={`${styles.rightPanel} ${mobileView !== 'cart' ? styles.mobileHidden : ''}`}>

                {/* Tab switcher */}
                <div className={styles.panelTabs}>
                    <button
                        className={`${styles.panelTab} ${activePanel === 'cart' ? styles.tabActive : ''}`}
                        onClick={() => setActivePanel('cart')}
                    >
                        🛒 Giỏ hàng
                        {totalItems > 0 && <span className={styles.tabBadge}>{totalItems}</span>}
                    </button>
                    <button
                        className={`${styles.panelTab} ${activePanel === 'parked' ? styles.tabActive : ''}`}
                        onClick={() => setActivePanel('parked')}
                    >
                        ⏸ Đơn tạm
                        {parkedOrders.length > 0 && <span className={styles.tabBadge}>{parkedOrders.length}</span>}
                    </button>
                </div>

                {/* ── PARKED PANEL ── */}
                {activePanel === 'parked' && (
                    <div className={styles.parkedPanel}>
                        {parkedOrders.length === 0 ? (
                            <div className={styles.emptyCart}>
                                <span>⏸</span>
                                <span>Chưa có đơn được giữ tạm</span>
                            </div>
                        ) : parkedOrders.map(p => (
                            <div key={p.id} className={styles.parkedCard}>
                                <div className={styles.parkedInfo}>
                                    <div className={styles.parkedLabel}>{p.label}</div>
                                    <div className={styles.parkedMeta}>
                                        {p.cart.length} sp · {formatVND(p.cart.reduce((s, i) => s + (i.product.salePrice || i.product.basePrice) * i.qty - i.itemDiscount, 0))}
                                    </div>
                                    <div className={styles.parkedTime}>{new Date(p.parkedAt).toLocaleTimeString('vi-VN')}</div>
                                </div>
                                <div className={styles.parkedActions}>
                                    <button className={styles.restoreBtn} onClick={() => handleRestoreParked(p)}>▶ Khôi phục</button>
                                    <button className={styles.delParkedBtn} onClick={() => setParkedOrders(prev => prev.filter(x => x.id !== p.id))}>✕</button>
                                </div>
                            </div>
                        ))}
                    </div>
                )}

                {/* ── CART PANEL ── */}
                {activePanel === 'cart' && (
                    <>
                        {/* Cart header */}
                        <div className={styles.cartHeader}>
                            <div className={styles.cartHeaderLeft}>
                                <span className={styles.cartTitle}>Giỏ hàng</span>
                                {totalItems > 0 && <span className={styles.cartCount}>{totalItems} sp</span>}
                            </div>
                            {cart.length > 0 && (
                                <button className={styles.clearCartBtn} onClick={() => setCart([])}>🗑 Xóa tất cả</button>
                            )}
                        </div>

                        {/* Customer — compact bar */}
                        <div className={styles.customerSection} ref={custRef}>
                            <div className={styles.custCompactBar} onClick={() => !selectedCustomer && setShowCustForm(v => !v)}>
                                <span>👤</span>
                                {selectedCustomer ? (
                                    <>
                                        <span className={styles.custCompactName}>{selectedCustomer.name}</span>
                                        {selectedCustomer.phone && <span className={styles.custCompactSub}>{selectedCustomer.phone}</span>}
                                        <button className={styles.custDeselect} onClick={(e) => { e.stopPropagation(); setSelectedCustomer(null); setCustSearch(''); setShowCustForm(false) }}>✕</button>
                                    </>
                                ) : custName ? (
                                    <>
                                        <span className={styles.custCompactName}>{custName}</span>
                                        {custPhone && <span className={styles.custCompactSub}>{custPhone}</span>}
                                        <button className={styles.custDeselect} onClick={(e) => { e.stopPropagation(); setCustName(''); setCustPhone('') }}>✕</button>
                                    </>
                                ) : (
                                    <span className={styles.custCompactPlaceholder}>Khách lẻ — nhấn để chọn</span>
                                )}
                            </div>
                            {showCustForm && !selectedCustomer && (
                                <div className={styles.custSearchWrap}>
                                    <input
                                        className={styles.custInput}
                                        placeholder="Tìm theo tên / SĐT / email..."
                                        value={custSearch}
                                        onChange={e => { setCustSearch(e.target.value); setCustDropOpen(true) }}
                                        onFocus={() => setCustDropOpen(true)}
                                        autoFocus
                                    />
                                    {custDropOpen && (custSearch.length >= 2) && (
                                        <div className={styles.custDropdown}>
                                            {custResults.map(c => (
                                                <button key={c._id} className={styles.custOption}
                                                    onClick={() => { setSelectedCustomer(c); setCustSearch(''); setCustDropOpen(false); setShowCustForm(false) }}
                                                >
                                                    <span className={styles.custOptAv}>{c.name.charAt(0).toUpperCase()}</span>
                                                    <div>
                                                        <div className={styles.custOptName}>{c.name}</div>
                                                        <div className={styles.custOptSub}>{c.phone || ''} {c.email}</div>
                                                    </div>
                                                </button>
                                            ))}
                                            {custResults.length === 0 && (
                                                <div className={styles.custNoResult}>Không tìm thấy — nhập tay bên dưới</div>
                                            )}
                                        </div>
                                    )}
                                    <div className={styles.custManual}>
                                        <input className={styles.custManualInput} placeholder="Tên khách lẻ" value={custName} onChange={e => setCustName(e.target.value)} />
                                        <input className={styles.custManualInput} placeholder="SĐT" value={custPhone} onChange={e => setCustPhone(e.target.value)} />
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Cart items */}
                        {cart.length === 0 ? (
                            <div className={styles.emptyCart}>
                                <span>🛒</span>
                                <span>Bấm vào sản phẩm để thêm</span>
                                <span className={styles.kbHint}>Phím / để tìm kiếm nhanh</span>
                            </div>
                        ) : (
                            <div className={styles.cartItems}>
                                {cart.map(item => {
                                    const unitPrice = item.product.salePrice || item.product.basePrice
                                    const lineTotal = Math.max(0, unitPrice * item.qty - item.itemDiscount)
                                    const isEditDiscount = editItemDiscount === item.product._id

                                    return (
                                        <div key={item.product._id} className={styles.cartItem}>
                                            {/* Thumb */}
                                            <div className={styles.itemThumb}>
                                                {item.product.images?.[0] ? (
                                                    <Image src={item.product.images[0]} alt={item.product.name} fill style={{ objectFit: 'cover' }} sizes="44px" unoptimized />
                                                ) : <span>📦</span>}
                                            </div>

                                            <div className={styles.itemBody}>
                                                <div className={styles.itemRow1}>
                                                    <span className={styles.itemName}>{item.product.name}</span>
                                                    <button className={styles.itemRemove} onClick={() => removeFromCart(item.product._id)}>✕</button>
                                                </div>
                                                <div className={styles.itemRow2}>
                                                    <div className={styles.qtyCtrl}>
                                                        <button className={styles.qBtn} onClick={() => updateQty(item.product._id, -1)}>−</button>
                                                        {editQtyId === item.product._id ? (
                                                            <input
                                                                className={styles.qInput}
                                                                type="number" value={editQtyVal} autoFocus
                                                                min={1} max={item.product.stock}
                                                                onChange={e => setEditQtyVal(e.target.value)}
                                                                onBlur={() => commitQtyEdit(item.product._id)}
                                                                onKeyDown={e => {
                                                                    if (e.key === 'Enter') commitQtyEdit(item.product._id)
                                                                    if (e.key === 'Escape') { setEditQtyId(null); setEditQtyVal('') }
                                                                }}
                                                            />
                                                        ) : (
                                                            <span
                                                                className={styles.qVal}
                                                                title="Bấm để nhập số lượng"
                                                                onClick={() => { setEditQtyId(item.product._id); setEditQtyVal(String(item.qty)) }}
                                                            >{item.qty}</span>
                                                        )}
                                                        <button className={styles.qBtn} onClick={() => updateQty(item.product._id, 1)} disabled={item.qty >= item.product.stock}>+</button>
                                                    </div>
                                                    <div className={styles.itemPriceStack}>
                                                        <span className={styles.itemUnit}>{formatVND(unitPrice)} × {item.qty}</span>
                                                        <span className={styles.itemTotal}>{formatVND(lineTotal)}</span>
                                                    </div>
                                                </div>

                                                {/* Per-item discount */}
                                                <div className={styles.itemRow3}>
                                                    <button
                                                        className={`${styles.discToggle} ${item.itemDiscount > 0 ? styles.active : ''}`}
                                                        onClick={() => setEditItemDiscount(isEditDiscount ? null : item.product._id)}
                                                    >
                                                        {item.itemDiscount > 0 ? `−${formatVND(item.itemDiscount)}` : '🏷 Giảm'}
                                                    </button>
                                                    <input
                                                        className={styles.itemNote}
                                                        placeholder="Ghi chú..."
                                                        value={item.note}
                                                        onChange={e => setItemNote(item.product._id, e.target.value)}
                                                    />
                                                </div>
                                                {isEditDiscount && (
                                                    <div className={styles.discEditor}>
                                                        <span>Giảm (VNĐ):</span>
                                                        <input
                                                            type="number" className={styles.discInput}
                                                            value={item.itemDiscount || ''}
                                                            min={0} max={unitPrice * item.qty}
                                                            onChange={e => setItemDiscount(item.product._id, parseFloat(e.target.value) || 0)}
                                                            autoFocus
                                                        />
                                                        <button className={styles.discConfirm} onClick={() => setEditItemDiscount(null)}>✓</button>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    )
                                })}
                            </div>
                        )}

                        {/* Footer — only when cart has items */}
                        {cart.length > 0 && (
                            <div className={styles.cartFooter}>
                                {/* Quick action buttons */}
                                <div className={styles.quickActions}>
                                    <button
                                        className={`${styles.quickBtn} ${showDiscount ? styles.active : ''} ${(discountValue || appliedCoupon) ? styles.hasValue : ''}`}
                                        onClick={() => { setShowDiscount(v => !v); setShowNote(false) }}
                                    >
                                        🏷 Giảm giá {discountValue ? (discountType === 'percent' ? `(${discountValue}%)` : `(${formatVND(Number(discountValue))})`) : ''}{appliedCoupon ? ` · ${appliedCoupon.code}` : ''}
                                    </button>
                                    <button
                                        className={`${styles.quickBtn} ${showNote ? styles.active : ''} ${orderNote ? styles.hasValue : ''}`}
                                        onClick={() => { setShowNote(v => !v); setShowDiscount(false) }}
                                    >
                                        📝 Ghi chú {orderNote ? '·' : ''}
                                    </button>
                                    <button className={styles.quickBtn} onClick={handleParkOrder}>⏸ Giữ đơn</button>
                                </div>

                                {/* Expandable discount panel */}
                                {showDiscount && (
                                    <div className={styles.expandPanel}>
                                        <div className={styles.discRow}>
                                            <div className={styles.discTypeSw}>
                                                <button className={`${styles.discTypeBtn} ${discountType === 'percent' ? styles.active : ''}`} onClick={() => setDiscountType('percent')}>%</button>
                                                <button className={`${styles.discTypeBtn} ${discountType === 'fixed' ? styles.active : ''}`} onClick={() => setDiscountType('fixed')}>VNĐ</button>
                                            </div>
                                            <input
                                                type="number" className={styles.discValInput}
                                                placeholder={discountType === 'percent' ? 'VD: 10 (%)' : 'VD: 50000'}
                                                value={discountValue} min={0}
                                                max={discountType === 'percent' ? 100 : subtotal}
                                                onChange={e => setDiscountValue(e.target.value)}
                                                autoFocus
                                            />
                                        </div>
                                        <div className={styles.couponRow}>
                                            <input
                                                className={styles.couponInput}
                                                placeholder="Mã coupon..."
                                                value={couponCode}
                                                onChange={e => { setCouponCode(e.target.value.toUpperCase()); setAppliedCoupon(null); setCouponError('') }}
                                                onKeyDown={e => e.key === 'Enter' && handleApplyCoupon()}
                                            />
                                            <button className={styles.couponBtn} onClick={handleApplyCoupon} disabled={!couponCode.trim() || couponLoading}>
                                                {couponLoading ? '...' : 'Áp dụng'}
                                            </button>
                                        </div>
                                        {couponError && <div className={styles.couponErr}>{couponError}</div>}
                                        {appliedCoupon && (
                                            <div className={styles.couponOk}>
                                                ✅ {appliedCoupon.code} — giảm {appliedCoupon.type === 'percent' ? `${appliedCoupon.value}%` : formatVND(appliedCoupon.value)}
                                                <button onClick={() => { setAppliedCoupon(null); setCouponCode('') }}>✕</button>
                                            </div>
                                        )}
                                    </div>
                                )}

                                {/* Expandable note panel */}
                                {showNote && (
                                    <div className={styles.expandPanel}>
                                        <textarea className={styles.noteInput} placeholder="Ghi chú đơn hàng..." value={orderNote} onChange={e => setOrderNote(e.target.value)} rows={2} autoFocus />
                                    </div>
                                )}

                                {/* Price summary */}
                                <div className={styles.priceSummary}>
                                    <div className={styles.priceRow}>
                                        <span>Tạm tính</span>
                                        <span>{formatVND(subtotal)}</span>
                                    </div>
                                    {computeOrderDiscount() > 0 && (
                                        <div className={`${styles.priceRow} ${styles.discLine}`}>
                                            <span>Giảm đơn ({discountType === 'percent' ? `${discountValue}%` : 'VNĐ'})</span>
                                            <span>−{formatVND(computeOrderDiscount())}</span>
                                        </div>
                                    )}
                                    {computeCouponDiscount() > 0 && (
                                        <div className={`${styles.priceRow} ${styles.discLine}`}>
                                            <span>Coupon ({appliedCoupon?.code})</span>
                                            <span>−{formatVND(computeCouponDiscount())}</span>
                                        </div>
                                    )}
                                    <div className={`${styles.priceRow} ${styles.grandRow}`}>
                                        <span>TỔNG CỘNG</span>
                                        <span>{formatVND(grandTotal)}</span>
                                    </div>
                                </div>

                                {/* Payment */}
                                <div className={styles.footerSection}>
                                    <div className={styles.sectionLabel}>💳 THANH TOÁN</div>
                                    <div className={styles.pmGrid}>
                                        {[
                                            { key: 'cash', label: 'Tiền mặt', icon: '💵', kb: 'F1' },
                                            { key: 'card', label: 'Thẻ', icon: '💳', kb: 'F3' },
                                            { key: 'transfer', label: 'Chuyển khoản', icon: '🏦', kb: 'F4' },
                                        ].map(m => (
                                            <button key={m.key}
                                                className={`${styles.pmBtn} ${payment === m.key ? styles.pmActive : ''}`}
                                                onClick={() => setPayment(m.key)}
                                            >
                                                <span>{m.icon}</span>
                                                <span>{m.label}</span>
                                                <span className={styles.pmKb}>{m.kb}</span>
                                            </button>
                                        ))}
                                    </div>
                                    {payment === 'cash' && (
                                        <div className={styles.cashBox}>
                                            <input
                                                className={styles.cashInput}
                                                type="number" placeholder="Khách đưa (VNĐ)"
                                                value={cashInput}
                                                onChange={e => setCashInput(e.target.value)}
                                            />
                                            <div className={styles.quickAmts}>
                                                {[50000, 100000, 200000, 500000, 1000000].map(amt => (
                                                    <button key={amt} className={styles.qAmt} onClick={() => setCashInput(String(amt))}>
                                                        {formatVND(amt).replace('₫', '')}
                                                    </button>
                                                ))}
                                                <button className={`${styles.qAmt} ${styles.exactAmt}`} onClick={() => setCashInput(String(grandTotal))}>Đúng số</button>
                                            </div>
                                            {cashInput && cashAmount >= grandTotal && (
                                                <div className={styles.changeOk}>Tiền thối: <strong>{formatVND(change)}</strong></div>
                                            )}
                                            {cashInput && cashAmount < grandTotal && (
                                                <div className={styles.changeShort}>Còn thiếu: <strong>{formatVND(grandTotal - cashAmount)}</strong></div>
                                            )}
                                        </div>
                                    )}
                                </div>

                                {/* Checkout button */}
                                <button
                                    className={styles.checkoutBtn}
                                    disabled={cart.length === 0 || checkingOut || (payment === 'cash' && cashInput !== '' && cashAmount < grandTotal)}
                                    onClick={handleCheckout}
                                >
                                    {checkingOut ? '⏳ ĐANG XỬ LÝ...' : `✅ THANH TOÁN — ${formatVND(grandTotal)}`}
                                </button>

                                <div className={styles.kbBar}>
                                    <span>/ Tìm</span><span>F1 Tiền mặt</span><span>F3 Thẻ</span><span>F4 Chuyển khoản</span>
                                </div>
                            </div>
                        )}
                    </>
                )}
            </div>

            {/* ══════ RECEIPT / INVOICE MODAL ══════ */}
            {receiptOrder && (
                <div className={styles.receiptOverlay} onClick={() => setReceiptOrder(null)}>
                    <div className={styles.receiptModal} onClick={e => e.stopPropagation()}>
                        {/* Printable content */}
                        <div ref={receiptRef} className={styles.rcPrintArea}>
                            {/* ── Header with branding ── */}
                            <div className={styles.rcHeader}>
                                <div className={styles.rcBrand}>
                                    <div className={styles.rcLogo}>NEX<em>GEAR</em></div>
                                    <div className={styles.rcSlogan}>NEXT-GEN GEAR STORE</div>
                                </div>
                                <div className={styles.rcInvoiceLabel}>HÓA ĐƠN BÁN HÀNG</div>
                            </div>

                            {/* ── Store info ── */}
                            <div className={styles.rcStoreInfo}>
                                <div>📍 123 Nguyễn Huệ, Q.1, TP. Hồ Chí Minh</div>
                                <div>📞 1900-NEXGEAR (1900-639-4327)</div>
                                <div>🌐 nexgear.vn · ✉ contact@nexgear.vn</div>
                            </div>

                            <div className={styles.rcDividerDeco} />

                            {/* ── Order info ── */}
                            <div className={styles.rcOrderInfo}>
                                <div className={styles.rcInfoGrid}>
                                    <div className={styles.rcInfoBlock}>
                                        <div className={styles.rcInfoLabel}>MÃ ĐƠN HÀNG</div>
                                        <div className={styles.rcInfoValue}>{receiptOrder.orderCode}</div>
                                    </div>
                                    <div className={styles.rcInfoBlock}>
                                        <div className={styles.rcInfoLabel}>NGÀY MUA</div>
                                        <div className={styles.rcInfoValue}>{new Date().toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' })}</div>
                                    </div>
                                    <div className={styles.rcInfoBlock}>
                                        <div className={styles.rcInfoLabel}>GIỜ</div>
                                        <div className={styles.rcInfoValue}>{new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}</div>
                                    </div>
                                    <div className={styles.rcInfoBlock}>
                                        <div className={styles.rcInfoLabel}>THANH TOÁN</div>
                                        <div className={styles.rcInfoValue}>
                                            {receiptOrder.payment === 'cash' ? 'Tiền mặt' : receiptOrder.payment === 'card' ? 'Thẻ' : 'Chuyển khoản'}
                                        </div>
                                    </div>
                                </div>

                                <div className={styles.rcCustomerBox}>
                                    <div className={styles.rcInfoLabel}>KHÁCH HÀNG</div>
                                    <div className={styles.rcCustDetail}>
                                        <span className={styles.rcCustName}>{receiptOrder.customer}</span>
                                        <span className={styles.rcCustPhone}>SĐT: {receiptOrder.phone}</span>
                                    </div>
                                </div>
                            </div>

                            <div className={styles.rcDividerDeco} />

                            {/* ── Items table ── */}
                            <table className={styles.rcTable}>
                                <thead>
                                    <tr>
                                        <th className={styles.rcThNum}>#</th>
                                        <th className={styles.rcThName}>Sản phẩm</th>
                                        <th className={styles.rcThQty}>SL</th>
                                        <th className={styles.rcThPrice}>Đơn giá</th>
                                        <th className={styles.rcThTotal}>Thành tiền</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {receiptOrder.items.map((item, idx) => {
                                        const up = item.product.salePrice || item.product.basePrice
                                        const lineTotal = Math.max(0, up * item.qty - item.itemDiscount)
                                        return (
                                            <tr key={item.product._id}>
                                                <td className={styles.rcTdNum}>{idx + 1}</td>
                                                <td className={styles.rcTdName}>
                                                    <div>{item.product.name}</div>
                                                    <div className={styles.rcItemSku}>{item.product.sku}</div>
                                                    {item.itemDiscount > 0 && (
                                                        <div className={styles.rcItemDiscNote}>🏷 Giảm: {formatVND(item.itemDiscount)}</div>
                                                    )}
                                                </td>
                                                <td className={styles.rcTdQty}>{item.qty}</td>
                                                <td className={styles.rcTdPrice}>{formatVND(up)}</td>
                                                <td className={styles.rcTdTotal}>{formatVND(lineTotal)}</td>
                                            </tr>
                                        )
                                    })}
                                </tbody>
                            </table>

                            <div className={styles.rcDividerDeco} />

                            {/* ── Summary ── */}
                            <div className={styles.rcSummary}>
                                <div className={styles.rcSumRow}>
                                    <span>Tạm tính ({receiptOrder.items.reduce((s, i) => s + i.qty, 0)} sản phẩm)</span>
                                    <span>{formatVND(receiptOrder.grandTotal + receiptOrder.discount)}</span>
                                </div>
                                {receiptOrder.discount > 0 && (
                                    <div className={`${styles.rcSumRow} ${styles.rcDisc}`}>
                                        <span>Giảm giá{receiptOrder.coupon ? ` (Mã: ${receiptOrder.coupon.code})` : ''}</span>
                                        <span>−{formatVND(receiptOrder.discount)}</span>
                                    </div>
                                )}
                                <div className={styles.rcGrandTotal}>
                                    <span>TỔNG THANH TOÁN</span>
                                    <span>{formatVND(receiptOrder.grandTotal)}</span>
                                </div>
                            </div>

                            {/* ── Cash change ── */}
                            {receiptOrder.payment === 'cash' && receiptOrder.cashAmount > 0 && (
                                <div className={styles.rcCashBox}>
                                    <div className={styles.rcSumRow}>
                                        <span>Tiền khách đưa</span>
                                        <span>{formatVND(receiptOrder.cashAmount)}</span>
                                    </div>
                                    <div className={styles.rcSumRow}>
                                        <span>Tiền thối lại</span>
                                        <span className={styles.rcChangeVal}>{formatVND(receiptOrder.change)}</span>
                                    </div>
                                </div>
                            )}

                            <div className={styles.rcDividerDeco} />

                            {/* ── Signature ── */}
                            <div className={styles.rcSignature}>
                                <div className={styles.rcSigBlock}>
                                    <div className={styles.rcSigLabel}>Thu ngân</div>
                                    <div className={styles.rcSigLine} />
                                    <div className={styles.rcSigName}>NEXGEAR POS</div>
                                </div>
                                <div className={styles.rcSigBlock}>
                                    <div className={styles.rcSigLabel}>Khách hàng</div>
                                    <div className={styles.rcSigLine} />
                                    <div className={styles.rcSigName}>{receiptOrder.customer}</div>
                                </div>
                            </div>

                            {/* ── Stamp ── */}
                            <div className={styles.rcStamp}>
                                <div className={styles.rcStampCircle}>
                                    <div className={styles.rcStampText}>NEXGEAR</div>
                                    <div className={styles.rcStampSub}>ĐÃ THANH TOÁN</div>
                                </div>
                            </div>

                            {/* ── Footer ── */}
                            <div className={styles.rcFooter}>
                                <div className={styles.rcFooterLine}>Cảm ơn quý khách đã mua hàng tại NEXGEAR!</div>
                                <div className={styles.rcFooterLine}>Sản phẩm được bảo hành theo chính sách nhà sản xuất.</div>
                                <div className={styles.rcFooterLine}>Hotline hỗ trợ: 1900-NEXGEAR · nexgear.vn</div>
                                <div className={styles.rcFooterBrand}>— NEX<em>GEAR</em> —</div>
                            </div>
                        </div>

                        {/* Action buttons (not printed) */}
                        <div className={styles.rcActions}>
                            <button className={styles.rcPrint} onClick={handlePrint}>🖨️ IN HÓA ĐƠN</button>
                            <button className={styles.rcNewOrder} onClick={() => setReceiptOrder(null)}>🛒 ĐƠN MỚI</button>
                            <button className={styles.rcClose} onClick={() => setReceiptOrder(null)}>Đóng</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
        </>
    )
}
