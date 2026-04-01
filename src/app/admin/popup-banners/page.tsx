'use client';

import { useState, useEffect } from 'react';
import {
    Plus, Search, Edit2, Trash2, Eye, EyeOff, Image as ImageIcon,
    Clock, MousePointer, Monitor, X, AlertCircle, Calendar
} from 'lucide-react';
import Toast from '@/components/admin/Toast';
import ImageUploader from '@/components/admin/ImageUploader';
import { Button, Badge, Input, LazyImage } from '@/components/ui';
import s from './page.module.scss';

interface PopupBanner {
    _id: string;
    title: string;
    image: string;
    link: string;
    displayFrequency: 'once' | 'daily' | 'every_session';
    startDate: string | null;
    endDate: string | null;
    delaySeconds: number;
    isActive: boolean;
    showOnPages: string[];
    createdAt: string;
}

const FREQUENCY_LABELS: Record<string, string> = {
    once: '1 lần duy nhất',
    daily: 'Mỗi ngày 1 lần',
    every_session: 'Mỗi phiên truy cập',
};

export default function PopupBannersPage() {
    const [banners, setBanners] = useState<PopupBanner[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingBanner, setEditingBanner] = useState<PopupBanner | null>(null);

    const [formData, setFormData] = useState({
        title: '',
        image: '',
        link: '',
        displayFrequency: 'once',
        startDate: '',
        endDate: '',
        delaySeconds: 3,
        isActive: true,
        showOnPages: ['all'],
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
            const res = await fetch('/api/popup-banners');
            const data = await res.json();
            if (data.success) {
                setBanners(data.data);
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

    const handleOpenModal = (banner?: PopupBanner) => {
        if (banner) {
            setEditingBanner(banner);
            setFormData({
                title: banner.title,
                image: banner.image,
                link: banner.link,
                displayFrequency: banner.displayFrequency,
                startDate: banner.startDate ? banner.startDate.split('T')[0] : '',
                endDate: banner.endDate ? banner.endDate.split('T')[0] : '',
                delaySeconds: banner.delaySeconds,
                isActive: banner.isActive,
                showOnPages: banner.showOnPages || ['all'],
            });
        } else {
            setEditingBanner(null);
            setFormData({
                title: '',
                image: '',
                link: '',
                displayFrequency: 'once',
                startDate: '',
                endDate: '',
                delaySeconds: 3,
                isActive: true,
                showOnPages: ['all'],
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
                ? `/api/popup-banners/${editingBanner._id}`
                : '/api/popup-banners';
            const method = editingBanner ? 'PUT' : 'POST';

            const res = await fetch(url, {
                method,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(formData),
            });

            const data = await res.json();

            if (data.success) {
                showToast(editingBanner ? 'Cập nhật thành công!' : 'Tạo popup thành công!');
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
        if (!confirm('Bạn có chắc muốn xóa popup này?')) return;

        try {
            const res = await fetch(`/api/popup-banners/${id}`, { method: 'DELETE' });
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

    const handleToggleActive = async (banner: PopupBanner) => {
        try {
            const res = await fetch(`/api/popup-banners/${banner._id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ isActive: !banner.isActive }),
            });

            const data = await res.json();

            if (data.success) {
                showToast(banner.isActive ? 'Đã tắt popup' : 'Đã bật popup');
                fetchBanners();
            }
        } catch (error) {
            showToast('Lỗi kết nối', 'error');
        }
    };

    const filteredBanners = banners.filter(b =>
        b.title.toLowerCase().includes(searchTerm.toLowerCase())
    );

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
                    <h1>Popup Quảng cáo</h1>
                    <p>Quản lý các popup tự động hiển thị trên website</p>
                </div>
                <Button variant="cyan" onClick={() => handleOpenModal()}>
                    <Plus size={18} /> THÊM POPUP
                </Button>
            </div>

            <div className={s.filtersBar}>
                <div className={s.searchBox}>
                    <Input
                        placeholder="Tìm theo tiêu đề popup..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        leftIcon={<Search size={18} />}
                    />
                </div>
            </div>

            <div className={s.grid}>
                {loading ? (
                    <div className={s.loading}>
                        <div className={s.spinner}></div>
                        <p>Đang tải dữ liệu...</p>
                    </div>
                ) : filteredBanners.length === 0 ? (
                    <div className={s.empty}>
                        <AlertCircle size={48} />
                        <h3>Chưa có popup nào</h3>
                        <p>Hệ thống hỗ trợ tự động hiển thị popup cho khách hàng điểm danh hoặc nhận quà.</p>
                        <Button variant="cyan" onClick={() => handleOpenModal()}>TẠO POPUP NGAY</Button>
                    </div>
                ) : (
                    filteredBanners.map((banner) => (
                        <div key={banner._id} className={s.card}>
                            <div className={s.imageWrap}>
                                {banner.image ? (
                                    <LazyImage src={banner.image} alt={banner.title} />
                                ) : (
                                    <div className={s.emptyImage}>
                                        <ImageIcon size={48} strokeWidth={1} />
                                        <span>No image</span>
                                    </div>
                                )}
                                <div className={s.activeToggle}>
                                    <button
                                        onClick={() => handleToggleActive(banner)}
                                        className={banner.isActive ? s.active : ''}
                                        title={banner.isActive ? "Tắt popup" : "Bật popup"}
                                    >
                                        {banner.isActive ? <Eye size={18} /> : <EyeOff size={18} />}
                                    </button>
                                </div>
                            </div>

                            <div className={s.info}>
                                <div className={s.titleRow}>
                                    <h3>{banner.title}</h3>
                                    <Badge variant={banner.isActive ? 'green' : 'gray'}>
                                        {banner.isActive ? 'BẬT' : 'TẮT'}
                                    </Badge>
                                </div>

                                <div className={s.metaList}>
                                    <div className={s.metaItem}>
                                        <Clock size={14} />
                                        <span>Delay: <strong>{banner.delaySeconds}s</strong></span>
                                    </div>
                                    <div className={s.metaItem}>
                                        <MousePointer size={14} />
                                        <span>{FREQUENCY_LABELS[banner.displayFrequency]}</span>
                                    </div>
                                    {(banner.startDate || banner.endDate) && (
                                        <div className={s.metaItem}>
                                            <Calendar size={14} />
                                            <span>
                                                {banner.startDate ? new Date(banner.startDate).toLocaleDateString() : '...'} —
                                                {banner.endDate ? new Date(banner.endDate).toLocaleDateString() : '...'}
                                            </span>
                                        </div>
                                    )}
                                </div>

                                <div className={s.actions}>
                                    <button onClick={() => handleOpenModal(banner)} className={`${s.actionBtn} ${s.edit}`}>
                                        <Edit2 size={14} /> Sửa
                                    </button>
                                    <button onClick={() => handleDelete(banner._id)} className={`${s.actionBtn} ${s.delete}`}>
                                        <Trash2 size={14} /> Xóa
                                    </button>
                                </div>
                            </div>
                        </div>
                    ))
                )}
            </div>

            {/* Modal */}
            {isModalOpen && (
                <div className={s.overlay} onClick={(e) => e.target === e.currentTarget && handleCloseModal()}>
                    <div className={s.modal}>
                        <div className={s.modalHeader}>
                            <h2>{editingBanner ? 'CẬP NHẬT POPUP' : 'THÊM POPUP MỚI'}</h2>
                            <button onClick={handleCloseModal} className={s.closeBtn}>
                                <X size={24} />
                            </button>
                        </div>

                        <form onSubmit={handleSubmit} className={s.form}>
                            <div className={s.field}>
                                <label>Tiêu đề popup *</label>
                                <Input
                                    required
                                    value={formData.title}
                                    onChange={e => setFormData({ ...formData, title: e.target.value })}
                                    placeholder="Vd: Popup Quà Tặng Năm Mới"
                                />
                            </div>

                            <div className={s.field}>
                                <label>Hình ảnh Popup *</label>
                                <ImageUploader
                                    value={formData.image ? [formData.image] : []}
                                    onChange={(urls) => setFormData({ ...formData, image: urls[0] || '' })}
                                    maxImages={1}
                                />
                            </div>

                            <div className={s.field}>
                                <label>Đường dẫn Web (Link)</label>
                                <Input
                                    value={formData.link}
                                    onChange={e => setFormData({ ...formData, link: e.target.value })}
                                    placeholder="https://"
                                />
                            </div>

                            <div className={s.row}>
                                <div className={s.field}>
                                    <label>Tần suất hiển thị</label>
                                    <select
                                        value={formData.displayFrequency}
                                        onChange={e => setFormData({ ...formData, displayFrequency: e.target.value as any })}
                                    >
                                        <option value="once">1 lần duy nhất</option>
                                        <option value="daily">Mỗi ngày 1 lần</option>
                                        <option value="every_session">Mỗi phiên làm việc</option>
                                    </select>
                                </div>
                                <div className={s.field}>
                                    <label>Độ trễ hiện (giây)</label>
                                    <input
                                        type="number"
                                        min="0"
                                        max="60"
                                        value={formData.delaySeconds}
                                        onChange={e => setFormData({ ...formData, delaySeconds: Number(e.target.value) })}
                                    />
                                </div>
                            </div>

                            <div className={s.row}>
                                <div className={s.field}>
                                    <label>Bắt đầu từ</label>
                                    <input
                                        type="date"
                                        value={formData.startDate}
                                        onChange={e => setFormData({ ...formData, startDate: e.target.value })}
                                    />
                                </div>
                                <div className={s.field}>
                                    <label>Kết thúc vào</label>
                                    <input
                                        type="date"
                                        value={formData.endDate}
                                        onChange={e => setFormData({ ...formData, endDate: e.target.value })}
                                    />
                                </div>
                            </div>

                            <label className={s.checkboxField}>
                                <input
                                    type="checkbox"
                                    checked={formData.isActive}
                                    onChange={e => setFormData({ ...formData, isActive: e.target.checked })}
                                />
                                <span>Kích hoạt popup ngay</span>
                            </label>

                            <div className={s.formActions}>
                                <Button variant="primary" type="submit" fullWidth>
                                    {editingBanner ? 'LƯU THAY ĐỔI' : 'TẠO POPUP NGAY'}
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
