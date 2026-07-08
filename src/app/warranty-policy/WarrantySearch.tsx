'use client';

import { useState } from 'react';
import { Search, ShieldCheck, ShieldAlert, Calendar, User, ShoppingBag, Hash, CreditCard } from 'lucide-react';
import styles from './page.module.scss';

interface SearchResult {
  _id: string;
  warrantyNumber: string;
  serialNumber: string;
  warrantyType: 'manufacturer' | 'store';
  purchaseDate: string;
  warrantyStartDate: string;
  warrantyEndDate: string;
  warrantyMonths: number;
  status: 'active' | 'expired' | 'voided' | 'claimed';
  notes: string;
  product?: {
    name: string;
    sku: string;
  };
  customer?: {
    name: string;
    phone: string;
  };
  order?: {
    orderCode: string;
  };
}

export default function WarrantySearch() {
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<SearchResult[] | null>(null);
  const [error, setError] = useState('');

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim()) return;

    setLoading(true);
    setError('');
    setResults(null);

    try {
      const res = await fetch(`/api/warranty/search?q=${encodeURIComponent(query.trim())}`);
      const data = await res.json();

      if (data.success) {
        setResults(data.data);
        if (data.data.length === 0) {
          setError('Không tìm thấy thông tin bảo hành khớp với từ khoá của bạn.');
        }
      } else {
        setError(data.error || 'Đã xảy ra lỗi trong quá trình tra cứu.');
      }
    } catch (err) {
      setError('Lỗi kết nối máy chủ. Vui lòng thử lại sau.');
    } finally {
      setLoading(false);
    }
  };

  const getDaysRemaining = (endDate: string) => {
    const days = Math.ceil((new Date(endDate).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24));
    return days > 0 ? days : 0;
  };

  const getStatusBadge = (status: string, endDate: string) => {
    const days = getDaysRemaining(endDate);
    if (status === 'expired' || days <= 0) {
      return { label: 'Hết hạn', class: styles.expired, icon: <ShieldAlert size={16} /> };
    }
    if (status === 'voided') {
      return { label: 'Vô hiệu', class: styles.voided, icon: <ShieldAlert size={16} /> };
    }
    if (status === 'claimed') {
      return { label: 'Đang xử lý bảo hành', class: styles.claimed, icon: <ShieldCheck size={16} /> };
    }
    return { label: `Còn hạn (${days} ngày)`, class: styles.active, icon: <ShieldCheck size={16} /> };
  };

  return (
    <div className={styles.searchSection}>
      <h2 className={styles.sectionTitle}>Tra cứu bảo hành sản phẩm</h2>
      <p className={styles.sectionSub}>Nhập số điện thoại mua hàng, mã thẻ bảo hành (WARR-...) hoặc số serial máy để xem hạn bảo hành trực tuyến.</p>

      <form onSubmit={handleSearch} className={styles.searchForm}>
        <div className={styles.inputWrapper}>
          <Search className={styles.searchIcon} size={20} />
          <input
            type="text"
            placeholder="Số điện thoại / Mã bảo hành / Số Serial máy..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className={styles.searchInput}
          />
        </div>
        <button type="submit" className={styles.searchBtn} disabled={loading}>
          {loading ? 'Đang tra...' : 'TRA CỨU'}
        </button>
      </form>

      {error && <div className={styles.errorMessage}>{error}</div>}

      {results && results.length > 0 && (
        <div className={styles.resultsGrid}>
          {results.map((card) => {
            const statusInfo = getStatusBadge(card.status, card.warrantyEndDate);
            return (
              <div key={card._id} className={styles.resultCard}>
                <div className={styles.cardHeader}>
                  <span className={`${styles.statusBadge} ${statusInfo.class}`}>
                    {statusInfo.icon}
                    {statusInfo.label}
                  </span>
                  <span className={styles.warrantyNum}>{card.warrantyNumber}</span>
                </div>

                <div className={styles.cardBody}>
                  <div className={styles.infoRow}>
                    <ShoppingBag size={16} className={styles.rowIcon} />
                    <div>
                      <span className={styles.label}>Sản phẩm:</span>
                      <strong className={styles.value}>{card.product?.name || 'Sản phẩm của Thành Võ Laptop'}</strong>
                    </div>
                  </div>

                  {card.serialNumber && (
                    <div className={styles.infoRow}>
                      <Hash size={16} className={styles.rowIcon} />
                      <div>
                        <span className={styles.label}>Số Serial:</span>
                        <code className={styles.valueMono}>{card.serialNumber}</code>
                      </div>
                    </div>
                  )}

                  <div className={styles.infoRow}>
                    <User size={16} className={styles.rowIcon} />
                    <div>
                      <span className={styles.label}>Khách hàng:</span>
                      <strong className={styles.value}>{card.customer?.name || 'Khách vãng lai'}</strong>
                    </div>
                  </div>

                  <div className={styles.infoRow}>
                    <Calendar size={16} className={styles.rowIcon} />
                    <div>
                      <span className={styles.label}>Thời hạn:</span>
                      <span className={styles.value}>
                        {card.warrantyMonths} tháng (Từ {new Date(card.warrantyStartDate).toLocaleDateString('vi-VN')} đến {new Date(card.warrantyEndDate).toLocaleDateString('vi-VN')})
                      </span>
                    </div>
                  </div>

                  {card.order?.orderCode && (
                    <div className={styles.infoRow}>
                      <CreditCard size={16} className={styles.rowIcon} />
                      <div>
                        <span className={styles.label}>Đơn hàng:</span>
                        <span className={styles.value}>{card.order.orderCode}</span>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
