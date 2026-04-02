'use client';

import { useEffect, useState, useCallback } from 'react';
import {
  Plus, Search, RefreshCw, HelpCircle, MessageCircle, Trash2,
  X, Edit2, CheckCircle, XCircle, GripVertical, AlertCircle
} from 'lucide-react';
import Toast from '@/components/admin/Toast';
import { Button, Badge, Input } from '@/components/ui';
import { useSiteSettings } from '@/contexts/SiteSettingsContext';
import s from './page.module.scss';

interface FAQ {
  _id: string;
  question: string;
  answer: string;
  category: string;
  order: number;
  isActive: boolean;
  createdAt: string;
}

const CATEGORY_LABELS: Record<string, string> = {
  general: 'Chung',
  product: 'Sản phẩm',
  order: 'Đơn hàng',
  payment: 'Thanh toán',
  shipping: 'Vận chuyển',
  warranty: 'Bảo hành',
  return: 'Đổi trả'
};

export default function FAQsPage() {
  const siteSettings = useSiteSettings();
  const [faqs, setFaqs] = useState<FAQ[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterCategory, setFilterCategory] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedFaq, setSelectedFaq] = useState<FAQ | null>(null);
  const [isEditMode, setIsEditMode] = useState(false);

  const [formData, setFormData] = useState({
    question: '',
    answer: '',
    category: 'general',
    order: 0,
    isActive: true
  });

  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' | 'info'; isVisible: boolean }>({
    message: '',
    type: 'info',
    isVisible: false
  });

  const showToast = (message: string, type: 'success' | 'error' | 'info' = 'success') => {
    setToast({ message, type, isVisible: true });
  };

  const fetchFaqs = useCallback(async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (filterCategory) params.append('category', filterCategory);

      const response = await fetch(`/api/faqs?${params}`);
      const result = await response.json();

      if (result.success) {
        setFaqs(result.data);
      } else {
        showToast(result.error || 'Lỗi khi tải dữ liệu', 'error');
      }
    } catch (error) {
      showToast('Lỗi kết nối server', 'error');
    } finally {
      setLoading(false);
    }
  }, [filterCategory]);

  useEffect(() => {
    fetchFaqs();
  }, [fetchFaqs]);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const response = await fetch('/api/faqs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });

      const result = await response.json();
      if (result.success) {
        showToast('Thêm FAQ thành công');
        setIsModalOpen(false);
        resetForm();
        fetchFaqs();
      } else {
        showToast(result.error || 'Lỗi khi thêm FAQ', 'error');
      }
    } catch (error) {
      showToast('Lỗi kết nối server', 'error');
    }
  };

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedFaq) return;

    try {
      const response = await fetch(`/api/faqs/${selectedFaq._id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });

      const result = await response.json();
      if (result.success) {
        showToast('Cập nhật thành công');
        setIsModalOpen(false);
        setIsEditMode(false);
        setSelectedFaq(null);
        resetForm();
        fetchFaqs();
      } else {
        showToast(result.error || 'Lỗi khi cập nhật', 'error');
      }
    } catch (error) {
      showToast('Lỗi kết nối server', 'error');
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Bạn có chắc muốn xóa FAQ này?')) return;

    try {
      const response = await fetch(`/api/faqs/${id}`, {
        method: 'DELETE'
      });

      const result = await response.json();
      if (result.success) {
        showToast('Xóa thành công');
        fetchFaqs();
      }
    } catch (error) {
      showToast('Lỗi kết nối server', 'error');
    }
  };

  const resetForm = () => {
    setFormData({
      question: '',
      answer: '',
      category: 'general',
      order: 0,
      isActive: true
    });
  };

  const openEditModal = (faq: FAQ) => {
    setSelectedFaq(faq);
    setFormData({
      question: faq.question,
      answer: faq.answer,
      category: faq.category,
      order: faq.order,
      isActive: faq.isActive
    });
    setIsEditMode(true);
    setIsModalOpen(true);
  };

  const filteredFaqs = faqs.filter(f =>
    f.question.toLowerCase().includes(searchTerm.toLowerCase()) ||
    f.answer.toLowerCase().includes(searchTerm.toLowerCase())
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
          <h1>FAQ - Câu hỏi thường gặp</h1>
          <p>Quản lý các câu hỏi và câu trả lời phổ biến cho khách hàng</p>
        </div>
        <Button variant="cyan" onClick={() => {
          setIsEditMode(false);
          resetForm();
          setIsModalOpen(true);
        }}>
          <Plus size={18} /> THÊM FAQ
        </Button>
      </div>

      <div className={s.filtersBar}>
        <div className={s.searchBox}>
          <Input
            placeholder="Tìm kiếm nội dung câu hỏi hoặc câu trả lời..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            leftIcon={<Search size={18} />}
          />
        </div>

        <select
          value={filterCategory}
          onChange={(e) => setFilterCategory(e.target.value)}
          className={s.selectCategory}
        >
          <option value="">Tất cả danh mục</option>
          {Object.entries(CATEGORY_LABELS).map(([key, label]) => (
            <option key={key} value={key}>{label}</option>
          ))}
        </select>

        <Button variant="ghost" onClick={fetchFaqs} size="md">
          <RefreshCw size={16} /> LÀM MỚI
        </Button>
      </div>

      <div className={s.statsRow}>
        <div className={s.statCard}>
          <div className={`${s.icon} ${s.primary}`}>
            <HelpCircle size={24} />
          </div>
          <div className={s.info}>
            <h4>Tổng FAQ</h4>
            <div className={s.value}>{faqs.length}</div>
          </div>
        </div>

        <div className={s.statCard}>
          <div className={`${s.icon} ${s.success}`}>
            <CheckCircle size={24} />
          </div>
          <div className={s.info}>
            <h4>Đang hiển thị</h4>
            <div className={s.value}>{faqs.filter(f => f.isActive).length}</div>
          </div>
        </div>

        <div className={s.statCard}>
          <div className={`${s.icon} ${s.warning}`}>
            <XCircle size={24} />
          </div>
          <div className={s.info}>
            <h4>Đang ẩn</h4>
            <div className={s.value}>{faqs.filter(f => !f.isActive).length}</div>
          </div>
        </div>

        <div className={s.statCard}>
          <div className={`${s.icon} ${s.featured}`}>
            <MessageCircle size={24} />
          </div>
          <div className={s.info}>
            <h4>Danh mục</h4>
            <div className={s.value}>{Object.keys(CATEGORY_LABELS).length}</div>
          </div>
        </div>
      </div>

      <div className={s.list}>
        {loading ? (
          <div className={s.loading}>
            <RefreshCw className="animate-spin" size={32} />
            <p>Đang tải dữ liệu...</p>
          </div>
        ) : filteredFaqs.length === 0 ? (
          <div className={s.empty}>
            <AlertCircle size={48} color="#7A7870" />
            <h3>Không tìm thấy FAQ</h3>
            <p>Thử thay đổi bộ lọc hoặc thêm câu hỏi mới.</p>
          </div>
        ) : (
          <div className={s.listInner}>
            {filteredFaqs.map((faq) => (
              <div key={faq._id} className={s.faqItem}>
                <div className={s.orderHandle}>
                  <GripVertical size={16} />
                  <span className={s.orderNum}>{faq.order}</span>
                </div>

                <div className={s.faqContent}>
                  <div className={s.topLine}>
                    <h3>
                      {faq.question}
                      {!faq.isActive && <Badge variant="gray">ĐÃ ẨN</Badge>}
                    </h3>

                    <div className={s.faqActions}>
                      <Button variant="ghost" size="sm" onClick={() => openEditModal(faq)}>
                        <Edit2 size={14} />
                      </Button>
                      <Button variant="ghost" size="sm" onClick={() => handleDelete(faq._id)}>
                        <Trash2 size={14} color="#F0356A" />
                      </Button>
                    </div>
                  </div>

                  <p className={s.answer}>{faq.answer}</p>

                  <div className={s.meta}>
                    <Badge variant="cyan">
                      {CATEGORY_LABELS[faq.category] || faq.category}
                    </Badge>
                    <span className={s.date}>
                      {new Date(faq.createdAt).toLocaleDateString('vi-VN')}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Modal */}
      {isModalOpen && (
        <div className={s.overlay} onClick={(e) => e.target === e.currentTarget && setIsModalOpen(false)}>
          <div className={s.modal}>
            <div className={s.modalHeader}>
              <h2>{isEditMode ? 'CẬP NHẬT FAQ' : 'THÊM FAQ MỚI'}</h2>
              <button onClick={() => setIsModalOpen(false)} className={s.closeBtn}>
                <X size={24} />
              </button>
            </div>

            <form onSubmit={isEditMode ? handleUpdate : handleCreate} className={s.form}>
              <div className={s.field}>
                <label>Câu hỏi *</label>
                <Input
                  required
                  value={formData.question}
                  onChange={(e) => setFormData({ ...formData, question: e.target.value })}
                  placeholder={`Vd: Chính sách bảo hành của ${siteSettings.storeName} như thế nào?`}
                />
              </div>

              <div className={s.field}>
                <label>Câu trả lời *</label>
                <textarea
                  required
                  value={formData.answer}
                  onChange={(e) => setFormData({ ...formData, answer: e.target.value })}
                  placeholder="Nhập nội dung trả lời chi tiết..."
                />
              </div>

              <div className={s.row}>
                <div className={s.field}>
                  <label>Danh mục</label>
                  <select
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                  >
                    {Object.entries(CATEGORY_LABELS).map(([key, label]) => (
                      <option key={key} value={key}>{label}</option>
                    ))}
                  </select>
                </div>
                <div className={s.field}>
                  <label>Thứ tự hiển thị</label>
                  <input
                    type="number"
                    min="0"
                    value={formData.order}
                    onChange={(e) => setFormData({ ...formData, order: parseInt(e.target.value) || 0 })}
                  />
                </div>
              </div>

              <label className={s.checkboxField}>
                <input
                  type="checkbox"
                  checked={formData.isActive}
                  onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                />
                <span>Cho phép hiển thị câu hỏi này</span>
              </label>

              <div className={s.formActions}>
                <Button variant="primary" type="submit" fullWidth>
                  {isEditMode ? 'LƯU THAY ĐỔI' : 'TẠO FAQ NGAY'}
                </Button>
                <Button variant="ghost" onClick={() => setIsModalOpen(false)} type="button">HỦY</Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

