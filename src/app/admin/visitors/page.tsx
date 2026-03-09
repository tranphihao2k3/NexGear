'use client';

import { useState, useEffect } from 'react';
import {
    Plus, Search, Edit2, Trash2, X,
    Eye, Monitor, Globe, BarChart3,
    ArrowLeft, ArrowRight, MousePointer2
} from 'lucide-react';
import Toast from '@/components/admin/Toast';
import { Button, Badge, Input } from '@/components/ui';
import s from './page.module.scss';

interface Visitor {
    _id: string;
    label: string;
    ipAddress?: string;
    userAgent?: string;
    count: number;
    createdAt: string;
    updatedAt: string;
}

export default function VisitorsPage() {
    const [visitors, setVisitors] = useState<Visitor[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingVisitor, setEditingVisitor] = useState<Visitor | null>(null);
    const [pagination, setPagination] = useState({ page: 1, limit: 12, total: 0, totalPages: 1 });

    const [formData, setFormData] = useState({
        label: '',
        ipAddress: '',
        userAgent: '',
    });

    const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' | 'info'; isVisible: boolean }>({
        message: '',
        type: 'info',
        isVisible: false
    });

    const showToast = (message: string, type: 'success' | 'error' | 'info' = 'success') => {
        setToast({ message, type, isVisible: true });
    };

    const fetchVisitors = async () => {
        setLoading(true);
        try {
            const params = new URLSearchParams({
                page: (pagination?.page || 1).toString(),
                limit: (pagination?.limit || 12).toString(),
                search: searchTerm
            });
            const res = await fetch(`/api/visitors?${params}`);
            const data = await res.json();
            if (data.success) {
                setVisitors(data.data || []);
                if (data.pagination) {
                    setPagination(data.pagination);
                }
            } else {
                showToast(data.error || 'Lỗi tải dữ liệu', 'error');
            }
        } catch (error) {
            showToast('Lỗi tải dữ liệu', 'error');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        const timer = setTimeout(() => {
            fetchVisitors();
        }, 300);
        return () => clearTimeout(timer);
    }, [pagination?.page, searchTerm]);

    const handleOpenModal = (visitor?: Visitor) => {
        if (visitor) {
            setEditingVisitor(visitor);
            setFormData({
                label: visitor.label,
                ipAddress: visitor.ipAddress || '',
                userAgent: visitor.userAgent || '',
            });
        } else {
            setEditingVisitor(null);
            setFormData({ label: '', ipAddress: '', userAgent: '' });
        }
        setIsModalOpen(true);
    };

    const handleCloseModal = () => {
        setIsModalOpen(false);
        setEditingVisitor(null);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            const url = editingVisitor
                ? `/api/visitors/${editingVisitor._id}`
                : '/api/visitors';
            const method = editingVisitor ? 'PUT' : 'POST';

            const res = await fetch(url, {
                method,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ ...formData, isNewLabel: !editingVisitor }),
            });

            const data = await res.json();
            if (data.success) {
                showToast(editingVisitor ? 'Cập nhật thành công!' : 'Tạo mới thành công!');
                handleCloseModal();
                fetchVisitors();
            } else {
                showToast(data.error || 'Có lỗi xảy ra', 'error');
            }
        } catch (error) {
            showToast('Lỗi kết nối', 'error');
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm('Xóa bản ghi này?')) return;
        try {
            const res = await fetch(`/api/visitors/${id}`, { method: 'DELETE' });
            if (res.ok) {
                showToast('Đã xóa thành công');
                fetchVisitors();
            }
        } catch (error) {
            showToast('Lỗi khi xóa', 'error');
        }
    };

    const handlePageChange = (newPage: number) => {
        setPagination(prev => ({ ...prev, page: newPage }));
    };

    return (
        <div className={s.page}>
            <Toast
                message={toast.message}
                type={toast.type}
                isVisible={toast.isVisible}
                onClose={() => setToast(prev => ({ ...prev, isVisible: false }))}
            />

            <div className={s.header}>
                <div className={s.titleArea}>
                    <h1>Visitors Tracker</h1>
                    <p>Theo dõi lưu lượng truy cập và nhãn định danh khách hàng</p>
                </div>
                <Button variant="cyan" onClick={() => handleOpenModal()}>
                    <Plus size={18} /> THÊM LABEL MỚI
                </Button>
            </div>

            <div className={s.statsBar}>
                <div className={s.statCard}>
                    <div className={s.statIcon}><BarChart3 size={20} /></div>
                    <div className={s.statInfo}>
                        <div className={s.statLabel}>Tổng lượt</div>
                        <div className={s.statValue}>{pagination?.total || 0}</div>
                    </div>
                </div>
                <div className={s.statCard}>
                    <div className={s.statIcon}><Globe size={20} /></div>
                    <div className={s.statInfo}>
                        <div className={s.statLabel}>Unique Labels</div>
                        <div className={s.statValue}>{visitors.length}</div>
                    </div>
                </div>
            </div>

            <div className={s.filtersBar}>
                <div className={s.searchBox}>
                    <Input
                        placeholder="Tìm label hoặc IP..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        leftIcon={<Search size={18} />}
                    />
                </div>
            </div>

            <div className={s.content}>
                {loading ? (
                    <div className={s.loading}>
                        <div className={s.spinner}></div>
                        <p>Đang tải dữ liệu...</p>
                    </div>
                ) : (
                    <>
                        <div className={s.grid}>
                            {visitors.map((v) => (
                                <div key={v._id} className={s.visitorCard}>
                                    <div className={s.cardHeader}>
                                        <div className={s.labelType}>
                                            <Badge variant="cyan">{v.label}</Badge>
                                        </div>
                                        <div className={s.countBadge}>
                                            <MousePointer2 size={12} />
                                            <span>{v.count}</span>
                                        </div>
                                    </div>

                                    <div className={s.cardBody}>
                                        <div className={s.metaItem}>
                                            <Monitor size={14} />
                                            <span className={s.ipText}>{v.ipAddress || 'No IP'}</span>
                                        </div>
                                        <div className={s.metaItem}>
                                            <Eye size={14} />
                                            <span className={s.dateText}>{new Date(v.updatedAt).toLocaleDateString('vi-VN')}</span>
                                        </div>
                                    </div>

                                    <div className={s.cardActions}>
                                        <button onClick={() => handleOpenModal(v)} className={s.editBtn}>
                                            <Edit2 size={14} />
                                        </button>
                                        <button onClick={() => handleDelete(v._id)} className={s.deleteBtn}>
                                            <Trash2 size={14} />
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>

                        {visitors.length === 0 && (
                            <div className={s.empty}>
                                <div className={s.emptyIcon}><Eye size={48} /></div>
                                <h3>Không có dữ liệu</h3>
                                <p>Chưa có lượt truy cập nào được ghi lại hoặc không khớp tìm kiếm.</p>
                            </div>
                        )}

                        {pagination.totalPages > 1 && (
                            <div className={s.pagination}>
                                <button
                                    disabled={pagination?.page === 1}
                                    onClick={() => handlePageChange((pagination?.page || 1) - 1)}
                                >
                                    <ArrowLeft size={16} /> TRƯỚC
                                </button>
                                <span className={s.pageInfo}>Trang {pagination?.page || 1} / {pagination?.totalPages || 1}</span>
                                <button
                                    disabled={pagination?.page === pagination?.totalPages}
                                    onClick={() => handlePageChange((pagination?.page || 1) + 1)}
                                >
                                    SAU <ArrowRight size={16} />
                                </button>
                            </div>
                        )}
                    </>
                )}
            </div>

            {/* Modal */}
            {isModalOpen && (
                <div className={s.modalOverlay} onClick={(e) => e.target === e.currentTarget && handleCloseModal()}>
                    <div className={s.modalContent}>
                        <div className={s.modalHeader}>
                            <h2>{editingVisitor ? 'CẬP NHẬT LABEL' : 'THÊM LABEL MỚI'}</h2>
                            <button onClick={handleCloseModal} className={s.closeBtn}><X size={24} /></button>
                        </div>

                        <form onSubmit={handleSubmit} className={s.form}>
                            <Input
                                label="Label định danh *"
                                required
                                value={formData.label}
                                onChange={e => setFormData({ ...formData, label: e.target.value })}
                                placeholder="Vd: homepage, product_detail_123"
                            />

                            <Input
                                label="Địa chỉ IP"
                                value={formData.ipAddress}
                                onChange={e => setFormData({ ...formData, ipAddress: e.target.value })}
                                placeholder="127.0.0.1"
                            />

                            <div className={s.field}>
                                <label>User Agent</label>
                                <textarea
                                    value={formData.userAgent}
                                    onChange={e => setFormData({ ...formData, userAgent: e.target.value })}
                                    rows={3}
                                    placeholder="Thông tin trình duyệt..."
                                />
                            </div>

                            <div className={s.formActions}>
                                <Button variant="primary" type="submit" fullWidth>
                                    {editingVisitor ? 'LƯU THAY ĐỔI' : 'TẠO MỚI NGAY'}
                                </Button>
                                <Button variant="ghost" type="button" onClick={handleCloseModal} fullWidth>HỦY</Button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
