'use client';

import { useEffect, useState, useCallback } from 'react';
import {
    Plus,
    Edit2,
    Trash2,
    X,
    Search,
    Gift,
    TrendingUp,
    TrendingDown,
    RefreshCw,
    ChevronLeft,
    ChevronRight,
    Database
} from 'lucide-react';
import { useToast } from '@/components/ui/Toast';
import { Button, Badge, Input } from '@/components/ui';
import s from './page.module.scss';

interface Customer {
    _id: string;
    name: string;
    phone: string;
    email: string;
}

interface LoyaltyPoints {
    _id: string;
    customerId: Customer;
    points: number;
    pointsType: string;
    description: string;
    orderId: string;
    createdAt: string;
}

const TYPE_MAP: Record<string, { label: string, variant: any }> = {
    earned: { label: 'Tích điểm', variant: 'green' },
    redeemed: { label: 'Đổi điểm', variant: 'magenta' },
    adjusted: { label: 'Điều chỉnh', variant: 'cyan' },
    expired: { label: 'Hết hạn', variant: 'ink' },
};

const normalizePointsType = (t: string) => {
    if (t === 'earn') return 'earned';
    if (t === 'redeem') return 'redeemed';
    if (t === 'bonus') return 'adjusted';
    return t;
};

const denormalizePointsType = (t: string) => {
    if (t === 'earned') return 'earned';
    if (t === 'redeemed') return 'redeemed';
    if (t === 'adjusted') return 'adjusted';
    return t || 'earned';
};

const isPositivePointsType = (t: string) => ['earned', 'adjusted'].includes(denormalizePointsType(t));

const toApiPayload = (form: { customerId: string; points: number; pointsType: string; description: string; orderId: string }) => ({
    customer: form.customerId,
    points: Number(form.points) || 0,
    pointsType: denormalizePointsType(form.pointsType),
    description: form.description,
    order: form.orderId || null,
});

const fromApiRecord = (record: any) => ({
    ...record,
    customerId: (record.customerId || record.customer),
    orderId: record.orderId || record.order || '',
    pointsType: normalizePointsType(record.pointsType),
});

const mapFilterTypeToApi = (type: string) => {
    if (!type) return '';
    return denormalizePointsType(type);
};

const mapUiTypeToApiType = (type: string) => denormalizePointsType(type);

export default function LoyaltyPointsPage() {
    const { success: showSuccess, error: showError } = useToast();
    const [records, setRecords] = useState<LoyaltyPoints[]>([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [editingRecord, setEditingRecord] = useState<LoyaltyPoints | null>(null);
    const [filterType, setFilterType] = useState('');
    const [pagination, setPagination] = useState({ page: 1, limit: 20, total: 0, pages: 0 });
    const [customers, setCustomers] = useState<Customer[]>([]);
    const [formData, setFormData] = useState({
        customerId: '',
        points: 0,
        pointsType: 'earned',
        description: '',
        orderId: '',
    });

    const fetchCustomers = useCallback(async () => {
        try {
            const res = await fetch('/api/customers?limit=100');
            const data = await res.json();
            if (data.success) setCustomers(data.data || []);
        } catch (error) {
            console.error('Error fetching customers:', error);
        }
    }, []);

    const fetchRecords = useCallback(async () => {
        try {
            setLoading(true);
            const params = new URLSearchParams({
                page: pagination.page.toString(),
                limit: pagination.limit.toString(),
            });
            const apiFilterType = mapFilterTypeToApi(filterType);
            if (apiFilterType) params.append('pointsType', apiFilterType);

            const res = await fetch(`/api/loyalty-points?${params}`);
            const data = await res.json();
            if (data.success) {
                setRecords((data.data || []).map(fromApiRecord));
                setPagination(data.pagination);
            }
        } catch (error) {
            showError('Lỗi khi tải danh sách điểm');
        } finally {
            setLoading(false);
        }
    }, [pagination.page, pagination.limit, filterType, showError]);

    useEffect(() => {
        fetchRecords();
        fetchCustomers();
    }, [fetchRecords, fetchCustomers]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        try {
            const url = editingRecord
                ? `/api/loyalty-points/${editingRecord._id}`
                : '/api/loyalty-points';

            const method = editingRecord ? 'PUT' : 'POST';

            const res = await fetch(url, {
                method,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(toApiPayload(formData)),
            });

            const data = await res.json();

            if (data.success) {
                fetchRecords();
                handleCloseModal();
                showSuccess(editingRecord ? 'Cập nhật thành công!' : 'Tạo mới thành công!');
            } else {
                showError('Lỗi: ' + data.error);
            }
        } catch (error) {
            showError('Lỗi kết nối server');
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm('Bạn có chắc muốn xóa bản ghi điểm này? Thao tác này có thể ảnh hưởng đến tổng điểm của khách hàng.')) return;

        try {
            const res = await fetch(`/api/loyalty-points/${id}`, { method: 'DELETE' });
            const data = await res.json();

            if (data.success) {
                fetchRecords();
                showSuccess('Đã xóa bản ghi thành công!');
            } else {
                showError('Lỗi: ' + data.error);
            }
        } catch (error) {
            showError('Lỗi kết nối server');
        }
    };

    const handleEdit = (record: LoyaltyPoints) => {
        setEditingRecord(record);
        setFormData({
            customerId: (record.customerId as any)?._id || record.customerId,
            points: record.points,
            pointsType: denormalizePointsType(record.pointsType || 'earned'),
            description: record.description || '',
            orderId: (record as any).orderId || (record as any).order?._id || '',
        });
        setShowModal(true);
    };

    const handleCloseModal = () => {
        setShowModal(false);
        setEditingRecord(null);
        setFormData({ customerId: '', points: 0, pointsType: 'earned', description: '', orderId: '' });
    };

    return (
        <div className={s.page}>
            <div className={s.header}>
                <div>
                    <h1><Gift size={32} color="#7B3FF2" /> Điểm thưởng NexPoints</h1>
                    <p>Hệ thống tích điểm và tri ân khách hàng thân thiết</p>
                </div>
                <Button
                    variant="primary"
                    onClick={() => setShowModal(true)}
                    leftIcon={<Plus size={20} />}
                >
                    ĐIỀU CHỈNH ĐIỂM
                </Button>
            </div>

            <div className={s.actionBar}>
                <select
                    value={filterType}
                    onChange={(e) => { setFilterType(e.target.value); setPagination(p => ({ ...p, page: 1 })); }}
                >
                    <option value="">Tất cả loại giao dịch</option>
                    <option value="earned">Tích điểm (Mua hàng)</option>
                    <option value="redeemed">Đổi điểm (Giảm giá)</option>
                    <option value="adjusted">Thưởng/Điều chỉnh</option>
                    <option value="expired">Hết hạn</option>
                </select>

                <Button variant="ghost" onClick={fetchRecords} leftIcon={<RefreshCw size={18} />}>
                    LÀM MỚI
                </Button>
            </div>

            <div className={s.tableWrapper}>
                <table>
                    <thead>
                        <tr>
                            <th>Khách hàng</th>
                            <th>Biến động</th>
                            <th>Loại hình</th>
                            <th>Nội dung</th>
                            <th>Ngày thực hiện</th>
                            <th style={{ textAlign: 'right' }}>Thao tác</th>
                        </tr>
                    </thead>
                    <tbody>
                        {loading ? (
                            <tr>
                                <td colSpan={6} style={{ textAlign: 'center', padding: '100px 0' }}>
                                    <RefreshCw className="animate-spin mb-2" size={32} color="#7B3FF2" />
                                    <p>Hệ thống đang tải dữ liệu điểm...</p>
                                </td>
                            </tr>
                        ) : records.length === 0 ? (
                            <tr>
                                <td colSpan={6} style={{ textAlign: 'center', padding: '100px 0', color: '#7A7870' }}>
                                    Chưa có lịch sử điểm thưởng nào.
                                </td>
                            </tr>
                        ) : (
                            records.map((record) => {
                                const customer = record.customerId;
                                const typeInfo = TYPE_MAP[record.pointsType] || { label: record.pointsType, variant: 'ink' };
                                const isPositive = isPositivePointsType(record.pointsType);

                                return (
                                    <tr key={record._id}>
                                        <td>
                                            <div className={s.customerInfo}>
                                                <div className={s.name}>{customer?.name || 'Ẩn danh'}</div>
                                                <div className={s.phone}>{customer?.phone || 'N/A'}</div>
                                            </div>
                                        </td>
                                        <td>
                                            <div className={`${s.points} ${isPositive ? s.up : s.down}`}>
                                                {isPositive ? <TrendingUp size={16} /> : <TrendingDown size={16} />}
                                                {isPositive ? '+' : '-'}{record.points.toLocaleString()} pts
                                            </div>
                                        </td>
                                        <td>
                                            <Badge variant={typeInfo.variant}>
                                                {typeInfo.label}
                                            </Badge>
                                        </td>
                                        <td>
                                            <div style={{ fontSize: '13px', color: '#3D3C38', maxWidth: '300px' }}>
                                                {record.description || '-'}
                                            </div>
                                        </td>
                                        <td>
                                            <div style={{ fontSize: '12px', color: '#7A7870' }}>
                                                {new Date(record.createdAt).toLocaleDateString('vi-VN')}
                                            </div>
                                            <div style={{ fontSize: '10px', color: '#A0A0A0' }}>
                                                {new Date(record.createdAt).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}
                                            </div>
                                        </td>
                                        <td>
                                            <div className={s.actions}>
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    onClick={() => handleEdit(record)}
                                                >
                                                    <Edit2 size={16} color="#00C4AD" />
                                                </Button>
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    onClick={() => handleDelete(record._id)}
                                                >
                                                    <Trash2 size={16} color="#F0356A" />
                                                </Button>
                                            </div>
                                        </td>
                                    </tr>
                                );
                            })
                        )}
                    </tbody>
                </table>

                {pagination.pages > 1 && (
                    <div className={s.pagination}>
                        <div className={s.info}>
                            Trang {pagination.page} / {pagination.pages} &bull; Tổng {pagination.total} bản ghi
                        </div>
                        <div className={s.btns}>
                            <Button
                                variant="ghost"
                                size="sm"
                                disabled={pagination.page === 1}
                                onClick={() => setPagination(p => ({ ...p, page: p.page - 1 }))}
                            >
                                <ChevronLeft size={18} />
                            </Button>
                            <Button
                                variant="ghost"
                                size="sm"
                                disabled={pagination.page === pagination.pages}
                                onClick={() => setPagination(p => ({ ...p, page: p.page + 1 }))}
                            >
                                <ChevronRight size={18} />
                            </Button>
                        </div>
                    </div>
                )}
            </div>

            {showModal && (
                <div className={s.modalOverlay}>
                    <div className={s.modal}>
                        <div className={s.modalHeader}>
                            <h2>{editingRecord ? 'CHỈNH SỬA ĐIỂM' : 'ĐIỀU CHỈNH ĐIỂM HÀNH CHÍNH'}</h2>
                            <Button variant="ghost" onClick={handleCloseModal}>
                                <X size={20} />
                            </Button>
                        </div>
                        <form onSubmit={handleSubmit}>
                            <div>
                                <span className={s.fieldLabel}>Khách hàng nhận điểm *</span>
                                <select
                                    required
                                    value={formData.customerId}
                                    onChange={(e) => setFormData({ ...formData, customerId: e.target.value })}
                                >
                                    <option value="">-- Chọn khách hàng --</option>
                                    {customers.map(cust => (
                                        <option key={cust._id} value={cust._id}>
                                            {cust.name} ({cust.phone})
                                        </option>
                                    ))}
                                </select>
                            </div>

                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                                <div>
                                    <span className={s.fieldLabel}>Số điểm *</span>
                                    <Input
                                        type="number"
                                        required
                                        value={formData.points}
                                        onChange={(e) => setFormData({ ...formData, points: parseInt(e.target.value) || 0 })}
                                    />
                                </div>
                                <div>
                                    <span className={s.fieldLabel}>Loại giao dịch</span>
                                    <select
                                        value={formData.pointsType}
                                        onChange={(e) => setFormData({ ...formData, pointsType: mapUiTypeToApiType(e.target.value) })}
                                    >
                                        <option value="earned">Tích điểm</option>
                                        <option value="redeemed">Đổi điểm</option>
                                        <option value="adjusted">Thưởng / Điều chỉnh</option>
                                        <option value="expired">Hết hạn</option>
                                    </select>
                                </div>
                            </div>

                            <div>
                                <span className={s.fieldLabel}>Lý do / Nội dung biến động</span>
                                <textarea
                                    value={formData.description}
                                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                    placeholder="VD: Thưởng khách hàng thân thiết tháng 12..."
                                />
                            </div>

                            <div>
                                <span className={s.fieldLabel}>Mã đơn hàng liên quan (nếu có)</span>
                                <Input
                                    value={formData.orderId}
                                    onChange={(e) => setFormData({ ...formData, orderId: e.target.value })}
                                    placeholder="VD: OD-12345"
                                />
                            </div>

                            <div className={s.modalFooter}>
                                <Button variant="ghost" onClick={handleCloseModal}>HỦY BỎ</Button>
                                <Button variant="primary" type="submit">
                                    {editingRecord ? 'CẬP NHẬT' : 'THỰC HIỆN'}
                                </Button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
