// ============================================================
// NEXGEAR — Admin Product Units (Serial Numbers) Page
// ============================================================
'use client'

import { useState, useEffect, useCallback } from 'react'
import styles from './page.module.scss'
import { CyberpunkLoader, useToast } from '@/components/ui'

interface Product { _id: string; name: string; sku: string }
interface Warehouse { _id: string; name: string }

const CONDITIONS = [
    { value: 'new', label: 'Mới' }, { value: 'like_new', label: 'Như mới' },
    { value: 'customer_new', label: 'Khách để lại' }, { value: 'good', label: 'Tốt' },
    { value: 'fair', label: 'Trung bình' }, { value: 'poor', label: 'Kém' },
]
const STATUSES = [
    { value: 'available', label: 'Còn hàng' }, { value: 'reserved', label: 'Đã đặt' },
    { value: 'sold', label: 'Đã bán' }, { value: 'service', label: 'Đang sửa' },
    { value: 'returned', label: 'Trả lại' }, { value: 'scrapped', label: 'Thanh lý' },
]
const SOURCES = [
    { value: 'import', label: 'Nhập hàng' }, { value: 'trade_sell', label: 'Thu cũ' }, { value: 'repair', label: 'Sửa chữa' },
]

function formatCurrency(amount: number) {
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(amount)
}

export default function AdminProductUnitsPage() {
    const { success, error } = useToast()
    const [units, setUnits] = useState<any[]>([])
    const [products, setProducts] = useState<Product[]>([])
    const [warehouses, setWarehouses] = useState<Warehouse[]>([])
    const [loading, setLoading] = useState(true)
    const [showModal, setShowModal] = useState(false)
    const [saving, setSaving] = useState(false)
    const [editingId, setEditingId] = useState<string | null>(null)
    const [filterStatus, setFilterStatus] = useState('')
    const [filterCondition, setFilterCondition] = useState('')
    const [search, setSearch] = useState('')
    const [formProduct, setFormProduct] = useState('')
    const [formSerial, setFormSerial] = useState('')
    const [formBarcode, setFormBarcode] = useState('')
    const [formWarehouse, setFormWarehouse] = useState('')
    const [formCondition, setFormCondition] = useState('new')
    const [formPurchasePrice, setFormPurchasePrice] = useState('')
    const [formSellingPrice, setFormSellingPrice] = useState('')
    const [formStatus, setFormStatus] = useState('available')
    const [formSource, setFormSource] = useState('import')

    const fetchProducts = useCallback(async () => {
        try {
            const res = await fetch('/api/products?limit=200')
            const json = await res.json()
            if (json.success) setProducts(json.data)
        } catch (err) { console.error('Failed to fetch products:', err) }
    }, [])

    const fetchWarehouses = useCallback(async () => {
        try {
            const res = await fetch('/api/warehouses?limit=100')
            const json = await res.json()
            if (json.success) setWarehouses(json.data)
        } catch (err) { console.error('Failed to fetch warehouses:', err) }
    }, [])

    const fetchUnits = useCallback(async () => {
        setLoading(true)
        try {
            const params = new URLSearchParams()
            if (filterStatus) params.set('status', filterStatus)
            if (filterCondition) params.set('condition', filterCondition)
            if (search) params.set('search', search)
            params.set('limit', '100')
            const res = await fetch(`/api/product-units?${params}`)
            const json = await res.json()
            if (json.success) setUnits(json.data)
        } catch (err) { console.error('Failed to fetch units:', err) }
        finally { setLoading(false) }
    }, [filterStatus, filterCondition, search])

    useEffect(() => { fetchProducts() }, [fetchProducts])
    useEffect(() => { fetchWarehouses() }, [fetchWarehouses])
    useEffect(() => { fetchUnits() }, [fetchUnits])

    const resetForm = () => {
        setEditingId(null); setFormProduct(''); setFormSerial(''); setFormBarcode('')
        setFormWarehouse(''); setFormCondition('new'); setFormPurchasePrice('')
        setFormSellingPrice(''); setFormStatus('available'); setFormSource('import')
    }

    const openAddModal = () => { resetForm(); setShowModal(true) }

    const openEditModal = (unit: any) => {
        setEditingId(unit._id); setFormProduct(unit.product?._id || '')
        setFormSerial(unit.serialNumber); setFormBarcode(unit.barcode || '')
        setFormWarehouse(unit.warehouse?._id || ''); setFormCondition(unit.condition)
        setFormPurchasePrice(unit.purchasePrice?.toString() || '')
        setFormSellingPrice(unit.sellingPrice?.toString() || '')
        setFormStatus(unit.status); setFormSource(unit.source || 'import')
        setShowModal(true)
    }

    const handleSave = async () => {
        if (!formProduct || !formSerial) return error('Vui lòng nhập sản phẩm và serial')
        setSaving(true)
        try {
            const payload = {
                product: formProduct, serialNumber: formSerial.toUpperCase(),
                barcode: formBarcode || null, warehouse: formWarehouse || null,
                condition: formCondition, purchasePrice: parseFloat(formPurchasePrice) || 0,
                sellingPrice: parseFloat(formSellingPrice) || 0, status: formStatus, source: formSource,
            }
            const res = await fetch(editingId ? `/api/product-units/${editingId}` : '/api/product-units', {
                method: editingId ? 'PUT' : 'POST', headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload),
            })
            const json = await res.json()
            if (!json.success) throw new Error(json.error || 'Lưu thất bại')
            success(editingId ? 'Đã cập nhật' : 'Đã thêm serial')
            setShowModal(false); resetForm(); fetchUnits()
        } catch (e: any) { error(e.message) }
        finally { setSaving(false) }
    }

    const handleDelete = async (unit: any) => {
        if (!confirm(`Xóa serial ${unit.serialNumber}?`)) return
        try {
            const res = await fetch(`/api/product-units/${unit._id}`, { method: 'DELETE' })
            const json = await res.json()
            if (json.success) { success('Đã xóa'); fetchUnits() }
            else error(json.error || 'Xóa thất bại')
        } catch { error('Lỗi kết nối') }
    }

    const getStatusColor = (s: string) => ({ available: 'green', reserved: 'blue', sold: 'gray', service: 'orange', returned: 'red', scrapped: 'gray' }[s] || 'gray')
    const totalValue = units.reduce((sum, u) => sum + (u.sellingPrice || 0), 0)

    return (
        <>
            <div className={styles.header}>
                <div className={styles.headerLeft}>
                    <h1>Quản lý Serial</h1>
                    <div className={styles.filterGroup}>
                        <input type="text" className={styles.searchInput} placeholder="Tìm..." value={search} onChange={e => setSearch(e.target.value)} />
                        <select className={styles.filterSelect} value={filterStatus} onChange={e => setFilterStatus(e.target.value)}>
                            <option value="">Trạng thái</option>
                            {STATUSES.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
                        </select>
                        <select className={styles.filterSelect} value={filterCondition} onChange={e => setFilterCondition(e.target.value)}>
                            <option value="">Tình trạng</option>
                            {CONDITIONS.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
                        </select>
                    </div>
                </div>
                <button className={styles.addBtn} onClick={openAddModal}>+ THÊM SERIAL</button>
            </div>
            <div className={styles.summary}>
                <div className={styles.summaryItem}><span className={styles.summaryLabel}>Tổng</span><span className={styles.summaryValue}>{units.length}</span></div>
                <div className={styles.summaryItem}><span className={styles.summaryLabel}>Còn hàng</span><span className={`${styles.summaryValue} ${styles.green}`}>{units.filter(u => u.status === 'available').length}</span></div>
                <div className={styles.summaryItem}><span className={styles.summaryLabel}>Giá trị</span><span className={styles.summaryValue}>{formatCurrency(totalValue)}</span></div>
            </div>
            {loading ? <CyberpunkLoader message="Đang tải..." compact /> : units.length === 0 ? <div style={{textAlign:'center',padding:'40px',color:'rgba(255,255,255,0.5)'}}>Chưa có serial</div> : (
                <div className={styles.tableWrapper}>
                    <table className={styles.table}>
                        <thead><tr><th>Serial</th><th>Sản phẩm</th><th>Kho</th><th>Tình trạng</th><th>Giá bán</th><th>Trạng thái</th><th>Thao tác</th></tr></thead>
                        <tbody>
                            {units.map(unit => (
                                <tr key={unit._id}>
                                    <td className={styles.mono}>{unit.serialNumber}</td>
                                    <td>{unit.product?.name || '-'}</td>
                                    <td>{unit.warehouse?.name || '-'}</td>
                                    <td>{CONDITIONS.find(c => c.value === unit.condition)?.label || unit.condition}</td>
                                    <td className={styles.money}>{formatCurrency(unit.sellingPrice)}</td>
                                    <td><span className={`${styles.badge} ${styles[getStatusColor(unit.status)]}`}>{STATUSES.find(s => s.value === unit.status)?.label || unit.status}</span></td>
                                    <td><div className={styles.actions}><button className={styles.actionBtn} onClick={() => openEditModal(unit)}>✏️</button><button className={`${styles.actionBtn} ${styles.danger}`} onClick={() => handleDelete(unit)}>🗑️</button></div></td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}
            {showModal && (
                <div className={styles.modalOverlay} onClick={() => setShowModal(false)}>
                    <div className={styles.modal} onClick={e => e.stopPropagation()}>
                        <div className={styles.modalHeader}><span className={styles.modalTitle}>{editingId ? 'Sửa serial' : 'Thêm serial'}</span><button className={styles.modalClose} onClick={() => setShowModal(false)}>✕</button></div>
                        <div className={styles.modalBody}>
                            <div className={styles.formGroup}><label className={styles.formLabel}>Sản phẩm</label><select className={styles.formInput} value={formProduct} onChange={e => setFormProduct(e.target.value)}><option value="">-- Chọn --</option>{products.map(p => <option key={p._id} value={p._id}>{p.name}</option>)}</select></div>
                            <div className={styles.formRow}>
                                <div className={styles.formGroup}><label className={styles.formLabel}>Serial</label><input type="text" className={styles.formInput} value={formSerial} onChange={e => setFormSerial(e.target.value.toUpperCase())} /></div>
                                <div className={styles.formGroup}><label className={styles.formLabel}>Barcode</label><input type="text" className={styles.formInput} value={formBarcode} onChange={e => setFormBarcode(e.target.value)} /></div>
                            </div>
                            <div className={styles.formRow}>
                                <div className={styles.formGroup}><label className={styles.formLabel}>Kho</label><select className={styles.formInput} value={formWarehouse} onChange={e => setFormWarehouse(e.target.value)}><option value="">-- Chọn --</option>{warehouses.map(w => <option key={w._id} value={w._id}>{w.name}</option>)}</select></div>
                                <div className={styles.formGroup}><label className={styles.formLabel}>Nguồn</label><select className={styles.formInput} value={formSource} onChange={e => setFormSource(e.target.value)}>{SOURCES.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}</select></div>
                            </div>
                            <div className={styles.formRow}>
                                <div className={styles.formGroup}><label className={styles.formLabel}>Tình trạng</label><select className={styles.formInput} value={formCondition} onChange={e => setFormCondition(e.target.value)}>{CONDITIONS.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}</select></div>
                                <div className={styles.formGroup}><label className={styles.formLabel}>Trạng thái</label><select className={styles.formInput} value={formStatus} onChange={e => setFormStatus(e.target.value)}>{STATUSES.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}</select></div>
                            </div>
                            <div className={styles.formRow}>
                                <div className={styles.formGroup}><label className={styles.formLabel}>Giá mua</label><input type="number" className={styles.formInput} value={formPurchasePrice} onChange={e => setFormPurchasePrice(e.target.value)} /></div>
                                <div className={styles.formGroup}><label className={styles.formLabel}>Giá bán</label><input type="number" className={styles.formInput} value={formSellingPrice} onChange={e => setFormSellingPrice(e.target.value)} /></div>
                            </div>
                        </div>
                        <div className={styles.modalFooter}><button className={styles.cancelBtn} onClick={() => setShowModal(false)} disabled={saving}>HỦY</button><button className={styles.saveBtn} onClick={handleSave} disabled={saving}>{saving ? 'Đang lưu...' : editingId ? 'CẬP NHẬT' : 'LƯU'}</button></div>
                    </div>
                </div>
            )}
        </>
    )
}
