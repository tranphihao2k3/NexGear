'use client';

import { useEffect, useState, useCallback } from 'react';
import {
  Plus,
  Search,
  RefreshCw,
  Megaphone,
  Percent,
  DollarSign,
  Calendar,
  Trash2,
  Eye,
  X,
  Edit2,
  CheckCircle,
  XCircle,
  Clock,
  Play,
  Pause,
  Ticket
} from 'lucide-react';
import { useToast } from '@/components/ui/Toast';
import { Button, Badge, Input } from '@/components/ui';
import s from './page.module.scss';

interface Promotion {
  _id: string;
  name: string;
  code: string;
  description: string;
  discountType: 'percentage' | 'fixed';
  discountValue: number;
  maxDiscountAmount: number;
  applicableProducts: any[];
  applicableCategories: any[];
  minOrderAmount: number;
  startDate: string;
  endDate: string;
  maxUses: number;
  usedCount: number;
  isActive: boolean;
  status: 'draft' | 'active' | 'scheduled' | 'expired' | 'cancelled';
  notes: string;
  createdAt: string;
}

const DISCOUNT_TYPES = {
  percentage: { label: 'Phần trăm', color: 'bg-blue-100 text-blue-700', icon: Percent },
  fixed: { label: 'Cố định', color: 'bg-green-100 text-green-700', icon: DollarSign }
};

const STATUS_MAP = {
  draft: { label: 'Bản nháp', variant: 'ink', icon: Clock },
  active: { label: 'Đang chạy', variant: 'green', icon: CheckCircle },
  scheduled: { label: 'Lên lịch', variant: 'cyan', icon: Calendar },
  expired: { label: 'Hết hạn', variant: 'ink', icon: XCircle },
  cancelled: { label: 'Đã hủy', variant: 'magenta', icon: XCircle }
};

export default function PromotionsPage() {
  const { success: showSuccess, error: showError } = useToast();
  const [promotions, setPromotions] = useState<Promotion[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedPromotion, setSelectedPromotion] = useState<Promotion | null>(null);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);

  const [formData, setFormData] = useState({
    name: '',
    code: '',
    description: '',
    discountType: 'percentage' as 'percentage' | 'fixed',
    discountValue: 0,
    maxDiscountAmount: 0,
    applicableProducts: [] as string[],
    applicableCategories: [] as string[],
    minOrderAmount: 0,
    startDate: '',
    endDate: '',
    maxUses: 0,
    notes: ''
  });

  const fetchPromotions = useCallback(async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (filterStatus) params.append('status', filterStatus);
      if (searchTerm) params.append('search', searchTerm);

      const response = await fetch(`/api/admin/promotions?${params}`);
      const result = await response.json();

      if (result.success) {
        setPromotions(result.data);
      } else {
        showError(result.error || 'Lỗi khi tải dữ liệu');
      }
    } catch (error) {
      showError('Lỗi kết nối server');
    } finally {
      setLoading(false);
    }
  }, [filterStatus, searchTerm, showError]);

  useEffect(() => {
    fetchPromotions();
  }, [fetchPromotions]);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const response = await fetch('/api/admin/promotions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });

      const result = await response.json();
      if (result.success) {
        showSuccess(result.message || 'Đã tạo chương trình khuyến mãi');
        setIsModalOpen(false);
        resetForm();
        fetchPromotions();
      } else {
        showError(result.error || 'Lỗi khi tạo');
      }
    } catch (error) {
      showError('Lỗi kết nối server');
    }
  };

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPromotion) return;

    try {
      const response = await fetch(`/api/admin/promotions/${selectedPromotion._id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });

      const result = await response.json();
      if (result.success) {
        showSuccess(result.message || 'Đã cập nhật thành công');
        setIsModalOpen(false);
        setIsEditMode(false);
        setSelectedPromotion(null);
        resetForm();
        fetchPromotions();
      } else {
        showError(result.error || 'Lỗi khi cập nhật');
      }
    } catch (error) {
      showError('Lỗi kết nối server');
    }
  };

  const handleUpdateStatus = async (id: string, status: string) => {
    try {
      const response = await fetch(`/api/admin/promotions/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status })
      });

      const result = await response.json();
      if (result.success) {
        showSuccess('Cập nhật trạng thái thành công');
        fetchPromotions();
      } else {
        showError(result.error || 'Lỗi khi cập nhật');
      }
    } catch (error) {
      showError('Lỗi kết nối server');
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Bạn có chắc muốn xóa chương trình khuyến mãi này?')) return;

    try {
      const response = await fetch(`/api/admin/promotions/${id}`, {
        method: 'DELETE'
      });

      const result = await response.json();
      if (result.success) {
        showSuccess(result.message || 'Đã xóa thành công');
        fetchPromotions();
      } else {
        showError(result.error || 'Lỗi khi xóa');
      }
    } catch (error) {
      showError('Lỗi kết nối server');
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      code: '',
      description: '',
      discountType: 'percentage',
      discountValue: 0,
      maxDiscountAmount: 0,
      applicableProducts: [],
      applicableCategories: [],
      minOrderAmount: 0,
      startDate: '',
      endDate: '',
      maxUses: 0,
      notes: ''
    });
  };

  const openEditModal = (promotion: Promotion) => {
    setSelectedPromotion(promotion);
    setFormData({
      name: promotion.name,
      code: promotion.code,
      description: promotion.description,
      discountType: promotion.discountType,
      discountValue: promotion.discountValue,
      maxDiscountAmount: promotion.maxDiscountAmount,
      applicableProducts: promotion.applicableProducts?.map((p: any) => p._id || p) || [],
      applicableCategories: promotion.applicableCategories?.map((c: any) => c._id || c) || [],
      minOrderAmount: promotion.minOrderAmount,
      startDate: promotion.startDate ? new Date(promotion.startDate).toISOString().split('T')[0] : '',
      endDate: promotion.endDate ? new Date(promotion.endDate).toISOString().split('T')[0] : '',
      maxUses: promotion.maxUses,
      notes: promotion.notes
    });
    setIsEditMode(true);
    setIsModalOpen(true);
  };

  const isExpired = (endDate: string) => new Date(endDate) < new Date();

  return (
    <div className={s.page}>
      <div className={s.header}>
        <div>
          <h1><Ticket size={32} color="#F0356A" /> Khuyến mãi</h1>
          <p>Quản lý chương trình khuyến mãi và ưu đãi khách hàng</p>
        </div>
        <Button
          variant="primary"
          onClick={() => {
            setIsEditMode(false);
            resetForm();
            setIsModalOpen(true);
          }}
          leftIcon={<Plus size={20} />}
        >
          TẠO KHUYẾN MÃI
        </Button>
      </div>

      <div className={s.actionBar}>
        <div className={s.search}>
          <Search size={20} />
          <input
            type="text"
            placeholder="Tìm kiếm theo tên hoặc mã giảm giá..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        <select
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value)}
        >
          <option value="">Tất cả trạng thái</option>
          <option value="draft">Bản nháp</option>
          <option value="active">Đang chạy</option>
          <option value="scheduled">Đã lên lịch</option>
          <option value="expired">Hết hạn</option>
        </select>

        <Button variant="ghost" onClick={fetchPromotions} leftIcon={<RefreshCw size={18} />}>
          LÀM MỚI
        </Button>
      </div>

      <div className={s.statsGrid}>
        <div className={s.statCard}>
          <div className={`${s.icon} ${s.blue}`}><Megaphone size={24} /></div>
          <div className={s.info}>
            <div className={s.label}>Tổng CTKM</div>
            <div className={s.value}>{promotions.length}</div>
          </div>
        </div>

        <div className={s.statCard}>
          <div className={`${s.icon} ${s.green}`}><CheckCircle size={24} /></div>
          <div className={s.info}>
            <div className={s.label}>Đang chạy</div>
            <div className={s.value}>{promotions.filter(p => p.status === 'active').length}</div>
          </div>
        </div>

        <div className={s.statCard}>
          <div className={`${s.icon} ${s.yellow}`}><Clock size={24} /></div>
          <div className={s.info}>
            <div className={s.label}>Bản nháp</div>
            <div className={s.value}>{promotions.filter(p => p.status === 'draft').length}</div>
          </div>
        </div>

        <div className={s.statCard}>
          <div className={`${s.icon} ${s.purple}`}><Plus size={24} /></div>
          <div className={s.info}>
            <div className={s.label}>Đã sử dụng</div>
            <div className={s.value}>{promotions.reduce((sum, p) => sum + (p.usedCount || 0), 0)}</div>
          </div>
        </div>
      </div>

      <div className={s.tableWrapper}>
        <table>
          <thead>
            <tr>
              <th>Tên / Mã</th>
              <th style={{ textAlign: 'center' }}>Giảm giá</th>
              <th style={{ textAlign: 'center' }}>Thời gian</th>
              <th style={{ textAlign: 'center' }}>Sử dụng</th>
              <th style={{ textAlign: 'center' }}>Trạng thái</th>
              <th style={{ textAlign: 'center' }}>Thao tác</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={6} style={{ textAlign: 'center', padding: '100px 0' }}>
                  <RefreshCw className="animate-spin mb-2" size={32} color="#00C4AD" />
                  <p>Hệ thống đang tải dữ liệu...</p>
                </td>
              </tr>
            ) : promotions.length === 0 ? (
              <tr>
                <td colSpan={6} style={{ textAlign: 'center', padding: '100px 0', color: '#7A7870' }}>
                  Chưa có chương trình khuyến mãi nào.
                </td>
              </tr>
            ) : (
              promotions.map((promo) => {
                const statusInfo = STATUS_MAP[promo.status] || STATUS_MAP.draft;

                return (
                  <tr key={promo._id}>
                    <td>
                      <div className={s.promoName}>
                        <div className={s.name}>{promo.name}</div>
                        {promo.code && <div className={s.code}>{promo.code}</div>}
                      </div>
                    </td>
                    <td style={{ textAlign: 'center' }}>
                      <div className={`${s.discountBadge} ${s[promo.discountType]}`}>
                        {promo.discountType === 'percentage'
                          ? `${promo.discountValue}%`
                          : new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(promo.discountValue)}
                      </div>
                      {promo.maxDiscountAmount > 0 && (
                        <div style={{ fontSize: '10px', color: '#7A7870', marginTop: '4px' }}>
                          Max: {new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(promo.maxDiscountAmount)}
                        </div>
                      )}
                    </td>
                    <td style={{ textAlign: 'center' }}>
                      <div style={{ fontSize: '12px' }}>
                        {new Date(promo.startDate).toLocaleDateString('vi-VN')}
                      </div>
                      <div style={{ fontSize: '10px', color: '#7A7870' }}>
                        đến {new Date(promo.endDate).toLocaleDateString('vi-VN')}
                      </div>
                      {isExpired(promo.endDate) && (
                        <div style={{ fontSize: '10px', color: '#F0356A', fontWeight: 'bold' }}>(HẾT HẠN)</div>
                      )}
                    </td>
                    <td style={{ textAlign: 'center' }}>
                      <div className={s.usage}>
                        <div className={s.usageText}>
                          {promo.usedCount || 0}
                          {promo.maxUses > 0 && ` / ${promo.maxUses}`}
                        </div>
                        {promo.maxUses > 0 && (
                          <div className={s.progressBar}>
                            <div
                              className={s.fill}
                              style={{ width: `${Math.min(100, ((promo.usedCount || 0) / promo.maxUses) * 100)}%` }}
                            />
                          </div>
                        )}
                      </div>
                    </td>
                    <td style={{ textAlign: 'center' }}>
                      <Badge variant={statusInfo.variant as any}>
                        {statusInfo.label}
                      </Badge>
                    </td>
                    <td>
                      <div className={s.actions}>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            setSelectedPromotion(promo);
                            setIsDetailModalOpen(true);
                          }}
                        >
                          <Eye size={16} />
                        </Button>
                        {promo.status === 'draft' && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleUpdateStatus(promo._id, 'active')}
                          >
                            <Play size={16} color="#1DB96A" />
                          </Button>
                        )}
                        {promo.status === 'active' && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleUpdateStatus(promo._id, 'cancelled')}
                          >
                            <Pause size={16} color="#F0A500" />
                          </Button>
                        )}
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => openEditModal(promo)}
                        >
                          <Edit2 size={16} color="#00C4AD" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDelete(promo._id)}
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
      </div>

      {/* Create/Edit Modal */}
      {isModalOpen && (
        <div className={s.modalOverlay}>
          <div className={s.modal}>
            <div className={s.modalHeader}>
              <h2>{isEditMode ? 'CHỈNH SỬA KHUYẾN MÃI' : 'TẠO MỚI KHUYẾN MÃI'}</h2>
              <Button variant="ghost" onClick={() => setIsModalOpen(false)}>
                <X size={20} />
              </Button>
            </div>
            <form onSubmit={isEditMode ? handleUpdate : handleCreate}>
              <Input
                label="Tên chương trình khuyến mãi *"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                required
              />

              <div className={s.formGrid}>
                <Input
                  label="Mã khuyến mãi (Code)"
                  value={formData.code}
                  onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
                  placeholder="VD: NEXGEAR2024"
                />
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  <label style={{ fontSize: '11px', fontWeight: 'bold', fontFamily: 'JetBrains Mono' }}>LOẠI GIẢM GIÁ</label>
                  <select
                    value={formData.discountType}
                    onChange={(e) => setFormData({ ...formData, discountType: e.target.value as any })}
                    style={{ padding: '8px', borderRadius: '4px', border: '1px solid #ddd' }}
                  >
                    <option value="percentage">Phần trăm (%)</option>
                    <option value="fixed">Số tiền cố định (VND)</option>
                  </select>
                </div>
              </div>

              <div className={s.formGrid}>
                <Input
                  label={`Giá trị ${formData.discountType === 'percentage' ? '(%)' : '(VND)'}*`}
                  type="number"
                  value={formData.discountValue}
                  onChange={(e) => setFormData({ ...formData, discountValue: parseFloat(e.target.value) || 0 })}
                  required
                />
                <Input
                  label="Giảm tối đa (VNĐ)"
                  type="number"
                  value={formData.maxDiscountAmount}
                  onChange={(e) => setFormData({ ...formData, maxDiscountAmount: parseFloat(e.target.value) || 0 })}
                />
              </div>

              <div className={s.formGrid}>
                <Input
                  label="Ngày bắt đầu *"
                  type="date"
                  value={formData.startDate}
                  onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                  required
                />
                <Input
                  label="Ngày kết thúc *"
                  type="date"
                  value={formData.endDate}
                  onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                  required
                />
              </div>

              <div className={s.formGrid}>
                <Input
                  label="Đơn tối thiểu (VNĐ)"
                  type="number"
                  value={formData.minOrderAmount}
                  onChange={(e) => setFormData({ ...formData, minOrderAmount: parseFloat(e.target.value) || 0 })}
                />
                <Input
                  label="Lượt dùng (0=k.giới hạn)"
                  type="number"
                  value={formData.maxUses}
                  onChange={(e) => setFormData({ ...formData, maxUses: parseInt(e.target.value) || 0 })}
                />
              </div>

              <Input
                label="Mô tả & Ghi chú"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              />

              <div className={s.modalFooter}>
                <Button variant="ghost" onClick={() => setIsModalOpen(false)}>HỦY BỎ</Button>
                <Button variant="primary" type="submit">
                  {isEditMode ? 'CẬP NHẬT' : 'TẠO MỚI'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Detail Modal */}
      {isDetailModalOpen && selectedPromotion && (
        <div className={s.modalOverlay}>
          <div className={s.detailModal}>
            <div className={s.modalHeader}>
              <h2>CHI TIẾT KHUYẾN MÃI</h2>
              <Button variant="ghost" onClick={() => setIsDetailModalOpen(false)}>
                <X size={20} />
              </Button>
            </div>
            <div className={s.detailContent}>
              <div className={s.promoBanner}>
                <div className={s.name}>{selectedPromotion.name}</div>
                <div className={s.code}>{selectedPromotion.code || 'CHƯA CỐ ĐỊNH'}</div>
              </div>

              <div className={s.detailRow}>
                <span className={s.label}>Mô tả / Hình thức:</span>
                <span className={s.value}>{selectedPromotion.description || 'Không có mô tả chi tiết.'}</span>
              </div>

              <div className={s.formGrid}>
                <div className={s.detailRow}>
                  <span className={s.label}>Mức ưu đãi:</span>
                  <span className={s.value} style={{ color: '#F0356A' }}>
                    {selectedPromotion.discountType === 'percentage'
                      ? `${selectedPromotion.discountValue}%`
                      : `${selectedPromotion.discountValue.toLocaleString('vi-VN')} VND`}
                  </span>
                </div>
                <div className={s.detailRow}>
                  <span className={s.label}>Giảm tối đa:</span>
                  <span className={s.value}>
                    {selectedPromotion.maxDiscountAmount > 0
                      ? `${selectedPromotion.maxDiscountAmount.toLocaleString('vi-VN')} VND`
                      : 'Không giới hạn'}
                  </span>
                </div>
              </div>

              <div className={s.formGrid}>
                <div className={s.detailRow}>
                  <span className={s.label}>Bắt đầu:</span>
                  <span className={s.value}>
                    {new Date(selectedPromotion.startDate).toLocaleDateString('vi-VN')}
                  </span>
                </div>
                <div className={s.detailRow}>
                  <span className={s.label}>Kết thúc:</span>
                  <span className={s.value} style={{ color: isExpired(selectedPromotion.endDate) ? '#F0356A' : 'inherit' }}>
                    {new Date(selectedPromotion.endDate).toLocaleDateString('vi-VN')}
                  </span>
                </div>
              </div>

              <div className={s.formGrid}>
                <div className={s.detailRow}>
                  <span className={s.label}>Tối thiểu đơn:</span>
                  <span className={s.value}>
                    {selectedPromotion.minOrderAmount > 0
                      ? `${selectedPromotion.minOrderAmount.toLocaleString('vi-VN')} VND`
                      : '0 VND'}
                  </span>
                </div>
                <div className={s.detailRow}>
                  <span className={s.label}>Lượt sử dụng:</span>
                  <span className={s.value}>
                    {selectedPromotion.usedCount || 0}
                    {selectedPromotion.maxUses > 0 && ` / ${selectedPromotion.maxUses}`}
                  </span>
                </div>
              </div>

              {selectedPromotion.notes && (
                <div className={s.detailRow}>
                  <span className={s.label}>Ghi chú nội bộ:</span>
                  <span className={s.value} style={{ fontStyle: 'italic', color: '#7A7870' }}>
                    {selectedPromotion.notes}
                  </span>
                </div>
              )}
            </div>
            <div className={s.modalFooter}>
              <Button variant="cyan" fullWidth onClick={() => setIsDetailModalOpen(false)}>
                ĐÓNG CỬA SỔ
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
