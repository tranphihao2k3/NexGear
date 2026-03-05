// ============================================================
// NEXGEAR — Admin Staff Page (A08) — Full CRUD
// ============================================================
'use client'

import { useState, useEffect, useCallback } from 'react'
import styles from './page.module.scss'
import { useToast } from '@/components/ui'

interface Staff {
    _id: string
    name: string
    email: string
    image?: string
    role: 'admin' | 'manager' | 'staff' | 'cashier'
    createdAt: string
}

const ROLE_LABELS: Record<string, string> = {
    admin: 'Admin',
    manager: 'Quản lý',
    staff: 'Nhân viên',
    cashier: 'POS',
}

const COLORS = ['#7B3FF2', '#00C4AD', '#F0A500', '#1DB96A', '#F0356A']

function getColor(index: number) {
    return COLORS[index % COLORS.length]
}

function formatDate(dateStr: string) {
    return new Date(dateStr).toLocaleDateString('vi-VN', { month: '2-digit', year: 'numeric' })
}

export default function AdminStaffPage() {
    const { success, error, info } = useToast()
    const [staffList, setStaffList] = useState<Staff[]>([])
    const [loading, setLoading] = useState(true)
    const [showModal, setShowModal] = useState(false)
    const [saving, setSaving] = useState(false)

    // Form state (shared for add & edit)
    const [editingId, setEditingId] = useState<string | null>(null)
    const [formName, setFormName] = useState('')
    const [formEmail, setFormEmail] = useState('')
    const [formPhone, setFormPhone] = useState('')
    const [formRole, setFormRole] = useState('staff')
    const [formPassword, setFormPassword] = useState('')

    // Reset password modal
    const [showResetModal, setShowResetModal] = useState(false)
    const [resetTarget, setResetTarget] = useState<Staff | null>(null)
    const [newPassword, setNewPassword] = useState('')

    const fetchStaff = useCallback(async () => {
        setLoading(true)
        try {
            const roles = ['admin', 'manager', 'staff', 'cashier']
            const results = await Promise.all(
                roles.map(async (role) => {
                    const res = await fetch(`/api/users?role=${role}&limit=50`)
                    const json = await res.json()
                    return json.success ? json.data : []
                })
            )
            setStaffList(results.flat())
        } catch (err) {
            console.error('Failed to fetch staff:', err)
        } finally {
            setLoading(false)
        }
    }, [])

    useEffect(() => { fetchStaff() }, [fetchStaff])

    const resetForm = () => {
        setEditingId(null)
        setFormName('')
        setFormEmail('')
        setFormPhone('')
        setFormRole('staff')
        setFormPassword('')
    }

    const openAddModal = () => {
        resetForm()
        setShowModal(true)
    }

    const openEditModal = (member: Staff) => {
        setEditingId(member._id)
        setFormName(member.name)
        setFormEmail(member.email)
        setFormPhone('')
        setFormRole(member.role)
        setFormPassword('')
        setShowModal(true)
    }

    const handleSave = async () => {
        if (!formName || !formEmail) {
            return error('Vui lòng nhập họ tên và email')
        }
        setSaving(true)
        try {
            if (editingId) {
                // Update existing staff
                const res = await fetch(`/api/users/${editingId}`, {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        name: formName,
                        email: formEmail,
                        role: formRole,
                    }),
                })
                const json = await res.json()
                if (!json.success) throw new Error(json.error || 'Cập nhật thất bại')
                success('Đã cập nhật nhân viên')
            } else {
                // Create new staff
                const res = await fetch('/api/users', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        name: formName,
                        email: formEmail,
                        password: formPassword || '123456',
                        role: formRole,
                    }),
                })
                const json = await res.json()
                if (!json.success) throw new Error(json.error || 'Thêm nhân viên thất bại')
                success('Đã thêm nhân viên mới')
            }
            setShowModal(false)
            resetForm()
            fetchStaff()
        } catch (e: any) {
            error(e.message)
        } finally {
            setSaving(false)
        }
    }

    const handleDelete = async (member: Staff) => {
        if (member.role === 'admin') {
            return error('Không thể xóa tài khoản Admin')
        }
        if (!confirm(`Xóa nhân viên "${member.name}"? Hành động này không thể hoàn tác.`)) return
        try {
            const res = await fetch(`/api/users/${member._id}`, { method: 'DELETE' })
            const json = await res.json()
            if (json.success) {
                success('Đã xóa nhân viên')
                fetchStaff()
            } else {
                error(json.error || 'Xóa thất bại')
            }
        } catch {
            error('Lỗi kết nối')
        }
    }

    const openResetPassword = (member: Staff) => {
        setResetTarget(member)
        setNewPassword('')
        setShowResetModal(true)
    }

    const handleResetPassword = async () => {
        if (!resetTarget) return
        if (!newPassword || newPassword.length < 6) {
            return error('Mật khẩu mới phải có ít nhất 6 ký tự')
        }
        setSaving(true)
        try {
            const res = await fetch(`/api/users/${resetTarget._id}/reset-password`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ password: newPassword }),
            })
            const json = await res.json()
            if (json.success) {
                success(`Đã đặt lại mật khẩu cho ${resetTarget.name}`)
                setShowResetModal(false)
                setResetTarget(null)
            } else {
                error(json.error || 'Đặt lại mật khẩu thất bại')
            }
        } catch {
            error('Lỗi kết nối')
        } finally {
            setSaving(false)
        }
    }

    return (
        <>
            <div className={styles.header}>
                <div className={styles.headerLeft}>
                    <h1>Nhân viên</h1>
                </div>
                <button className={styles.addBtn} onClick={openAddModal}>
                    + THÊM NHÂN VIÊN
                </button>
            </div>

            {loading ? (
                <div style={{ textAlign: 'center', padding: '40px', color: 'rgba(255,255,255,0.5)' }}>
                    Đang tải...
                </div>
            ) : staffList.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '40px', color: 'rgba(255,255,255,0.5)' }}>
                    Chưa có nhân viên nào
                </div>
            ) : (
                <div className={styles.staffGrid}>
                    {staffList.map((member, idx) => (
                        <div key={member._id} className={styles.staffCard}>
                            <div className={styles.staffHeader}>
                                <div className={styles.staffAvatar} style={{ background: getColor(idx) }}>
                                    {member.name.charAt(0)}
                                </div>
                                <div className={styles.staffInfo}>
                                    <div className={styles.staffName}>{member.name}</div>
                                    <div className={styles.staffEmail}>{member.email}</div>
                                </div>
                                <span className={`${styles.roleBadge} ${styles[member.role]}`}>
                                    {ROLE_LABELS[member.role] || member.role}
                                </span>
                            </div>

                            <div className={styles.staffDetails}>
                                <div className={styles.detailRow}>
                                    <span className={styles.detailLabel}>Vai trò</span>
                                    <span className={styles.detailValue}>{ROLE_LABELS[member.role] || member.role}</span>
                                </div>
                                <div className={styles.detailRow}>
                                    <span className={styles.detailLabel}>Ngày tham gia</span>
                                    <span className={styles.detailValue}>{formatDate(member.createdAt)}</span>
                                </div>
                            </div>

                            <div className={styles.staffActions}>
                                <button className={styles.staffActionBtn} onClick={() => openEditModal(member)}>
                                    ✏️ Sửa
                                </button>
                                <button className={styles.staffActionBtn} onClick={() => openResetPassword(member)}>
                                    🔑 Reset MK
                                </button>
                                {member.role !== 'admin' && (
                                    <button
                                        className={`${styles.staffActionBtn} ${styles.danger}`}
                                        onClick={() => handleDelete(member)}
                                    >
                                        🗑️ Xóa
                                    </button>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Add/Edit Staff Modal */}
            {showModal && (
                <div className={styles.modalOverlay} onClick={() => setShowModal(false)}>
                    <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
                        <div className={styles.modalHeader}>
                            <span className={styles.modalTitle}>
                                {editingId ? 'Chỉnh sửa nhân viên' : 'Thêm nhân viên'}
                            </span>
                            <button className={styles.modalClose} onClick={() => setShowModal(false)}>✕</button>
                        </div>
                        <div className={styles.modalBody}>
                            <div className={styles.formRow}>
                                <div className={styles.formGroup}>
                                    <label className={styles.formLabel}>Họ tên</label>
                                    <input
                                        type="text"
                                        className={styles.formInput}
                                        placeholder="Nguyễn Văn X"
                                        value={formName}
                                        onChange={(e) => setFormName(e.target.value)}
                                    />
                                </div>
                                <div className={styles.formGroup}>
                                    <label className={styles.formLabel}>Email</label>
                                    <input
                                        type="email"
                                        className={styles.formInput}
                                        placeholder="email@nexgear.vn"
                                        value={formEmail}
                                        onChange={(e) => setFormEmail(e.target.value)}
                                    />
                                </div>
                            </div>
                            <div className={styles.formRow}>
                                <div className={styles.formGroup}>
                                    <label className={styles.formLabel}>Điện thoại</label>
                                    <input
                                        type="tel"
                                        className={styles.formInput}
                                        placeholder="0901234567"
                                        value={formPhone}
                                        onChange={(e) => setFormPhone(e.target.value)}
                                    />
                                </div>
                                <div className={styles.formGroup}>
                                    <label className={styles.formLabel}>Vai trò</label>
                                    <select
                                        className={styles.formInput}
                                        value={formRole}
                                        onChange={(e) => setFormRole(e.target.value)}
                                    >
                                        <option value="staff">Nhân viên</option>
                                        <option value="cashier">POS</option>
                                        <option value="manager">Quản lý</option>
                                        <option value="admin">Admin</option>
                                    </select>
                                </div>
                            </div>
                            {!editingId && (
                                <div className={styles.formGroup}>
                                    <label className={styles.formLabel}>Mật khẩu tạm</label>
                                    <input
                                        type="password"
                                        className={styles.formInput}
                                        placeholder="Mật khẩu mặc định (min 6 ký tự)..."
                                        value={formPassword}
                                        onChange={(e) => setFormPassword(e.target.value)}
                                    />
                                </div>
                            )}
                        </div>
                        <div className={styles.modalFooter}>
                            <button className={styles.cancelBtn} onClick={() => setShowModal(false)} disabled={saving}>HỦY</button>
                            <button className={styles.saveBtn} onClick={handleSave} disabled={saving}>
                                {saving ? 'Đang lưu...' : editingId ? '✓ CẬP NHẬT' : '✓ THÊM NHÂN VIÊN'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Reset Password Modal */}
            {showResetModal && resetTarget && (
                <div className={styles.modalOverlay} onClick={() => setShowResetModal(false)}>
                    <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
                        <div className={styles.modalHeader}>
                            <span className={styles.modalTitle}>Đặt lại mật khẩu</span>
                            <button className={styles.modalClose} onClick={() => setShowResetModal(false)}>✕</button>
                        </div>
                        <div className={styles.modalBody}>
                            <div style={{ marginBottom: '16px', color: 'rgba(255,255,255,0.6)', fontSize: '14px' }}>
                                Đặt lại mật khẩu cho <strong style={{ color: '#fff' }}>{resetTarget.name}</strong> ({resetTarget.email})
                            </div>
                            <div className={styles.formGroup}>
                                <label className={styles.formLabel}>Mật khẩu mới</label>
                                <input
                                    type="password"
                                    className={styles.formInput}
                                    placeholder="Nhập mật khẩu mới (min 6 ký tự)..."
                                    value={newPassword}
                                    onChange={(e) => setNewPassword(e.target.value)}
                                />
                            </div>
                        </div>
                        <div className={styles.modalFooter}>
                            <button className={styles.cancelBtn} onClick={() => setShowResetModal(false)} disabled={saving}>HỦY</button>
                            <button className={styles.saveBtn} onClick={handleResetPassword} disabled={saving}>
                                {saving ? 'Đang xử lý...' : '🔑 ĐẶT LẠI MẬT KHẨU'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </>
    )
}
