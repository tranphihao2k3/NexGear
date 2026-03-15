'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import styles from './page.module.scss';
import { CyberpunkLoader, useToast } from '@/components/ui';

function toSlug(str: string): string {
    return str
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/đ/g, 'd').replace(/Đ/g, 'd')
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/(^-|-$)+/g, '');
}

interface Category {
    _id: string;
    name: string;
    slug: string;
    icon: string;
    isActive: boolean;
    order: number;
    parent?: { _id: string; name: string; slug: string } | string | null;
    children?: Category[];
}

export default function AdminCategoriesPage() {
    const { success, error } = useToast();
    const qc = useQueryClient();
    const [showModal, setShowModal] = useState(false);
    const [editingId, setEditingId] = useState<string | null>(null);
    const [formData, setFormData] = useState({ name: '', slug: '', icon: '', order: '0', parent: '' });

    // ── React Query ──
    const { data: categories = [], isPending: loading } = useQuery<Category[]>({
        queryKey: ['categories'],
        queryFn: () => fetch('/api/categories?limit=50').then(r => r.json()).then(d => d.data ?? []),
        staleTime: 1000 * 60 * 5,
    });

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setFormData((prev) => ({
            ...prev,
            [name]: value,
            // Auto generate slug
            ...(name === 'name' && !editingId
                ? { slug: toSlug(value) }
                : {})
        }));
    };

    // Root categories for parent dropdown
    const rootCategories = categories.filter(c => !c.parent);

    // Build tree-ordered flat list for table display
    const treeOrderedCategories = (() => {
        const roots = categories.filter(c => !c.parent);
        const childrenMap = new Map<string, Category[]>();
        for (const c of categories) {
            const pid = typeof c.parent === 'object' && c.parent ? c.parent._id : c.parent;
            if (pid) {
                if (!childrenMap.has(pid)) childrenMap.set(pid, []);
                childrenMap.get(pid)!.push(c);
            }
        }
        const result: { cat: Category; depth: number }[] = [];
        for (const root of roots) {
            result.push({ cat: root, depth: 0 });
            const children = childrenMap.get(root._id) || [];
            for (const child of children) result.push({ cat: child, depth: 1 });
        }
        return result;
    })();

    const openAdd = () => {
        setEditingId(null);
        setFormData({ name: '', slug: '', icon: '', order: '0', parent: '' });
        setShowModal(true);
    };

    const openEdit = (cat: Category) => {
        setEditingId(cat._id);
        const parentId = typeof cat.parent === 'object' && cat.parent ? cat.parent._id : (cat.parent || '');
        setFormData({ name: cat.name, slug: cat.slug, icon: cat.icon, order: cat.order.toString(), parent: parentId });
        setShowModal(true);
    };

    const saveCategoryMutation = useMutation({
        mutationFn: ({ id, data }: { id?: string; data: any }) => {
            const url = id ? `/api/categories/${id}` : '/api/categories';
            return fetch(url, {
                method: id ? 'PUT' : 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(data),
            }).then(r => r.json());
        },
        onSuccess: (data, vars) => {
            if (!data.success) { error(data.error); return; }
            success(vars.id ? 'Đã cập nhật danh mục' : 'Đã thêm danh mục');
            setShowModal(false);
            qc.invalidateQueries({ queryKey: ['categories'] });
        },
    });

    const deleteCategoryMutation = useMutation({
        mutationFn: (id: string) =>
            fetch(`/api/categories/${id}`, { method: 'DELETE' }).then(r => r.json()),
        onSuccess: (data) => {
            if (data.success) { success('Đã xóa'); qc.invalidateQueries({ queryKey: ['categories'] }); }
            else error(data.error);
        },
        onError: () => error('Lỗi xóa'),
    });

    const saveItem = () => {
        if (!formData.name || !formData.slug) return error('Tên và Slug là bắt buộc!');
        saveCategoryMutation.mutate({
            id: editingId ?? undefined,
            data: { ...formData, order: Number(formData.order), parent: formData.parent || null },
        });
    };

    const toggleActive = (cat: Category) => {
        saveCategoryMutation.mutate({ id: cat._id, data: { isActive: !cat.isActive } });
    };

    const deleteItem = (id: string) => {
        if (!confirm('Xóa danh mục này?')) return;
        deleteCategoryMutation.mutate(id);
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
                        {loading ? <tr><td colSpan={6}><CyberpunkLoader message="Đang tải danh mục..." compact /></td></tr> : treeOrderedCategories.map(({ cat, depth }) => (
                            <tr key={cat._id}>
                                <td style={{ fontSize: '24px' }}>{cat.icon || '📁'}</td>
                                <td style={{ color: '#fff', fontWeight: 500, paddingLeft: depth > 0 ? `${depth * 24 + 8}px` : undefined }}>{depth > 0 ? '└ ' : ''}{cat.name}</td>
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
                                <label className={styles.formLabel}>Danh mục cha</label>
                                <select
                                    className={styles.formInput}
                                    value={formData.parent}
                                    onChange={(e) => setFormData(prev => ({ ...prev, parent: e.target.value }))}
                                >
                                    <option value="">— Không (root) —</option>
                                    {rootCategories.filter(c => c._id !== editingId).map(c => (
                                        <option key={c._id} value={c._id}>{c.icon} {c.name}</option>
                                    ))}
                                </select>
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
