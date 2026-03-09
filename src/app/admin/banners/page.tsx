'use client';

import { useState, useEffect } from 'react';
import {
    Plus, Search, Edit2, Trash2, ArrowUp, ArrowDown,
    Image as ImageIcon, Link as LinkIcon, Calendar,
    X, LayoutGrid, AlertCircle
} from 'lucide-react';
import Toast from '@/components/admin/Toast';
import ImageUploader from '@/components/admin/ImageUploader';
import { Button, Badge, Input } from '@/components/ui';
import s from './page.module.scss';

interface Banner {
    _id: string;
    title: string;
    image: string;
    link: string;
    position: 'home' | 'promotion' | 'banner' | 'popup';
    order: number;
    startDate: string | null;
    endDate: string | null;
    status: 'active' | 'inactive' | 'scheduled';
    description: string;
    createdAt: string;
}

const POSITION_LABELS: Record<string, string> = {
    home: 'Trang chủ',
    promotion: 'Khuyến mãi',
    banner: 'Banner chung',
    popup: 'Popup',
};

const STATUS_CONFG: Record<string, { label: string; variant: any }> = {
    active: { label: 'Hoạt động', variant: 'green' },
    inactive: { label: 'Đã tắt', variant: 'gray' },
    scheduled: { label: 'Lên lịch', variant: 'gold' },
};

export default function BannersPage() {
    const [banners, setBanners] = useState<Banner[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [filterPosition, setFilterPosition] = useState('all');
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingBanner, setEditingBanner] = useState<Banner | null>(null);

    const [formData, setFormData] = useState({
        title: '',
        image: '',
        link: '',
        position: 'home',
        order: 0,
        startDate: '',
        endDate: '',
        status: 'active',
        description: '',
    });

    const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' | 'info'; isVisible: boolean }>({
        message: '',
        type: 'info',
        isVisible: false
    });

    const showToast = (message: string, type: 'success' | 'error' | 'info' = 'success') => {
        setToast({ message, type, isVisible: true });
    };

    const fetchBanners = async () => {
        try {
            const res = await fetch('/api/banners?all=true');
            const data = await res.json();
            if (data.success) {
                // Initial sort by position and order
                const sorted = data.data.sort((a: Banner, b: Banner) => {
                    if (a.position !== b.position) return a.position.localeCompare(b.position);
                    return a.order - b.order;
                });
                setBanners(sorted);
            }
        } catch (error) {
            showToast('Lỗi tải dữ liệu', 'error');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchBanners();
    }, []);

    const handleOpenModal = (banner?: Banner) => {
        if (banner) {
            setEditingBanner(banner);
            setFormData({
                title: banner.title,
                image: banner.image,
                link: banner.link,
                position: banner.position,
                order: banner.order,
                startDate: banner.startDate ? banner.startDate.split('T')[0] : '',
                endDate: banner.endDate ? banner.endDate.split('T')[0] : '',
                status: banner.status,
                description: banner.description || '',
            });
        } else {
            setEditingBanner(null);
            setFormData({
                title: '',
                image: '',
                link: '',
                position: 'home',
                order: banners.filter(b => b.position === 'home').length,
                startDate: '',
                endDate: '',
                status: 'active',
                description: '',
            });
        }
        setIsModalOpen(true);
    };

    const handleCloseModal = () => {
        setIsModalOpen(false);
        setEditingBanner(null);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        try {
            const url = editingBanner
                ? `/api/banners/${editingBanner._id}`
                : '/api/banners';
            const method = editingBanner ? 'PUT' : 'POST';

            const res = await fetch(url, {
                method,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(formData),
            });

            const data = await res.json();

            if (data.success) {
                showToast(editingBanner ? 'Cập nhật thành công!' : 'Tạo banner thành công!');
                handleCloseModal();
                fetchBanners();
            } else {
                showToast(data.error || 'Có lỗi xảy ra', 'error');
            }
        } catch (error) {
            showToast('Lỗi kết nối', 'error');
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm('Bạn có chắc muốn xóa banner này?')) return;

        try {
            const res = await fetch(`/api/banners/${id}`, { method: 'DELETE' });
            const data = await res.json();

            if (data.success) {
                showToast('Đã xóa thành công!');
                fetchBanners();
            } else {
                showToast(data.error || 'Lỗi khi xóa', 'error');
            }
        } catch (error) {
            showToast('Lỗi kết nối', 'error');
        }
    };

    const handleReorder = async (id: string, direction: 'up' | 'down') => {
        const banner = banners.find(b => b._id === id);
        if (!banner) return;

        const samePosBanners = banners.filter(b => b.position === banner.position);
        const indexInGroup = samePosBanners.findIndex(b => b._id === id);

        if (direction === 'up' && indexInGroup === 0) return;
        if (direction === 'down' && indexInGroup === samePosBanners.length - 1) return;

        const swapIndex = direction === 'up' ? indexInGroup - 1 : indexInGroup + 1;
        const otherBanner = samePosBanners[swapIndex];

        try {
            // Swap orders via API
            await Promise.all([
                fetch(`/api/banners/${banner._id}`, {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ order: otherBanner.order }),
                }),
                fetch(`/api/banners/${otherBanner._id}`, {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ order: banner.order }),
                })
            ]);

            fetchBanners();
            showToast('Đã cập nhật thứ tự');
        } catch (error) {
            showToast('Lỗi cập nhật thứ tự', 'error');
        }
    };

    const filteredBanners = banners.filter(b => {
        const matchesSearch = b.title.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesPosition = filterPosition === 'all' ? true : b.position === filterPosition;
        return matchesSearch && matchesPosition;
    });

    return (
        <div className={s.page}>
            <Toast
                message={toast.message}
                type={toast.type}
                isVisible={toast.isVisible}
                onClose={() => setToast(prev => ({ ...prev, isVisible: false }))}
            />

            <div className={s.header}>
                <div>
                    <h1>Banner & Quảng cáo</h1>
                    <p>Quản lý banner và hình ảnh quảng cáo trên website</p>
                </div>
                <Button variant="cyan" onClick={() => handleOpenModal()}>
                    <Plus size={18} /> THÊM BANNER
                </Button>
            </div>

            <div className={s.filtersBar}>
                <div className={s.searchBox}>
                    <Input
                        placeholder="Tìm theo tiêu đề..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        leftIcon={<Search size={18} />}
                    />
                </div>

                <div className={s.tabs}>
                    {[
                        { key: 'all', label: 'Tất cả' },
                        { key: 'home', label: 'Trang chủ' },
                        { key: 'promotion', label: 'Khuyến mãi' },
                        { key: 'banner', label: 'Banner' },
                        { key: 'popup', label: 'Popup' },
                    ].map(({ key, label }) => (
                        <button
                            key={key}
                            onClick={() => setFilterPosition(key)}
                            className={`${s.tabBtn} ${filterPosition === key ? s.active : ''}`}
                        >
                            {label}
                        </button>
                    ))}
                </div>
            </div>

            <div className={s.bannersGrid}>
                {loading ? (
                    <div className={s.loadingState}>
                        <div className={s.spinner}></div>
                        <p>Đang tải dữ liệu...</p>
                    </div>
                ) : filteredBanners.length === 0 ? (
                    <div className={s.emptyState}>
                        <AlertCircle size={48} />
                        <h3>Chưa có banner nào</h3>
                        <p>Hãy thêm banner để thu hút khách hàng ngay!</p>
                        <Button variant="cyan" onClick={() => handleOpenModal()}>THÊM BANNER MỚI</Button>
                    </div>
                ) : (
                    filteredBanners.map((banner, index) => {
                        const group = banners.filter(b => b.position === banner.position);
                        const idxInGroup = group.findIndex(b => b._id === banner._id);

                        return (
                            <div key={banner._id} className={s.bannerCard}>
                                <div className={s.imageWrap}>
                                    {banner.image ? (
                                        <img src={banner.image} alt={banner.title} loading="lazy" />
                                    ) : (
                                        <div className={s.emptyImage}>
                                            <ImageIcon size={48} strokeWidth={1} />
                                            <span>No image</span>
                                        </div>
                                    )}
                                    <div className={s.cardBadge}>
                                        <Badge variant={STATUS_CONFG[banner.status].variant}>
                                            {STATUS_CONFG[banner.status].label}
                                        </Badge>
                                    </div>
                                    <div className={s.cardOrder}>
                                        <button
                                            onClick={() => handleReorder(banner._id, 'up')}
                                            disabled={idxInGroup === 0}
                                            className={s.orderBtn}
                                            title="Lên trên"
                                        >
                                            <ArrowUp size={14} />
                                        </button>
                                        <button
                                            onClick={() => handleReorder(banner._id, 'down')}
                                            disabled={idxInGroup === group.length - 1}
                                            className={s.orderBtn}
                                            title="Xuống dưới"
                                        >
                                            <ArrowDown size={14} />
                                        </button>
                                    </div>
                                </div>

                                <div className={s.bannerInfo}>
                                    <div className={s.bannerTitle}>{banner.title}</div>
                                    <div className={s.bannerMeta}>
                                        <div className={s.metaItem}>
                                            <Badge variant="ink">{POSITION_LABELS[banner.position]}</Badge>
                                            <span style={{ marginLeft: 'auto' }}>#{banner.order + 1}</span>
                                        </div>
                                        {banner.link && (
                                            <div className={`${s.metaItem} ${s.primary}`}>
                                                <LinkIcon size={12} />
                                                <span>{banner.link.replace(/^https?:\/\//, '')}</span>
                                            </div>
                                        )}
                                        {(banner.startDate || banner.endDate) && (
                                            <div className={s.metaItem}>
                                                <Calendar size={12} />
                                                <span>
                                                    {banner.startDate ? new Date(banner.startDate).toLocaleDateString() : '...'} —
                                                    {banner.endDate ? new Date(banner.endDate).toLocaleDateString() : '...'}
                                                </span>
                                            </div>
                                        )}
                                    </div>

                                    <div className={s.cardActions}>
                                        <button onClick={() => handleOpenModal(banner)} className={`${s.actionBtn} ${s.edit}`}>
                                            <Edit2 size={14} /> Sửa
                                        </button>
                                        <button onClick={() => handleDelete(banner._id)} className={`${s.actionBtn} ${s.delete}`}>
                                            <Trash2 size={14} /> Xóa
                                        </button>
                                    </div>
                                </div>
                            </div>
                        );
                    })
                )}
            </div>

            {/* Modal */}
            {isModalOpen && (
                <div className={s.modalOverlay} onClick={(e) => e.target === e.currentTarget && handleCloseModal()}>
                    <div className={s.modalContent}>
                        <div className={s.modalHeader}>
                            <h2>{editingBanner ? 'CẬP NHẬT BANNER' : 'THÊM BANNER MỚI'}</h2>
                            <button onClick={handleCloseModal} className={s.closeBtn}>
                                <X size={24} />
                            </button>
                        </div>

                        <form onSubmit={handleSubmit} className={s.form}>
                            <div className={s.field}>
                                <label>Tiêu đề banner *</label>
                                <Input
                                    required
                                    value={formData.title}
                                    onChange={e => setFormData({ ...formData, title: e.target.value })}
                                    placeholder="Vd: Banner Khuyến Mãi Hè 2024"
                                />
                            </div>

                            <div className={s.field}>
                                <label>Hình ảnh quảng cáo *</label>
                                <ImageUploader
                                    value={formData.image ? [formData.image] : []}
                                    onChange={(urls) => setFormData({ ...formData, image: urls[0] || '' })}
                                    maxImages={1}
                                />
                            </div>

                            <div className={s.field}>
                                <label>Đường dẫn khi click (Link)</label>
                                <Input
                                    value={formData.link}
                                    onChange={e => setFormData({ ...formData, link: e.target.value })}
                                    placeholder="https://"
                                    leftIcon={<LinkIcon size={16} />}
                                />
                            </div>

                            <div className={s.formGrid}>
                                <div className={s.field}>
                                    <label>Vị trí hiển thị</label>
                                    <select
                                        value={formData.position}
                                        onChange={e => setFormData({ ...formData, position: e.target.value as any, order: banners.filter(b => b.position === e.target.value).length })}
                                    >
                                        <option value="home">Trang chủ</option>
                                        <option value="promotion">Khuyến mãi</option>
                                        <option value="banner">Banner chung</option>
                                        <option value="popup">Popup</option>
                                    </select>
                                </div>
                                <div className={s.field}>
                                    <label>Thứ tự hiển thị</label>
                                    <input
                                        type="number"
                                        min="0"
                                        value={formData.order}
                                        onChange={e => setFormData({ ...formData, order: Number(e.target.value) })}
                                    />
                                </div>
                            </div>

                            <div className={s.formGrid}>
                                <div className={s.field}>
                                    <label>Ngày bắt đầu</label>
                                    <input
                                        type="date"
                                        value={formData.startDate}
                                        onChange={e => setFormData({ ...formData, startDate: e.target.value })}
                                    />
                                </div>
                                <div className={s.field}>
                                    <label>Ngày kết thúc</label>
                                    <input
                                        type="date"
                                        value={formData.endDate}
                                        onChange={e => setFormData({ ...formData, endDate: e.target.value })}
                                    />
                                </div>
                            </div>

                            <div className={s.field}>
                                <label>Trạng thái</label>
                                <select
                                    value={formData.status}
                                    onChange={e => setFormData({ ...formData, status: e.target.value as any })}
                                >
                                    <option value="active">Đang hoạt động</option>
                                    <option value="inactive">Tạm tắt</option>
                                    <option value="scheduled">Đã lên lịch</option>
                                </select>
                            </div>

                            <div className={s.field}>
                                <label>Mô tả ngắn</label>
                                <textarea
                                    value={formData.description}
                                    onChange={e => setFormData({ ...formData, description: e.target.value })}
                                    rows={2}
                                    placeholder="Ghi chú về banner..."
                                />
                            </div>

                            <div className={s.formActions}>
                                <Button variant="primary" type="submit" fullWidth>
                                    {editingBanner ? 'LƯU THAY ĐỔI' : 'TẠO BANNER NGAY'}
                                </Button>
                                <Button variant="ghost" onClick={handleCloseModal} type="button">HỦY</Button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
