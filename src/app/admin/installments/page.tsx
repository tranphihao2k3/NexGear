'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { useToast } from '@/components/ui';
import { toCsv, downloadCsv } from '@/lib/csv';
import styles from './page.module.scss';

interface Entry { loanAmount: number; monthly: number }
interface Plan {
    _id: string;
    provider: string;
    term: number;
    entries: Entry[];
    note: string;
    isActive: boolean;
}

const fmtVND = (n: number) => new Intl.NumberFormat('vi-VN').format(n);

export default function AdminInstallmentsPage() {
    const { success, error: showError } = useToast();
    const [plans, setPlans] = useState<Plan[]>([]);
    const [loading, setLoading] = useState(true);
    const [importing, setImporting] = useState(false);
    const [importProvider, setImportProvider] = useState('HD SAISON');
    const [showImport, setShowImport] = useState(false);
    const [showAdd, setShowAdd] = useState(false);
    const [editPlan, setEditPlan] = useState<Plan | null>(null);
    const fileRef = useRef<HTMLInputElement>(null);

    // Add/Edit form state
    const [formProvider, setFormProvider] = useState('');
    const [formTerm, setFormTerm] = useState('');
    const [formNote, setFormNote] = useState('');
    const [formActive, setFormActive] = useState(true);
    const [formEntries, setFormEntries] = useState('');

    const fetchPlans = useCallback(async () => {
        try {
            const res = await fetch('/api/installments');
            const json = await res.json();
            if (json.success) setPlans(json.data);
        } catch { /* ignore */ }
        setLoading(false);
    }, []);

    useEffect(() => { fetchPlans(); }, [fetchPlans]);

    // Group plans by provider
    const grouped = plans.reduce<Record<string, Plan[]>>((acc, p) => {
        (acc[p.provider] ??= []).push(p);
        return acc;
    }, {});

    const handleImport = async () => {
        const file = fileRef.current?.files?.[0];
        if (!file) { showError('Chọn file Excel trước'); return; }
        setImporting(true);
        try {
            const fd = new FormData();
            fd.append('file', file);
            fd.append('provider', importProvider);
            const res = await fetch('/api/installments/import', { method: 'POST', body: fd });
            const json = await res.json();
            if (json.success) {
                success(`Import thành công: ${json.data.imported} kỳ hạn cho ${json.data.provider}`);
                setShowImport(false);
                if (fileRef.current) fileRef.current.value = '';
                fetchPlans();
            } else {
                showError(json.error || 'Import thất bại');
            }
        } catch (e) {
            showError((e as Error).message);
        }
        setImporting(false);
    };

    const handleExport = (provider: string) => {
        const providerPlans = plans.filter(p => p.provider === provider).sort((a, b) => a.term - b.term);
        if (providerPlans.length === 0) return;

        // Build a combined table: rows = unique loan amounts, cols = terms
        const terms = providerPlans.map(p => p.term);
        const allAmounts = new Set<number>();
        providerPlans.forEach(p => p.entries.forEach(e => allAmounts.add(e.loanAmount)));
        const amounts = [...allAmounts].sort((a, b) => a - b);

        // Build lookup
        const lookup: Record<string, number> = {};
        providerPlans.forEach(p => p.entries.forEach(e => {
            lookup[`${e.loanAmount}-${p.term}`] = e.monthly;
        }));

        const rows = amounts.map(amt => {
            const row: Record<string, unknown> = { 'Khoản vay': amt };
            terms.forEach(t => { row[`${t} tháng`] = lookup[`${amt}-${t}`] || ''; });
            return row;
        });

        const csv = toCsv(rows);
        downloadCsv(`tra-gop-${provider.replace(/\s/g, '-')}-${new Date().toISOString().slice(0, 10)}.csv`, csv);
        success('Đã xuất file CSV');
    };

    const handleExportExcel = (provider: string) => {
        handleExport(provider);
    };

    const handleDelete = async (id: string) => {
        if (!confirm('Xóa gói trả góp này?')) return;
        const res = await fetch(`/api/installments?id=${id}`, { method: 'DELETE' });
        const json = await res.json();
        if (json.success) { success('Đã xóa'); fetchPlans(); }
        else showError(json.error || 'Lỗi');
    };

    const openEdit = (plan: Plan) => {
        setEditPlan(plan);
        setFormProvider(plan.provider);
        setFormTerm(String(plan.term));
        setFormNote(plan.note);
        setFormActive(plan.isActive);
        setFormEntries(plan.entries.map(e => `${e.loanAmount},${e.monthly}`).join('\n'));
        setShowAdd(true);
    };

    const openAdd = () => {
        setEditPlan(null);
        setFormProvider('HD SAISON');
        setFormTerm('');
        setFormNote('');
        setFormActive(true);
        setFormEntries('');
        setShowAdd(true);
    };

    const handleSave = async () => {
        if (!formProvider || !formTerm) { showError('Nhập đủ nhà cung cấp và kỳ hạn'); return; }
        const entries: Entry[] = formEntries
            .split('\n')
            .map(line => line.trim())
            .filter(Boolean)
            .map(line => {
                const [a, m] = line.split(',').map(s => Number(s.replace(/\D/g, '')));
                return { loanAmount: a || 0, monthly: m || 0 };
            })
            .filter(e => e.loanAmount > 0 && e.monthly > 0);

        const res = await fetch('/api/installments', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                provider: formProvider,
                term: Number(formTerm),
                entries,
                note: formNote,
                isActive: formActive,
            }),
        });
        const json = await res.json();
        if (json.success) {
            success(editPlan ? 'Đã cập nhật' : 'Đã thêm gói trả góp');
            setShowAdd(false);
            fetchPlans();
        } else {
            showError(json.error || 'Lỗi');
        }
    };

    if (loading) return <div className={styles.loading}>Đang tải...</div>;

    return (
        <div className={styles.page}>
            {/* Header */}
            <div className={styles.header}>
                <div className={styles.headerLeft}>
                    <h1>QUẢN LÝ TRẢ GÓP</h1>
                    <span className={styles.headerSub}>{plans.length} gói trả góp</span>
                </div>
                <div className={styles.headerActions}>
                    <button className={styles.importBtn} onClick={() => setShowImport(true)}>📥 Import Excel</button>
                    <button className={styles.addBtn} onClick={openAdd}>+ Thêm gói</button>
                </div>
            </div>

            {/* Import Modal */}
            {showImport && (
                <div className={styles.overlay} onClick={() => setShowImport(false)}>
                    <div className={styles.modal} onClick={e => e.stopPropagation()}>
                        <h2>Import bảng trả góp từ Excel</h2>
                        <p className={styles.modalHint}>
                            File Excel cần có: cột đầu = Khoản vay, các cột sau = số tiền góp/tháng theo kỳ hạn.
                            <br />Header ví dụ: <code>Khoản vay | 6 tháng | 9 tháng | 12 tháng</code>
                        </p>
                        <div className={styles.formGroup}>
                            <label>Nhà cung cấp</label>
                            <select value={importProvider} onChange={e => setImportProvider(e.target.value)}>
                                <option>HD SAISON</option>
                                <option>MCredit</option>
                                <option>FE Credit</option>
                                <option>Home Credit</option>
                            </select>
                        </div>
                        <div className={styles.formGroup}>
                            <label>File Excel (.xlsx, .xls, .csv)</label>
                            <input ref={fileRef} type="file" accept=".xlsx,.xls,.csv" />
                        </div>
                        <div className={styles.modalActions}>
                            <button className={styles.cancelBtn} onClick={() => setShowImport(false)}>Hủy</button>
                            <button className={styles.saveBtn} onClick={handleImport} disabled={importing}>
                                {importing ? 'Đang import...' : 'Import'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Add/Edit Modal */}
            {showAdd && (
                <div className={styles.overlay} onClick={() => setShowAdd(false)}>
                    <div className={styles.modal} onClick={e => e.stopPropagation()}>
                        <h2>{editPlan ? 'Sửa gói trả góp' : 'Thêm gói trả góp'}</h2>
                        <div className={styles.formRow}>
                            <div className={styles.formGroup}>
                                <label>Nhà cung cấp</label>
                                <select value={formProvider} onChange={e => setFormProvider(e.target.value)}>
                                    <option>HD SAISON</option>
                                    <option>MCredit</option>
                                    <option>FE Credit</option>
                                    <option>Home Credit</option>
                                </select>
                            </div>
                            <div className={styles.formGroup}>
                                <label>Kỳ hạn (tháng)</label>
                                <input type="number" value={formTerm} onChange={e => setFormTerm(e.target.value)} placeholder="6" />
                            </div>
                        </div>
                        <div className={styles.formGroup}>
                            <label>Ghi chú</label>
                            <input type="text" value={formNote} onChange={e => setFormNote(e.target.value)} placeholder="Ghi chú (tùy chọn)" />
                        </div>
                        <div className={styles.formGroup}>
                            <label className={styles.checkLabel}>
                                <input type="checkbox" checked={formActive} onChange={e => setFormActive(e.target.checked)} />
                                Kích hoạt
                            </label>
                        </div>
                        <div className={styles.formGroup}>
                            <label>Bảng lãi suất (mỗi dòng: khoản vay, số tiền/tháng)</label>
                            <textarea
                                className={styles.entriesArea}
                                value={formEntries}
                                onChange={e => setFormEntries(e.target.value)}
                                placeholder={"2000000,411000\n3000000,610000\n5000000,1008000"}
                                rows={10}
                            />
                        </div>
                        <div className={styles.modalActions}>
                            <button className={styles.cancelBtn} onClick={() => setShowAdd(false)}>Hủy</button>
                            <button className={styles.saveBtn} onClick={handleSave}>Lưu</button>
                        </div>
                    </div>
                </div>
            )}

            {/* Plans grouped by provider */}
            {Object.keys(grouped).length === 0 ? (
                <div className={styles.empty}>
                    <p>Chưa có gói trả góp nào</p>
                    <p>Import file Excel hoặc thêm thủ công để bắt đầu.</p>
                </div>
            ) : (
                Object.entries(grouped).map(([provider, provPlans]) => (
                    <div key={provider} className={styles.providerGroup}>
                        <div className={styles.providerHeader}>
                            <h2>{provider}</h2>
                            <button className={styles.exportBtn} onClick={() => handleExportExcel(provider)}>
                                📤 Export CSV
                            </button>
                        </div>
                        <div className={styles.plansGrid}>
                            {provPlans.sort((a, b) => a.term - b.term).map(plan => (
                                <div key={plan._id} className={`${styles.planCard} ${!plan.isActive ? styles.inactive : ''}`}>
                                    <div className={styles.planHeader}>
                                        <span className={styles.planTerm}>{plan.term} tháng</span>
                                        {!plan.isActive && <span className={styles.inactiveBadge}>Tắt</span>}
                                    </div>
                                    <div className={styles.planCount}>{plan.entries.length} mức giá</div>
                                    {plan.entries.length > 0 && (
                                        <div className={styles.planRange}>
                                            {fmtVND(plan.entries[0].loanAmount)}đ — {fmtVND(plan.entries[plan.entries.length - 1].loanAmount)}đ
                                        </div>
                                    )}
                                    {plan.note && <div className={styles.planNote}>{plan.note}</div>}
                                    <div className={styles.planActions}>
                                        <button onClick={() => openEdit(plan)}>Sửa</button>
                                        <button className={styles.deleteBtn} onClick={() => handleDelete(plan._id)}>Xóa</button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                ))
            )}
        </div>
    );
}
