'use client';

import { useEffect, useState, useCallback } from 'react';
import {
  Plus,
  Search,
  RefreshCw,
  ArrowLeftRight,
  RotateCcw,
  Wallet,
  Package,
  CheckCircle,
  XCircle,
  Clock,
  Trash2,
  Eye,
  X
} from 'lucide-react';
import { useToast } from '@/components/ui/Toast';
import { Button, Badge, Input } from '@/components/ui';
import s from './page.module.scss';

interface ReturnItem {
  _id: string;
  returnNumber: string;
  orderId: {
    _id: string;
    orderNumber: string;
    totalAmount: number;
  };
  customerId: {
    _id: string;
    name: string;
    phone: string;
  };
  returnType: 'refund' | 'exchange' | 'store_credit';
  reason: string;
  status: 'pending' | 'approved' | 'rejected' | 'processed' | 'cancelled';
  refundAmount: number;
  refundMethod: string;
  processedBy?: { name: string };
  processedAt?: string;
  createdAt: string;
  notes: string;
}

const RETURN_TYPES: Record<string, { label: string, variant: any }> = {
  refund: { label: 'Hoàn tiền', variant: 'green' },
  exchange: { label: 'Đổi hàng', variant: 'purple' },
  store_credit: { label: 'Tín dụng', variant: 'cyan' }
};

const STATUS_MAP: Record<string, { label: string, variant: any, icon: any }> = {
  pending: { label: 'Chờ xử lý', variant: 'gold', icon: Clock },
  approved: { label: 'Đã duyệt', variant: 'cyan', icon: CheckCircle },
  rejected: { label: 'Từ chối', variant: 'magenta', icon: XCircle },
  processed: { label: 'Đã xử lý', variant: 'green', icon: CheckCircle },
  cancelled: { label: 'Đã hủy', variant: 'ink', icon: XCircle }
};

export default function ReturnsPage() {
  const { success: showSuccess, error: showError } = useToast();
  const [returns, setReturns] = useState<ReturnItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedReturn, setSelectedReturn] = useState<ReturnItem | null>(null);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);

  const [formData, setFormData] = useState({
    orderId: '',
    customerId: '',
    returnType: 'refund' as 'refund' | 'exchange' | 'store_credit',
    reason: '',
    refundAmount: 0,
    refundMethod: 'cash',
    notes: ''
  });

  const fetchReturns = useCallback(async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (filterType) params.append('returnType', filterType);
      if (filterStatus) params.append('status', filterStatus);
      if (searchTerm) params.append('search', searchTerm);

      const response = await fetch(`/api/returns?${params}`);
      const result = await response.json();

      if (result.success) {
        setReturns(result.data);
      } else {
        showError(result.error || 'Lỗi khi tải dữ liệu');
      }
    } catch (error) {
      showError('Lỗi kết nối server');
    } finally {
      setLoading(false);
    }
  }, [filterType, filterStatus, searchTerm, showError]);

  useEffect(() => {
    fetchReturns();
  }, [fetchReturns]);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const response = await fetch('/api/returns', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });

      const result = await response.json();
      if (result.success) {
        showSuccess(result.message || 'Đã tạo đơn đổi trả');
        setIsModalOpen(false);
        setFormData({
          orderId: '',
          customerId: '',
          returnType: 'refund',
          reason: '',
          refundAmount: 0,
          refundMethod: 'cash',
          notes: ''
        });
        fetchReturns();
      } else {
        showError(result.error || 'Lỗi khi tạo đơn');
      }
    } catch (error) {
      showError('Lỗi kết nối server');
    }
  };

  const handleUpdateStatus = async (id: string, status: string) => {
    try {
      const response = await fetch(`/api/returns/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status })
      });

      const result = await response.json();
      if (result.success) {
        showSuccess('Cập nhật trạng thái thành công');
        fetchReturns();
      } else {
        showError(result.error || 'Lỗi khi cập nhật');
      }
    } catch (error) {
      showError('Lỗi kết nối server');
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Bạn có chắc muốn xóa đơn này?')) return;

    try {
      const response = await fetch(`/api/returns/${id}`, {
        method: 'DELETE'
      });

      const result = await response.json();
      if (result.success) {
        showSuccess(result.message || 'Đã xóa đơn');
        fetchReturns();
      } else {
        showError(result.error || 'Lỗi khi xóa');
      }
    } catch (error) {
      showError('Lỗi kết nối server');
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND'
    }).format(amount);
  };

  return (
    <div className={s.page}>
      <div className={s.header}>
        <div>
          <h1><ArrowLeftRight size={32} color="#00C4AD" /> Quản lý đổi trả</h1>
          <p>Xử lý quy trình đổi hàng và hoàn tiền cho khách hàng</p>
        </div>
        <Button
          variant="primary"
          onClick={() => setIsModalOpen(true)}
          leftIcon={<Plus size={20} />}
        >
          TẠO ĐƠN ĐỔI TRẢ
        </Button>
      </div>

      <div className={s.actionBar}>
        <div className={s.search}>
          <Search size={20} />
          <input
            type="text"
            placeholder="Tìm theo mã đơn trả, mã đơn hàng..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        <select
          value={filterType}
          onChange={(e) => setFilterType(e.target.value)}
        >
          <option value="">Tất cả hình thức</option>
          <option value="refund">Hoàn tiền (Refund)</option>
          <option value="exchange">Đổi hàng (Exchange)</option>
          <option value="store_credit">Tín dụng (Store Credit)</option>
        </select>

        <select
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value)}
        >
          <option value="">Tất cả trạng thái</option>
          <option value="pending">Chờ xử lý</option>
          <option value="approved">Đã duyệt</option>
          <option value="processed">Đã xử lý xong</option>
          <option value="rejected">Bị từ chối</option>
        </select>

        <Button variant="ghost" onClick={fetchReturns} leftIcon={<RefreshCw size={18} />}>
          LÀM MỚI
        </Button>
      </div>

      <div className={s.statsGrid}>
        <div className={s.statCard}>
          <div className={`${s.icon} ${s.blue}`}><ArrowLeftRight size={24} /></div>
          <div className={s.info}>
            <div className={s.label}>Tổng số đơn</div>
            <div className={s.value}>{returns.length}</div>
          </div>
        </div>

        <div className={s.statCard}>
          <div className={`${s.icon} ${s.yellow}`}><Clock size={24} /></div>
          <div className={s.info}>
            <div className={s.label}>Chờ xử lý</div>
            <div className={s.value}>{returns.filter(r => r.status === 'pending').length}</div>
          </div>
        </div>

        <div className={s.statCard}>
          <div className={`${s.icon} ${s.green}`}><Wallet size={24} /></div>
          <div className={s.info}>
            <div className={s.label}>Tổng hoàn tiền</div>
            <div className={s.value} style={{ fontSize: '14px' }}>
              {formatCurrency(returns.reduce((sum, r) => sum + (r.refundAmount || 0), 0))}
            </div>
          </div>
        </div>

        <div className={s.statCard}>
          <div className={`${s.icon} ${s.purple}`}><RotateCcw size={24} /></div>
          <div className={s.info}>
            <div className={s.label}>Đơn đổi hàng</div>
            <div className={s.value}>{returns.filter(r => r.returnType === 'exchange').length}</div>
          </div>
        </div>
      </div>

      <div className={s.tableWrapper}>
        <table>
          <thead>
            <tr>
              <th>Mã Đơn Trả</th>
              <th>Đơn Gốc</th>
              <th>Khách Hàng</th>
              <th>Hình Thức</th>
              <th style={{ textAlign: 'right' }}>Hoàn Tiền</th>
              <th style={{ textAlign: 'center' }}>Trạng Thái</th>
              <th style={{ textAlign: 'center' }}>Thao Tác</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={7} style={{ textAlign: 'center', padding: '100px 0' }}>
                  <RefreshCw className="animate-spin mb-2" size={32} color="#00C4AD" />
                  <p>Hệ thống đang tải dữ liệu đơn đổi trả...</p>
                </td>
              </tr>
            ) : returns.length === 0 ? (
              <tr>
                <td colSpan={7} style={{ textAlign: 'center', padding: '100px 0', color: '#7A7870' }}>
                  Chưa có đơn đổi trả nào được ghi nhận.
                </td>
              </tr>
            ) : (
              returns.map((item) => {
                const statusInfo = STATUS_MAP[item.status] || STATUS_MAP.pending;
                const typeInfo = RETURN_TYPES[item.returnType] || { label: item.returnType, variant: 'ink' };
                const StatusIcon = statusInfo.icon;

                return (
                  <tr key={item._id}>
                    <td>
                      <div className={s.orderInfo}>
                        <div className={s.number}>{item.returnNumber}</div>
                        <div className={s.date}>{new Date(item.createdAt).toLocaleDateString('vi-VN')}</div>
                      </div>
                    </td>
                    <td>
                      <div className={s.orderInfo}>
                        <div className={s.number}>#{item.orderId?.orderNumber}</div>
                        <div style={{ fontSize: '11px', color: '#7A7870' }}>{formatCurrency(item.orderId?.totalAmount || 0)}</div>
                      </div>
                    </td>
                    <td>
                      <div className={s.customerInfo}>
                        <div className={s.name}>{item.customerId?.name}</div>
                        <div className={s.phone}>{item.customerId?.phone}</div>
                      </div>
                    </td>
                    <td>
                      <Badge variant={typeInfo.variant}>{typeInfo.label}</Badge>
                    </td>
                    <td>
                      <div className={s.refundAmount}>{formatCurrency(item.refundAmount)}</div>
                    </td>
                    <td style={{ textAlign: 'center' }}>
                      <Badge variant={statusInfo.variant}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                          <StatusIcon size={12} />
                          {statusInfo.label}
                        </div>
                      </Badge>
                    </td>
                    <td>
                      <div className={s.actions}>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            setSelectedReturn(item);
                            setIsDetailModalOpen(true);
                          }}
                        >
                          <Eye size={16} color="#00C4AD" />
                        </Button>
                        {item.status === 'pending' && (
                          <>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleUpdateStatus(item._id, 'approved')}
                            >
                              <CheckCircle size={16} color="#1DB96A" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleUpdateStatus(item._id, 'rejected')}
                              title="Từ chối"
                            >
                              <XCircle size={16} color="#F0356A" />
                            </Button>
                          </>
                        )}
                        {item.status === 'approved' && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleUpdateStatus(item._id, 'processed')}
                            title="Đã xử lý thành công"
                          >
                            <Package size={16} color="#00C4AD" />
                          </Button>
                        )}
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDelete(item._id)}
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

      {/* Create Modal */}
      {isModalOpen && (
        <div className={s.modalOverlay}>
          <div className={s.modal}>
            <div className={s.modalHeader}>
              <h2>TẠO ĐƠN ĐỔI TRẢ MỚI</h2>
              <Button variant="ghost" onClick={() => setIsModalOpen(false)}>
                <X size={20} />
              </Button>
            </div>
            <form onSubmit={handleCreate}>
              <div className={s.formGrid}>
                <Input
                  label="Mã đơn hàng gốc *"
                  value={formData.orderId}
                  onChange={(e) => setFormData({ ...formData, orderId: e.target.value })}
                  required
                />
                <Input
                  label="Mã khách hàng *"
                  value={formData.customerId}
                  onChange={(e) => setFormData({ ...formData, customerId: e.target.value })}
                  required
                />
              </div>

              <div className={s.formGrid}>
                <div>
                  <span className={s.fieldLabel}>Hình thức đổi trả</span>
                  <select
                    value={formData.returnType}
                    onChange={(e) => setFormData({ ...formData, returnType: e.target.value as any })}
                  >
                    <option value="refund">Hoàn tiền (Refund)</option>
                    <option value="exchange">Đổi hàng mới (Exchange)</option>
                    <option value="store_credit">Tín dụng cửa hàng</option>
                  </select>
                </div>
                <div>
                  <span className={s.fieldLabel}>Phương thức hoàn</span>
                  <select
                    value={formData.refundMethod}
                    onChange={(e) => setFormData({ ...formData, refundMethod: e.target.value })}
                  >
                    <option value="cash">Tiền mặt</option>
                    <option value="bank">Chuyển khoản</option>
                    <option value="store_credit">Số dư NexGear</option>
                  </select>
                </div>
              </div>

              {formData.returnType === 'refund' && (
                <Input
                  label="Số tiền hoàn lại (VNĐ)"
                  type="number"
                  value={formData.refundAmount}
                  onChange={(e) => setFormData({ ...formData, refundAmount: parseInt(e.target.value) || 0 })}
                />
              )}

              <Input
                label="Lý do đổi trả *"
                value={formData.reason}
                onChange={(e) => setFormData({ ...formData, reason: e.target.value })}
                required
              />

              <div>
                <span className={s.fieldLabel}>Ghi chú nội bộ</span>
                <textarea
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  placeholder="Thông tin thêm cho quản trị viên..."
                />
              </div>

              <div className={s.modalFooter}>
                <Button variant="ghost" onClick={() => setIsModalOpen(false)}>HỦY BỎ</Button>
                <Button variant="primary" type="submit">TẠO ĐƠN TRẢ</Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Detail Modal */}
      {isDetailModalOpen && selectedReturn && (
        <div className={s.modalOverlay}>
          <div className={s.detailModal}>
            <div className={s.modalHeader}>
              <h2>CHI TIẾT ĐƠN ĐỔI TRẢ</h2>
              <Button variant="ghost" onClick={() => setIsDetailModalOpen(false)}>
                <X size={20} />
              </Button>
            </div>
            <div className={s.detailContent}>
              <div className={s.detailRow}>
                <span className={s.label}>Mã đơn trả:</span>
                <span className={s.value} style={{ fontFamily: 'JetBrains Mono', color: '#00C4AD' }}>{selectedReturn.returnNumber}</span>
              </div>

              <div className={s.detailRow}>
                <span className={s.label}>Ngày yêu cầu:</span>
                <span className={s.value}>{new Date(selectedReturn.createdAt).toLocaleString('vi-VN')}</span>
              </div>

              <div className={s.detailRow}>
                <span className={s.label}>Đơn hàng gốc:</span>
                <span className={s.value}>#{selectedReturn.orderId?.orderNumber} ({formatCurrency(selectedReturn.orderId?.totalAmount || 0)})</span>
              </div>

              <div className={s.detailRow}>
                <span className={s.label}>Khách hàng:</span>
                <span className={s.value}>{selectedReturn.customerId?.name} - {selectedReturn.customerId?.phone}</span>
              </div>

              <div className={s.detailRow}>
                <span className={s.label}>Hình thức:</span>
                <Badge variant={RETURN_TYPES[selectedReturn.returnType].variant}>{RETURN_TYPES[selectedReturn.returnType].label}</Badge>
              </div>

              <div className={s.detailRow}>
                <span className={s.label}>Số tiền hoàn:</span>
                <span className={s.value} style={{ color: '#1DB96A' }}>{formatCurrency(selectedReturn.refundAmount)}</span>
              </div>

              <div className={s.detailRow}>
                <span className={s.label}>Lý do:</span>
                <span className={s.value}>{selectedReturn.reason}</span>
              </div>

              {selectedReturn.notes && (
                <div className={s.detailRow}>
                  <span className={s.label}>Ghi chú:</span>
                  <span className={s.value} style={{ fontStyle: 'italic', fontSize: '13px' }}>{selectedReturn.notes}</span>
                </div>
              )}

              {selectedReturn.processedBy && (
                <div className={s.detailRow}>
                  <span className={s.label}>Xử lý bởi:</span>
                  <span className={s.value}>{selectedReturn.processedBy.name} lúc {selectedReturn.processedAt && new Date(selectedReturn.processedAt).toLocaleTimeString()}</span>
                </div>
              )}
            </div>
            <div className={s.modalFooter}>
              <Button variant="cyan" fullWidth onClick={() => setIsDetailModalOpen(false)}>ĐÓNG</Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
