'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  Plus,
  Search,
  Pencil,
  Trash2,
  Eye,
  CheckCircle,
  XCircle,
  Clock,
  Package,
  DollarSign,
  User,
  X,
  MessageCircle,
  ChevronLeft,
  RefreshCw,
  CreditCard,
  FileText
} from 'lucide-react';
import { useToast } from '@/components/ui/Toast';
import { Button, Badge, Input } from '@/components/ui';
import ImageUploader from '@/components/admin/ImageUploader';
import { searchMatch } from '@/lib/normalize';
import s from './page.module.scss';
import { useSiteSettings } from '@/contexts/SiteSettingsContext';
import Link from 'next/link';

interface BuybackOrder {
  _id: string;
  buybackNumber: string;
  sellerName: string;
  sellerPhone: string;
  sellerIdNumber: string;
  sellerAddress: string;
  productInfo: {
    brand: string;
    model: string;
    serialNumber: string;
    condition: string;
    specs: Record<string, any>;
  };
  images: string[];
  buyPrice: number;
  inspectionNotes: string;
  inspectedBy?: { name: string };
  inspectedAt?: string;
  status: 'pending' | 'inspecting' | 'approved' | 'rejected' | 'cancelled';
  approvedBy?: { name: string };
  approvedAt?: string;
  rejectionReason: string;
  paymentMethod: 'cash' | 'bank' | 'qr';
  paidAt?: string;
  notes: string;
  createdAt: string;
  quotedPrice?: number;
}

const STATUS_OPTIONS: Record<string, { label: string; variant: any; icon: any }> = {
  pending: { label: 'Chờ duyệt', variant: 'gold', icon: Clock },
  inspecting: { label: 'Đang kiểm tra', variant: 'purple', icon: Eye },
  approved: { label: 'Đã duyệt', variant: 'green', icon: CheckCircle },
  rejected: { label: 'Từ chối', variant: 'red', icon: XCircle },
  cancelled: { label: 'Đã hủy', variant: 'ink', icon: X },
};

const PAYMENT_METHODS: Record<string, { label: string; icon: any }> = {
  cash: { label: 'Tiền mặt', icon: DollarSign },
  bank: { label: 'Chuyển khoản', icon: CreditCard },
  qr: { label: 'QR Code', icon: CreditCard },
};

export default function BuybackOrdersPage() {
  const siteSettings = useSiteSettings();
  const { success: showSuccess, error: showError } = useToast();
  const [orders, setOrders] = useState<BuybackOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<BuybackOrder | null>(null);
  const [editingOrder, setEditingOrder] = useState<BuybackOrder | null>(null);
  const [quotedPriceInput, setQuotedPriceInput] = useState<string>('');

  const [formData, setFormData] = useState({
    sellerName: '',
    sellerPhone: '',
    sellerIdNumber: '',
    sellerAddress: '',
    productInfo: {
      brand: '',
      model: '',
      serialNumber: '',
      condition: '',
      specs: {},
    },
    images: [] as string[],
    buyPrice: 0,
    inspectionNotes: '',
    status: 'pending',
    paymentMethod: 'cash',
    notes: '',
  });

  const fetchOrders = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/buyback-orders');
      const data = await res.json();
      if (data.success) {
        setOrders(data.data);
      }
    } catch (error) {
      showError('Lỗi tải dữ liệu');
    } finally {
      setLoading(false);
    }
  }, [showError]);

  useEffect(() => {
    fetchOrders();
  }, [fetchOrders]);

  const handleOpenModal = (order?: BuybackOrder) => {
    if (order) {
      setEditingOrder(order);
      setFormData({
        sellerName: order.sellerName,
        sellerPhone: order.sellerPhone,
        sellerIdNumber: order.sellerIdNumber,
        sellerAddress: order.sellerAddress,
        productInfo: { ...order.productInfo },
        images: [...(order.images || [])],
        buyPrice: order.buyPrice,
        inspectionNotes: order.inspectionNotes,
        status: order.status,
        paymentMethod: order.paymentMethod as any,
        notes: order.notes,
      });
    } else {
      setEditingOrder(null);
      setFormData({
        sellerName: '',
        sellerPhone: '',
        sellerIdNumber: '',
        sellerAddress: '',
        productInfo: {
          brand: '',
          model: '',
          serialNumber: '',
          condition: '',
          specs: {},
        },
        images: [],
        buyPrice: 0,
        inspectionNotes: '',
        status: 'pending',
        paymentMethod: 'cash',
        notes: '',
      });
    }
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingOrder(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const url = editingOrder
        ? `/api/buyback-orders/${editingOrder._id}`
        : '/api/buyback-orders';
      const method = editingOrder ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      const data = await res.json();
      if (data.success) {
        showSuccess(editingOrder ? 'Cập nhật thành công!' : 'Tạo đơn thu cũ thành công!');
        handleCloseModal();
        fetchOrders();
      } else {
        showError(data.error || 'Có lỗi xảy ra');
      }
    } catch (error) {
      showError('Lỗi kết nối');
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Bạn có chắc muốn xóa đơn này?')) return;
    try {
      const res = await fetch(`/api/buyback-orders/${id}`, { method: 'DELETE' });
      const data = await res.json();
      if (data.success) {
        showSuccess('Đã xóa thành công!');
        fetchOrders();
      } else {
        showError(data.error || 'Lỗi khi xóa');
      }
    } catch (error) {
      showError('Lỗi kết nối');
    }
  };

  const handleSaveQuotedPrice = async () => {
    if (!selectedOrder) return;
    try {
      const res = await fetch(`/api/buyback-orders/${selectedOrder._id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ quotedPrice: Number(quotedPriceInput || 0) }),
      });
      const data = await res.json();
      if (data.success) {
        showSuccess('Đã lưu giá báo thành công!');
        setSelectedOrder(data.data);
        fetchOrders();
      } else {
        showError(data.error || 'Không thể lưu giá báo');
      }
    } catch (error) {
      showError('Lỗi kết nối khi lưu giá báo');
    }
  };

  const openZaloQuote = () => {
    if (!selectedOrder?.sellerPhone) {
      showError('Không có số điện thoại người bán');
      return;
    }

    const quoted = Number(quotedPriceInput || 0);
    if (!quoted || quoted <= 0) {
      showError('Vui lòng nhập giá báo trước khi gửi Zalo');
      return;
    }

    const message = `${siteSettings.storeName} xin báo giá máy ${selectedOrder.productInfo?.brand || ''} ${selectedOrder.productInfo?.model || ''}: ${formatPrice(quoted)}. Nếu đồng ý, bạn phản hồi giúp shop để chốt đơn nhé. Cảm ơn quý khách!`;
    const zaloUrl = `https://zalo.me/${selectedOrder.sellerPhone}?text=${encodeURIComponent(message)}`;
    window.open(zaloUrl, '_blank', 'noopener,noreferrer');
  };

  const filteredOrders = orders.filter((o) => {
    const matchesSearch = searchMatch(
      searchTerm,
      o.buybackNumber,
      o.sellerName,
      o.sellerPhone,
      o.productInfo.model
    );
    const matchesStatus = filterStatus === 'all' ? true : o.status === filterStatus;
    return matchesSearch && matchesStatus;
  });

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND',
    }).format(price || 0);
  };

  return (
    <div className={s.page}>
      {/* Header */}
      <div className={s.header}>
        <div>
          <h1>Quản lý Thu cũ Đổi mới</h1>
          <p>Hệ thống thu mua, thẩm định và quản lý thiết bị cũ</p>
        </div>
        <div className={s.actions}>
          <Button variant="ghost" onClick={fetchOrders}>
            <RefreshCw size={20} className={loading ? 'animate-spin' : ''} />
          </Button>
          <Button variant="cyan" onClick={() => handleOpenModal()}>
            <Plus size={20} /> TẠO ĐƠN THU CŨ
          </Button>
        </div>
      </div>

      {/* ActionBar */}
      <div className={s.actionBar}>
        <div className={s.search}>
          <Input
            placeholder="Mã đơn, tên khách, SĐT, thiết bị..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            leftIcon={<Search size={18} />}
          />
        </div>
        <div className={s.filters}>
          <button
            className={filterStatus === 'all' ? s.active : ''}
            onClick={() => setFilterStatus('all')}
          >
            Tất cả
          </button>
          {Object.entries(STATUS_OPTIONS).map(([key, obj]) => (
            <button
              key={key}
              className={filterStatus === key ? s.active : ''}
              onClick={() => setFilterStatus(key)}
            >
              {obj.label}
            </button>
          ))}
        </div>
      </div>

      {/* Table */}
      <div className={s.tableContainer}>
        <table>
          <thead>
            <tr>
              <th>Mã đơn</th>
              <th>Người bán</th>
              <th>Thiết bị</th>
              <th style={{ textAlign: 'right' }}>Giá mua</th>
              <th style={{ textAlign: 'center' }}>Trạng thái</th>
              <th>Ngày tạo</th>
              <th style={{ textAlign: 'center' }}>Thao tác</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={7}>
                  <div className={s.loading}>
                    <div className={s.spinner}></div>
                    <span>Đang tải danh sách...</span>
                  </div>
                </td>
              </tr>
            ) : filteredOrders.length === 0 ? (
              <tr>
                <td colSpan={7} style={{ textAlign: 'center', padding: '100px 0' }}>
                  <Package size={48} color="var(--color-bg3)" style={{ margin: '0 auto 16px' }} />
                  <p style={{ color: 'var(--color-ink3)' }}>Không tìm thấy đơn thu cũ nào</p>
                </td>
              </tr>
            ) : (
              filteredOrders.map((order) => {
                const statusObj = STATUS_OPTIONS[order.status] || STATUS_OPTIONS.pending;
                return (
                  <tr key={order._id}>
                    <td><span className={s.mainText}>{order.buybackNumber}</span></td>
                    <td>
                      <span className={s.mainText}>{order.sellerName}</span>
                      <span className={s.subText}>{order.sellerPhone}</span>
                    </td>
                    <td>
                      <span className={s.mainText}>{order.productInfo.brand} {order.productInfo.model}</span>
                      <span className={s.subText}>{order.productInfo.condition}</span>
                    </td>
                    <td className={s.price}>{formatPrice(order.buyPrice)}</td>
                    <td style={{ textAlign: 'center' }}>
                      <Badge variant={statusObj.variant}>{statusObj.label}</Badge>
                    </td>
                    <td>
                      <span className={s.subText}>
                        {new Date(order.createdAt).toLocaleDateString('vi-VN')}
                      </span>
                    </td>
                    <td>
                      <div className={s.actions}>
                        <Button variant="ghost" size="sm" onClick={() => { setSelectedOrder(order); setQuotedPriceInput(order.quotedPrice ? String(order.quotedPrice) : ''); }} title="Chi tiết">
                          <Eye size={18} />
                        </Button>
                        <Button variant="ghost" size="sm" onClick={() => handleOpenModal(order)} title="Sửa">
                          <Pencil size={18} />
                        </Button>
                        <Button variant="ghost" size="sm" onClick={() => handleDelete(order._id)} title="Xóa">
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

      {/* Create/Edit Modal */}
      {isModalOpen && (
        <div className={s.modalOverlay} onClick={(e) => e.target === e.currentTarget && handleCloseModal()}>
          <div className={s.modal}>
            <div className={s.modalHeader}>
              <h2>{editingOrder ? `CẬP NHẬT ĐƠN ${editingOrder.buybackNumber}` : 'TẠO ĐƠN THU CŨ MỚI'}</h2>
              <button onClick={handleCloseModal}><X size={24} /></button>
            </div>
            <form onSubmit={handleSubmit}>
              <div className={s.modalBody}>
                <div className={s.section}>
                  <h3><User size={16} /> Thông tin người bán</h3>
                  <div className={s.formGrid}>
                    <Input
                      label="Họ tên người bán"
                      required
                      value={formData.sellerName}
                      onChange={(e) => setFormData({ ...formData, sellerName: e.target.value })}
                    />
                    <Input
                      label="Số điện thoại"
                      required
                      value={formData.sellerPhone}
                      onChange={(e) => setFormData({ ...formData, sellerPhone: e.target.value })}
                    />
                  </div>
                  <div className={s.formGrid} style={{ marginTop: '12px' }}>
                    <Input
                      label="CMND / CCCD"
                      value={formData.sellerIdNumber}
                      onChange={(e) => setFormData({ ...formData, sellerIdNumber: e.target.value })}
                    />
                    <Input
                      label="Địa chỉ"
                      value={formData.sellerAddress}
                      onChange={(e) => setFormData({ ...formData, sellerAddress: e.target.value })}
                    />
                  </div>
                </div>

                <div className={s.section}>
                  <h3><Package size={16} /> Thông tin thiết bị</h3>
                  <div className={s.formGrid}>
                    <Input
                      label="Thương hiệu"
                      value={formData.productInfo.brand}
                      onChange={(e) => setFormData({ ...formData, productInfo: { ...formData.productInfo, brand: e.target.value } })}
                    />
                    <Input
                      label="Model máy"
                      value={formData.productInfo.model}
                      onChange={(e) => setFormData({ ...formData, productInfo: { ...formData.productInfo, model: e.target.value } })}
                    />
                  </div>
                  <div className={s.formGrid} style={{ marginTop: '12px' }}>
                    <Input
                      label="Số Serial"
                      value={formData.productInfo.serialNumber}
                      onChange={(e) => setFormData({ ...formData, productInfo: { ...formData.productInfo, serialNumber: e.target.value } })}
                    />
                    <Input
                      label="Tình trạng ngoại quan"
                      value={formData.productInfo.condition}
                      onChange={(e) => setFormData({ ...formData, productInfo: { ...formData.productInfo, condition: e.target.value } })}
                      placeholder="VD: 99%, Cấn góc nhẹ..."
                    />
                  </div>
                  <div className={s.fieldGroup} style={{ marginTop: '12px' }}>
                    <label>Hình ảnh thiết bị</label>
                    <ImageUploader
                      value={formData.images}
                      onChange={(urls) => setFormData({ ...formData, images: urls })}
                      maxImages={5}
                    />
                  </div>
                </div>

                <div className={s.section}>
                  <h3><DollarSign size={16} /> Định giá & Thanh toán</h3>
                  <div className={s.formGrid}>
                    <Input
                      label="Giá thu mua (VNĐ)"
                      type="number"
                      required
                      value={formData.buyPrice}
                      onChange={(e) => setFormData({ ...formData, buyPrice: parseInt(e.target.value) || 0 })}
                    />
                    <div className={s.fieldGroup}>
                      <label>Phương thức thanh toán</label>
                      <select
                        value={formData.paymentMethod}
                        onChange={(e) => setFormData({ ...formData, paymentMethod: e.target.value as any })}
                      >
                        {Object.entries(PAYMENT_METHODS).map(([key, obj]) => (
                          <option key={key} value={key}>{obj.label}</option>
                        ))}
                      </select>
                    </div>
                  </div>
                </div>

                <div className={s.section} style={{ marginBottom: 0 }}>
                  <h3><FileText size={16} /> Ghi chú & Trạng thái</h3>
                  <div className={s.fieldGroup}>
                    <label>Trạng thái đơn</label>
                    <select
                      value={formData.status}
                      onChange={(e) => setFormData({ ...formData, status: e.target.value as any })}
                    >
                      {Object.entries(STATUS_OPTIONS).map(([key, obj]) => (
                        <option key={key} value={key}>{obj.label}</option>
                      ))}
                    </select>
                  </div>
                  <div className={s.fieldGroup}>
                    <label>Ghi chú nội bộ</label>
                    <textarea
                      rows={3}
                      value={formData.notes}
                      onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                      placeholder="Thông tin thêm về máy hoặc khách hàng..."
                    />
                  </div>
                </div>
              </div>
              <div className={s.modalFooter}>
                <Button variant="ghost" onClick={handleCloseModal}>HỦY BỎ</Button>
                <Button variant="primary" type="submit">LƯU ĐƠN THU CŨ</Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Detail Modal */}
      {selectedOrder && (
        <div className={s.modalOverlay} onClick={(e) => e.target === e.currentTarget && setSelectedOrder(null)}>
          <div className={s.modal}>
            <div className={s.modalHeader}>
              <div>
                <h2>CHI TIẾT ĐƠN {selectedOrder.buybackNumber}</h2>
                <div style={{ fontFamily: 'var(--font-mono)', fontSize: '10px', color: 'var(--color-ink3)', textTransform: 'uppercase' }}>
                  Ngày tạo: {new Date(selectedOrder.createdAt).toLocaleDateString('vi-VN')}
                </div>
              </div>
              <button onClick={() => setSelectedOrder(null)}><X size={24} /></button>
            </div>
            <div className={s.modalBody}>
              <div className={s.detailGrid}>
                <div className={s.section}>
                  <h3><Package size={16} /> Thông tin thiết bị</h3>
                  <div className={s.detailItem}>
                    <label>Thiết bị</label>
                    <span>{selectedOrder.productInfo.brand} {selectedOrder.productInfo.model}</span>
                  </div>
                  <div className={s.detailItem} style={{ marginTop: '12px' }}>
                    <label>Tình trạng</label>
                    <span>{selectedOrder.productInfo.condition}</span>
                  </div>
                  <div className={s.detailItem} style={{ marginTop: '12px' }}>
                    <label>Số Serial</label>
                    <span>{selectedOrder.productInfo.serialNumber || 'N/A'}</span>
                  </div>
                  <div className={s.imageGrid}>
                    {selectedOrder.images?.map((img, idx) => (
                      <img key={idx} src={img} alt={`Device photo ${idx + 1}`} />
                    ))}
                  </div>
                </div>

                <div className={s.section}>
                  <h3><User size={16} /> Thông tin người bán</h3>
                  <div className={s.detailItem}>
                    <label>Họ tên</label>
                    <span>{selectedOrder.sellerName}</span>
                  </div>
                  <div className={s.detailItem} style={{ marginTop: '12px' }}>
                    <label>Số điện thoại</label>
                    <span>{selectedOrder.sellerPhone}</span>
                  </div>
                  <div className={s.detailItem} style={{ marginTop: '12px' }}>
                    <label>Địa chỉ</label>
                    <span>{selectedOrder.sellerAddress || 'N/A'}</span>
                  </div>
                </div>
              </div>

              <div className={s.quoteCard}>
                <label style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--color-magenta)', fontWeight: 'bold', fontSize: '11px', textTransform: 'uppercase' }}>
                  <DollarSign size={14} /> Báo giá thu cũ (Hệ thống)
                </label>
                <div className={s.quoteInput}>
                  <input
                    type="number"
                    value={quotedPriceInput}
                    onChange={(e) => setQuotedPriceInput(e.target.value)}
                    placeholder="Nhập giá báo cho khách..."
                  />
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <Button variant="primary" size="sm" onClick={handleSaveQuotedPrice}>LƯU GIÁ</Button>
                    <Button variant="cyan" size="sm" onClick={openZaloQuote}>
                      <MessageCircle size={16} /> ZALO
                    </Button>
                  </div>
                </div>
              </div>

              <div className={s.section} style={{ marginTop: '24px', marginBottom: 0 }}>
                <h3><FileText size={16} /> Ghi chú & Thẩm định</h3>
                <div className={s.detailItem}>
                  <label>Ghi chú thẩm định</label>
                  <p style={{ background: 'var(--color-bg)', padding: '12px', borderRadius: 'var(--r-2)', fontSize: '13px', margin: '8px 0', border: '1px solid var(--color-border)' }}>
                    {selectedOrder.inspectionNotes || 'Chưa có ghi chú thẩm định'}
                  </p>
                </div>
                <div className={s.detailItem}>
                  <label>Ghi chú đơn</label>
                  <p style={{ background: 'var(--color-bg)', padding: '12px', borderRadius: 'var(--r-2)', fontSize: '13px', margin: '8px 0', border: '1px solid var(--color-border)' }}>
                    {selectedOrder.notes || 'Không có ghi chú'}
                  </p>
                </div>
              </div>
            </div>
            <div className={s.modalFooter}>
              <Button variant="ghost" onClick={() => setSelectedOrder(null)}>ĐÓNG LẠI</Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
