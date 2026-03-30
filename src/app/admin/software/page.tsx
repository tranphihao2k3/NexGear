'use client';

import { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import { Plus, Edit, Trash2, Eye, FileText, Download, Box, RefreshCw, Layers, Zap } from 'lucide-react';
import { useToast } from '@/components/ui/Toast';
import { Button, Badge } from '@/components/ui';
import s from './page.module.scss';
import { useSiteSettings } from '@/contexts/SiteSettingsContext';

interface Software {
    _id: string;
    title: string;
    slug: string;
    excerpt: string;
    category: string;
    version: string;
    type: string;
    status: string;
    views: number;
    autoSetup?: boolean;
    createdAt: string;
}

export default function AdminSoftwarePage() {
    const siteSettings = useSiteSettings();
    const { success: showSuccess, error: showError } = useToast();
    const [softwareList, setSoftwareList] = useState<Software[]>([]);
    const [loading, setLoading] = useState(true);
    const [filterStatus, setFilterStatus] = useState<string>('');

    const fetchSoftware = useCallback(async () => {
        try {
            setLoading(true);
            const url = filterStatus === 'autoSetup'
                ? '/api/software?autoSetup=true'
                : filterStatus
                    ? `/api/software?status=${filterStatus}`
                    : '/api/software';
            const res = await fetch(url);
            const result = await res.json();
            if (result.success) {
                setSoftwareList(result.data || []);
            }
        } catch (error) {
            showError('Lỗi khi tải kho phần mềm');
        } finally {
            setLoading(false);
        }
    }, [filterStatus, showError]);

    useEffect(() => {
        fetchSoftware();
    }, [fetchSoftware]);

    const handleDelete = async (id: string, title: string) => {
        if (!confirm(`Bạn có chắc muốn xóa phần mềm "${title}"?`)) return;

        try {
            const res = await fetch(`/api/software/${id}`, { method: 'DELETE' });
            const data = await res.json();

            if (data.success) {
                showSuccess('Đã xóa thành công!');
                fetchSoftware();
            } else {
                showError('Lỗi: ' + data.error);
            }
        } catch (error) {
            showError('Lỗi kết nối server');
        }
    };

    return (
        <div className={s.page}>
            <div className={s.header}>
                <div>
                    <h1><Box size={32} color="#7B3FF2" /> Kho Driver & Phần mềm</h1>
                    <p>Quản lý tài nguyên driver và các ứng dụng hệ máy tính</p>
                </div>
                <Link href="/admin/software/new">
                    <Button variant="primary" leftIcon={<Plus size={20} />}>
                        THÊM PHẦN MỀM MỚI
                    </Button>
                </Link>
            </div>

            <div className={s.filterBar}>
                <div className={s.filterLabel}>Lọc trạng thái:</div>
                <div className={s.btnGroup}>
                    <Button
                        variant={filterStatus === '' ? 'cyan' : 'ghost'}
                        size="sm"
                        onClick={() => setFilterStatus('')}
                    >
                        TẤT CẢ ({softwareList.length})
                    </Button>
                    <Button
                        variant={filterStatus === 'published' ? 'cyan' : 'ghost'}
                        size="sm"
                        onClick={() => setFilterStatus('published')}
                    >
                        ĐÃ XUẤT BẢN
                    </Button>
                    <Button
                        variant={filterStatus === 'draft' ? 'cyan' : 'ghost'}
                        size="sm"
                        onClick={() => setFilterStatus('draft')}
                    >
                        BẢN NHÁP
                    </Button>
                    <Button
                        variant={filterStatus === 'autoSetup' ? 'cyan' : 'ghost'}
                        size="sm"
                        onClick={() => setFilterStatus('autoSetup')}
                        leftIcon={<Zap size={14} />}
                    >
                        AUTO-SETUP
                    </Button>
                </div>
                <div style={{ marginLeft: 'auto' }}>
                    <Button variant="ghost" size="sm" onClick={fetchSoftware}>
                        <RefreshCw size={16} />
                    </Button>
                </div>
            </div>

            {loading ? (
                <div style={{ textAlign: 'center', padding: '100px 0' }}>
                    <RefreshCw className="animate-spin mb-2" size={32} color="#00C4AD" />
                    <p>Đang tải dữ liệu kho phần mềm...</p>
                </div>
            ) : softwareList.length > 0 ? (
                <div className={s.softwareList}>
                    {/* Header row for desktop */}
                    <div className={`${s.softwareCard} ${s.tableHeader}`} style={{ backgroundColor: '#ECEAE3', border: 'none', fontWeight: 'bold' }}>
                        <div style={{ fontSize: '10px', color: '#7A7870', textTransform: 'uppercase' }}>Thông tin phần mềm</div>
                        <div style={{ fontSize: '10px', color: '#7A7870', textTransform: 'uppercase' }}>Phiên bản</div>
                        <div style={{ fontSize: '10px', color: '#7A7870', textTransform: 'uppercase' }}>Danh mục</div>
                        <div style={{ fontSize: '10px', color: '#7A7870', textTransform: 'uppercase', textAlign: 'center' }}>Trạng thái</div>
                        <div style={{ fontSize: '10px', color: '#7A7870', textTransform: 'uppercase', textAlign: 'center' }}>Lượt xem</div>
                        <div style={{ fontSize: '10px', color: '#7A7870', textTransform: 'uppercase', textAlign: 'right' }}>Thao tác</div>
                    </div>

                    {softwareList.map((sw) => (
                        <div key={sw._id} className={s.softwareCard}>
                            <div className={s.infoSection}>
                                <div className={s.iconBox}><Layers size={24} /></div>
                                <div className={s.text}>
                                    <div className={s.title}>
                                        {sw.title}
                                        {sw.autoSetup && <Zap size={14} color="#F59E0B" style={{ display: 'inline', marginLeft: '6px', verticalAlign: 'middle' }} />}
                                    </div>
                                    <div className={s.type}>{sw.type}</div>
                                </div>
                            </div>

                            <div className={s.version}>v{sw.version}</div>

                            <div className={s.category}>
                                <span className={s.badge}>{sw.category}</span>
                            </div>

                            <div style={{ textAlign: 'center' }}>
                                <Badge variant={sw.status === 'published' ? 'green' : 'gold'}>
                                    {sw.status === 'published' ? 'Đã đăng' : 'Bản nháp'}
                                </Badge>
                            </div>

                            <div className={s.views}>
                                <Eye size={14} /> {sw.views}
                            </div>

                            <div className={s.actions}>
                                <Link href={`/admin/software/edit/${sw._id}`}>
                                    <Button variant="ghost" size="sm">
                                        <Edit size={16} color="#00C4AD" />
                                    </Button>
                                </Link>
                                <Button variant="ghost" size="sm" onClick={() => handleDelete(sw._id, sw.title)}>
                                    <Trash2 size={16} color="#F0356A" />
                                </Button>
                            </div>
                        </div>
                    ))}
                </div>
            ) : (
                <div className={s.emptyState}>
                    <div className={s.icon}><Box size={40} /></div>
                    <h3>Kho chưa có phần mềm</h3>
                    <p>Bắt đầu xây dựng kho tài nguyên driver và phần mềm hỗ trợ hệ thống cho người dùng {siteSettings.storeName}.</p>
                    <Link href="/admin/software/new">
                        <Button variant="primary" leftIcon={<Plus size={20} />}> THÊM PHẦN MỀM ĐẦU TIÊN </Button>
                    </Link>
                </div>
            )}
        </div>
    );
}
