// ============================================================
// NEXGEAR — Admin Purchase Orders Page
// ============================================================
'use client'

import { useState, useEffect, useCallback } from 'react'
import styles from './page.module.scss'
import { CyberpunkLoader, useToast } from '@/components/ui'

interface Supplier {
    _id: string
    name: string
    supplierCode: string
}

interface Warehouse {
    _id: string
    name: string
    warehouseCode: string
}

interface PurchaseOrder {
    _id: string
    orderNumber: string
    supplier: Supplier
    supplierName: string
    warehouse: Warehouse
    items: {
        product: string
        productName: string
        quantity: number
        unitPrice: number
        totalPrice: number
        receivedQuantity: number
    }[]
    subtotal: number
    tax: number
    discount: number
    totalAmount: number
    paidAmount: number
    paymentStatus: 'unpaid' | 'partial' | 'paid'
    status: 'draft' | 'ordered' | 'partial' | 'received' | 'cancelled'
    orderDate: string
    expectedDeliveryDate: string
    notes: string
}

const STATUS_LABELS: Record<string, string> = {
    draft: 'Nháp',
    ordered: 'Đã đặt',
    partial: 'Nhận một phần',
    received: 'Đã nhận đủ',
    cancelled: 'Đã hủy',
}

const PAYMENT_LABELS: Record<string, string> = {
    unpaid: 'Chưa thanh toán',
    partial: 'Thanh toán một phần',
    paid: 'Đã thanh toán',
}

function formatCurrency(amount: number) {
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(amount)
}

function formatDate(dateStr: string | null) {
    if (!dateStr) return '-'
    return new Date(dateStr).toLocaleDateString('vi-VN', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
    })
}

function generateOrderNumber(): string {
    const date = new Date()
    const prefix = 'PO'
    const timestamp = date.getTime().toString().slice(-6)
    const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0')
    return `${prefix}${date.getFullYear()}${String(date.getMonth() + 1).padStart(2, '0')}${timestamp}${random}`
}

export default function AdminPurchaseOrdersPage() {
    const { success, error } = useToast()
    const [orders, setOrders] = useState<PurchaseOrder[]>([])
    const [suppliers, setSuppliers] = useState<Supplier[]>([])
    const [warehouses, setWarehouses] = useState<Warehouse[]>([])
    const [loading, setLoading] = useState(true)
    const [showModal, setShowModal] = useState(false)
    const [saving, setSaving] = useState(false)
    const [editingId, setEditingId] = useState<string | null>(null)

    const [filterStatus, setFilterStatus] = useState('')
    const [filterPayment, setFilterPayment] = useState('')

    const [formOrderNumber, setFormOrderNumber] = useState('')
    const [formSupplier, setFormSupplier] = useState('')
    const [formWarehouse, setFormWarehouse] = useState('')
    const [formOrderDate, setFormOrderDate] = useState('')
    const [formExpectedDate, setFormExpectedDate] = useState('')
    const [formItems, setFormItems] = useState<any[]>([])
    const [formTax, setFormTax] = useState('0')
    const [formDiscount, setFormDiscount] = useState('0')
    const [formPaidAmount, setFormPaidAmount] = useState('0')
    const [formNotes, setFormNotes] = useState('')
    const [formStatus, setFormStatus] = useState('draft')

    const fetchSuppliers = useCallback(async () => {
        try {
            const res = await fetch('/api/suppliers?limit=100')
            const json = await res.json()
            if (json.success) {
                setSuppliers(json.data)
            }
        } catch (err) {
            console.error('Failed to fetch suppliers:', err)
        }
    }, [])

    const fetchWarehouses = useCallback(async () => {
        try {
            const res = await fetch('/api/warehouses?limit=100')
            const json = await res.json()
            if (json.success) {
                setWarehouses(json.data)
            }
        } catch (err) {
            console.error('Failed to fetch warehouses:', err)
        }
    }, [])

    const fetchOrders = useCallback(async () => {
        setLoading(true)
        try {
            const params = new URLSearchParams()
            if (filterStatus) params.set('status', filterStatus)
            if (filterPayment) params.set('paymentStatus', filterPayment)
            params.set('limit', '100')

            const res = await fetch(`/api/purchase-orders?${params}`)
            const json = await res.json()
            if (json.success) {
                setOrders(json.data)
            }
        } catch (err) {
            console.error('Failed to fetch orders:', err)
        } finally {
            setLoading(false)
        }
    }, [filterStatus, filterPayment])

    useEffect(() => { fetchSuppliers() }, [fetchSuppliers])
    useEffect(() => { fetchWarehouses() }, [fetchWarehouses])
    useEffect(() => { fetchOrders() }, [fetchOrders])

    const calculateSubtotal = () => {
        return formItems.reduce((sum, item) => sum + (item.quantity * item.unitPrice || 0), 0)
    }

    const calculateTotal = () => {
        const subtotal = calculateSubtotal()
        const tax = parseFloat(formTax) || 0
        const discount = parseFloat(formDiscount) || 0
        return subtotal + tax - discount
    }

    const resetForm = () => {
        setEditingId(null)
        setFormOrderNumber(generateOrderNumber())
        setFormSupplier('')
        setFormWarehouse('')
        setFormOrderDate(new Date().toISOString().slice(0, 10))
        setFormExpectedDate('')
        setFormItems([])
        setFormTax('0')
        setFormDiscount('0')
        setFormPaidAmount('0')
        setFormNotes('')
        setFormStatus('draft')
    }

    const openAddModal = () => {
        resetForm()
        setShowModal(true)
    }

    const openEditModal = (order: PurchaseOrder) => {
        setEditingId(order._id)
        setFormOrderNumber(order.orderNumber)
        setFormSupplier(typeof order.supplier === 'object' ? order.supplier._id : '')
        setFormWarehouse(typeof order.warehouse === 'object' ? order.warehouse._id : '')
        setFormOrderDate(order.orderDate ? new Date(order.orderDate).toISOString().slice(0, 10) : '')
        setFormExpectedDate(order.expectedDeliveryDate ? new Date(order.expectedDeliveryDate).toISOString().slice(0, 10) : '')
        setFormItems(order.items || [])
        setFormTax(order.tax.toString())
        setFormDiscount(order.discount.toString())
        setFormPaidAmount(order.paidAmount.toString())
        setFormNotes(order.notes)
        setFormStatus(order.status)
        setShowModal(true)
    }

    const handleSave = async () => {
        if (!formOrderNumber || !formSupplier || !formWarehouse) {
            return error('Vui lòng nhập đầy đủ thông tin')
        }
        setSaving(true)
        try {
            const supplierObj = suppliers.find(s => s._id === formSupplier)
            const warehouseObj = warehouses.find(w => w._id === formWarehouse)

            const payload = {
                orderNumber: formOrderNumber,
                supplier: formSupplier,
                supplierName: supplierObj?.name || '',
                warehouse: formWarehouse,
                warehouseName: warehouseObj?.name || '',
                items: formItems.map(item => ({
                    ...item,
                    totalPrice: item.quantity * item.unitPrice
                })),
                subtotal: calculateSubtotal(),
                tax: parseFloat(formTax) || 0,
                discount: parseFloat(formDiscount) || 0,
                totalAmount: calculateTotal(),
                paidAmount: parseFloat(formPaidAmount) || 0,
                orderDate: formOrderDate ? new Date(formOrderDate).toISOString() : null,
                expectedDeliveryDate: formExpectedDate ? new Date(formExpectedDate).toISOString() : null,
                notes: formNotes,
                status: formStatus,
            }

            let res
            if (editingId) {
                res = await fetch(`/api/purchase-orders/${editingId}`, {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(payload),
                })
            } else {
                res = await fetch('/api/purchase-orders', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(payload),
                })
            }

            const json = await res.json()
            if (!json.success) throw new Error(json.error || 'Lưu thất bại')
            success(editingId ? 'Đã cập nhật' : 'Đã tạo đơn nhập hàng')
            setShowModal(false)
            resetForm()
            fetchOrders()
        } catch (e: any) {
            error(e.message)
        } finally {
            setSaving(false)
        }
    }

    const handleDelete = async (order: PurchaseOrder) => {
        if (!confirm(`Xóa đơn nhập hàng ${order.orderNumber}?`)) return
        try {
            const res = await fetch(`/api/purchase-orders/${order._id}`, { method: 'DELETE' })
            const json = await res.json()
            if (json.success) {
                success('Đã xóa đơn nhập hàng')
                fetchOrders()
            } else {
                error(json.error || 'Xóa thất bại')
            }
        } catch {
            error('Lỗi kết nối')
        }
    }

    const getStatusColor = (status: string) => {
        const colors: Record<string, string> = {
            draft: 'gray',
            ordered: 'blue',
            partial: 'orange',
            received: 'green',
            cancelled: 'red',
        }
        return colors[status] || 'gray'
    }

    const getPaymentColor = (status: string) => {
        const colors: Record<string, string> = {
            unpaid: 'red',
            partial: 'orange',
            paid: 'green',
        }
        return colors[status] || 'gray'
    }

    const totalAmount = orders.reduce((sum, o) => sum + o.totalAmount, 0)
    const totalPaid = orders.reduce((sum, o) => sum + o.paidAmount, 0)

    return (
        <>
            <div className={styles.header}>
                <div className={styles.headerLeft}>
                    <h1>Đơn nhập hàng</h1>
                    <div className={styles.filterGroup}>
                        <select
                            className={styles.filterSelect}
                            value={filterStatus}
                            onChange={(e) => setFilterStatus(e.target.value)}
                        >
                            <option value="">Tất cả trạng thái</option>
                            <option value="draft">Nháp</option>
                            <option value="ordered">Đã đặt</option>
                            <option value="partial">Nhận một phần</option>
                            <option value="received">Đã nhận đủ</option>
                            <option value="cancelled">Đã hủy</option>
                        </select>
                        <select
                            className={styles.filterSelect}
                            value={filterPayment}
                            onChange={(e) => setFilterPayment(e.target.value)}
                        >
                            <option value="">Tất cả thanh toán</option>
                            <option value="unpaid">Chưa thanh toán</option>
                            <option value="partial">Thanh toán một phần</option>
                            <option value="paid">Đã thanh toán</option>
                        </select>
                    </div>
                </div>
                <button className={styles.addBtn} onClick={openAddModal}>
                    + TẠO ĐƠN
                </button>
            </div>

            <div className={styles.summary}>
                <div className={styles.summaryItem}>
                    <span className={styles.summaryLabel}>Tổng đơn</span>
                    <span className={styles.summaryValue}>{orders.length}</span>
                </div>
                <div className={styles.summaryItem}>
                    <span className={styles.summaryLabel}>Tổng giá trị</span>
                    <span className={styles.summaryValue}>{formatCurrency(totalAmount)}</span>
                </div>
                <div className={styles.summaryItem}>
                    <span className={styles.summaryLabel}>Đã thanh toán</span>
                    <span className={`${styles.summaryValue} ${styles.green}`}>{formatCurrency(totalPaid)}</span>
                </div>
                <div className={styles.summaryItem}>
                    <span className={styles.summaryLabel}>Còn nợ</span>
                    <span className={`${styles.summaryValue} ${styles.red}`}>{formatCurrency(totalAmount - totalPaid)}</span>
                </div>
            </div>

            {loading ? (
                <CyberpunkLoader message="Đang tải..." compact />
            ) : orders.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '40px', color: 'rgba(255,255,255,0.5)' }}>
                    Chưa có đơn nhập hàng nào
                </div>
            ) : (
                <div className={styles.tableWrapper}>
                    <table className={styles.table}>
                        <thead>
                            <tr>
                                <th>Mã đơn</th>
                                <th>Nhà cung cấp</th>
                                <th>Kho</th>
                                <th>Ngày đặt</th>
                                <th>Tổng tiền</th>
                                <th>Đã trả</th>
                                <th>Thanh toán</th>
                                <th>Trạng thái</th>
                                <th>Thao tác</th>
                            </tr>
                        </thead>
                        <tbody>
                            {orders.map((order) => {
                                const sup = order.supplier as any
                                const wh = order.warehouse as any
                                return (
                                <tr key={order._id}>
                                    <td className={styles.mono}>{order.orderNumber}</td>
                                    <td>{sup?.name || order.supplierName}</td>
                                    <td>{wh?.name || '-'}</td>
                                    <td>{formatDate(order.orderDate)}</td>
                                    <td className={styles.money}>{formatCurrency(order.totalAmount)}</td>
                                    <td className={styles.money}>{formatCurrency(order.paidAmount)}</td>
                                    <td>
                                        <span className={`${styles.badge} ${styles[getPaymentColor(order.paymentStatus)]}`}>
                                            {PAYMENT_LABELS[order.paymentStatus]}
                                        </span>
                                    </td>
                                    <td>
                                        <span className={`${styles.badge} ${styles[getStatusColor(order.status)]}`}>
                                            {STATUS_LABELS[order.status]}
                                        </span>
                                    </td>
                                    <td>
                                        <div className={styles.actions}>
                                            <button className={styles.actionBtn} onClick={() => openEditModal(order)}>
                                                ✏️
                                            </button>
                                            <button className={`${styles.actionBtn} ${styles.danger}`} onClick={() => handleDelete(order)}>
                                                🗑️
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                                )
                            })}
                        </tbody>
                    </table>
                </div>
            )}

            {showModal && (
                <div className={styles.modalOverlay} onClick={() => setShowModal(false)}>
                    <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
                        <div className={styles.modalHeader}>
                            <span className={styles.modalTitle}>
                                {editingId ? 'Chỉnh sửa đơn nhập hàng' : 'Tạo đơn nhập hàng'}
                            </span>
                            <button className={styles.modalClose} onClick={() => setShowModal(false)}>✕</button>
                        </div>
                        <div className={styles.modalBody}>
                            <div className={styles.formRow}>
                                <div className={styles.formGroup}>
                                    <label className={styles.formLabel}>Mã đơn</label>
                                    <input
                                        type="text"
                                        className={styles.formInput}
                                        value={formOrderNumber}
                                        onChange={(e) => setFormOrderNumber(e.target.value)}
                                    />
                                </div>
                                <div className={styles.formGroup}>
                                    <label className={styles.formLabel}>Trạng thái</label>
                                    <select
                                        className={styles.formInput}
                                        value={formStatus}
                                        onChange={(e) => setFormStatus(e.target.value)}
                                    >
                                        <option value="draft">Nháp</option>
                                        <option value="ordered">Đã đặt</option>
                                        <option value="partial">Nhận một phần</option>
                                        <option value="received">Đã nhận đủ</option>
                                        <option value="cancelled">Đã hủy</option>
                                    </select>
                                </div>
                            </div>
                            <div className={styles.formRow}>
                                <div className={styles.formGroup}>
                                    <label className={styles.formLabel}>Nhà cung cấp</label>
                                    <select
                                        className={styles.formInput}
                                        value={formSupplier}
                                        onChange={(e) => setFormSupplier(e.target.value)}
                                    >
                                        <option value="">-- Chọn nhà cung cấp --</option>
                                        {suppliers.map(s => (
                                            <option key={s._id} value={s._id}>{s.name}</option>
                                        ))}
                                    </select>
                                </div>
                                <div className={styles.formGroup}>
                                    <label className={styles.formLabel}>Kho nhận</label>
                                    <select
                                        className={styles.formInput}
                                        value={formWarehouse}
                                        onChange={(e) => setFormWarehouse(e.target.value)}
                                    >
                                        <option value="">-- Chọn kho --</option>
                                        {warehouses.map(w => (
                                            <option key={w._id} value={w._id}>{w.name}</option>
                                        ))}
                                    </select>
                                </div>
                            </div>
                            <div className={styles.formRow}>
                                <div className={styles.formGroup}>
                                    <label className={styles.formLabel}>Ngày đặt</label>
                                    <input
                                        type="date"
                                        className={styles.formInput}
                                        value={formOrderDate}
                                        onChange={(e) => setFormOrderDate(e.target.value)}
                                    />
                                </div>
                                <div className={styles.formGroup}>
                                    <label className={styles.formLabel}>Ngày dự kiến</label>
                                    <input
                                        type="date"
                                        className={styles.formInput}
                                        value={formExpectedDate}
                                        onChange={(e) => setFormExpectedDate(e.target.value)}
                                    />
                                </div>
                            </div>
                            <div className={styles.formRow}>
                                <div className={styles.formGroup}>
                                    <label className={styles.formLabel}>Thuế (VND)</label>
                                    <input
                                        type="number"
                                        className={styles.formInput}
                                        value={formTax}
                                        onChange={(e) => setFormTax(e.target.value)}
                                    />
                                </div>
                                <div className={styles.formGroup}>
                                    <label className={styles.formLabel}>Giảm giá (VND)</label>
                                    <input
                                        type="number"
                                        className={styles.formInput}
                                        value={formDiscount}
                                        onChange={(e) => setFormDiscount(e.target.value)}
                                    />
                                </div>
                            </div>
                            <div className={styles.formRow}>
                                <div className={styles.formGroup}>
                                    <label className={styles.formLabel}>Đã thanh toán (VND)</label>
                                    <input
                                        type="number"
                                        className={styles.formInput}
                                        value={formPaidAmount}
                                        onChange={(e) => setFormPaidAmount(e.target.value)}
                                    />
                                </div>
                            </div>
                            <div className={styles.formGroup}>
                                <label className={styles.formLabel}>Ghi chú</label>
                                <textarea
                                    className={styles.formTextarea}
                                    value={formNotes}
                                    onChange={(e) => setFormNotes(e.target.value)}
                                    rows={2}
                                />
                            </div>
                            <div className={styles.orderSummary}>
                                <div className={styles.summaryRow}>
                                    <span>Tạm tính:</span>
                                    <span>{formatCurrency(calculateSubtotal())}</span>
                                </div>
                                <div className={styles.summaryRow}>
                                    <span>Thuế:</span>
                                    <span>{formatCurrency(parseFloat(formTax) || 0)}</span>
                                </div>
                                <div className={styles.summaryRow}>
                                    <span>Giảm giá:</span>
                                    <span>-{formatCurrency(parseFloat(formDiscount) || 0)}</span>
                                </div>
                                <div className={`${styles.summaryRow} ${styles.total}`}>
                                    <span>Tổng cộng:</span>
                                    <span>{formatCurrency(calculateTotal())}</span>
                                </div>
                            </div>
                        </div>
                        <div className={styles.modalFooter}>
                            <button className={styles.cancelBtn} onClick={() => setShowModal(false)} disabled={saving}>HỦY</button>
                            <button className={styles.saveBtn} onClick={handleSave} disabled={saving}>
                                {saving ? 'Đang lưu...' : editingId ? '✓ CẬP NHẬT' : '✓ LƯU'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </>
    )
}
