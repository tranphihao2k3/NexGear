'use client';

import { useEffect, useState, useCallback } from 'react';
import {
  Search,
  Plus,
  Eye,
  Pencil,
  RefreshCw,
  Wrench,
  Clock,
  CheckCircle,
  XCircle,
  Trash2,
  X,
  MessageCircle,
  ChevronLeft
} from 'lucide-react';
import { useToast } from '@/components/ui/Toast';
import { Button, Badge, Input } from '@/components/ui';
import ImageUploader from '@/components/admin/ImageUploader';
import { searchMatch } from '@/lib/normalize';
import s from './page.module.scss';
import Link from 'next/link';

// ============================================
// Types
// ============================================
interface ServiceType {
  _id: string;
  serviceNumber: string;
  serviceType: string;
  customerName: string;
  customerPhone: string;
  productInfo?: {
    brand?: string;
    model?: string;
    serialNumber?: string;
  };
  images?: string[];
  status: string;
  priority: string;
  issueDescription: string;
  estimatedCost: number;
  actualCost: number;
  receivedDate: string;
  completedDate?: string;
  notes?: string;
  createdAt: string;
  quotedPrice?: number;
}

const STATUS_OPTIONS: Record<string, { label: string; variant: any; icon: any }> = {
  pending: { label: 'Chờ tiếp nhận', variant: 'gold', icon: Clock },
  diagnosing: { label: 'Đang chẩn đoán', variant: 'purple', icon: Search },
  in_progress: { label: 'Đang sửa chữa', variant: 'cyan', icon: Wrench },
  waiting_parts: { label: 'Chờ linh kiện', variant: 'gold', icon: Clock },
  completed: { label: 'Hoàn thành', variant: 'green', icon: CheckCircle },
  cancelled: { label: 'Đã hủy', variant: 'ink', icon: XCircle },
};

const PRIORITY_OPTIONS: Record<string, { label: string; variant: any }> = {
  low: { label: 'Thấp', variant: 'ink' },
  normal: { label: 'Bình thường', variant: 'cyan' },
  high: { label: 'Cao', variant: 'magenta' },
  urgent: { label: 'Khẩn cấp', variant: 'red' }
};

const SERVICE_TYPES: Record<string, { label: string; variant: any }> = {
  repair: { label: 'Sửa chữa', variant: 'magenta' },
  cleaning: { label: 'Vệ sinh', variant: 'cyan' },
  upgrade: { label: 'Nâng cấp', variant: 'purple' },
  warranty: { label: 'Bảo hành', variant: 'green' },
  inspection: { label: 'Kiểm tra', variant: 'ink' },
};

export default function ServicesPage() {
  const { success: showSuccess, error: showError } = useToast();
  const [loading, setLoading] = useState(true);
  const [services, setServices] = useState<ServiceType[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [selectedService, setSelectedService] = useState<ServiceType | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingService, setEditingService] = useState<ServiceType | null>(null);
  const [quotedPriceInput, setQuotedPriceInput] = useState<string>('');

  const [formData, setFormData] = useState({
    serviceType: 'repair',
    customerName: '',
    customerPhone: '',
    productInfo: {
      brand: '',
      model: '',
      serialNumber: '',
    },
    images: [] as string[],
    status: 'pending',
    priority: 'normal',
    issueDescription: '',
    notes: '',
    estimatedCost: 0,
    actualCost: 0,
  });

  const loadServices = useCallback(async (status?: string) => {
    setLoading(true);
    try {
      const url = status ? `/api/services?status=${status}` : '/api/services';
      const response = await fetch(url);
      if (!response.ok) throw new Error('Failed to fetch services');
      const result = await response.json();
      setServices(result.data || []);
    } catch (err: any) {
      showError('Không thể tải danh sách dịch vụ');
    } finally {
      setLoading(false);
    }
  }, [showError]);

  useEffect(() => {
    loadServices(filterStatus || undefined);
  }, [filterStatus, loadServices]);

  const filteredServices = services.filter((service) => {
    return searchMatch(
      searchTerm,
      service.serviceNumber,
      service.customerName,
      service.customerPhone,
      service.productInfo?.model || '',
      service.issueDescription
    );
  });

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND',
    }).format(price || 0);
  };

  const handleOpenModal = (service?: ServiceType) => {
    if (service) {
      setEditingService(service);
      setFormData({
        serviceType: service.serviceType,
        customerName: service.customerName,
        customerPhone: service.customerPhone,
        productInfo: {
          brand: service.productInfo?.brand || '',
          model: service.productInfo?.model || '',
          serialNumber: service.productInfo?.serialNumber || '',
        },
        images: service.images || [],
        status: service.status,
        priority: service.priority,
        issueDescription: service.issueDescription,
        notes: service.notes || '',
        estimatedCost: service.estimatedCost || 0,
        actualCost: service.actualCost || 0,
      });
    } else {
      setEditingService(null);
      setFormData({
        serviceType: 'repair',
        customerName: '',
        customerPhone: '',
        productInfo: {
          brand: '',
          model: '',
          serialNumber: '',
        },
        images: [],
        status: 'pending',
        priority: 'normal',
        issueDescription: '',
        notes: '',
        estimatedCost: 0,
        actualCost: 0,
      });
    }
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingService(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const url = editingService
        ? `/api/services/${editingService._id}`
        : '/api/services';
      const method = editingService ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      const data = await res.json();
      if (data.success) {
        showSuccess(editingService ? 'Cập nhật thành công!' : 'Tiếp nhận thành công!');
        handleCloseModal();
        loadServices(filterStatus || undefined);
      } else {
        showError(data.error || 'Có lỗi xảy ra');
      }
    } catch (err: any) {
      showError('Lỗi kết nối');
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Bạn có chắc muốn xóa dịch vụ này?')) return;
    try {
      const res = await fetch(`/api/services/${id}`, { method: 'DELETE' });
      const data = await res.json();
      if (data.success) {
        showSuccess('Đã xóa thành công!');
        loadServices(filterStatus || undefined);
      } else {
        showError(data.error || 'Lỗi khi xóa');
      }
    } catch (err) {
      showError('Lỗi kết nối');
    }
  };

  const handleSaveQuotedPrice = async (service: ServiceType) => {
    try {
      const res = await fetch(`/api/services/${service._id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          quotedPrice: Number(quotedPriceInput || 0),
        }),
      });
      const data = await res.json();
      if (data.success) {
        showSuccess('Đã lưu giá báo thành công!');
        setSelectedService(data.data);
        loadServices(filterStatus || undefined);
      } else {
        showError(data.error || 'Không thể lưu giá báo');
      }
    } catch (error) {
      showError('Lỗi kết nối khi lưu giá báo');
    }
  };

  const openZaloQuote = (service: ServiceType) => {
    if (!service.customerPhone) {
      showError('Không có số điện thoại khách hàng');
      return;
    }

    const quoted = Number(quotedPriceInput || 0);
    if (!quoted || quoted <= 0) {
      showError('Vui lòng nhập giá báo trước khi gửi Zalo');
      return;
    }

    const message = `NEXGEAR xin báo giá dịch vụ: "${service.issueDescription.substring(0, 50)}..." cho thiết bị ${service.productInfo?.brand || ''} ${service.productInfo?.model || ''}. Chi phí dự kiến: ${formatPrice(quoted)}. Cảm ơn quý khách!`;
    const zaloUrl = `https://zalo.me/${service.customerPhone}?text=${encodeURIComponent(message)}`;
    window.open(zaloUrl, '_blank', 'noopener,noreferrer');
  };

  return (
    <div className={s.page}>
      {/* Header */}
      <div className={s.header}>
        <div>
          <h1>Quản lý Dịch vụ & Sửa chữa</h1>
          <p>Hệ thống tiếp nhận, báo giá và theo dõi dịch vụ kỹ thuật</p>
        </div>
        <div className={s.actions}>
          <Button variant="ghost" onClick={() => loadServices(filterStatus || undefined)}>
            <RefreshCw size={20} className={loading ? 'animate-spin' : ''} />
          </Button>
          <Button variant="cyan" onClick={() => handleOpenModal()}>
            <Plus size={20} /> TIẾP NHẬN MỚI
          </Button>
        </div>
      </div>

      {/* ActionBar */}
      <div className={s.actionBar}>
        <div className={s.search}>
          <Input
            placeholder="Mã dịch vụ, khách hàng, SĐT, thiết bị..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            leftIcon={<Search size={18} />}
          />
        </div>
        <div className={s.filters}>
          <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)}>
            <option value="">Tất cả trạng thái</option>
            {Object.entries(STATUS_OPTIONS).map(([key, obj]) => (
              <option key={key} value={key}>{obj.label}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Table */}
      <div className={s.tableContainer}>
        <table>
          <thead>
            <tr>
              <th>Mã DV</th>
              <th>Loại dịch vụ</th>
              <th>Khách hàng</th>
              <th>Thiết bị</th>
              <th style={{ textAlign: 'right' }}>Chi phí</th>
              <th style={{ textAlign: 'center' }}>Trạng thái</th>
              <th>Tiếp nhận</th>
              <th style={{ textAlign: 'center' }}>Thao tác</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={8}>
                  <div className={s.loading}>
                    <div className={s.spinner}></div>
                    <span>Đang tải danh sách...</span>
                  </div>
                </td>
              </tr>
            ) : filteredServices.length === 0 ? (
              <tr>
                <td colSpan={8} style={{ textAlign: 'center', padding: '100px 0' }}>
                  <Wrench size={48} color="var(--color-bg3)" style={{ margin: '0 auto 16px' }} />
                  <p style={{ color: 'var(--color-ink3)' }}>Không tìm thấy dịch vụ nào</p>
                </td>
              </tr>
            ) : (
              filteredServices.map((service) => {
                const typeObj = SERVICE_TYPES[service.serviceType] || SERVICE_TYPES.inspection;
                const statusObj = STATUS_OPTIONS[service.status] || STATUS_OPTIONS.pending;
                const priorityObj = PRIORITY_OPTIONS[service.priority] || PRIORITY_OPTIONS.normal;

                return (
                  <tr key={service._id}>
                    <td><span className={s.mainText}>{service.serviceNumber}</span></td>
                    <td>
                      <Badge variant={typeObj.variant}>{typeObj.label}</Badge>
                    </td>
                    <td>
                      <span className={s.mainText}>{service.customerName}</span>
                      <span className={s.subText}>{service.customerPhone}</span>
                    </td>
                    <td>
                      <span className={s.mainText}>{service.productInfo?.brand || '---'} {service.productInfo?.model || ''}</span>
                      <span className={s.subText}>{service.issueDescription}</span>
                    </td>
                    <td style={{ textAlign: 'right' }}>
                      <span style={{ color: 'var(--color-cyan)', fontWeight: 'bold', fontFamily: 'var(--font-mono)' }}>
                        {formatPrice(service.actualCost || service.estimatedCost)}
                      </span>
                    </td>
                    <td style={{ textAlign: 'center' }}>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', alignItems: 'center' }}>
                        <Badge variant={statusObj.variant}>{statusObj.label}</Badge>
                        <Badge variant={priorityObj.variant}>{priorityObj.label}</Badge>
                      </div>
                    </td>
                    <td>
                      <span className={s.subText}>
                        {new Date(service.receivedDate).toLocaleDateString('vi-VN')}
                      </span>
                    </td>
                    <td>
                      <div className={s.actions}>
                        <Button variant="ghost" size="sm" onClick={() => { setSelectedService(service); setQuotedPriceInput(service.quotedPrice ? String(service.quotedPrice) : ''); }} title="Chi tiết">
                          <Eye size={18} />
                        </Button>
                        <Button variant="ghost" size="sm" onClick={() => handleOpenModal(service)} title="Sửa">
                          <Pencil size={18} />
                        </Button>
                        <Button variant="ghost" size="sm" onClick={() => handleDelete(service._id)} title="Xóa">
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
        <Link href="/admin" className={s.backBtn} style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--color-ink3)', fontSize: '11px', fontWeight: 'bold', textTransform: 'uppercase' }}>
          <ChevronLeft size={16} /> Quay lại trang chủ
        </Link>
      </div>

      {/* Create/Edit Modal */}
      {isModalOpen && (
        <div className={s.modalOverlay} onClick={(e) => e.target === e.currentTarget && handleCloseModal()}>
          <div className={s.modal}>
            <div className={s.modalHeader}>
              <h2>{editingService ? `CẬP NHẬT DV ${editingService.serviceNumber}` : 'TIẾP NHẬN DỊCH VỤ MỚI'}</h2>
              <button onClick={handleCloseModal}><X size={24} /></button>
            </div>
            <form onSubmit={handleSubmit}>
              <div className={s.modalBody}>
                <div className={s.formGrid}>
                  <div className={s.fieldGroup}>
                    <label>Loại dịch vụ</label>
                    <select
                      value={formData.serviceType}
                      onChange={(e) => setFormData({ ...formData, serviceType: e.target.value })}
                    >
                      {Object.entries(SERVICE_TYPES).map(([key, obj]) => (
                        <option key={key} value={key}>{obj.label}</option>
                      ))}
                    </select>
                  </div>
                  <div className={s.fieldGroup}>
                    <label>Độ ưu tiên</label>
                    <select
                      value={formData.priority}
                      onChange={(e) => setFormData({ ...formData, priority: e.target.value })}
                    >
                      {Object.entries(PRIORITY_OPTIONS).map(([key, obj]) => (
                        <option key={key} value={key}>{obj.label}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className={s.formGrid}>
                  <Input
                    label="Tên khách hàng"
                    required
                    value={formData.customerName}
                    onChange={(e) => setFormData({ ...formData, customerName: e.target.value })}
                  />
                  <Input
                    label="Số điện thoại"
                    required
                    value={formData.customerPhone}
                    onChange={(e) => setFormData({ ...formData, customerPhone: e.target.value })}
                  />
                </div>

                <div className={s.formGrid}>
                  <Input
                    label="Hãng sản xuất"
                    value={formData.productInfo.brand}
                    onChange={(e) => setFormData({ ...formData, productInfo: { ...formData.productInfo, brand: e.target.value } })}
                  />
                  <Input
                    label="Model / Tên máy"
                    value={formData.productInfo.model}
                    onChange={(e) => setFormData({ ...formData, productInfo: { ...formData.productInfo, model: e.target.value } })}
                  />
                </div>

                <div className={s.formGrid}>
                  <Input
                    label="Phí dự kiến (VNĐ)"
                    type="number"
                    value={formData.estimatedCost}
                    onChange={(e) => setFormData({ ...formData, estimatedCost: parseInt(e.target.value) || 0 })}
                  />
                  <Input
                    label="Phí thực tế (VNĐ)"
                    type="number"
                    value={formData.actualCost}
                    onChange={(e) => setFormData({ ...formData, actualCost: parseInt(e.target.value) || 0 })}
                  />
                </div>

                <div className={s.fieldGroup}>
                  <label>Mô tả tình trạng / Lỗi</label>
                  <textarea
                    required
                    rows={3}
                    value={formData.issueDescription}
                    onChange={(e) => setFormData({ ...formData, issueDescription: e.target.value })}
                    placeholder="Máy bị nứt màn hình, không lên nguồn..."
                  />
                </div>

                <div className={s.fieldGroup}>
                  <label>Trạng thái</label>
                  <select
                    value={formData.status}
                    onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                  >
                    {Object.entries(STATUS_OPTIONS).map(([key, obj]) => (
                      <option key={key} value={key}>{obj.label}</option>
                    ))}
                  </select>
                </div>

                <div className={s.fieldGroup}>
                  <label>Hình ảnh thiết bị</label>
                  <ImageUploader
                    value={formData.images}
                    onChange={(urls) => setFormData({ ...formData, images: urls })}
                    maxImages={8}
                  />
                </div>
              </div>
              <div className={s.modalFooter}>
                <Button variant="ghost" onClick={handleCloseModal}>HỦY BỎ</Button>
                <Button variant="primary" type="submit">LƯU THÔNG TIN</Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Detail Modal */}
      {selectedService && (
        <div className={s.modalOverlay} onClick={(e) => e.target === e.currentTarget && setSelectedService(null)}>
          <div className={s.modal}>
            <div className={s.modalHeader}>
              <div>
                <h2>CHI TIẾT DỊCH VỤ {selectedService.serviceNumber}</h2>
                <div style={{ fontFamily: 'var(--font-mono)', fontSize: '10px', color: 'var(--color-ink3)', textTransform: 'uppercase' }}>
                  Nhận: {new Date(selectedService.receivedDate).toLocaleDateString('vi-VN')}
                </div>
              </div>
              <button onClick={() => setSelectedService(null)}><X size={24} /></button>
            </div>
            <div className={s.modalBody}>
              <div className={s.detailSection}>
                <h3>Thiết bị & Tình trạng</h3>
                <div className={s.detailGrid}>
                  <div className={s.detailItem}>
                    <label>Hãng — Model</label>
                    <span>{selectedService.productInfo?.brand} — {selectedService.productInfo?.model}</span>
                  </div>
                  <div className={s.detailItem}>
                    <label>Ưu tiên</label>
                    <Badge variant={PRIORITY_OPTIONS[selectedService.priority]?.variant || 'ink'}>
                      {PRIORITY_OPTIONS[selectedService.priority]?.label}
                    </Badge>
                  </div>
                  <div className={s.detailItem} style={{ gridColumn: 'span 2' }}>
                    <label>Lỗi máy</label>
                    <p style={{ background: 'var(--color-bg)', padding: '12px', borderRadius: 'var(--r-2)', fontSize: '13px', margin: '8px 0', border: '1px solid var(--color-border)' }}>
                      {selectedService.issueDescription}
                    </p>
                  </div>
                </div>
              </div>

              <div className={s.detailSection}>
                <h3>Hình ảnh hiện trạng</h3>
                <div className={s.imageGrid}>
                  {selectedService.images?.map((img, idx) => (
                    <img key={idx} src={img} alt={`Device photo ${idx + 1}`} />
                  ))}
                  {(!selectedService.images || selectedService.images.length === 0) && (
                    <p style={{ color: 'var(--color-ink3)', fontSize: '11px' }}>Không có hình ảnh đính kèm</p>
                  )}
                </div>
              </div>

              <div className={s.detailSection}>
                <h3>Khách hàng</h3>
                <div className={s.detailGrid}>
                  <div className={s.detailItem}>
                    <label>Tên khách</label>
                    <span>{selectedService.customerName}</span>
                  </div>
                  <div className={s.detailItem}>
                    <label>Số điện thoại</label>
                    <span>{selectedService.customerPhone}</span>
                  </div>
                </div>
              </div>

              <div className={s.quoteCard}>
                <label style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--color-magenta)', fontWeight: 'bold', fontSize: '11px', textTransform: 'uppercase' }}>
                  <Wrench size={14} /> Báo giá dịch vụ
                </label>
                <div className={s.quoteInput}>
                  <input
                    type="number"
                    value={quotedPriceInput}
                    onChange={(e) => setQuotedPriceInput(e.target.value)}
                    placeholder="Nhập giá dự kiến..."
                  />
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <Button variant="primary" size="sm" onClick={() => handleSaveQuotedPrice(selectedService)}>LƯU GIÁ</Button>
                    <Button variant="cyan" size="sm" onClick={() => openZaloQuote(selectedService)}>
                      <MessageCircle size={16} /> ZALO
                    </Button>
                  </div>
                </div>
              </div>
            </div>
            <div className={s.modalFooter}>
              <Button variant="ghost" onClick={() => setSelectedService(null)}>ĐÓNG LẠI</Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
