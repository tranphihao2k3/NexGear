// ============================================================
// LTV — Admin Salary Page v3
// Workflow:
//   Tab 1: Ghi nhận hàng ngày → thưởng/phạt từng khoản
//   Tab 2: Tính lương cuối tháng → tổng hợp + tạo phiếu lương
// ============================================================
'use client'

import { useState, useEffect, useCallback, useMemo } from 'react'
import styles from './page.module.scss'
import { CyberpunkLoader, useToast } from '@/components/ui'

// ── TYPES ─────────────────────────────────────────────────
interface Employee {
    _id: string
    firstName: string
    lastName: string
    employeeCode: string
    position: string
    salary: number      // lương cứng
    leaveQuota: number  // số ngày phép/tháng
    status: string
    // User fields (khi map từ /api/users)
    name?: string
    role?: string
}

interface Transaction {
    _id: string
    employee: Employee
    type: 'bonus' | 'deduction' | 'other'
    amount: number
    label: string
    date: string
    month: number
    year: number
    isAddition?: boolean
}

interface SalaryRecord {
    _id: string
    employee: Employee
    month: number
    year: number
    baseSalary: number
    allowances: number
    bonuses: number
    deductions: number
    netSalary: number
    grossSalary: number
    status: 'draft' | 'pending' | 'paid' | 'cancelled'
    notes: string
}

// Gom transactions theo nhân viên cho tính lương
interface EmployeeSummary {
    employee: Employee
    baseSalary: number
    allowances: number
    bonuses: number
    deductions: number
    others: number
    // Phép nghỉ
    leaveQuota: number      // phép được cấp
    leaveUsed: number       // ngày nghỉ phép có phép
    absentDays: number      // ngày vắng không phép
    leaveDeduction: number  // tiền trừ do nghỉ quá
    netSalary: number
    txList: Transaction[]
    existingSalary?: SalaryRecord
}

// ── CONSTANTS ─────────────────────────────────────────────
const MONTHS = [
    'Tháng 1', 'Tháng 2', 'Tháng 3', 'Tháng 4', 'Tháng 5', 'Tháng 6',
    'Tháng 7', 'Tháng 8', 'Tháng 9', 'Tháng 10', 'Tháng 11', 'Tháng 12',
]

const STATUS_LABELS: Record<string, string> = {
    draft: 'Nháp', pending: 'Chờ duyệt', paid: 'Đã TT', cancelled: 'Đã hủy',
}
const STATUS_COLOR: Record<string, string> = {
    draft: 'gray', pending: 'orange', paid: 'green', cancelled: 'red',
}
const POS_LABELS: Record<string, string> = {
    admin: 'Admin', manager: 'Quản lý', sales: 'Bán hàng',
    technician: 'Kỹ thuật', accountant: 'Kế toán',
    warehouse: 'Kho', receptionist: 'Lễ tân',
}

function fmt(n: number, compact = false) {
    if (compact) {
        if (Math.abs(n) >= 1_000_000) return (n / 1_000_000).toFixed(1).replace(/\.0$/, '') + 'tr'
        if (Math.abs(n) >= 1_000) return Math.round(n / 1000) + 'k'
    }
    return new Intl.NumberFormat('vi-VN').format(n) + '₫'
}

function empName(e: Employee | null | undefined) {
    if (!e) return 'Nhân viên đã xóa'
    // Hỗ trợ cả User (name) lẫn Employee (firstName + lastName)
    if (e.name) return e.name
    return `${e.firstName || ''} ${e.lastName || ''}`.trim() || e.employeeCode || 'Chưa đặt tên'
}

// Parse "50k giao máy" → { amount: 50000, label: "giao máy" }
function parseQuick(text: string): { amount: number; label: string } | null {
    const t = text.trim()
    if (!t) return null
    const m = t.match(/^([\d.,]+)\s*(k|ngàn|nghìn|tr|triệu|m)?\s+(.+)$/i)
    if (!m) return null
    let amt = parseFloat(m[1].replace(/,/g, '.'))
    const unit = (m[2] || '').toLowerCase()
    if (unit === 'k' || unit === 'ngàn' || unit === 'nghìn') amt *= 1000
    if (unit === 'tr' || unit === 'triệu' || unit === 'm') amt *= 1_000_000
    return { amount: Math.round(amt), label: m[3].trim() }
}

// ── COMPONENT ─────────────────────────────────────────────
export default function AdminSalaryPage() {
    const { success, error: toastError } = useToast()
    const [tab, setTab] = useState<'log' | 'calc'>('log')

    const now = new Date()
    const [month, setMonth] = useState(now.getMonth() + 1)
    const [year, setYear] = useState(now.getFullYear())

    const [employees, setEmployees] = useState<Employee[]>([])
    const [transactions, setTransactions] = useState<Transaction[]>([])
    const [salaries, setSalaries] = useState<SalaryRecord[]>([])
    // attendanceMap: empId → { leaveUsed, absentDays }
    const [attendanceMap, setAttendanceMap] = useState<Record<string, { leaveUsed: number; absentDays: number }>>({})
    const [loading, setLoading] = useState(true)
    const [saving, setSaving] = useState(false)

    // Quick log form
    const [selEmployee, setSelEmployee] = useState('')
    const [quickType, setQuickType] = useState<'bonus' | 'deduction' | 'other'>('bonus')
    const [quickAmount, setQuickAmount] = useState('')   // số tiền
    const [quickLabel, setQuickLabel] = useState('')    // mô tả
    const [quickDate, setQuickDate] = useState(now.toISOString().split('T')[0])

    // Edit tx modal
    const [editTx, setEditTx] = useState<Transaction | null>(null)
    const [editLabel, setEditLabel] = useState('')
    const [editAmount, setEditAmount] = useState('')
    const [editType, setEditType] = useState<'bonus' | 'deduction' | 'other'>('bonus')
    const [editEmployeeId, setEditEmployeeId] = useState('')
    const [editIsAddition, setEditIsAddition] = useState(false)

    // Calc tab - selected employees to pay
    const [calcAllowances, setCalcAllowances] = useState<Record<string, string>>({})

    // ── FETCH ──────────────────────────────────────────────
    const fetchEmployees = useCallback(async () => {
        try {
            // Lấy tất cả users không phải customer (bao gồm superadmin, admin, manager, staff...)
            const res = await fetch('/api/users?limit=100')
            const json = await res.json()
            if (!json.success) return

            const users: any[] = (json.data || []).filter(
                (u: any) => u.role !== 'customer'
            )

            // Map User → Employee interface
            const mapped: Employee[] = users.map((u: any) => ({
                _id: u._id,
                name: u.name,
                firstName: u.name?.split(' ').slice(0, -1).join(' ') || u.name || '',
                lastName: u.name?.split(' ').pop() || '',
                employeeCode: u._id.slice(-6).toUpperCase(),
                position: u.role || 'staff',
                salary: u.baseSalary || 0,
                leaveQuota: u.leaveQuota || 2,
                status: 'active',
            }))
            setEmployees(mapped)
        } catch { }
    }, [])

    const fetchTransactions = useCallback(async () => {
        setLoading(true)
        try {
            // Lấy ngày đầu/cuối tháng để query attendance
            const startDate = new Date(year, month - 1, 1).toISOString().split('T')[0]
            const endDate = new Date(year, month, 0).toISOString().split('T')[0]

            const params = new URLSearchParams({ month: month.toString(), year: year.toString() })
            const [txRes, salRes, attRes] = await Promise.all([
                fetch(`/api/salary-transactions?${params}`).then(r => r.json()),
                fetch(`/api/salaries?month=${month}&year=${year}`).then(r => r.json()),
                // Lấy attendance để tính ngày nghỉ
                fetch(`/api/attendance?startDate=${startDate}&endDate=${endDate}&limit=1000`).then(r => r.json()),
            ])
            if (txRes.success) setTransactions(txRes.data)
            if (salRes.success) setSalaries(salRes.data)

            // Xử lý attendance → gộm theo employee
            if (attRes.success) {
                const map: Record<string, { leaveUsed: number; absentDays: number }> = {}
                for (const rec of attRes.data) {
                    const eid = rec.employee?._id || rec.employee
                    if (!eid) continue
                    if (!map[eid]) map[eid] = { leaveUsed: 0, absentDays: 0 }
                    if (rec.status === 'leave') map[eid].leaveUsed++
                    if (rec.status === 'absent') map[eid].absentDays++
                }
                setAttendanceMap(map)
            }
        } catch { } finally {
            setLoading(false)
        }
    }, [month, year])

    useEffect(() => { fetchEmployees() }, [fetchEmployees])
    useEffect(() => { fetchTransactions() }, [fetchTransactions])

    // ── LOG một khoản mới ─────────────────────────────────
    const handleQuickLog = async () => {
        if (!selEmployee) return toastError('Chọn nhân viên')
        const amt = Number(quickAmount)
        if (!amt || amt <= 0) return toastError('Nhập số tiền hợp lệ')
        if (!quickLabel.trim()) return toastError('Nhập mô tả khoản')

        try {
            const dateObj = new Date(quickDate)
            const isAdd = quickType === 'bonus'
            const res = await fetch('/api/salary-transactions', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    employee: selEmployee,
                    type: quickType,
                    amount: amt,
                    label: quickLabel.trim(),
                    date: dateObj.toISOString(),
                    month,
                    year,
                    isAddition: isAdd,
                }),
            })
            const json = await res.json()
            if (!json.success) throw new Error(json.error)
            success(`Đã ghi: ${isAdd ? '+' : '-'}${fmt(amt, true)} ${quickLabel.trim()}`)
            setQuickAmount('')
            setQuickLabel('')
            fetchTransactions()
        } catch (e: any) {
            toastError(e.message)
        }
    }

    // ── XÓA transaction ───────────────────────────────────
    const handleDeleteTx = async (id: string) => {
        if (!confirm('Xóa khoản này?')) return
        await fetch(`/api/salary-transactions/${id}`, { method: 'DELETE' })
        success('Đã xóa')
        fetchTransactions()
    }

    // ── SỬA transaction ───────────────────────────────────
    const openEdit = (tx: Transaction) => {
        setEditTx(tx)
        setEditLabel(tx.label)
        setEditAmount(tx.amount.toString())
        setEditType(tx.type)
        const empId = (tx.employee as any)?._id || tx.employee
        setEditEmployeeId(empId || '')
        setEditIsAddition(tx.isAddition ?? (tx.type === 'bonus'))
    }

    const handleSaveEdit = async () => {
        if (!editTx) return
        try {
            const res = await fetch(`/api/salary-transactions/${editTx._id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ 
                    type: editType, 
                    amount: Number(editAmount), 
                    label: editLabel, 
                    employee: editEmployeeId,
                    isAddition: editIsAddition
                }),
            })
            const json = await res.json()
            if (!json.success) throw new Error(json.error)
            success('Đã cập nhật')
            setEditTx(null)
            fetchTransactions()
        } catch (e: any) { toastError(e.message) }
    }

    // ── TÍNH LƯƠNG cuối tháng ─────────────────────────────
    // Gom transactions + attendance theo employee → tính lương
    const summaries = useMemo<EmployeeSummary[]>(() => {
        const map = new Map<string, EmployeeSummary>()

        // Init từ danh sách employees active
        for (const emp of employees) {
            const att = attendanceMap[emp._id] || { leaveUsed: 0, absentDays: 0 }
            const quota = emp.leaveQuota ?? 2

            // Ngày nghỉ quá phép = (leaveUsed - quota) nếu dương
            const overLeave = Math.max(0, att.leaveUsed - quota)
            // Ngày vắng không phép
            const absent = att.absentDays
            // Tổng ngày bị trừ lương
            const daysToDeduct = overLeave + absent
            // Tiền trừ: lương_cứng / 30 × số_ngày_trừ
            const leaveDeduction = Math.round((emp.salary / 30) * daysToDeduct)

            map.set(emp._id, {
                employee: emp,
                baseSalary: emp.salary || 0,
                allowances: 0,
                bonuses: 0,
                deductions: 0,
                others: 0,
                leaveQuota: quota,
                leaveUsed: att.leaveUsed,
                absentDays: absent,
                leaveDeduction,
                netSalary: 0,
                txList: [],
                existingSalary: salaries.find(s => {
                    if (!s.employee) return false
                    const sEmp = s.employee as any
                    return (sEmp?._id || sEmp) === emp._id
                }),
            })
        }

        // Cộng transactions vào
        for (const tx of transactions) {
            const empId = (tx.employee as any)?._id || tx.employee
            if (!map.has(empId)) continue
            const s = map.get(empId)!
            s.txList.push(tx)
            const isAdd = tx.isAddition ?? (tx.type === 'bonus')
            if (isAdd) s.bonuses += tx.amount
            else {
                if (tx.type === 'bonus') s.bonuses -= tx.amount // case hiếm: thưởng nhưng lại chọn trừ
                else if (tx.type === 'deduction') s.deductions += tx.amount
                else s.others += tx.amount
            }
        }

        // Tính net (deductions bao gồm cả leaveDeduction)
        for (const s of map.values()) {
            const allowance = Number(calcAllowances[s.employee._id] || 0)
            s.allowances = allowance
            const totalDeduct = s.deductions + s.others + s.leaveDeduction
            s.netSalary = s.baseSalary + allowance + s.bonuses - totalDeduct
        }

        return Array.from(map.values())
            .filter(s => s.txList.length > 0 || s.baseSalary > 0)
            .sort((a, b) => empName(a.employee).localeCompare(empName(b.employee), 'vi'))
    }, [employees, transactions, salaries, calcAllowances, attendanceMap])

    const handlePayEmployee = async (summary: EmployeeSummary) => {
        setSaving(true)
        try {
            const totalDeduct = summary.deductions + summary.leaveDeduction
            const payload = {
                employee: summary.employee._id,
                month,
                year,
                baseSalary: summary.baseSalary,
                allowances: summary.allowances,
                bonuses: summary.bonuses,
                deductions: summary.deductions + summary.others + summary.leaveDeduction,
                // Phép nghỉ
                leaveQuota: summary.leaveQuota,
                leaveUsed: summary.leaveUsed,
                absentDays: summary.absentDays,
                leaveDeduction: summary.leaveDeduction,
                grossSalary: summary.baseSalary + summary.allowances + summary.bonuses,
                netSalary: summary.netSalary,
                workingDays: 26,
                actualWorkingDays: 26 - summary.absentDays - summary.leaveUsed,
                overtimeHours: 0,
                status: 'paid',
                notes: JSON.stringify({
                    items: summary.txList.map(t => ({
                        id: t._id,
                        label: `${new Date(t.date).getDate()}/${month}: ${t.label}`,
                        amount: t.amount,
                        type: t.type,
                    })),
                    note: '',
                }),
            }

            const existing = summary.existingSalary
            let res
            if (existing) {
                res = await fetch(`/api/salaries/${existing._id}`, {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(payload),
                })
            } else {
                res = await fetch('/api/salaries', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(payload),
                })
            }
            const json = await res.json()
            if (!json.success) throw new Error(json.error)
            success(`Đã tính lương ${empName(summary.employee)}: ${fmt(summary.netSalary)}`)
            fetchTransactions()
        } catch (e: any) {
            toastError(e.message)
        } finally {
            setSaving(false)
        }
    }

    const handlePayAll = async () => {
        if (!confirm(`Tính lương tất cả ${summaries.length} nhân viên tháng ${month}/${year}?`)) return
        setSaving(true)
        for (const s of summaries) {
            await handlePayEmployee(s)
        }
        setSaving(false)
        success(`Đã tính lương ${summaries.length} nhân viên`)
    }

    // Filter transactions theo nhân viên đang chọn (tab log)
    const filteredTx = useMemo(() => {
        if (!selEmployee) return transactions
        return transactions.filter(t => {
            const tid = (t.employee as any)?._id || t.employee
            return tid === selEmployee
        })
    }, [transactions, selEmployee])

    const totalBonus = transactions.filter(t => t.type === 'bonus').reduce((s, t) => s + t.amount, 0)
    const totalDeduct = transactions.filter(t => t.type === 'deduction').reduce((s, t) => s + t.amount, 0)
    const totalOther = transactions.filter(t => t.type === 'other').reduce((s, t) => s + t.amount, 0)

    // ── RENDER ────────────────────────────────────────────
    return (
        <>
            {/* ── HEADER ── */}
            <div className={styles.header}>
                <div className={styles.headerLeft}>
                    <h1>Lương nhân viên</h1>
                    <div className={styles.periodPicker}>
                        <select className={styles.filterSelect} value={month}
                            onChange={e => setMonth(Number(e.target.value))}>
                            {MONTHS.map((m, i) => <option key={i} value={i + 1}>{m}</option>)}
                        </select>
                        <select className={styles.filterSelect} value={year}
                            onChange={e => setYear(Number(e.target.value))}>
                            {[2024, 2025, 2026, 2027].map(y => <option key={y} value={y}>{y}</option>)}
                        </select>
                    </div>
                </div>
                <div className={styles.tabs}>
                    <button className={`${styles.tab} ${tab === 'log' ? styles.tabActive : ''}`}
                        onClick={() => setTab('log')}>
                        📋 Ghi nhận hàng ngày
                    </button>
                    <button className={`${styles.tab} ${tab === 'calc' ? styles.tabActive : ''}`}
                        onClick={() => setTab('calc')}>
                        💰 Tính lương cuối tháng
                    </button>
                </div>
            </div>

            {/* ── SUMMARY BAR ── */}
            <div className={styles.summaryBar}>
                <div className={styles.summaryItem}>
                    <span className={styles.sLabel}>Khoản ghi tháng này</span>
                    <span className={styles.sVal}>{transactions.length}</span>
                </div>
                <div className={`${styles.summaryItem} ${styles.green}`}>
                    <span className={styles.sLabel}>Tổng thưởng</span>
                    <span className={styles.sVal}>+{fmt(totalBonus, true)}</span>
                </div>
                <div className={`${styles.summaryItem} ${styles.red}`}>
                    <span className={styles.sLabel}>Tổng khấu trừ</span>
                    <span className={styles.sVal}>-{fmt(totalDeduct, true)}</span>
                </div>
                <div className={`${styles.summaryItem} ${styles.purple}`}>
                    <span className={styles.sLabel}>Mượn tiền/Khác</span>
                    <span className={styles.sVal}>±{fmt(totalOther, true)}</span>
                </div>
                <div className={`${styles.summaryItem} ${styles.cyan}`}>
                    <span className={styles.sLabel}>Phiếu lương đã tạo</span>
                    <span className={styles.sVal}>{salaries.length}</span>
                </div>
            </div>

            {loading ? <CyberpunkLoader message="Đang tải..." compact /> : (
                <>
                    {/* ════════════════════════════════════════════
                        TAB 1: GHI NHẬN HÀNG NGÀY
                    ════════════════════════════════════════════ */}
                    {tab === 'log' && (
                        <div className={styles.logTab}>
                            {/* Quick log form */}
                            <div className={styles.logForm}>
                                <div className={styles.logFormTitle}>⚡ Ghi nhanh khoản thưởng / phạt</div>
                                <div className={styles.logFormRow}>
                                    <select className={styles.empSelect} value={selEmployee}
                                        onChange={e => setSelEmployee(e.target.value)}>
                                        <option value="">-- Chọn nhân viên --</option>
                                        {employees.map(emp => (
                                            <option key={emp._id} value={emp._id}>
                                                {empName(emp)} — {fmt(emp.salary, true)}/tháng
                                            </option>
                                        ))}
                                    </select>
                                    <select className={`${styles.typeSelect} ${styles[quickType]}`}
                                        value={quickType}
                                        onChange={e => setQuickType(e.target.value as 'bonus' | 'deduction' | 'other')}>
                                        <option value="bonus">+ Thưởng</option>
                                        <option value="deduction">− Phạt / Trừ</option>
                                        <option value="other">± Khoản khác</option>
                                    </select>
                                    {/* Ô tiền riêng */}
                                    <input
                                        className={styles.amountInput}
                                        type="number"
                                        placeholder="Số tiền (VNĐ)"
                                        min="0"
                                        step="1000"
                                        value={quickAmount}
                                        onChange={e => setQuickAmount(e.target.value)}
                                        onKeyDown={e => e.key === 'Enter' && handleQuickLog()}
                                    />
                                    {/* Ô mô tả riêng */}
                                    <input
                                        className={styles.quickInput}
                                        type="text"
                                        placeholder="Mô tả... (giao máy, thưởng tối, vệ sinh...)"
                                        value={quickLabel}
                                        onChange={e => setQuickLabel(e.target.value)}
                                        onKeyDown={e => e.key === 'Enter' && handleQuickLog()}
                                    />
                                    <input type="date" className={styles.dateInput}
                                        value={quickDate}
                                        onChange={e => setQuickDate(e.target.value)} />
                                    <button className={styles.logBtn} onClick={handleQuickLog}>
                                        GHI LẠI
                                    </button>
                                </div>

                            </div>

                            {/* Filter by employee */}
                            <div className={styles.txHeader}>
                                <span className={styles.txTitle}>
                                    Danh sách khoản ({filteredTx.length})
                                    {selEmployee && (
                                        <button className={styles.clearFilter} onClick={() => setSelEmployee('')}>
                                            &nbsp; xem tất cả ✕
                                        </button>
                                    )}
                                </span>
                            </div>

                            {/* Transaction list */}
                            {filteredTx.length === 0 ? (
                                <div className={styles.empty}>
                                    <div className={styles.emptyIcon}>📋</div>
                                    Chưa có khoản nào được ghi trong tháng {month}/{year}
                                </div>
                            ) : (
                                <div className={styles.txList}>
                                    {filteredTx.map(tx => {
                                        const emp = tx.employee as any
                                        const d = new Date(tx.date)
                                        return (
                                            <div key={tx._id} className={`${styles.txCard} ${tx.type === 'bonus' ? styles.bonus : (tx.type === 'other' ? styles.otherTx : styles.deduction)}`}>
                                                <div className={styles.txDate}>
                                                    {d.getDate()}/{d.getMonth() + 1}
                                                </div>
                                                <div className={styles.txEmp}>
                                                    <div className={styles.txEmpName}>{empName(emp)}</div>
                                                    <div className={styles.txEmpRole}>
                                                        {emp ? (POS_LABELS[emp.position] || emp.position) : '-'}
                                                    </div>
                                                </div>
                                                <div className={styles.txLabel}>{tx.label}</div>
                                                <div className={`${styles.txAmount} ${styles[tx.type]}`}>
                                                    {(tx.isAddition ?? (tx.type === 'bonus')) ? '+' : '-'}{fmt(tx.amount, true)}
                                                </div>
                                                <div className={styles.txActions}>
                                                    <button className={styles.txBtn} onClick={() => openEdit(tx)}>✏️</button>
                                                    <button className={`${styles.txBtn} ${styles.del}`}
                                                        onClick={() => handleDeleteTx(tx._id)}>🗑</button>
                                                </div>
                                            </div>
                                        )
                                    })}
                                </div>
                            )}
                        </div>
                    )}

                    {/* ════════════════════════════════════════════
                        TAB 2: TÍNH LƯƠNG CUỐI THÁNG
                    ════════════════════════════════════════════ */}
                    {tab === 'calc' && (
                        <div className={styles.calcTab}>
                            <div className={styles.calcActions}>
                                <div className={styles.calcInfo}>
                                    Tổng hợp {summaries.length} nhân viên — {MONTHS[month - 1]} {year}
                                </div>
                                <button className={styles.payAllBtn} onClick={handlePayAll} disabled={saving || summaries.length === 0}>
                                    {saving ? 'Đang lưu...' : `💰 Tính lương tất cả (${summaries.length} NV)`}
                                </button>
                            </div>

                            {summaries.length === 0 ? (
                                <div className={styles.empty}>
                                    <div className={styles.emptyIcon}>👥</div>
                                    Chưa có nhân viên hoặc khoản ghi nào trong tháng này
                                </div>
                            ) : (
                                <div className={styles.calcList}>
                                    {summaries.map(s => {
                                        const paid = s.existingSalary?.status === 'paid'
                                        const bonusTx = s.txList.filter(t => t.type === 'bonus')
                                        const deductTx = s.txList.filter(t => t.type === 'deduction')
                                        const otherTx = s.txList.filter(t => t.type === 'other')
                                        return (
                                            <div key={s.employee._id} className={`${styles.calcCard} ${paid ? styles.paid : ''}`}>
                                                {/* Header nhân viên */}
                                                <div className={styles.calcCardHeader}>
                                                    <div className={styles.calcEmpInfo}>
                                                        <div className={styles.calcAvatar}>
                                                            {(s.employee.firstName || s.employee.name || '?').charAt(0)}
                                                        </div>
                                                        <div>
                                                            <div className={styles.calcEmpName}>{empName(s.employee)}</div>
                                                            <div className={styles.calcEmpSub}>
                                                                {s.employee.position ? (POS_LABELS[s.employee.position] || s.employee.position) : 'staff'} &nbsp;·&nbsp;
                                                                Lương CB: {fmt(s.baseSalary)}
                                                            </div>
                                                            {/* Phép nghỉ badges */}
                                                            <div className={styles.leaveBadges}>
                                                                <span className={styles.leaveTag}>
                                                                    📅 Phép: {s.leaveUsed}/{s.leaveQuota} ngày
                                                                </span>
                                                                {s.absentDays > 0 && (
                                                                    <span className={`${styles.leaveTag} ${styles.absentTag}`}>
                                                                        ⚠️ Vắng: {s.absentDays} ngày
                                                                    </span>
                                                                )}
                                                                {s.leaveDeduction > 0 && (
                                                                    <span className={`${styles.leaveTag} ${styles.deductTag}`}>
                                                                        −{fmt(s.leaveDeduction, true)} nghỉ quá phép
                                                                    </span>
                                                                )}
                                                            </div>
                                                        </div>
                                                    </div>
                                                    <div className={styles.calcCardRight}>
                                                        {paid && (
                                                            <span className={`${styles.status} ${styles.green}`}>✓ Đã TT</span>
                                                        )}
                                                        <button
                                                            className={styles.payBtn}
                                                            onClick={() => handlePayEmployee(s)}
                                                            disabled={saving}>
                                                            {paid ? '↻ Cập nhật' : '✓ Tính lương'}
                                                        </button>
                                                    </div>
                                                </div>

                                                {/* Chi tiết khoản */}
                                                <div className={styles.calcDetail}>
                                                    <div className={styles.calcColums}>
                                                        {/* Thưởng */}
                                                        <div className={styles.calcCol}>
                                                            <div className={styles.calcColTitle}>
                                                                <span className={styles.bonusDot} /> Thưởng ({bonusTx.length})
                                                            </div>
                                                            {bonusTx.length === 0 ? (
                                                                <div className={styles.noItems}>Không có</div>
                                                            ) : (
                                                                bonusTx.map(t => (
                                                                    <div key={t._id} className={styles.calcItem}>
                                                                        <span className={styles.calcItemDate}>
                                                                            {new Date(t.date).getDate()}/{month}
                                                                        </span>
                                                                        <span className={styles.calcItemLabel}>{t.label}</span>
                                                                        <span className={styles.calcItemAmt + ' ' + styles.bonusAmt}>
                                                                            {(t.isAddition ?? true) ? '+' : '-'}{fmt(t.amount, true)}
                                                                        </span>
                                                                    </div>
                                                                ))
                                                            )}
                                                            {bonusTx.length > 0 && (
                                                                <div className={styles.calcSubtotal}>
                                                                    <span>Tổng thưởng</span>
                                                                    <span className={styles.bonusAmt}>+{fmt(s.bonuses)}</span>
                                                                </div>
                                                            )}
                                                        </div>

                                                        {/* Khấu trừ */}
                                                        <div className={styles.calcCol}>
                                                            <div className={styles.calcColTitle}>
                                                                <span className={styles.deductDot} /> Khấu trừ ({deductTx.length})
                                                            </div>
                                                            {deductTx.length === 0 ? (
                                                                <div className={styles.noItems}>Không có</div>
                                                            ) : (
                                                                deductTx.map(t => (
                                                                    <div key={t._id} className={styles.calcItem}>
                                                                        <span className={styles.calcItemDate}>
                                                                            {new Date(t.date).getDate()}/{month}
                                                                        </span>
                                                                        <span className={styles.calcItemLabel}>{t.label}</span>
                                                                        <span className={styles.calcItemAmt + ' ' + styles.deductAmt}>
                                                                            {(t.isAddition ?? false) ? '+' : '-'}{fmt(t.amount, true)}
                                                                        </span>
                                                                    </div>
                                                                ))
                                                            )}
                                                            {deductTx.length > 0 && (
                                                                <div className={styles.calcSubtotal}>
                                                                    <span>Tổng trừ</span>
                                                                    <span className={styles.deductAmt}>-{fmt(s.deductions)}</span>
                                                                </div>
                                                            )}
                                                        </div>

                                                        {/* Khoản khác */}
                                                        {otherTx.length > 0 && (
                                                            <div className={styles.calcCol}>
                                                                <div className={styles.calcColTitle}>
                                                                    <span className={styles.otherDot} /> Của chủ / Khác ({otherTx.length})
                                                                </div>
                                                                {otherTx.map(t => (
                                                                    <div key={t._id} className={styles.calcItem}>
                                                                        <span className={styles.calcItemDate}>
                                                                            {new Date(t.date).getDate()}/{month}
                                                                        </span>
                                                                        <span className={styles.calcItemLabel}>{t.label}</span>
                                                                        <span className={styles.calcItemAmt + ' ' + (t.isAddition ? styles.bonusAmt : styles.otherAmt)}>
                                                                            {t.isAddition ? '+' : '−'}{fmt(t.amount, true)}
                                                                        </span>
                                                                    </div>
                                                                ))}
                                                                <div className={styles.calcSubtotal}>
                                                                    <span>Tổng mượn/khác</span>
                                                                    <span className={styles.otherAmt}>−{fmt(s.others)}</span>
                                                                </div>
                                                            </div>
                                                        )}
                                                    </div>

                                                    {/* Phụ cấp */}
                                                    <div className={styles.allowanceRow}>
                                                        <label className={styles.allowanceLabel}>Phụ cấp tháng này (chuyên cần, v.v.):</label>
                                                        <input
                                                            className={styles.allowanceInput}
                                                            type="number"
                                                            placeholder="0"
                                                            value={calcAllowances[s.employee._id] || ''}
                                                            onChange={e => setCalcAllowances(prev => ({
                                                                ...prev,
                                                                [s.employee._id]: e.target.value,
                                                            }))}
                                                        />
                                                        <span className={styles.mono}>₫</span>
                                                    </div>

                                                    {/* Tổng */}
                                                    <div className={styles.calcTotal}>
                                                        <div className={styles.calcTotalRow}>
                                                            <span>Lương CB</span>
                                                            <span className={styles.mono}>{fmt(s.baseSalary)}</span>
                                                        </div>
                                                        {s.allowances > 0 && (
                                                            <div className={styles.calcTotalRow}>
                                                                <span>Phụ cấp</span>
                                                                <span className={styles.mono}>{fmt(s.allowances)}</span>
                                                            </div>
                                                        )}
                                                        <div className={`${styles.calcTotalRow} ${styles.bonus}`}>
                                                            <span>Thưởng ({s.txList.filter(t=>t.type==='bonus').length} khoản)</span>
                                                            <span className={`${styles.mono} ${styles.bonusAmt}`}>+{fmt(s.bonuses)}</span>
                                                        </div>
                                                        {s.deductions > 0 && (
                                                            <div className={`${styles.calcTotalRow} ${styles.deduct}`}>
                                                                <span>Khấu trừ ({s.txList.filter(t=>t.type==='deduction').length} khoản)</span>
                                                                <span className={`${styles.mono} ${styles.deductAmt}`}>-{fmt(s.deductions)}</span>
                                                            </div>
                                                        )}
                                                        {/* Trừ nghỉ quá phép */}
                                                        {s.leaveDeduction > 0 && (
                                                            <div className={`${styles.calcTotalRow} ${styles.deduct}`}>
                                                                <span>
                                                                    📅 Nghỉ quá phép
                                                                    {' '}({Math.max(0, s.leaveUsed - s.leaveQuota) + s.absentDays} ngày × {fmt(Math.round(s.baseSalary/30), true)}/ngày)
                                                                </span>
                                                                <span className={styles.mono}>−{fmt(s.deductions + s.leaveDeduction)}</span>
                                                            </div>
                                                        )}
                                                        {s.others > 0 && (
                                                            <div className={`${styles.calcTotalRow} ${styles.deduct}`}>
                                                                <span>Mượn tiền/Khác</span>
                                                                <span className={styles.mono}>−{fmt(s.others)}</span>
                                                            </div>
                                                        )}
                                                        <div className={styles.calcDivider} />
                                                        <div className={`${styles.calcTotalRow} ${styles.netRow}`}>
                                                            <span>💰 Thực nhận</span>
                                                            <span className={`${styles.mono} ${styles.netAmt}`}>{fmt(s.netSalary)}</span>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        )
                                    })}
                                </div>
                            )}
                        </div>
                    )}
                </>
            )}

            {/* ── EDIT MODAL ── */}
            {editTx && (
                <div className={styles.overlay} onClick={() => setEditTx(null)}>
                    <div className={styles.editModal} onClick={e => e.stopPropagation()}>
                        <div className={styles.editHeader}>
                            <span>Sửa khoản</span>
                            <button onClick={() => setEditTx(null)}>✕</button>
                        </div>
                        <div className={styles.editBody}>
                            <label className={styles.logHint}>Gán cho nhân viên:</label>
                            <select className={styles.formInput} value={editEmployeeId}
                                onChange={e => setEditEmployeeId(e.target.value)}>
                                <option value="">-- Chọn nhân viên --</option>
                                {employees.map(emp => (
                                    <option key={emp._id} value={emp._id}>{empName(emp)}</option>
                                ))}
                            </select>

                            <label className={styles.logHint}>Loại & Phép tính:</label>
                            <div className={styles.typeRow}>
                                <select className={styles.formInput} value={editType}
                                    onChange={e => {
                                        const val = e.target.value as any
                                        setEditType(val)
                                        if (val === 'bonus') setEditIsAddition(true)
                                        else if (val === 'deduction') setEditIsAddition(false)
                                    }}>
                                    <option value="bonus">Thưởng</option>
                                    <option value="deduction">Khấu trừ</option>
                                    <option value="other">Khoản khác</option>
                                </select>

                                <div className={styles.mathToggle}>
                                    <button 
                                        className={`${styles.mathBtn} ${editIsAddition ? styles.activeAdd : ''}`}
                                        onClick={() => setEditIsAddition(true)}
                                        title="Cộng vào lương"
                                    >+</button>
                                    <button 
                                        className={`${styles.mathBtn} ${!editIsAddition ? styles.activeSub : ''}`}
                                        onClick={() => setEditIsAddition(false)}
                                        title="Trừ vào lương"
                                    >−</button>
                                </div>
                            </div>
                            <input className={styles.formInput} placeholder="Mô tả"
                                value={editLabel} onChange={e => setEditLabel(e.target.value)} />
                            <input className={styles.formInput} type="number" placeholder="Số tiền"
                                value={editAmount} onChange={e => setEditAmount(e.target.value)} />
                        </div>
                        <div className={styles.editFooter}>
                            <button className={styles.cancelBtn} onClick={() => setEditTx(null)}>Hủy</button>
                            <button className={styles.saveBtn} onClick={handleSaveEdit}>Lưu</button>
                        </div>
                    </div>
                </div>
            )}
        </>
    )
}
