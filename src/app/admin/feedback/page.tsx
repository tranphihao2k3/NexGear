'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  Search,
  RefreshCw,
  AlertCircle,
  MessageSquare,
  CheckCircle,
  XCircle,
  Clock,
  Trash2,
  Eye,
  Loader2,
  X
} from 'lucide-react';
import { useToast } from '@/components/ui/Toast';
import { Button, Badge, Input } from '@/components/ui';
import s from './page.module.scss';

// ============================================
// Types
// ============================================
interface Feedback {
  _id: string;
  name: string;
  email: string;
  phone?: string;
  subject: string;
  message: string;
  type: 'complaint' | 'suggestion' | 'inquiry' | 'other';
  status: 'pending' | 'processing' | 'resolved' | 'rejected';
  createdAt: string;
  updatedAt: string;
}

const STATUS_MAP: Record<string, { label: string, variant: any, icon: any }> = {
  pending: { label: 'Chờ xử lý', variant: 'gold', icon: Clock },
  processing: { label: 'Đang xử lý', variant: 'cyan', icon: Loader2 },
  resolved: { label: 'Đã giải quyết', variant: 'green', icon: CheckCircle },
  rejected: { label: 'Từ chối', variant: 'magenta', icon: XCircle },
};

const TYPE_MAP: Record<string, { label: string, variant: any }> = {
  complaint: { label: 'Khiếu nại', variant: 'magenta' },
  suggestion: { label: 'Góp ý', variant: 'purple' },
  inquiry: { label: 'Hỏi đáp', variant: 'cyan' },
  other: { label: 'Khác', variant: 'ink' },
};

// ============================================
// Main Feedback Page
// ============================================
export default function FeedbackPage() {
  const { success: showSuccess, error: showError } = useToast();
  const [loading, setLoading] = useState(true);
  const [feedbacks, setFeedbacks] = useState<Feedback[]>([]);
  const [filterStatus, setFilterStatus] = useState('');
  const [filterType, setFilterType] = useState('');
  const [selectedFeedback, setSelectedFeedback] = useState<Feedback | null>(null);
  const [updating, setUpdating] = useState(false);

  const loadFeedbacks = useCallback(async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/feedback');
      const result = await response.json();
      if (result.success) {
        setFeedbacks(result.data || []);
      } else {
        showError(result.error || 'Không thể tải danh sách phản hồi');
      }
    } catch (err: any) {
      showError('Lỗi kết nối server');
    } finally {
      setLoading(false);
    }
  }, [showError]);

  useEffect(() => {
    loadFeedbacks();
  }, [loadFeedbacks]);

  const handleUpdateStatus = async (id: string, status: string) => {
    setUpdating(true);
    try {
      const response = await fetch(`/api/feedback/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
      });

      const result = await response.json();
      if (result.success) {
        showSuccess('Cập nhật trạng thái thành công!');
        loadFeedbacks();
        if (selectedFeedback && selectedFeedback._id === id) {
          setSelectedFeedback({ ...selectedFeedback, status: status as any });
        }
      } else {
        showError(result.error || 'Lỗi khi cập nhật');
      }
    } catch (error: any) {
      showError('Lỗi kết nối server');
    } finally {
      setUpdating(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Bạn có chắc chắn muốn xóa phản hồi này?')) return;

    try {
      const response = await fetch(`/api/admin/feedback/${id}`, {
        method: 'DELETE',
      });
      const result = await response.json();

      if (result.success) {
        showSuccess('Đã xóa phản hồi thành công!');
        loadFeedbacks();
        if (selectedFeedback && selectedFeedback._id === id) {
          setSelectedFeedback(null);
        }
      } else {
        showError(result.error || 'Lỗi khi xóa');
      }
    } catch (error: any) {
      showError('Lỗi kết nối server');
    }
  };

  const filteredFeedbacks = feedbacks.filter(f => {
    const matchesStatus = !filterStatus || f.status === filterStatus;
    const matchesType = !filterType || f.type === filterType;
    return matchesStatus && matchesType;
  });

  return (
    <div className={s.page}>
      <div className={s.header}>
        <div>
          <h1><MessageSquare size={32} color="#00C4AD" /> Quản lý Phản hồi</h1>
          <p>Lắng nghe ý kiến và giải quyết khiếu nại của khách hàng</p>
        </div>
        <Button
          variant="ghost"
          onClick={loadFeedbacks}
          leftIcon={<RefreshCw size={18} className={loading ? 'animate-spin' : ''} />}
        >
          LÀM MỚI
        </Button>
      </div>

      <div className={s.actionBar}>
        <select
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value)}
        >
          <option value="">Tất cả trạng thái</option>
          <option value="pending">Chờ xử lý</option>
          <option value="processing">Đang xử lý</option>
          <option value="resolved">Đã giải quyết</option>
          <option value="rejected">Từ chối</option>
        </select>
        <select
          value={filterType}
          onChange={(e) => setFilterType(e.target.value)}
        >
          <option value="">Tất cả phân loại</option>
          <option value="complaint">Khiếu nại</option>
          <option value="suggestion">Góp ý</option>
          <option value="inquiry">Hỏi đáp</option>
          <option value="other">Khác</option>
        </select>
      </div>

      <div className={s.tableWrapper}>
        <table>
          <thead>
            <tr>
              <th>Người gửi</th>
              <th>Loại</th>
              <th>Tiêu đề</th>
              <th>Trạng thái</th>
              <th>Ngày gửi</th>
              <th style={{ textAlign: 'right' }}>Thao tác</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={6} style={{ textAlign: 'center', padding: '100px 0' }}>
                  <RefreshCw className="animate-spin mb-2" size={32} color="#00C4AD" />
                  <p>Hệ thống đang tải danh sách phản hồi...</p>
                </td>
              </tr>
            ) : filteredFeedbacks.length === 0 ? (
              <tr>
                <td colSpan={6} style={{ textAlign: 'center', padding: '100px 0', color: '#7A7870' }}>
                  Không có phản hồi nào khớp với bộ lọc.
                </td>
              </tr>
            ) : (
              filteredFeedbacks.map((f) => {
                const statusInfo = STATUS_MAP[f.status] || STATUS_MAP.pending;
                const typeInfo = TYPE_MAP[f.type] || TYPE_MAP.other;
                const StatusIcon = statusInfo.icon;

                return (
                  <tr key={f._id}>
                    <td>
                      <div className={s.sender}>
                        <div className={s.name}>{f.name}</div>
                        <div className={s.email}>{f.email}</div>
                      </div>
                    </td>
                    <td>
                      <Badge variant={typeInfo.variant}>{typeInfo.label}</Badge>
                    </td>
                    <td>
                      <div className={s.subject}>{f.subject}</div>
                    </td>
                    <td>
                      <Badge variant={statusInfo.variant}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                          <StatusIcon size={12} className={f.status === 'processing' ? 'animate-spin' : ''} />
                          {statusInfo.label}
                        </div>
                      </Badge>
                    </td>
                    <td>
                      <div style={{ fontSize: '12px', color: '#7A7870' }}>
                        {new Date(f.createdAt).toLocaleDateString('vi-VN')}
                      </div>
                    </td>
                    <td>
                      <div className={s.actions}>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setSelectedFeedback(f)}
                        >
                          <Eye size={16} color="#00C4AD" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDelete(f._id)}
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

      {/* Feedback Detail Modal */}
      {selectedFeedback && (
        <div className={s.modalOverlay}>
          <div className={s.modal}>
            <div className={s.modalHeader}>
              <div className={s.titleWrap}>
                <h2>CHI TIẾT PHẢN HỒI</h2>
                <div className={s.id}>#{selectedFeedback._id.slice(-8).toUpperCase()}</div>
              </div>
              <Button variant="ghost" onClick={() => setSelectedFeedback(null)}>
                <X size={20} />
              </Button>
            </div>

            <div className={s.modalBody}>
              <div className={s.metaSection}>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <Badge variant={TYPE_MAP[selectedFeedback.type]?.variant}>{TYPE_MAP[selectedFeedback.type]?.label}</Badge>
                  <Badge variant={STATUS_MAP[selectedFeedback.status]?.variant}>{STATUS_MAP[selectedFeedback.status]?.label}</Badge>
                </div>
                <div style={{ fontSize: '12px', color: '#7A7870', fontFamily: 'JetBrains Mono' }}>
                  {new Date(selectedFeedback.createdAt).toLocaleString('vi-VN')}
                </div>
              </div>

              <div className={s.infoGrid}>
                <div className={s.infoItem}>
                  <span className={s.label}>Họ tên khách hàng</span>
                  <div className={s.value}>{selectedFeedback.name}</div>
                </div>
                <div className={s.infoItem}>
                  <span className={s.label}>Địa chỉ Email</span>
                  <div className={s.value}>{selectedFeedback.email}</div>
                </div>
                {selectedFeedback.phone && (
                  <div className={s.infoItem}>
                    <span className={s.label}>Số điện thoại</span>
                    <div className={s.value}>{selectedFeedback.phone}</div>
                  </div>
                )}
              </div>

              <div className={s.contentSection}>
                <span className={s.label}>Tiêu đề phản hồi</span>
                <div className={s.subjectText}>{selectedFeedback.subject}</div>

                <span className={s.label}>Nội dung chi tiết</span>
                <div className={s.messageBox}>{selectedFeedback.message}</div>
              </div>

              <div className={s.statusUpdate}>
                <span className={s.label}>Cập nhật trạng thái xử lý</span>
                <div className={s.buttonGroup}>
                  {Object.entries(STATUS_MAP).map(([status, info]) => (
                    <Button
                      key={status}
                      variant={selectedFeedback.status === status ? 'primary' : 'outline'}
                      size="sm"
                      disabled={updating || selectedFeedback.status === status}
                      onClick={() => handleUpdateStatus(selectedFeedback._id, status)}
                    >
                      {info.label}
                    </Button>
                  ))}
                </div>
              </div>
            </div>

            <div className={s.modalFooter}>
              <Button
                variant="danger"
                leftIcon={<Trash2 size={16} />}
                onClick={() => handleDelete(selectedFeedback._id)}
              >
                XÓA PHẢN HỒI
              </Button>
              <Button
                variant="cyan"
                onClick={() => setSelectedFeedback(null)}
              >
                ĐÓNG CỬA SỔ
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
