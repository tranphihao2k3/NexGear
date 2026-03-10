'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import styles from '../categories/page.module.scss';
import { CyberpunkLoader, useToast } from '@/components/ui';

interface Brand {
    _id: string;
    name: string;
    slug: string;
    country: string;
    isActive: boolean;
}

export default function AdminBrandsPage() {
    const { success, error } = useToast();
    const qc = useQueryClient();
    const [showModal, setShowModal] = useState(false);
    const [editingId, setEditingId] = useState<string | null>(null);
    const [formData, setFormData] = useState({ name: '', slug: '', country: '' });

    // ── React Query ──
    const { data: brands = [], isPending: loading } = useQuery<Brand[]>({
        queryKey: ['brands'],
        queryFn: () => fetch('/api/brands?limit=50').then(r => r.json()).then(d => d.data ?? []),
        staleTime: 1000 * 60 * 5,
    })

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setFormData((prev) => ({
            ...prev,
            [name]: value,
            ...(name === 'name' && !editingId
                ? { slug: value.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '') }
                : {})
        }));
    };

    const openAdd = () => {
        setEditingId(null);
        setFormData({ name: '', slug: '', country: '' });
        setShowModal(true);
    };

    const openEdit = (brand: Brand) => {
        setEditingId(brand._id);
        setFormData({ name: brand.name, slug: brand.slug, country: brand.country || '' });
        setShowModal(true);
    };

    const saveBrandMutation = useMutation({
        mutationFn: ({ id, data }: { id?: string; data: any }) => {
            const url = id ? `/api/brands/${id}` : `/api/brands`;
            return fetch(url, {
                method: id ? 'PUT' : 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(data)
            }).then(r => r.json());
        },
        onSuccess: (data, vars) => {
            if (!data.success) { error(data.error); return; }
            success(vars.id ? 'Đã cập nhật thương hiệu' : 'Đã thêm thương hiệu');
            setShowModal(false);
            qc.invalidateQueries({ queryKey: ['brands'] });
        },
    });

    const deleteBrandMutation = useMutation({
        mutationFn: (id: string) => fetch(`/api/brands/${id}`, { method: 'DELETE' }).then(r => r.json()),
        onSuccess: (data) => {
            if (data.success) { success('Đã xóa'); qc.invalidateQueries({ queryKey: ['brands'] }); }
            else error(data.error);
        },
        onError: () => error('Lỗi xóa'),
    });

    const saveItem = () => {
        if (!formData.name || !formData.slug) return error('Tên và Slug là bắt buộc!');
        saveBrandMutation.mutate({ id: editingId ?? undefined, data: formData });
    };

    const toggleActive = (brand: Brand) => {
        saveBrandMutation.mutate({ id: brand._id, data: { isActive: !brand.isActive } });
    };

    const deleteItem = (id: string) => {
        if (!confirm('Xóa thương hiệu này?')) return;
        deleteBrandMutation.mutate(id);
    };

    return (
        <div>
            <div className={styles.header}>
                <div className={styles.headerLeft}>
                    <h1>Thương hiệu</h1>
                </div>
                <button className={styles.addBtn} onClick={openAdd}>+ THÊM THƯƠNG HIỆU</button>
            </div>

            <div className={styles.tableWrapper}>
                <table className={styles.table}>
                    <thead>
                        <tr>
                            <th>Tên Thương Hiệu</th>
                            <th>Slug</th>
                            <th>Quốc gia</th>
                            <th>Trạng thái</th>
                            <th></th>
                        </tr>
                    </thead>
                    <tbody>
                        {loading ? <tr><td colSpan={5}><CyberpunkLoader message="Đang tải thương hiệu..." compact /></td></tr> : brands.map(brand => (
                            <tr key={brand._id}>
                                <td style={{ color: '#fff', fontWeight: 500 }}>{brand.name}</td>
                                <td>{brand.slug}</td>
                                <td>{brand.country || '---'}</td>
                                <td>
                                    <div className={styles.statusToggle}>
                                        <div className={`${styles.toggleSwitch} ${brand.isActive ? styles.on : ''}`} onClick={() => toggleActive(brand)}>
                                            <div className={styles.toggleKnob} />
                                        </div>
                                        <span className={`${styles.statusText} ${brand.isActive ? styles.active : ''}`}>{brand.isActive ? 'Active' : 'Off'}</span>
                                    </div>
                                </td>
                                <td>
                                    <div className={styles.rowActions}>
                                        <button className={styles.rowActionBtn} onClick={() => openEdit(brand)}>✏️</button>
                                        <button className={`${styles.rowActionBtn} ${styles.danger}`} onClick={() => deleteItem(brand._id)}>🗑️</button>
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {showModal && (
                <div className={styles.modalOverlay}>
                    <div className={styles.modal}>
                        <div className={styles.modalHeader}>
                            <h2 className={styles.modalTitle}>{editingId ? 'Sửa' : 'Thêm'}</h2>
                            <button className={styles.modalClose} onClick={() => setShowModal(false)}>✕</button>
                        </div>
                        <div className={styles.modalBody}>
                            <div className={styles.formGroup}>
                                <label className={styles.formLabel}>Tên (Vd: Akko)</label>
                                <input type="text" name="name" className={styles.formInput} value={formData.name} onChange={handleInputChange} />
                            </div>
                            <div className={styles.formGroup}>
                                <label className={styles.formLabel}>Slug</label>
                                <input type="text" name="slug" className={styles.formInput} value={formData.slug} onChange={handleInputChange} />
                            </div>
                            <div className={styles.formGroup}>
                                <label className={styles.formLabel}>Quốc gia (Vd: Taiwan)</label>
                                <input type="text" name="country" className={styles.formInput} value={formData.country} onChange={handleInputChange} />
                            </div>
                        </div>
                        <div className={styles.modalFooter}>
                            <button className={styles.cancelBtn} onClick={() => setShowModal(false)}>HỦY</button>
                            <button className={styles.saveBtn} onClick={saveItem}>LƯU</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
