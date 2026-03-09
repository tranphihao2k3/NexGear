'use client';

import { useEffect, useState, useCallback } from 'react';
import {
  Plus,
  Search,
  RefreshCw,
  Shield,
  Clock,
  CheckCircle,
  XCircle,
  AlertTriangle,
  Trash2,
  Eye,
  X,
  FileText,
  ChevronLeft
} from 'lucide-react';
import { useToast } from '@/components/ui/Toast';
import { Button, Badge, Input } from '@/components/ui';
import s from './page.module.scss';
import Link from 'next/link';

interface WarrantyCard {
  _id: string;
  warrantyNumber: string;
  productId: {
    _id: string;
    name: string;
    model: string;
  };
  customerId: {
    _id: string;
    name: string;
    phone: string;
  };
  orderId?: {
    _id: string;
    orderNumber: string;
  };
  serialNumber: string;
  warrantyType: 'manufacturer' | 'store';
  warrantyStartDate: string;
  warrantyEndDate: string;
  warrantyMonths: number;
  warrantyTerms?: string;
  status: 'active' | 'expired' | 'voided' | 'claimed';
  notes: string;
  createdAt: string;
}

const WARRANTY_TYPES: Record<string, { label: string; variant: any }> = {
  manufacturer: { label: 'Hãng', variant: 'purple' },
  store: { label: 'Cửa hàng', variant: 'cyan' }
};

const STATUS_BADGES: Record<string, { label: string; variant: any; icon: any }> = {
  active: { label: 'Còn hiệu lực', variant: 'green', icon: CheckCircle },
  expired: { label: 'Hết hạn', variant: 'ink', icon: Clock },
  voided: { label: 'Vô hiệu', variant: 'red', icon: XCircle },
  claimed: { label: 'Đã bảo hành', variant: 'gold', icon: AlertTriangle }
};

export default function WarrantyCardsPage() {
  const { success: showSuccess, error: showError } = useToast();
  const [warrantyCards, setWarrantyCards] = useState<WarrantyCard[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedCard, setSelectedCard] = useState<WarrantyCard | null>(null);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);

  const [formData, setFormData] = useState({
    productId: '',
    customerId: '',
    orderId: '',
    serialNumber: '',
    warrantyType: 'store' as 'manufacturer' | 'store',
    warrantyMonths: 12,
    warrantyTerms: '',
    purchaseDate: '',
    warrantyStartDate: '',
    notes: ''
  });

  const fetchWarrantyCards = useCallback(async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (filterType) params.append('warrantyType', filterType);
      if (filterStatus) params.append('status', filterStatus);

      const response = await fetch(`/api/warranty-cards?${params}`);
      const result = await response.json();

      if (result.success) {
        setWarrantyCards(result.data);
      } else {
        showError('Không thể tải dữ liệu bảo hành');
      }
    } catch (error) {
      showError('Lỗi kết nối server');
    } finally {
      setLoading(false);
    }
  }, [filterType, filterStatus, showError]);

  useEffect(() => {
    fetchWarrantyCards();
  }, [fetchWarrantyCards]);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const response = await fetch('/api/warranty-cards', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });

      const result = await response.json();
      if (result.success) {
        showSuccess('Tạo thẻ bảo hành thành công!');
        setIsModalOpen(false);
        setFormData({
          productId: '',
          customerId: '',
          orderId: '',
          serialNumber: '',
          warrantyType: 'store',
          warrantyMonths: 12,
          warrantyTerms: '',
          purchaseDate: '',
          warrantyStartDate: '',
          notes: ''
        });
        fetchWarrantyCards();
      } else {
        showError(result.error || 'Lỗi khi tạo thẻ');
      }
    } catch (error) {
      showError('Lỗi kết nối server');
    }
  };

  const handleUpdateStatus = async (id: string, status: string) => {
    try {
      const response = await fetch(`/api/warranty-cards/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status })
      });

      const result = await response.json();
      if (result.success) {
        showSuccess('Cập nhật trạng thái thành công!');
        fetchWarrantyCards();
      } else {
        showError(result.error || 'Lỗi khi cập nhật');
      }
    } catch (error) {
      showError('Lỗi kết nối server');
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Bạn có chắc muốn xóa thẻ bảo hành này?')) return;

    try {
      const response = await fetch(`/api/warranty-cards/${id}`, {
        method: 'DELETE'
      });

      const result = await response.json();
      if (result.success) {
        showSuccess('Xóa thẻ bảo hành thành công!');
        fetchWarrantyCards();
      } else {
        showError(result.error || 'Lỗi khi xóa');
      }
    } catch (error) {
      showError('Lỗi kết nối server');
    }
  };

  const getDaysRemaining = (endDate: string) => {
    const days = Math.ceil((new Date(endDate).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24));
    return days > 0 ? days : 0;
  };

  const filteredWarrantyCards = warrantyCards.filter(card => {
    if (!searchTerm) return true;
    const s = searchTerm.toLowerCase();
    return (
      card.warrantyNumber.toLowerCase().includes(s) ||
      card.serialNumber?.toLowerCase().includes(s) ||
      card.customerId?.name.toLowerCase().includes(s) ||
      card.productId?.name.toLowerCase().includes(s)
    );
  });

  return (
    <div className={s.page}>
      {/* Header */}
      <div className={s.header}>
        <div>
          <h1>Quản lý Thẻ Bảo Hành</h1>
          <p>Kích hoạt và theo dõi thời hạn bảo hành sản phẩm cho khách hàng</p>
        </div>
        <Button onClick={() => setIsModalOpen(true)} variant="cyan">
          <Plus size={20} /> TẠO THẺ MỚI
        </Button>
      </div>

      {/* Stats */}
      <div className={s.statsGrid}>
        <div className={s.statCard}>
          <div className={`${s.icon} ${s.primary}`}><Shield size={24} /></div>
          <div className={s.info}>
            <label>Tổng số thẻ</label>
            <span className={s.value}>{warrantyCards.length}</span>
          </div>
        </div>
        <div className={s.statCard}>
          <div className={`${s.icon} ${s.success}`}><CheckCircle size={24} /></div>
          <div className={s.info}>
            <label>Đang hiệu lực</label>
            <span className={s.value}>{warrantyCards.filter(w => w.status === 'active').length}</span>
          </div>
        </div>
        <div className={s.statCard}>
          <div className={`${s.icon} ${s.warning}`}><AlertTriangle size={24} /></div>
          <div className={s.info}>
            <label>Sắp hết hạn</label>
            <span className={s.value}>{warrantyCards.filter(w => w.status === 'active' && getDaysRemaining(w.warrantyEndDate) <= 30).length}</span>
          </div>
        </div>
        <div className={s.statCard}>
          <div className={s.icon}><Clock size={24} /></div>
          <div className={s.info}>
            <label>Hết hạn/Khác</label>
            <span className={s.value}>{warrantyCards.filter(w => w.status !== 'active').length}</span>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className={s.actionBar}>
        <div className={s.search}>
          <Input
            placeholder="Tìm mã thẻ, serial, tên khách, sản phẩm..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            leftIcon={<Search size={18} />}
          />
        </div>

        <div className={s.filters}>
          <select value={filterType} onChange={(e) => setFilterType(e.target.value)}>
            <option value="">Tất cả loại hình</option>
            <option value="manufacturer">Bảo hành hãng</option>
            <option value="store">Bảo hành shop</option>
          </select>

          <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)}>
            <option value="">Tất cả trạng thái</option>
            <option value="active">Còn hiệu lực</option>
            <option value="expired">Hết hạn</option>
            <option value="claimed">Đã sử dụng</option>
          </select>

          <Button variant="ghost" onClick={fetchWarrantyCards}>
            <RefreshCw size={18} className={loading ? 'animate-spin' : ''} />
          </Button>
        </div>
      </div>

      {/* Table */}
      <div className={s.tableContainer}>
        <table>
          <thead>
            <tr>
              <th>Mã thẻ</th>
              <th>Sản phẩm</th>
              <th>Serial</th>
              <th>Khách hàng</th>
              <th style={{ textAlign: 'center' }}>Loại</th>
              <th style={{ textAlign: 'center' }}>Thời hạn</th>
              <th style={{ textAlign: 'center' }}>Trạng thái</th>
              <th style={{ textAlign: 'center' }}>Thao tác</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={8} style={{ textAlign: 'center', padding: '100px 0' }}>
                  <RefreshCw className="animate-spin" size={32} color="var(--color-cyan)" />
                  <p style={{ marginTop: '12px', fontFamily: 'var(--font-mono)', fontSize: '11px', color: 'var(--color-ink3)' }}>ĐANG TẢI DỮ LIỆU...</p>
                </td>
              </tr>
            ) : filteredWarrantyCards.length === 0 ? (
              <tr>
                <td colSpan={8} style={{ textAlign: 'center', padding: '100px 0' }}>
                  <Shield size={48} color="var(--color-bg3)" style={{ margin: '0 auto 16px' }} />
                  <p style={{ color: 'var(--color-ink3)' }}>Không tìm thấy thẻ bảo hành nào</p>
                </td>
              </tr>
            ) : (
              filteredWarrantyCards.map((card) => {
                const typeInfo = WARRANTY_TYPES[card.warrantyType] || { label: card.warrantyType, variant: 'ink' };
                const statusInfo = STATUS_BADGES[card.status] || { label: card.status, variant: 'ink', icon: Clock };
                const daysRemaining = getDaysRemaining(card.warrantyEndDate);

                return (
                  <tr key={card._id}>
                    <td>
                      <span className={s.mainText}>{card.warrantyNumber}</span>
                      <span className={s.subText}>{new Date(card.createdAt).toLocaleDateString('vi-VN')}</span>
                    </td>
                    <td>
                      <span className={s.mainText}>{card.productId?.name}</span>
                      <span className={s.subText}>{card.productId?.model}</span>
                    </td>
                    <td><code style={{ fontSize: '11px', fontFamily: 'var(--font-mono)' }}>{card.serialNumber || '-'}</code></td>
                    <td>
                      <span className={s.mainText}>{card.customerId?.name}</span>
                      <span className={s.subText}>{card.customerId?.phone}</span>
                    </td>
                    <td style={{ textAlign: 'center' }}>
                      <Badge variant={typeInfo.variant}>{typeInfo.label}</Badge>
                    </td>
                    <td style={{ textAlign: 'center' }}>
                      <span className={s.mainText}>{card.warrantyMonths}T</span>
                      <span className={`${s.subText} ${daysRemaining <= 30 && card.status === 'active' ? 'text-red-500 font-bold' : ''}`}>
                        {card.status === 'active' ? `${daysRemaining} ngày` : '---'}
                      </span>
                    </td>
                    <td style={{ textAlign: 'center' }}>
                      <Badge variant={statusInfo.variant}>
                        {statusInfo.label}
                      </Badge>
                    </td>
                    <td>
                      <div className={s.actions}>
                        <Button variant="ghost" size="sm" onClick={() => { setSelectedCard(card); setIsDetailModalOpen(true); }} title="Xem chi tiết">
                          <Eye size={18} />
                        </Button>
                        {card.status === 'active' && (
                          <Button variant="ghost" size="sm" onClick={() => handleUpdateStatus(card._id, 'claimed')} title="Ghi chú bảo hành">
                            <FileText size={18} />
                          </Button>
                        )}
                        <Button variant="ghost" size="sm" onClick={() => handleDelete(card._id)} title="Xóa">
                          <Trash2 size={18} />
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

      <div style={{ marginTop: '24px' }}>
        <Link href="/admin" style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--color-ink3)', fontSize: '11px', fontWeight: 'bold', textTransform: 'uppercase' }}>
          <ChevronLeft size={16} /> Quay lại trang chủ
        </Link>
      </div>

      {/* Create Modal */}
      {isModalOpen && (
        <div className={s.modalOverlay} onClick={(e) => e.target === e.currentTarget && setIsModalOpen(false)}>
          <div className={s.modal}>
            <div className={s.modalHeader}>
              <h2>TẠO THẺ BẢO HÀNH MỚI</h2>
              <button onClick={() => setIsModalOpen(false)}><X size={24} /></button>
            </div>
            <form onSubmit={handleCreate}>
              <div className={s.modalBody}>
                <div className={s.formGrid}>
                  <Input
                    label="Họ tên Khách hàng / ID"
                    required
                    value={formData.customerId}
                    onChange={(e) => setFormData({ ...formData, customerId: e.target.value })}
                  />
                  <Input
                    label="Tên sản phẩm / ID"
                    required
                    value={formData.productId}
                    onChange={(e) => setFormData({ ...formData, productId: e.target.value })}
                  />
                </div>

                <div className={s.formGrid}>
                  <Input
                    label="Mã đơn hàng (nếu có)"
                    value={formData.orderId}
                    onChange={(e) => setFormData({ ...formData, orderId: e.target.value })}
                  />
                  <Input
                    label="Số Serial máy"
                    value={formData.serialNumber}
                    onChange={(e) => setFormData({ ...formData, serialNumber: e.target.value })}
                  />
                </div>

                <div className={s.formGrid}>
                  <div className={s.fieldGroup}>
                    <label>Loại bảo hành</label>
                    <select
                      value={formData.warrantyType}
                      onChange={(e) => setFormData({ ...formData, warrantyType: e.target.value as any })}
                    >
                      <option value="store">Cửa hàng (NEXGEAR)</option>
                      <option value="manufacturer">Chính hãng (Brand)</option>
                    </select>
                  </div>
                  <Input
                    label="Thời hạn (tháng)"
                    type="number"
                    value={formData.warrantyMonths}
                    onChange={(e) => setFormData({ ...formData, warrantyMonths: parseInt(e.target.value) || 0 })}
                  />
                </div>

                <div className={s.formGrid}>
                  <Input
                    label="Ngày mua hàng"
                    type="date"
                    value={formData.purchaseDate}
                    onChange={(e) => setFormData({ ...formData, purchaseDate: e.target.value })}
                  />
                  <Input
                    label="Ngày kích hoạt"
                    type="date"
                    value={formData.warrantyStartDate}
                    onChange={(e) => setFormData({ ...formData, warrantyStartDate: e.target.value })}
                  />
                </div>

                <div className={s.fieldGroup}>
                  <label>Điều khoản riêng</label>
                  <textarea
                    value={formData.warrantyTerms}
                    onChange={(e) => setFormData({ ...formData, warrantyTerms: e.target.value })}
                    placeholder="VD: Không bảo hành rơi vỡ, vào nước..."
                    rows={2}
                  />
                </div>

                <div className={s.fieldGroup}>
                  <label>Ghi chú khác</label>
                  <textarea
                    value={formData.notes}
                    onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                    rows={2}
                  />
                </div>
              </div>
              <div className={s.modalFooter}>
                <Button variant="ghost" onClick={() => setIsModalOpen(false)}>HỦY BỎ</Button>
                <Button variant="primary" type="submit">LƯU THẺ BẢO HÀNH</Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Detail Modal */}
      {isDetailModalOpen && selectedCard && (
        <div className={s.modalOverlay} onClick={(e) => e.target === e.currentTarget && setIsDetailModalOpen(false)}>
          <div className={s.modal}>
            <div className={s.modalHeader}>
              <div>
                <h2>CHI TIẾT THẺ BẢO HÀNH</h2>
                <div style={{ fontFamily: 'var(--font-mono)', fontSize: '10px', color: 'var(--color-cyan)', fontWeight: 'bold' }}>{selectedCard.warrantyNumber}</div>
              </div>
              <button onClick={() => setIsDetailModalOpen(false)}><X size={24} /></button>
            </div>
            <div className={s.modalBody}>
              <div className={s.detailView}>
                <div className={s.formGrid}>
                  <div className={s.detailItem}>
                    <label>Sản phẩm</label>
                    <span>{selectedCard.productId?.name}</span>
                    <div style={{ fontSize: '11px', color: 'var(--color-ink3)' }}>{selectedCard.productId?.model}</div>
                  </div>
                  <div className={s.detailItem}>
                    <label>Serial Number</label>
                    <code>{selectedCard.serialNumber || 'N/A'}</code>
                  </div>
                </div>

                <div className={s.detailItem}>
                  <label>Khách hàng</label>
                  <span>{selectedCard.customerId?.name}</span>
                  <div style={{ fontSize: '12px', color: 'var(--color-cyan)', fontFamily: 'var(--font-mono)' }}>{selectedCard.customerId?.phone}</div>
                </div>

                <div className={s.formGrid}>
                  <div className={s.detailItem}>
                    <label>Thời gian bảo hành</label>
                    <span>{selectedCard.warrantyMonths} Tháng</span>
                  </div>
                  <div className={s.detailItem}>
                    <label>Loại hình</label>
                    <span>{WARRANTY_TYPES[selectedCard.warrantyType]?.label}</span>
                  </div>
                </div>

                <div className={s.formGrid}>
                  <div className={s.detailItem}>
                    <label>Ngày bắt đầu</label>
                    <span>{new Date(selectedCard.warrantyStartDate).toLocaleDateString('vi-VN')}</span>
                  </div>
                  <div className={s.detailItem}>
                    <label>Ngày hết hạn</label>
                    <span style={{ color: selectedCard.status === 'expired' ? 'var(--color-magenta)' : 'inherit' }}>
                      {new Date(selectedCard.warrantyEndDate).toLocaleDateString('vi-VN')}
                    </span>
                  </div>
                </div>

                {selectedCard.warrantyTerms && (
                  <div className={s.detailItem}>
                    <label>Điều khoản</label>
                    <p style={{ background: 'var(--color-bg)', padding: '12px', borderRadius: 'var(--r-2)', fontSize: '13px', border: '1px solid var(--color-border)' }}>
                      {selectedCard.warrantyTerms}
                    </p>
                  </div>
                )}

                {selectedCard.notes && (
                  <div className={s.detailItem}>
                    <label>Ghi chú</label>
                    <span>{selectedCard.notes}</span>
                  </div>
                )}
              </div>
            </div>
            <div className={s.modalFooter}>
              <Button variant="ghost" onClick={() => setIsDetailModalOpen(false)}>ĐÓNG LẠI</Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
