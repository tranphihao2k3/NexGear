// ============================================================
// NEXGEAR — Admin Salary Page
// ============================================================
'use client'

import { useState, useEffect, useCallback } from 'react'
import styles from './page.module.scss'
import { CyberpunkLoader, useToast } from '@/components/ui'

interface Employee {
    _id: string
    name: string
    email: string
    role: string
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
    workingDays: number
    actualWorkingDays: number
    overtimeHours: number
    grossSalary: number
    netSalary: number
    status: 'draft' | 'pending' | 'paid' | 'cancelled'
    paidDate?: string
    notes: string
}

const STATUS_LABELS: Record<string, string> = {
    draft: 'Nháp',
    pending: 'Chờ duyệt',
    paid: 'Đã thanh toán',
    cancelled: 'Đã hủy',
}

const STATUS_COLORS: Record<string, string> = {
    draft: 'gray',
    pending: 'orange',
    paid: 'green',
    cancelled: 'red',
}

const MONTHS = [
    'Tháng 1', 'Tháng 2', 'Tháng 3', 'Tháng 4', 'Tháng 5', 'Tháng 6',
    'Tháng 7', 'Tháng 8', 'Tháng 9', 'Tháng 10', 'Tháng 11', 'Tháng 12'
]

function formatCurrency(amount: number) {
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(amount)
}

export default function AdminSalaryPage() {
    const { success, error } = useToast()
    const [salaries, setSalaries] = useState<SalaryRecord[]>([])
    const [employees, setEmployees] = useState<Employee[]>([])
    const [loading, setLoading] = useState(true)
    const [showModal, setShowModal] = useState(false)
    const [saving, setSaving] = useState(false)
    const [editingId, setEditingId] = useState<string | null>(null)

    const [filterMonth, setFilterMonth] = useState(new Date().getMonth() + 1)
    const [filterYear, setFilterYear] = useState(new Date().getFullYear())

    const [formEmployee, setFormEmployee] = useState('')
    const [formMonth, setFormMonth] = useState(new Date().getMonth() + 1)
    const [formYear, setFormYear] = useState(new Date().getFullYear())
    const [formBaseSalary, setFormBaseSalary] = useState('')
    const [formAllowances, setFormAllowances] = useState('0')
    const [formBonuses, setFormBonuses] = useState('0')
    const [formDeductions, setFormDeductions] = useState('0')
    const [formWorkingDays, setFormWorkingDays] = useState('22')
    const [formActualWorkingDays, setFormActualWorkingDays] = useState('22')
    const [formOvertimeHours, setFormOvertimeHours] = useState('0')
    const [formStatus, setFormStatus] = useState('draft')
    const [formNotes, setFormNotes] = useState('')

    const fetchEmployees = useCallback(async () => {
        try {
            const roles = ['admin', 'manager', 'staff', 'cashier']
            const results = await Promise.all(
                roles.map(async (role) => {
                    const res = await fetch(`/api/users?role=${role}&limit=50`)
                    const json = await res.json()
                    return json.success ? json.data : []
                })
            )
            setEmployees(results.flat())
        } catch (err) {
            console.error('Failed to fetch employees:', err)
        }
    }, [])

    const fetchSalaries = useCallback(async () => {
        setLoading(true)
        try {
            const params = new URLSearchParams({
                month: filterMonth.toString(),
                year: filterYear.toString(),
            })
            const res = await fetch(`/api/salaries?${params}`)
            const json = await res.json()
            if (json.success) {
                setSalaries(json.data)
            }
        } catch (err) {
            console.error('Failed to fetch salaries:', err)
        } finally {
            setLoading(false)
        }
    }, [filterMonth, filterYear])

    useEffect(() => { fetchEmployees() }, [fetchEmployees])
    useEffect(() => { fetchSalaries() }, [fetchSalaries])

    const resetForm = () => {
        setEditingId(null)
        setFormEmployee('')
        setFormMonth(new Date().getMonth() + 1)
        setFormYear(new Date().getFullYear())
        setFormBaseSalary('')
        setFormAllowances('0')
        setFormBonuses('0')
        setFormDeductions('0')
        setFormWorkingDays('22')
        setFormActualWorkingDays('22')
        setFormOvertimeHours('0')
        setFormStatus('draft')
        setFormNotes('')
    }

    const openAddModal = () => {
        resetForm()
        setShowModal(true)
    }

    const openEditModal = (record: SalaryRecord) => {
        setEditingId(record._id)
        setFormEmployee(record.employee._id)
        setFormMonth(record.month)
        setFormYear(record.year)
        setFormBaseSalary(record.baseSalary.toString())
        setFormAllowances(record.allowances.toString())
        setFormBonuses(record.bonuses.toString())
        setFormDeductions(record.deductions.toString())
        setFormWorkingDays(record.workingDays.toString())
        setFormActualWorkingDays(record.actualWorkingDays.toString())
        setFormOvertimeHours(record.overtimeHours.toString())
        setFormStatus(record.status)
        setFormNotes(record.notes)
        setShowModal(true)
    }

    const calculateGross = () => {
        const base = parseFloat(formBaseSalary) || 0
        const allowances = parseFloat(formAllowances) || 0
        const bonuses = parseFloat(formBonuses) || 0
        return base + allowances + bonuses
    }

    const calculateNet = () => {
        const gross = calculateGross()
        const deductions = parseFloat(formDeductions) || 0
        return gross - deductions
    }

    const handleSave = async () => {
        if (!formEmployee || !formBaseSalary) {
            return error('Vui lòng chọn nhân viên và nhập lương cơ bản')
        }
        setSaving(true)
        try {
            const payload = {
                employee: formEmployee,
                month: formMonth,
                year: formYear,
                baseSalary: parseFloat(formBaseSalary),
                allowances: parseFloat(formAllowances) || 0,
                bonuses: parseFloat(formBonuses) || 0,
                deductions: parseFloat(formDeductions) || 0,
                workingDays: parseInt(formWorkingDays) || 22,
                actualWorkingDays: parseInt(formActualWorkingDays) || 22,
                overtimeHours: parseFloat(formOvertimeHours) || 0,
                grossSalary: calculateGross(),
                netSalary: calculateNet(),
                status: formStatus,
                notes: formNotes,
            }

            let res
            if (editingId) {
                res = await fetch(`/api/salaries/${editingId}`, {
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
            if (!json.success) throw new Error(json.error || 'Lưu thất bại')
            success(editingId ? 'Đã cập nhật lương' : 'Đã thêm lương')
            setShowModal(false)
            resetForm()
            fetchSalaries()
        } catch (e: any) {
            error(e.message)
        } finally {
            setSaving(false)
        }
    }

    const handleDelete = async (record: SalaryRecord) => {
        const emp = record.employee as any
        const empName = emp?.name || `${emp?.firstName || ''} ${emp?.lastName || ''}`.trim() || '-'
        if (!confirm(`Xóa bảng lương ${MONTHS[record.month - 1]} ${record.year} cho ${empName}?`)) return
        try {
            const res = await fetch(`/api/salaries/${record._id}`, { method: 'DELETE' })
            const json = await res.json()
            if (json.success) {
                success('Đã xóa bảng lương')
                fetchSalaries()
            } else {
                error(json.error || 'Xóa thất bại')
            }
        } catch {
            error('Lỗi kết nối')
        }
    }

    const totalGross = salaries.reduce((sum, s) => sum + s.grossSalary, 0)
    const totalNet = salaries.reduce((sum, s) => sum + s.netSalary, 0)

    return (
        <>
            <div className={styles.header}>
                <div className={styles.headerLeft}>
                    <h1>Bảng lương</h1>
                    <div className={styles.filterGroup}>
                        <select
                            className={styles.filterSelect}
                            value={filterMonth}
                            onChange={(e) => setFilterMonth(Number(e.target.value))}
                        >
                            {MONTHS.map((m, i) => (
                                <option key={i} value={i + 1}>{m}</option>
                            ))}
                        </select>
                        <select
                            className={styles.filterSelect}
                            value={filterYear}
                            onChange={(e) => setFilterYear(Number(e.target.value))}
                        >
                            {[2023, 2024, 2025, 2026, 2027].map(y => (
                                <option key={y} value={y}>{y}</option>
                            ))}
                        </select>
                    </div>
                </div>
                <button className={styles.addBtn} onClick={openAddModal}>
                    + TÍNH LƯƠNG
                </button>
            </div>

            <div className={styles.summary}>
                <div className={styles.summaryItem}>
                    <span className={styles.summaryLabel}>Tổng nhân viên</span>
                    <span className={styles.summaryValue}>{salaries.length}</span>
                </div>
                <div className={styles.summaryItem}>
                    <span className={styles.summaryLabel}>Tổng lương gross</span>
                    <span className={styles.summaryValue}>{formatCurrency(totalGross)}</span>
                </div>
                <div className={styles.summaryItem}>
                    <span className={styles.summaryLabel}>Tổng lương net</span>
                    <span className={styles.summaryValue}>{formatCurrency(totalNet)}</span>
                </div>
            </div>

            {loading ? (
                <CyberpunkLoader message="Đang tải lương..." compact />
            ) : salaries.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '40px', color: 'rgba(255,255,255,0.5)' }}>
                    Chưa có bảng lương cho tháng này
                </div>
            ) : (
                <div className={styles.tableWrapper}>
                    <table className={styles.table}>
                        <thead>
                            <tr>
                                <th>Nhân viên</th>
                                <th>Mã NV</th>
                                <th>Phòng ban</th>
                                <th>Lương CB</th>
                                <th>Phụ cấp</th>
                                <th>Thưởng</th>
                                <th>Gross</th>
                                <th>Khấu trừ</th>
                                <th>Net</th>
                                <th>Trạng thái</th>
                                <th>Thao tác</th>
                            </tr>
                        </thead>
                        <tbody>
                            {salaries.map((salary) => {
                                const emp = salary.employee as any
                                if (!emp) return null
                                const empName = emp.name || `${emp.firstName || ''} ${emp.lastName || ''}`.trim() || '-'
                                const empCode = emp.employeeCode || emp._id?.slice(-6) || '-'
                                const empDept = emp.department || emp.role || '-'
                                return (
                                <tr key={salary._id}>
                                    <td>
                                        <div className={styles.employeeName}>
                                            {empName}
                                        </div>
                                    </td>
                                    <td className={styles.mono}>{empCode}</td>
                                    <td>{empDept}</td>
                                    <td className={styles.money}>{formatCurrency(salary.baseSalary)}</td>
                                    <td className={styles.money}>{formatCurrency(salary.allowances)}</td>
                                    <td className={styles.money}>{formatCurrency(salary.bonuses)}</td>
                                    <td className={styles.money}>{formatCurrency(salary.grossSalary)}</td>
                                    <td className={styles.money}>{formatCurrency(salary.deductions)}</td>
                                    <td className={`${styles.money} ${styles.net}`}>{formatCurrency(salary.netSalary)}</td>
                                    <td>
                                        <span className={`${styles.status} ${styles[STATUS_COLORS[salary.status]]}`}>
                                            {STATUS_LABELS[salary.status]}
                                        </span>
                                    </td>
                                    <td>
                                        <div className={styles.actions}>
                                            <button className={styles.actionBtn} onClick={() => openEditModal(salary)}>
                                                ✏️
                                            </button>
                                            <button className={`${styles.actionBtn} ${styles.danger}`} onClick={() => handleDelete(salary)}>
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
                                {editingId ? 'Chỉnh sửa lương' : 'Tính lương'}
                            </span>
                            <button className={styles.modalClose} onClick={() => setShowModal(false)}>✕</button>
                        </div>
                        <div className={styles.modalBody}>
                            <div className={styles.formRow}>
                                <div className={styles.formGroup}>
                                    <label className={styles.formLabel}>Nhân viên</label>
                                    <select
                                        className={styles.formInput}
                                        value={formEmployee}
                                        onChange={(e) => setFormEmployee(e.target.value)}
                                        disabled={!!editingId}
                                    >
                                        <option value="">-- Chọn nhân viên --</option>
                                        {employees.map(emp => (
                                            <option key={emp._id} value={emp._id}>
                                                {emp.name} ({emp.role})
                                            </option>
                                        ))}
                                    </select>
                                </div>
                            </div>
                            <div className={styles.formRow}>
                                <div className={styles.formGroup}>
                                    <label className={styles.formLabel}>Tháng</label>
                                    <select
                                        className={styles.formInput}
                                        value={formMonth}
                                        onChange={(e) => setFormMonth(Number(e.target.value))}
                                    >
                                        {MONTHS.map((m, i) => (
                                            <option key={i} value={i + 1}>{m}</option>
                                        ))}
                                    </select>
                                </div>
                                <div className={styles.formGroup}>
                                    <label className={styles.formLabel}>Năm</label>
                                    <select
                                        className={styles.formInput}
                                        value={formYear}
                                        onChange={(e) => setFormYear(Number(e.target.value))}
                                    >
                                        {[2023, 2024, 2025, 2026, 2027].map(y => (
                                            <option key={y} value={y}>{y}</option>
                                        ))}
                                    </select>
                                </div>
                            </div>
                            <div className={styles.formRow}>
                                <div className={styles.formGroup}>
                                    <label className={styles.formLabel}>Lương cơ bản (VND)</label>
                                    <input
                                        type="number"
                                        className={styles.formInput}
                                        placeholder="10000000"
                                        value={formBaseSalary}
                                        onChange={(e) => setFormBaseSalary(e.target.value)}
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
                                        <option value="pending">Chờ duyệt</option>
                                        <option value="paid">Đã thanh toán</option>
                                        <option value="cancelled">Đã hủy</option>
                                    </select>
                                </div>
                            </div>
                            <div className={styles.formRow}>
                                <div className={styles.formGroup}>
                                    <label className={styles.formLabel}>Phụ cấp (VND)</label>
                                    <input
                                        type="number"
                                        className={styles.formInput}
                                        placeholder="0"
                                        value={formAllowances}
                                        onChange={(e) => setFormAllowances(e.target.value)}
                                    />
                                </div>
                                <div className={styles.formGroup}>
                                    <label className={styles.formLabel}>Thưởng (VND)</label>
                                    <input
                                        type="number"
                                        className={styles.formInput}
                                        placeholder="0"
                                        value={formBonuses}
                                        onChange={(e) => setFormBonuses(e.target.value)}
                                    />
                                </div>
                            </div>
                            <div className={styles.formRow}>
                                <div className={styles.formGroup}>
                                    <label className={styles.formLabel}>Khấu trừ (VND)</label>
                                    <input
                                        type="number"
                                        className={styles.formInput}
                                        placeholder="0"
                                        value={formDeductions}
                                        onChange={(e) => setFormDeductions(e.target.value)}
                                    />
                                </div>
                                <div className={styles.formGroup}>
                                    <label className={styles.formLabel}>Ghi chú</label>
                                    <input
                                        type="text"
                                        className={styles.formInput}
                                        placeholder="Ghi chú..."
                                        value={formNotes}
                                        onChange={(e) => setFormNotes(e.target.value)}
                                    />
                                </div>
                            </div>
                            <div className={styles.salarySummary}>
                                <div className={styles.summaryRow}>
                                    <span>Tổng lương Gross:</span>
                                    <span className={styles.summaryAmount}>{formatCurrency(calculateGross())}</span>
                                </div>
                                <div className={styles.summaryRow}>
                                    <span>Lương Net:</span>
                                    <span className={`${styles.summaryAmount} ${styles.net}`}>{formatCurrency(calculateNet())}</span>
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
