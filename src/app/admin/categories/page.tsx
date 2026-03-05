'use client';

import { useState, useEffect } from 'react';
import styles from './page.module.scss';
import { useToast } from '@/components/ui';

interface Category {
    _id: string;
    name: string;
    slug: string;
    icon: string;
    isActive: boolean;
    order: number;
}

export default function AdminCategoriesPage() {
    const { success, error } = useToast();
    const [categories, setCategories] = useState<Category[]>([]);
    const [loading, setLoading] = useState(true);

    const [showModal, setShowModal] = useState(false);
    const [editingId, setEditingId] = useState<string | null>(null);
    const [formData, setFormData] = useState({ name: '', slug: '', icon: '', order: '0' });

    const fetchCategories = async () => {
        try {
            const res = await fetch('/api/categories?limit=50');
            const json = await res.json();
            if (json.success) setCategories(json.data);
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchCategories();
    }, []);

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setFormData((prev) => ({
            ...prev,
            [name]: value,
            // Auto generate slug
            ...(name === 'name' && !editingId
                ? { slug: value.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '') }
                : {})
        }));
    };

    const openAdd = () => {
        setEditingId(null);
        setFormData({ name: '', slug: '', icon: '', order: '0' });
        setShowModal(true);
    };

    const openEdit = (cat: Category) => {
        setEditingId(cat._id);
        setFormData({ name: cat.name, slug: cat.slug, icon: cat.icon, order: cat.order.toString() });
        setShowModal(true);
    };

    const saveItem = async () => {
        if (!formData.name || !formData.slug) return error('Tên và Slug là bắt buộc!');
        try {
            const url = editingId ? `/api/categories/${editingId}` : `/api/categories`;
            const res = await fetch(url, {
                method: editingId ? 'PUT' : 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ ...formData, order: Number(formData.order) })
            });
            const data = await res.json();
            if (!data.success) throw new Error(data.error);
            success(editingId ? 'Đã cập nhật danh mục' : 'Đã thêm danh mục');
            setShowModal(false);
            fetchCategories();
        } catch (e: any) { error(e.message); }
    };

    const toggleActive = async (cat: Category) => {
        try {
            const res = await fetch(`/api/categories/${cat._id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ isActive: !cat.isActive })
            });
            const data = await res.json();
            if (data.success) {
                setCategories(prev => prev.map(c => c._id === cat._id ? { ...c, isActive: !c.isActive } : c));
            }
        } catch (e) { error('Lỗi cập nhật'); }
    };

    const deleteItem = async (id: string) => {
        if (!confirm('Xóa danh mục này?')) return;
        try {
            const res = await fetch(`/api/categories/${id}`, { method: 'DELETE' });
            const data = await res.json();
            if (data.success) { success('Đã xóa'); fetchCategories(); }
            else error(data.error);
        } catch (e) { error('Lỗi xóa'); }
    };

    return (
        <div>
            <div className={styles.header}>
                <div className={styles.headerLeft}>
                    <h1>Danh mục</h1>
                </div>
                <button className={styles.addBtn} onClick={openAdd}>+ THÊM DANH MỤC</button>
            </div>

            <div className={styles.tableWrapper}>
                <table className={styles.table}>
                    <thead>
                        <tr>
                            <th>Icon</th>
                            <th>Tên Danh Mục</th>
                            <th>Slug</th>
                            <th>Thứ tự</th>
                            <th>Trạng thái</th>
                            <th></th>
                        </tr>
                    </thead>
                    <tbody>
                        {loading ? <tr><td colSpan={6}>Đang tải...</td></tr> : categories.map(cat => (
                            <tr key={cat._id}>
                                <td style={{ fontSize: '24px' }}>{cat.icon || '📁'}</td>
                                <td style={{ color: '#fff', fontWeight: 500 }}>{cat.name}</td>
                                <td>{cat.slug}</td>
                                <td>{cat.order}</td>
                                <td>
                                    <div className={styles.statusToggle}>
                                        <div className={`${styles.toggleSwitch} ${cat.isActive ? styles.on : ''}`} onClick={() => toggleActive(cat)}>
                                            <div className={styles.toggleKnob} />
                                        </div>
                                        <span className={`${styles.statusText} ${cat.isActive ? styles.active : ''}`}>{cat.isActive ? 'Active' : 'Off'}</span>
                                    </div>
                                </td>
                                <td>
                                    <div className={styles.rowActions}>
                                        <button className={styles.rowActionBtn} onClick={() => openEdit(cat)}>✏️</button>
                                        <button className={`${styles.rowActionBtn} ${styles.danger}`} onClick={() => deleteItem(cat._id)}>🗑️</button>
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
                                <label className={styles.formLabel}>Tên (Vd: Bàn Phím)</label>
                                <input type="text" name="name" className={styles.formInput} value={formData.name} onChange={handleInputChange} />
                            </div>
                            <div className={styles.formGroup}>
                                <label className={styles.formLabel}>Slug</label>
                                <input type="text" name="slug" className={styles.formInput} value={formData.slug} onChange={handleInputChange} />
                            </div>
                            <div className={styles.formGroup}>
                                <label className={styles.formLabel}>Icon (Emoji - vd: ⌨️)</label>
                                <input type="text" name="icon" className={styles.formInput} value={formData.icon} onChange={handleInputChange} maxLength={2} />
                            </div>
                            <div className={styles.formGroup}>
                                <label className={styles.formLabel}>Thứ tự hiển thị (Order)</label>
                                <input type="number" name="order" className={styles.formInput} value={formData.order} onChange={handleInputChange} />
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
