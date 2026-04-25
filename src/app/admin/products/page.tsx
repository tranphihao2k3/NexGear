'use client';

import { useState, useEffect, useMemo, useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useToast } from '@/components/ui';
import LazyImage from '@/components/ui/LazyImage';
import SearchableSelect from '@/components/admin/SearchableSelect';
import styles from './page.module.scss';
import { getSpecKeysForCategory, type SpecKeyDef } from '@/lib/spec-keys';
import { uploadImages } from '@/lib/image-server';

/** Searchable combobox cho spec key */
function SpecKeyCombobox({ value, options, customKeys, onChange, className }: {
    value: string;
    options: SpecKeyDef[];
    customKeys: string[];
    onChange: (key: string) => void;
    className?: string;
}) {
    const [open, setOpen] = useState(false);
    const [search, setSearch] = useState('');
    const ref = useRef<HTMLDivElement>(null);
    const inputRef = useRef<HTMLInputElement>(null);

    // Close on outside click
    useEffect(() => {
        const handler = (e: MouseEvent) => {
            if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
        };
        document.addEventListener('mousedown', handler);
        return () => document.removeEventListener('mousedown', handler);
    }, []);

    const normalize = (s: string) => s.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/đ/g, 'd');

    const allItems = [
        ...options.map(o => ({ key: o.key, label: o.key, custom: false })),
        ...customKeys.map(k => ({ key: k, label: `${k} (tùy chỉnh)`, custom: true })),
    ];

    const filtered = search
        ? allItems.filter(item => normalize(item.key).includes(normalize(search)) || item.key.toLowerCase().includes(search.toLowerCase()))
        : allItems;

    const showCustomAdd = search && !allItems.some(item => normalize(item.key) === normalize(search));

    return (
        <div ref={ref} style={{ flex: 1, position: 'relative' }}>
            <input
                ref={inputRef}
                type="text"
                className={className}
                value={open ? search : value}
                placeholder={value || '-- Chọn thông số --'}
                onFocus={() => { setOpen(true); setSearch(''); }}
                onChange={(e) => setSearch(e.target.value)}
                style={{ width: '100%' }}
                autoComplete="off"
            />
            {open && (
                <div style={{
                    position: 'absolute', top: '100%', left: 0, right: 0, zIndex: 999,
                    background: '#1a1a2e', border: '1px solid rgba(0,240,255,0.3)', borderRadius: '6px',
                    maxHeight: '200px', overflowY: 'auto', marginTop: '2px',
                    boxShadow: '0 4px 20px rgba(0,0,0,0.5)',
                }}>
                    {filtered.map(item => (
                        <div
                            key={item.key}
                            onClick={() => { onChange(item.key); setOpen(false); setSearch(''); }}
                            style={{
                                padding: '8px 12px', cursor: 'pointer',
                                color: item.custom ? '#aaa' : '#e0e0e0',
                                fontStyle: item.custom ? 'italic' : 'normal',
                                background: item.key === value ? 'rgba(0,240,255,0.1)' : 'transparent',
                            }}
                            onMouseEnter={(e) => (e.currentTarget.style.background = 'rgba(0,240,255,0.15)')}
                            onMouseLeave={(e) => (e.currentTarget.style.background = item.key === value ? 'rgba(0,240,255,0.1)' : 'transparent')}
                        >
                            {item.label}
                        </div>
                    ))}
                    {showCustomAdd && (
                        <div
                            onClick={() => { onChange(search); setOpen(false); setSearch(''); }}
                            style={{ padding: '8px 12px', cursor: 'pointer', color: '#00f0ff', borderTop: '1px solid rgba(255,255,255,0.1)' }}
                            onMouseEnter={(e) => (e.currentTarget.style.background = 'rgba(0,240,255,0.15)')}
                            onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
                        >
                            + Thêm &quot;{search}&quot; (tùy chỉnh)
                        </div>
                    )}
                    {filtered.length === 0 && !showCustomAdd && (
                        <div style={{ padding: '8px 12px', color: '#666' }}>Không tìm thấy</div>
                    )}
                </div>
            )}
        </div>
    );
}

function removeVietnameseTones(str: string): string {
    return str
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/đ/g, 'd')
        .replace(/Đ/g, 'D');
}

interface Category {
    _id: string;
    name: string;
    parent: { _id: string; name: string; slug: string } | null;
}

/** Group categories: parents first, then children indented */
function groupedCategoryOptions(categories: Category[]): { label: string; value: string }[] {
    const parents = categories.filter(c => !c.parent);
    const children = categories.filter(c => c.parent);
    const result: { label: string; value: string }[] = [];
    for (const p of parents) {
        result.push({ label: p.name, value: p._id });
        for (const ch of children.filter(c => c.parent!._id === p._id)) {
            result.push({ label: `  └ ${ch.name}`, value: ch._id });
        }
    }
    // Orphan children (parent not populated)
    const orphans = children.filter(c => !parents.some(p => p._id === c.parent!._id));
    for (const o of orphans) {
        result.push({ label: o.name, value: o._id });
    }
    return result;
}

interface Brand {
    _id: string;
    name: string;
}

interface ImageItem {
    url: string;       // blob URL (local preview) or server URL (/uploads/...)
    file?: File;       // pending file to upload (undefined = already uploaded)
    filename?: string; // server filename (for deletion)
}

interface VariantAttribute {
    key: string;
    value: string;
}

interface Variant {
    name: string;
    sku: string;
    price: string;
    stock: string;
    images: ImageItem[];
    attributes: VariantAttribute[];
}

interface Product {
    _id: string;
    name: string;
    slug: string;
    sku: string;
    category: Category;
    brand: Brand;
    basePrice: number;
    salePrice?: number;
    costPrice?: number;
    stock: number;
    isActive: boolean;
    isFeatured?: boolean;
    images: string[];
    description?: string;
    tags?: string[];
    specs?: Record<string, any>;
    variants?: Variant[];
    // LapLap fields
    isUsed?: boolean;
    condition?: 'new' | 'like_new' | 'used' | 'refurbished';
    usedGrade?: 'A' | 'B' | 'C' | null;
    conditionNote?: string;
    warranty?: { duration: number; items: string[] };
    warrantyMonths?: number;
    gift?: string;
}

export default function AdminProductsPage() {
    const { success, error, info } = useToast();
    const qc = useQueryClient();

    const [loading, setLoading] = useState(false); // chỉ dùng khi save/delete
    const [search, setSearch] = useState('');
    const [filterCategory, setFilterCategory] = useState('');
    const [filterStatus, setFilterStatus] = useState('');
    const [viewMode, setViewMode] = useState<'list' | 'grid'>('list');

    const [showModal, setShowModal] = useState(false);
    const [editingId, setEditingId] = useState<string | null>(null);

    const [formData, setFormData] = useState({
        name: '',
        slug: '',
        sku: '',
        category: '',
        brand: '',
        basePrice: '',
        salePrice: '',
        costPrice: '',
        stock: '',
        description: '',
        images: [] as ImageItem[],
        tags: '' as string,
        isFeatured: false,
        specs: [] as { key: string, value: string }[],
        variants: [] as Variant[],
        // LapLap fields
        warrantyMonths: '12',
        warrantyItems: ['Bảo hành 3 tháng chính hãng', 'Hỗ trợ phần mềm 3 năm', 'Đổi mới trong 7 ngày đầu nếu lỗi phần cứng'],
        gift: '',
        isUsed: false,
        condition: 'new',
        usedGrade: '',
        conditionNote: '',
    });
    const [saving, setSaving] = useState(false);
    const [uploadingImages, setUploadingImages] = useState(false);
    const [aiText, setAiText] = useState('');
    const [aiParsing, setAiParsing] = useState(false);
    const [hasDraft, setHasDraft] = useState(false);

    const DRAFT_KEY = 'nexgear_product_draft';

    // Auto-save draft to localStorage (exclude images — can't serialize File objects)
    useEffect(() => {
        if (!showModal || editingId) return; // only save drafts for new products
        const timer = setTimeout(() => {
            const draft = {
                ...formData,
                images: formData.images.filter(img => !img.file).map(img => ({ url: img.url, filename: img.filename })),
                variants: formData.variants.map(v => ({
                    ...v,
                    images: v.images.filter(img => !img.file).map(img => ({ url: img.url, filename: img.filename })),
                })),
                _savedAt: Date.now(),
            };
            localStorage.setItem(DRAFT_KEY, JSON.stringify(draft));
        }, 500); // debounce 500ms
        return () => clearTimeout(timer);
    }, [formData, showModal, editingId]);

    // Check if draft exists on mount
    useEffect(() => {
        try {
            const raw = localStorage.getItem(DRAFT_KEY);
            if (raw) {
                const draft = JSON.parse(raw);
                // Only show if draft is less than 24h old and has a name
                if (draft._savedAt && Date.now() - draft._savedAt < 86400000 && draft.name) {
                    setHasDraft(true);
                } else {
                    localStorage.removeItem(DRAFT_KEY);
                }
            }
        } catch { /* ignore */ }
    }, []);

    const loadDraft = () => {
        try {
            const raw = localStorage.getItem(DRAFT_KEY);
            if (!raw) return;
            const draft = JSON.parse(raw);
            const { _savedAt, ...data } = draft;
            setFormData({
                ...data,
                images: (data.images || []).map((img: any) => ({ url: img.url, filename: img.filename })),
                variants: (data.variants || []).map((v: any) => ({
                    ...v,
                    images: (v.images || []).map((img: any) => ({ url: img.url, filename: img.filename })),
                })),
            });
            setHasDraft(false);
            info('Đã khôi phục bản nháp!');
        } catch { /* ignore */ }
    };

    const clearDraft = () => {
        localStorage.removeItem(DRAFT_KEY);
        setHasDraft(false);
    };

    // Helper: tạo warrantyItems mặc định từ số tháng
    const buildWarrantyItems = (months: number): string[] => {
        const firstLine = months === 0
            ? 'Không bảo hành'
            : `Bảo hành ${months} tháng chính hãng`;
        return [firstLine, 'Hỗ trợ kỹ thuật trọn đời', 'Đổi mới trong 7 ngày đầu'];
    };

    const handleAiQuickFill = async () => {
        if (!aiText.trim()) { error('Nhập mô tả sản phẩm để AI phân tích'); return; }
        setAiParsing(true);
        try {
            const res = await fetch('/api/ai-parse-product', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ text: aiText }),
            });
            const json = await res.json();
            if (!json.success) { error(json.message || 'AI lỗi'); return; }
            const d = json.data;
            console.log('[AI Quick Fill] response:', JSON.stringify(d, null, 2));
            setFormData(prev => {
                const parsedBasePrice = (d.basePrice != null && d.basePrice !== 0) ? d.basePrice.toString()
                    : (d.price != null && d.price !== 0) ? d.price.toString()
                        : prev.basePrice;
                // Keep {{IMAGE_N}} placeholders intact — they'll be replaced with real uploaded URLs
                // after images upload completes inside handleSaveItem background task
                const rawDesc = d.description || prev.description || '';
                const resolvedUsedGrade = d.isUsed
                    ? ((d.usedGrade === 'A' || d.usedGrade === 'B') ? d.usedGrade : 'B')
                    : '';
                return {
                    ...prev,
                    name: d.name || prev.name,
                    slug: d.name ? removeVietnameseTones(d.name).toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '') : prev.slug,
                    sku: d.name ? 'NGR-' + removeVietnameseTones(d.name).toUpperCase().replace(/[^A-Z0-9]+/g, '').substring(0, 6) + '-' + Math.floor(Math.random() * 1000) : prev.sku,
                    category: d.categoryId || prev.category,
                    brand: d.brandId || prev.brand,
                    basePrice: parsedBasePrice,
                    // salePrice & costPrice: NOT auto-filled — user fills manually
                    stock: '1',
                    isUsed: typeof d.isUsed === 'boolean' ? d.isUsed : prev.isUsed,
                    condition: d.condition || prev.condition,
                    usedGrade: resolvedUsedGrade || prev.usedGrade,
                    conditionNote: d.conditionNote || prev.conditionNote,
                    warrantyMonths: (d.warrantyMonths != null) ? d.warrantyMonths.toString() : prev.warrantyMonths,
                    // Đồng bộ warrantyItems: dùng items từ AI nếu có, không thì tự generate từ số tháng
                    warrantyItems: (() => {
                        const months = d.warrantyMonths ?? Number(prev.warrantyMonths);
                        if (d.warranty?.items?.length > 0) return d.warranty.items;
                        return buildWarrantyItems(months);
                    })(),
                    gift: d.gift || prev.gift,
                    description: rawDesc, // {{IMAGE_N}} placeholders kept, real URLs injected after upload
                    tags: d.tags?.join(', ') || prev.tags,
                    specs: d.specs ? Object.entries(d.specs).map(([key, value]) => ({ key, value: String(value) })) : prev.specs,
                    variants: d.variants?.length ? d.variants.map((v: any) => ({
                        name: v.name || '',
                        sku: v.sku || '',
                        price: v.price?.toString() || '',
                        stock: v.stock?.toString() || '0',
                        images: [] as ImageItem[],
                        attributes: (v.attributes || []).map((a: any) => ({ key: a.key || '', value: a.value || '' })),
                    })) : prev.variants,
                };
            });
            success('AI đã điền thông tin sản phẩm!');
            setAiText('');
        } catch (e: any) {
            error('Lỗi kết nối AI: ' + e.message);
        } finally {
            setAiParsing(false);
        }
    };

    // ── React Query: Products ──
    const { data: products = [], isPending: productsLoading } = useQuery<Product[]>({
        queryKey: ['products', 'admin'],
        queryFn: () => fetch('/api/products?limit=100&admin=true')
            .then(r => r.json()).then(d => d.data ?? []),
        staleTime: 1000 * 60 * 2,
    });

    // ── React Query: Categories (cache 30 phút) ──
    const { data: categories = [] } = useQuery<Category[]>({
        queryKey: ['categories', 'list', {}],
        queryFn: () => fetch('/api/categories?limit=100')
            .then(r => r.json()).then(d => d.data ?? []),
        staleTime: 1000 * 60 * 30,
    });

    // ── React Query: Brands (cache 30 phút) ──
    const { data: brands = [] } = useQuery<Brand[]>({
        queryKey: ['brands', 'list', { hasProducts: false }],
        queryFn: () => fetch('/api/brands?limit=100')
            .then(r => r.json()).then(d => d.data ?? []),
        staleTime: 1000 * 60 * 30,
    });

    const parseVNPrice = (raw: string): string => {
        if (!raw) return '';
        let s = raw.trim().toLowerCase();

        // Already a pure number (possibly with dots/commas as thousand sep)
        // e.g. "1.290.000" or "1,290,000" or "1290000"
        const pureNum = s.replace(/[.,đd₫\s]/g, '');
        if (/^\d+$/.test(pureNum) && pureNum.length >= 6) return pureNum;

        // "X" at end → default to 9 (e.g. "9triuX" → "9triu9")
        s = s.replace(/x$/i, '9');

        // "11.900k" or "11900k" or "890k"
        const kMatch = s.match(/^([\d.,]+)\s*k$/);
        if (kMatch) {
            const num = parseFloat(kMatch[1].replace(/,/g, '.')) * 1000;
            return Math.round(num).toString();
        }

        // "9triu8" "9trieu8" "9triệu8" "9tr8" "9triu800" "9tr800"
        const trMatch = s.match(/^(\d+)\s*(?:tri[eệu]*u?|tr)\s*(\d*)$/);
        if (trMatch) {
            const millions = parseInt(trMatch[1]);
            const rest = trMatch[2] || '0';
            // "9tr8" → 9.8tr, "9tr800" → 9.800tr, "9tr" → 9tr
            let remainder = 0;
            if (rest.length <= 1) {
                remainder = parseInt(rest) * 100000; // "8" → 800000
            } else if (rest.length === 2) {
                remainder = parseInt(rest) * 10000; // "80" → 800000
            } else {
                remainder = parseInt(rest) * 1000; // "800" → 800000, "490" → 490000
            }
            return (millions * 1000000 + remainder).toString();
        }

        // "17.5tr" or "17,5tr"
        const decTrMatch = s.match(/^([\d.,]+)\s*(?:tri[eệu]*u?|tr)$/);
        if (decTrMatch) {
            const num = parseFloat(decTrMatch[1].replace(/,/g, '.')) * 1000000;
            return Math.round(num).toString();
        }

        // "3m"
        const mMatch = s.match(/^([\d.,]+)\s*m$/);
        if (mMatch) {
            const num = parseFloat(mMatch[1].replace(/,/g, '.')) * 1000000;
            return Math.round(num).toString();
        }

        // Fallback: strip non-digits
        const digits = s.replace(/\D/g, '');
        return digits || raw;
    };

    const formatVND = (value: string) => {
        const num = Number(value);
        if (!value || isNaN(num) || num === 0) return '';
        return new Intl.NumberFormat('vi-VN').format(num) + ' ₫';
    };

    const handlePriceBlur = (fieldName: 'basePrice' | 'salePrice' | 'costPrice') => {
        setFormData(prev => ({
            ...prev,
            [fieldName]: parseVNPrice(prev[fieldName] as string),
        }));
    };

    const handleVariantPriceBlur = (vi: number) => {
        setFormData(prev => ({
            ...prev,
            variants: prev.variants.map((v, i) =>
                i === vi ? { ...v, price: parseVNPrice(v.price) } : v
            ),
        }));
    };

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setFormData((prev) => ({
            ...prev,
            [name]: value,
            // Auto-generate slug and SKU from name if empty and typing name
            ...(name === 'name' && !editingId
                ? {
                    slug: removeVietnameseTones(value).toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, ''),
                    sku: 'NGR-' + removeVietnameseTones(value).toUpperCase().replace(/[^A-Z0-9]+/g, '').substring(0, 6) + '-' + Math.floor(Math.random() * 1000)
                }
                : {})
        }));
    };

    const openAddModal = () => {
        setEditingId(null);
        setFormData({
            name: '', slug: '', sku: '', category: categories[0]?._id || '', brand: brands[0]?._id || '',
            basePrice: '', salePrice: '', costPrice: '', stock: '0', description: '', images: [], tags: '',
            isFeatured: false, specs: [], variants: [],
            warrantyMonths: '12',
            warrantyItems: ['Bảo hành 3 tháng chính hãng', 'Hỗ trợ phần mềm 3 năm', 'Đổi mới trong 7 ngày đầu nếu lỗi phần cứng'],
            gift: '',
            isUsed: false,
            condition: 'new',
            usedGrade: '',
            conditionNote: '',
        });
        setShowModal(true);
    };

    const urlToImageItem = (url: string): ImageItem => ({
        url,
        filename: extractFilename(url),
    });

    const extractFilename = (url: string): string | undefined => {
        // Extract filename from local URL: /uploads/filename.jpg
        const match = url.match(/\/uploads\/(.+)$/);
        return match ? match[1] : undefined;
    };

    const openEditModal = (product: Product) => {
        setEditingId(product._id);
        const lWarranty = product.warranty || { duration: 12, items: [] };

        setFormData({
            name: product.name,
            slug: product.slug,
            sku: product.sku,
            category: (typeof product.category === 'object' ? product.category?._id : (product as any).categoryId) || '',
            brand: (typeof product.brand === 'object' ? product.brand?._id : (product as any).brandId) || '',
            basePrice: product.basePrice.toString(),
            salePrice: product.salePrice?.toString() || '',
            costPrice: product.costPrice?.toString() || '',
            stock: product.stock.toString(),
            description: product.description || '',
            images: (product.images || []).map(urlToImageItem),
            tags: (product.tags || []).join(', '),
            isFeatured: product.isFeatured || false,
            specs: Object.entries(product.specs || {}).map(([key, value]) => ({ key, value: String(value) })),
            variants: (product.variants || []).map((v: any) => ({
                name: v.name || '',
                sku: v.sku || '',
                price: v.price?.toString() || '',
                stock: v.stock?.toString() || '0',
                images: (v.images || []).map(urlToImageItem),
                attributes: (v.attributes || []).map((a: any) => ({ key: a.key || '', value: a.value || '' })),
            })),
            // LapLap fields
            warrantyMonths: (product.warrantyMonths || lWarranty.duration || 12).toString(),
            warrantyItems: lWarranty.items.length > 0 ? lWarranty.items : ['Bảo hành 3 tháng chính hãng', 'Hỗ trợ phần mềm 3 năm', 'Đổi mới trong 7 ngày đầu nếu lỗi phần cứng'],
            gift: product.gift || '',
            isUsed: product.isUsed || false,
            condition: product.condition || 'new',
            usedGrade: (product.usedGrade as string) || '',
            conditionNote: product.conditionNote || '',
        });
        setShowModal(true);
    };

    // Add images from File[] array (shared by both select and drop)
    const addImageFiles = (files: File[]) => {
        const imageFiles = files.filter(f => f.type.startsWith('image/'));
        if (imageFiles.length === 0) return;
        const newImages = imageFiles.map(file => ({
            url: URL.createObjectURL(file),
            file
        }));
        setFormData(prev => ({
            ...prev,
            images: [...prev.images, ...newImages]
        }));
    };

    // Add image as local preview (no upload yet)
    const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (!e.target.files || e.target.files.length === 0) return;
        addImageFiles(Array.from(e.target.files));
        e.target.value = '';
    };

    // Drag & drop handler
    const [dragOver, setDragOver] = useState(false);
    const handleImageDrop = (e: React.DragEvent) => {
        e.preventDefault();
        setDragOver(false);
        if (e.dataTransfer.files?.length) {
            addImageFiles(Array.from(e.dataTransfer.files));
        }
    };

    // Remove image — if already on server, delete from filesystem too
    const removeImage = async (index: number) => {
        const img = formData.images[index];
        if (img.filename) {
            try {
                await fetch('/api/upload', {
                    method: 'DELETE',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ filename: img.filename }),
                });
            } catch (e) {
                console.error('Failed to delete file:', e);
            }
        }
        // Revoke blob URL if local
        if (img.file) URL.revokeObjectURL(img.url);
        setFormData(prev => ({
            ...prev,
            images: prev.images.filter((_, i) => i !== index)
        }));
    };

    const addVariant = () => {
        setFormData(prev => ({
            ...prev,
            variants: [...prev.variants, { name: '', sku: '', price: '', stock: '0', images: [], attributes: [] }]
        }));
    };

    const removeVariant = (index: number) => {
        setFormData(prev => ({
            ...prev,
            variants: prev.variants.filter((_, i) => i !== index)
        }));
    };

    const updateVariant = (index: number, field: keyof Variant, value: string) => {
        setFormData(prev => ({
            ...prev,
            variants: prev.variants.map((v, i) => i === index ? { ...v, [field]: value } : v)
        }));
    };

    // Add variant image as local preview
    const handleVariantImageSelect = (index: number, e: React.ChangeEvent<HTMLInputElement>) => {
        if (!e.target.files || e.target.files.length === 0) return;
        const newImages = Array.from(e.target.files).map(file => ({
            url: URL.createObjectURL(file),
            file
        }));
        setFormData(prev => ({
            ...prev,
            variants: prev.variants.map((v, i) => i === index ? { ...v, images: [...v.images, ...newImages] } : v)
        }));
        e.target.value = '';
    };

    // Remove variant image — delete from server if needed
    const removeVariantImage = async (variantIndex: number, imgIndex: number) => {
        const img = formData.variants[variantIndex].images[imgIndex];
        if (img.filename) {
            try {
                await fetch('/api/upload', {
                    method: 'DELETE',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ filename: img.filename }),
                });
            } catch (e) {
                console.error('Failed to delete file:', e);
            }
        }
        if (img.file) URL.revokeObjectURL(img.url);
        setFormData(prev => ({
            ...prev,
            variants: prev.variants.map((v, i) => i === variantIndex ? { ...v, images: v.images.filter((_, j) => j !== imgIndex) } : v)
        }));
    };

    // Upload tất cả pending images trong 1 request duy nhất → trả về mảng URL
    const uploadPendingImages = async (items: ImageItem[]): Promise<string[]> => {
        const existingUrls = items.filter(img => !img.file).map(img => img.url);
        const pendingFiles = items.filter(img => !!img.file).map(img => img.file!);

        if (pendingFiles.length === 0) return existingUrls;

        // 1 request gửi tất cả files[], server trả về mảng URL
        const uploaded = await uploadImages(pendingFiles, { folder: 'products' });
        return [...existingUrls, ...uploaded.map((r: { url: string }) => r.url)];
    };

    const handleSaveItem = async () => {
        if (!formData.name || !formData.slug || !formData.sku || !formData.category || !formData.brand || !formData.basePrice) {
            error('Vui lòng điền đủ các trường bắt buộc');
            return;
        }

        setSaving(true);
        try {
            // Separate already-uploaded images from pending ones
            const existingImageUrls = formData.images.filter(img => !img.file).map(img => img.url);
            const pendingProductImages = formData.images.filter(img => img.file);

            // Build variants data with existing images only
            const variantsData = formData.variants.map(v => ({
                name: v.name,
                sku: v.sku,
                price: v.price ? Number(v.price) : null,
                stock: Number(v.stock) || 0,
                images: v.images.filter(img => !img.file).map(img => img.url),
                attributes: v.attributes.filter(a => a.key.trim() && a.value.trim()),
            }));
            const pendingVariantImages = formData.variants.map(v => ({
                images: v.images.filter(img => img.file),
                existingUrls: v.images.filter(img => !img.file).map(img => img.url),
            }));

            const specsObj = formData.specs.reduce((acc, curr) => {
                if (curr.key.trim() && curr.value.trim()) {
                    acc[curr.key.trim()] = curr.value.trim();
                }
                return acc;
            }, {} as Record<string, string>);

            // ── PHASE 1: Lưu thông tin sản phẩm (không có ảnh pending) ──
            const url = editingId ? `/api/products/${editingId}` : '/api/products';
            const method = editingId ? 'PUT' : 'POST';

            const res = await fetch(url, {
                method,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    ...formData,
                    basePrice: Number(formData.basePrice),
                    salePrice: formData.salePrice ? Number(formData.salePrice) : null,
                    costPrice: formData.costPrice ? Number(formData.costPrice) : 0,
                    stock: Number(formData.stock),
                    tags: formData.tags ? formData.tags.split(',').map((t: string) => t.trim()).filter(Boolean) : [],
                    images: existingImageUrls,
                    specs: specsObj,
                    variants: variantsData,
                    // LapLap fields
                    isUsed: formData.isUsed,
                    condition: formData.condition,
                    usedGrade: formData.usedGrade || null,
                    conditionNote: formData.conditionNote,
                    warrantyMonths: Number(formData.warrantyMonths),
                    warranty: {
                        duration: Number(formData.warrantyMonths),
                        items: formData.warrantyItems.filter(i => i.trim() !== '')
                    },
                    gift: formData.gift,
                    source: 'nexgear'
                })
            });

            const data = await res.json();
            if (!data.success) throw new Error(data.error || 'Server error');

            const savedProductId = editingId || data.data._id;
            const hasPendingUploads = pendingProductImages.length > 0 || pendingVariantImages.some(v => v.images.length > 0);


            // ── PHASE 2: Upload ảnh — ĐỢI XONG mới đóng modal ──
            if (hasPendingUploads) {
                setSaving(false);
                setUploadingImages(true);
                try {
                    // Upload product images
                    const uploadedProductUrls = await uploadPendingImages(pendingProductImages);
                    const allProductImages = [...existingImageUrls, ...uploadedProductUrls];

                    // Upload variant images
                    const updatedVariants = await Promise.all(variantsData.map(async (v, i) => {
                        const pending = pendingVariantImages[i];
                        if (pending.images.length === 0) return v;
                        const uploadedUrls = await uploadPendingImages(pending.images);
                        return { ...v, images: [...pending.existingUrls, ...uploadedUrls] };
                    }));

                    // Replace {{IMAGE_N}} placeholders in description with real URLs
                    const descWithImages = formData.description.replace(/\{\{IMAGE_(\d+)\}\}/g, (_: string, idx: string) => {
                        return allProductImages[parseInt(idx)] || '';
                    });

                    // PATCH sản phẩm với URLs thật
                    await fetch(`/api/products/${savedProductId}`, {
                        method: 'PUT',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                            images: allProductImages,
                            variants: updatedVariants,
                            ...(descWithImages !== formData.description ? { description: descWithImages } : {}),
                        }),
                    });

                    // Cleanup blob URLs
                    pendingProductImages.forEach(img => URL.revokeObjectURL(img.url));
                    pendingVariantImages.forEach(v => v.images.forEach(img => URL.revokeObjectURL(img.url)));

                    success(editingId ? 'Cập nhật sản phẩm & upload ảnh thành công' : 'Thêm sản phẩm & upload ảnh thành công');
                } catch (uploadErr: any) {
                    error(`Upload ảnh thất bại: ${uploadErr.message} — sản phẩm đã lưu nhưng thiếu ảnh`);
                } finally {
                    setUploadingImages(false);
                }
            } else {
                // Không có ảnh pending
                formData.images.forEach(img => { if (img.file) URL.revokeObjectURL(img.url); });
                formData.variants.forEach(v => v.images.forEach(img => { if (img.file) URL.revokeObjectURL(img.url); }));
                success(editingId ? 'Đã cập nhật sản phẩm' : 'Đã thêm sản phẩm');
            }

            // ── Đóng modal SAU KHI upload hoàn tất ──
            clearDraft();
            setShowModal(false);
            qc.invalidateQueries({ queryKey: ['products', 'admin'] });
        } catch (e: any) {
            error(e.message);
        } finally {
            setSaving(false);
            setUploadingImages(false);
        }
    };

    // ── Mutation: Toggle active ──
    const toggleActiveMutation = useMutation({
        mutationFn: (product: Product) =>
            fetch(`/api/products/${product._id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ isActive: !product.isActive }),
            }).then(r => r.json()),
        onSuccess: (data) => {
            if (data.success) {
                info('Đã cập nhật trạng thái');
                qc.invalidateQueries({ queryKey: ['products', 'admin'] });
            }
        },
        onError: () => error('Lỗi khi cập nhật trạng thái'),
    });

    const toggleActive = (product: Product) => toggleActiveMutation.mutate(product);

    // ── Mutation: Delete product ──
    const deleteMutation = useMutation({
        mutationFn: (id: string) =>
            fetch(`/api/products/${id}`, { method: 'DELETE' }).then(r => r.json()),
        onSuccess: (data) => {
            if (data.success) {
                success('Đã xóa sản phẩm');
                qc.invalidateQueries({ queryKey: ['products', 'admin'] });
            } else {
                error(data.error || 'Không thể xóa');
            }
        },
        onError: () => error('Lỗi khi xóa'),
    });

    const handleDelete = (id: string) => {
        if (!confirm('Bạn có chắc chắn muốn xóa sản phẩm này?')) return;
        deleteMutation.mutate(id);
    };

    const filtered = products.filter((p) => {
        const matchSearch = p.name.toLowerCase().includes(search.toLowerCase()) || p.sku.toLowerCase().includes(search.toLowerCase());
        const matchCategory = filterCategory ? (typeof p.category === 'object' ? p.category?._id : (p as any).categoryId) === filterCategory : true;
        const matchStatus = filterStatus ? (filterStatus === 'active' ? p.isActive : !p.isActive) : true;
        return matchSearch && matchCategory && matchStatus;
    });

    return (
        <>
            {/* Header */}
            <div className={styles.header}>
                <div className={styles.headerLeft}>
                    <h1>Sản phẩm</h1>
                    <div className={styles.subtitle}>{products.length} sản phẩm</div>
                </div>
                <button className={styles.addBtn} onClick={openAddModal}>
                    + THÊM SẢN PHẨM
                </button>
            </div>

            {/* Toolbar */}
            <div className={styles.toolbar}>
                <div className={styles.searchBox}>
                    <span className={styles.searchIcon}>🔍</span>
                    <input
                        type="text"
                        className={styles.searchInput}
                        placeholder="Tìm tên sản phẩm, SKU..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                    />
                </div>

                <select
                    className={styles.filterBtn}
                    value={filterCategory}
                    onChange={(e) => setFilterCategory(e.target.value)}
                >
                    <option value="">📁 Tất cả danh mục</option>
                    {groupedCategoryOptions(categories).map((o) => (
                        <option key={o.value} value={o.value}>{o.label}</option>
                    ))}
                </select>

                <select
                    className={styles.filterBtn}
                    value={filterStatus}
                    onChange={(e) => setFilterStatus(e.target.value)}
                >
                    <option value="">📊 Tất cả trạng thái</option>
                    <option value="active">Đang bán</option>
                    <option value="inactive">Đã ẩn</option>
                </select>

                <div className={styles.viewToggle}>
                    <button
                        className={`${styles.viewBtn} ${viewMode === 'list' ? styles.active : ''}`}
                        onClick={() => setViewMode('list')}
                    >
                        ☰
                    </button>
                    <button
                        className={`${styles.viewBtn} ${viewMode === 'grid' ? styles.active : ''}`}
                        onClick={() => setViewMode('grid')}
                    >
                        ▦
                    </button>
                </div>
            </div>

            {/* Products Layout */}
            {viewMode === 'list' ? (
                <div className={styles.tableWrapper}>
                    <table className={styles.table}>
                        <thead>
                            <tr>
                                <th>Sản phẩm</th>
                                <th>Danh mục</th>
                                <th>Giá</th>
                                <th>Tồn kho</th>
                                <th>Trạng thái</th>
                                <th></th>
                            </tr>
                        </thead>
                        <tbody>
                            {productsLoading ? (
                                <tr><td colSpan={6} style={{ textAlign: 'center', padding: '20px' }}>Đang tải dữ liệu...</td></tr>
                            ) : filtered.length === 0 ? (
                                <tr><td colSpan={6} style={{ textAlign: 'center', padding: '20px' }}>Không tìm thấy sản phẩm nào</td></tr>
                            ) : (
                                filtered.map((product) => (
                                    <tr key={product._id}>
                                        <td>
                                            <div className={styles.productCell}>
                                                <div className={styles.productImage}>
                                                    {product.images?.[0] ? <LazyImage src={product.images[0]} alt="" fill objectFit="cover" /> : '📦'}
                                                </div>
                                                <div className={styles.productInfo}>
                                                    <div className={styles.productName}>{product.name}</div>
                                                    <div className={styles.productSku}>
                                                        {product.brand?.name ? `${product.brand.name} — ` : ''}{product.sku}
                                                    </div>
                                                </div>
                                            </div>
                                        </td>
                                        <td>
                                            <span className={styles.productCategory}>{product.category?.name || '---'}</span>
                                        </td>
                                        <td>
                                            <span className={styles.price}>
                                                {new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(product.basePrice)}
                                            </span>
                                        </td>
                                        <td>
                                            <span className={`${styles.stock} ${product.stock === 0 ? styles.outOfStock : product.stock <= 5 ? styles.low : styles.inStock}`}>
                                                {product.stock === 0 ? 'Hết hàng' : product.stock}
                                            </span>
                                        </td>
                                        <td>
                                            <div className={styles.statusToggle}>
                                                <div
                                                    className={`${styles.toggleSwitch} ${product.isActive ? styles.on : ''}`}
                                                    onClick={() => toggleActive(product)}
                                                >
                                                    <div className={styles.toggleKnob} />
                                                </div>
                                                <span className={`${styles.statusText} ${product.isActive ? styles.active : ''}`}>
                                                    {product.isActive ? 'Active' : 'Off'}
                                                </span>
                                            </div>
                                        </td>
                                        <td>
                                            <div className={styles.rowActions}>
                                                <button className={styles.rowActionBtn} title="Chỉnh sửa" onClick={() => openEditModal(product)}>✏️</button>
                                                <button className={`${styles.rowActionBtn} ${styles.danger}`} title="Xóa" onClick={() => handleDelete(product._id)}>🗑️</button>
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            ) : (
                <div className={styles.gridWrapper}>
                    {loading ? (
                        <div style={{ textAlign: 'center', padding: '20px', gridColumn: '1 / -1' }}>Đang tải dữ liệu...</div>
                    ) : filtered.length === 0 ? (
                        <div style={{ textAlign: 'center', padding: '20px', gridColumn: '1 / -1' }}>Không tìm thấy sản phẩm nào</div>
                    ) : (
                        filtered.map((product) => (
                            <div key={product._id} className={styles.gridCard}>
                                <div className={styles.gridImage}>
                                    {product.images?.[0] ? <LazyImage src={product.images[0]} alt="" fill objectFit="cover" /> : '📦'}
                                </div>
                                <div className={styles.gridInfo}>
                                    <div className={styles.productName}>{product.name}</div>
                                    <div className={styles.productSku}>
                                        {product.brand?.name ? `${product.brand.name} — ` : ''}{product.sku}
                                    </div>
                                    <div className={styles.price}>
                                        {new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(product.basePrice)}
                                    </div>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '12px' }}>
                                        <span className={`${styles.stock} ${product.stock === 0 ? styles.outOfStock : product.stock <= 5 ? styles.low : styles.inStock}`}>
                                            {product.stock === 0 ? 'Hết hàng' : `Kho: ${product.stock}`}
                                        </span>
                                        <div className={styles.rowActions}>
                                            <div
                                                className={`${styles.toggleSwitch} ${product.isActive ? styles.on : ''}`}
                                                onClick={() => toggleActive(product)}
                                            >
                                                <div className={styles.toggleKnob} />
                                            </div>
                                            <button className={styles.rowActionBtn} title="Chỉnh sửa" onClick={() => openEditModal(product)}>✏️</button>
                                            <button className={`${styles.rowActionBtn} ${styles.danger}`} title="Xóa" onClick={() => handleDelete(product._id)}>🗑️</button>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ))
                    )}
                </div>
            )}

            {/* Add/Edit Product Modal */}
            {showModal && (
                <div className={styles.modalOverlay}>
                    <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
                        <div className={styles.modalHeader}>
                            <span className={styles.modalTitle}>{editingId ? 'Chỉnh sửa sản phẩm' : 'Thêm sản phẩm mới'}</span>
                            <button className={styles.modalClose} onClick={() => setShowModal(false)}>✕</button>
                        </div>
                        <div className={styles.modalBody}>

                            {/* Draft Restore */}
                            {!editingId && hasDraft && (
                                <div style={{ background: 'rgba(240,165,0,0.08)', border: '1px dashed rgba(240,165,0,0.4)', borderRadius: '8px', padding: '10px 14px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '10px' }}>
                                    <span style={{ fontSize: '13px', color: 'var(--ink2)' }}>📝 Có bản nháp chưa lưu từ lần trước</span>
                                    <div style={{ display: 'flex', gap: '6px' }}>
                                        <button type="button" onClick={loadDraft} style={{ padding: '5px 12px', background: '#F0A500', color: '#000', border: 'none', borderRadius: '4px', cursor: 'pointer', fontSize: '11px', fontWeight: 700 }}>KHÔI PHỤC</button>
                                        <button type="button" onClick={clearDraft} style={{ padding: '5px 12px', background: 'transparent', color: 'var(--ink3)', border: '1px solid rgba(0,0,0,0.1)', borderRadius: '4px', cursor: 'pointer', fontSize: '11px' }}>Bỏ qua</button>
                                    </div>
                                </div>
                            )}

                            {/* AI Quick Fill */}
                            <div className={styles.formGroup} style={{ background: 'rgba(0,196,173,0.05)', border: '1px dashed rgba(0,196,173,0.3)', borderRadius: '8px', padding: '12px' }}>
                                <label className={styles.formLabel} style={{ color: '#00C4AD', display: 'flex', alignItems: 'center', gap: '6px' }}>
                                    🤖 AI Quick Fill — Dán mô tả sản phẩm để tự động điền form
                                </label>
                                <textarea
                                    className={styles.formTextarea}
                                    value={aiText}
                                    onChange={(e) => setAiText(e.target.value)}
                                    placeholder={"Dán mô tả sản phẩm vào đây...\nVD: Laptop Dell Latitude 5420 i5-1145G7 RAM 16GB SSD 512GB 14inch FHD giá 8tr5\nHoặc: Chuột Logitech G Pro X Superlight 2 wireless 60g sensor Hero 2 giá 2tr290"}
                                    rows={3}
                                    style={{ fontSize: '12px' }}
                                />
                                <button
                                    type="button"
                                    onClick={handleAiQuickFill}
                                    disabled={aiParsing || !aiText.trim()}
                                    style={{
                                        marginTop: '8px', padding: '8px 16px',
                                        background: aiParsing ? '#666' : 'linear-gradient(135deg, #00C4AD, #00A896)',
                                        color: '#fff', border: 'none', borderRadius: '4px',
                                        cursor: aiParsing ? 'wait' : 'pointer',
                                        fontFamily: 'var(--font-display, monospace)',
                                        fontSize: '11px', fontWeight: 700, letterSpacing: '0.05em',
                                    }}
                                >
                                    {aiParsing ? '⏳ Đang phân tích...' : '✨ PHÂN TÍCH & ĐIỀN FORM'}
                                </button>
                            </div>

                            {/* Section 1: Thông tin cơ bản */}
                            <div className={styles.formRow}>
                                <div className={styles.formGroup}>
                                    <label className={styles.formLabel}>Tên sản phẩm *</label>
                                    <input type="text" name="name" className={styles.formInput} value={formData.name} onChange={handleInputChange} placeholder="VD: Akko 3068B Plus" />
                                </div>
                                <div className={styles.formGroup}>
                                    <label className={styles.formLabel}>Mã SKU *</label>
                                    <input type="text" name="sku" className={styles.formInput} value={formData.sku} onChange={handleInputChange} placeholder="VD: NGR-AKK-100" />
                                </div>
                            </div>

                            <div className={styles.formRow}>
                                <div className={styles.formGroup}>
                                    <label className={styles.formLabel}>Slug *</label>
                                    <input type="text" name="slug" className={styles.formInput} value={formData.slug} onChange={handleInputChange} placeholder="vd: akko-3068b-plus" />
                                </div>
                                <div className={styles.formGroup}>
                                    <label className={styles.formLabel}>Tags (cách bởi dấu phẩy)</label>
                                    <input type="text" name="tags" className={styles.formInput} value={formData.tags} onChange={handleInputChange} placeholder="sale, hot, new" />
                                </div>
                            </div>

                            <div className={styles.formRow}>
                                <div className={styles.formGroup}>
                                    <label className={styles.formLabel}>Danh mục *</label>
                                    <SearchableSelect
                                        options={[{ label: '-- Chọn danh mục --', value: '' }, ...groupedCategoryOptions(categories)]}
                                        value={formData.category}
                                        onChange={(val) => setFormData(p => ({ ...p, category: val }))}
                                        placeholder="-- Chọn danh mục --"
                                    />
                                </div>
                                <div className={styles.formGroup}>
                                    <label className={styles.formLabel}>Thương hiệu *</label>
                                    <SearchableSelect
                                        options={[{ label: '-- Chọn thương hiệu --', value: '' }, ...brands.map(b => ({ label: b.name, value: b._id }))]}
                                        value={formData.brand}
                                        onChange={(val) => setFormData(p => ({ ...p, brand: val }))}
                                        placeholder="-- Chọn thương hiệu --"
                                    />
                                </div>
                            </div>

                            {/* Section 2: Giá & Kho */}
                            <div className={styles.formRow} style={{ borderTop: '1px dashed rgba(255,255,255,0.1)', paddingTop: '16px' }}>
                                <div className={styles.formGroup}>
                                    <label className={styles.formLabel}>Giá vốn (Cost Price — chỉ Admin)</label>
                                    <input type="text" name="costPrice" className={styles.formInput} value={formData.costPrice} onChange={handleInputChange} onBlur={() => handlePriceBlur('costPrice')} placeholder="VD: 7tr5, 10000000" />
                                    {formData.costPrice && <span style={{ fontSize: '11px', color: 'var(--ink3)', marginTop: '4px', display: 'block' }}>{formatVND(formData.costPrice)}</span>}
                                </div>
                                <div className={styles.formGroup}>
                                    <label className={styles.formLabel}>Số lượng tồn kho</label>
                                    <input type="number" name="stock" className={styles.formInput} value={formData.stock} onChange={handleInputChange} placeholder="0" />
                                </div>
                            </div>

                            <div className={styles.formRow}>
                                <div className={styles.formGroup}>
                                    <label className={styles.formLabel}>Giá bán chung (Base Price VNĐ) *</label>
                                    <input type="text" name="basePrice" className={styles.formInput} value={formData.basePrice} onChange={handleInputChange} onBlur={() => handlePriceBlur('basePrice')} placeholder="VD: 1290000, 9tr8..." />
                                    {formData.basePrice && <span style={{ fontSize: '12px', color: 'var(--accent, #00e5ff)', marginTop: '4px', display: 'block' }}>{formatVND(formData.basePrice)}</span>}
                                </div>
                                <div className={styles.formGroup}>
                                    <label className={styles.formLabel}>Giá khuyến mãi (VNĐ)</label>
                                    <input type="text" name="salePrice" className={styles.formInput} value={formData.salePrice} onChange={handleInputChange} onBlur={() => handlePriceBlur('salePrice')} placeholder="VD: 990k, 1tr5..." />
                                    {formData.salePrice && <span style={{ fontSize: '12px', color: '#ff5252', marginTop: '4px', display: 'block' }}>{formatVND(formData.salePrice)}</span>}
                                </div>
                            </div>

                            {/* Section 3: Thuộc tính & Trạng thái */}
                            <div className={styles.formRow}>
                                <div className={styles.formGroup}>
                                    <label className={styles.formLabel} style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
                                        <input type="checkbox" checked={formData.isFeatured} onChange={(e) => setFormData(prev => ({ ...prev, isFeatured: e.target.checked }))} />
                                        Sản phẩm nổi bật (Trang chủ)
                                    </label>
                                </div>
                                <div className={styles.formGroup}>
                                    <label className={styles.formLabel} style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
                                        <input type="checkbox" checked={formData.isUsed} onChange={(e) => setFormData(prev => ({ ...prev, isUsed: e.target.checked }))} />
                                        Hàng đã qua sử dụng
                                    </label>
                                </div>
                            </div>

                            {/* Condition fields for used products */}
                            {formData.isUsed && (
                                <div style={{ background: 'rgba(240,165,0,0.05)', border: '1px solid rgba(240,165,0,0.2)', borderRadius: '8px', padding: '16px', marginBottom: '16px' }}>
                                    <div className={styles.formRow}>
                                        <div className={styles.formGroup}>
                                            <label className={styles.formLabel}>Tình trạng</label>
                                            <select name="condition" className={styles.formInput} value={formData.condition} onChange={handleInputChange}>
                                                <option value="like_new">Như mới (Like new)</option>
                                                <option value="used">Đã sử dụng</option>
                                                <option value="refurbished">Tân trang (Refurbished)</option>
                                            </select>
                                        </div>
                                        <div className={styles.formGroup}>
                                            <label className={styles.formLabel}>Phân loại ngoại hình</label>
                                            <select name="usedGrade" className={styles.formInput} value={formData.usedGrade} onChange={handleInputChange}>
                                                <option value="">-- Không phân loại --</option>
                                                <option value="A">Loại A (Đẹp 99%)</option>
                                                <option value="B">Loại B (Trầy xước nhẹ)</option>
                                                <option value="C">Loại C (Móp/Trầy nhiều)</option>
                                            </select>
                                        </div>
                                    </div>
                                    <div className={styles.formGroup}>
                                        <label className={styles.formLabel}>Ghi chú chi tiết tình trạng</label>
                                        <textarea name="conditionNote" className={styles.formTextarea} value={formData.conditionNote} onChange={handleInputChange} placeholder="VD: Màn hình không xước, pin còn 90%..." rows={2} />
                                    </div>
                                </div>
                            )}

                            {/* Section 4: Bảo hành & Quà tặng */}
                            <div className={styles.formRow} style={{ borderTop: '1px solid rgba(12,12,12,0.1)', paddingTop: '16px' }}>
                                <div className={styles.formGroup}>
                                    <label className={styles.formLabel}>Số tháng bảo hành</label>
                                    <select
                                        name="warrantyMonths"
                                        className={styles.formInput}
                                        value={formData.warrantyMonths}
                                        onChange={(e) => {
                                            const newMonths = Number(e.target.value);
                                            setFormData(prev => {
                                                // Cập nhật dòng đầu tiên của warrantyItems để khớp
                                                const newItems = [...prev.warrantyItems];
                                                const firstLine = newMonths === 0
                                                    ? 'Không bảo hành'
                                                    : `Bảo hành ${newMonths} tháng chính hãng`;
                                                newItems[0] = firstLine;
                                                return { ...prev, warrantyMonths: e.target.value, warrantyItems: newItems };
                                            });
                                        }}
                                    >
                                        {[0, 1, 3, 6, 12, 24, 36].map(m => (
                                            <option key={m} value={m}>{m === 0 ? 'Không bảo hành' : `${m} tháng`}</option>
                                        ))}
                                    </select>

                                    <div style={{ marginTop: '12px' }}>
                                        <label className={styles.formLabel} style={{ fontSize: '11px' }}>Chi tiết bảo hành</label>
                                        {formData.warrantyItems.map((item, i) => (
                                            <div key={i} style={{ display: 'flex', gap: '4px', marginBottom: '4px' }}>
                                                <input
                                                    type="text"
                                                    className={styles.formInput}
                                                    style={{ fontSize: '12px', padding: '4px 8px' }}
                                                    value={item}
                                                    onChange={(e) => {
                                                        const newItems = [...formData.warrantyItems];
                                                        newItems[i] = e.target.value;
                                                        setFormData(prev => ({ ...prev, warrantyItems: newItems }));
                                                    }}
                                                />
                                                <button type="button" onClick={() => setFormData(prev => ({ ...prev, warrantyItems: prev.warrantyItems.filter((_, idx) => idx !== i) }))} style={{ background: 'none', border: 'none', color: '#ff5252', cursor: 'pointer' }}>✕</button>
                                            </div>
                                        ))}
                                        <button type="button" onClick={() => setFormData(prev => ({ ...prev, warrantyItems: [...prev.warrantyItems, ''] }))} style={{ background: 'none', border: 'none', color: '#00f0ff', fontSize: '11px', cursor: 'pointer' }}>+ Thêm dòng</button>
                                    </div>
                                </div>
                                <div className={styles.formGroup}>
                                    <label className={styles.formLabel}>Quà tặng kèm</label>
                                    <textarea name="gift" className={styles.formTextarea} value={formData.gift} onChange={handleInputChange} placeholder="VD: Túi chống sốc, Chuột..." rows={4} />
                                </div>
                            </div>

                            {/* Section 5: Hình ảnh & Mô tả */}
                            <div className={styles.formGroup} style={{ borderTop: '1px solid rgba(12,12,12,0.1)', paddingTop: '16px' }}>
                                <label className={styles.formLabel}>Hình ảnh sản phẩm</label>
                                <div
                                    onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
                                    onDragLeave={() => setDragOver(false)}
                                    onDrop={handleImageDrop}
                                    style={{
                                        border: dragOver ? '2px dashed #00C4AD' : '2px dashed transparent',
                                        borderRadius: '8px',
                                        padding: '8px',
                                        background: dragOver ? 'rgba(0,196,173,0.05)' : 'transparent',
                                        transition: 'all 0.2s',
                                    }}
                                >
                                    <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginBottom: '8px' }}>
                                        {formData.images.map((img, i) => (
                                            <div key={i} style={{ position: 'relative', width: '80px', height: '80px', border: img.file ? '2px solid #F0B100' : '1px solid #333', borderRadius: '4px', overflow: 'hidden' }}>
                                                <LazyImage src={img.url} alt={`Preview ${i}`} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                                {img.file && <span style={{ position: 'absolute', bottom: '2px', left: '2px', background: '#F0B100', color: '#000', fontSize: '8px', padding: '1px 4px', borderRadius: '2px', fontWeight: 700 }}>MỚI</span>}
                                                <button
                                                    onClick={() => removeImage(i)}
                                                    style={{ position: 'absolute', top: '2px', right: '2px', background: 'rgba(0,0,0,0.5)', color: '#fff', border: 'none', borderRadius: '50%', width: '20px', height: '20px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '10px' }}
                                                >✕</button>
                                            </div>
                                        ))}
                                    </div>
                                    <label className={styles.imageUpload}>
                                        <input type="file" style={{ display: 'none' }} onChange={handleImageSelect} accept="image/*" multiple />
                                        <span className={styles.uploadIcon}>📷</span>
                                        <span className={styles.uploadText}>{dragOver ? 'Thả ảnh vào đây...' : 'Chọn hoặc kéo thả ảnh vào đây'}</span>
                                    </label>
                                </div>
                            </div>

                            <div className={styles.formGroup}>
                                <label className={styles.formLabel}>Mô tả chi tiết</label>
                                <textarea name="description" className={styles.formTextarea} value={formData.description} onChange={handleInputChange} placeholder="Mô tả chi tiết sản phẩm..." rows={5} />
                            </div>

                            {/* Specs */}
                            <div className={styles.formGroup}>
                                <div className={styles.variantsHeader}>
                                    <label className={styles.formLabel}>Thông số kỹ thuật (Dùng cho tính năng So Sánh)</label>
                                    <div style={{ display: 'flex', gap: '8px' }}>
                                        {(() => {
                                            const selectedCat = categories.find(c => c._id === formData.category);
                                            const presetKeys = selectedCat ? getSpecKeysForCategory(selectedCat.name) : [];
                                            if (presetKeys.length > 0) {
                                                const existingKeys = new Set(formData.specs.map(s => s.key));
                                                const missing = presetKeys.filter(p => !existingKeys.has(p.key));
                                                if (missing.length > 0) {
                                                    return (
                                                        <button type="button" className={styles.addVariantBtn} onClick={() => {
                                                            setFormData(p => ({
                                                                ...p,
                                                                specs: [...p.specs, ...missing.map(m => ({ key: m.key, value: '' }))]
                                                            }));
                                                        }}>+ Thêm tất cả thông số chuẩn ({missing.length})</button>
                                                    );
                                                }
                                            }
                                            return null;
                                        })()}
                                        <button type="button" className={styles.addVariantBtn} onClick={() => setFormData(p => ({ ...p, specs: [...p.specs, { key: '', value: '' }] }))}>+ Thêm thông số tùy chỉnh</button>
                                    </div>
                                </div>
                                {formData.specs.length === 0 && (
                                    <p className={styles.variantsEmpty}>Chưa có thông số kỹ thuật. {categories.find(c => c._id === formData.category) && getSpecKeysForCategory(categories.find(c => c._id === formData.category)!.name).length > 0 ? 'Nhấn "Thêm tất cả thông số chuẩn" để thêm nhanh.' : ''}</p>
                                )}
                                {formData.specs.map((spec, si) => {
                                    const selectedCat = categories.find(c => c._id === formData.category);
                                    const presetKeys = selectedCat ? getSpecKeysForCategory(selectedCat.name) : [];
                                    const presetDef = presetKeys.find(p => p.key === spec.key);
                                    const usedKeys = new Set(formData.specs.map((s, i) => i !== si ? s.key : ''));
                                    const availablePresets = presetKeys.filter(p => !usedKeys.has(p.key));

                                    return (
                                        <div key={si} style={{ display: 'flex', gap: '8px', marginBottom: '8px' }}>
                                            {availablePresets.length > 0 ? (
                                                <SpecKeyCombobox
                                                    value={spec.key}
                                                    options={availablePresets}
                                                    customKeys={spec.key && !presetKeys.find(p => p.key === spec.key) ? [spec.key] : []}
                                                    onChange={(key) => {
                                                        const newSpecs = [...formData.specs];
                                                        newSpecs[si].key = key;
                                                        setFormData({ ...formData, specs: newSpecs });
                                                    }}
                                                    className={styles.formInput}
                                                />
                                            ) : (
                                                <input type="text" className={styles.formInput} value={spec.key} onChange={(e) => {
                                                    const newSpecs = [...formData.specs];
                                                    newSpecs[si].key = e.target.value;
                                                    setFormData({ ...formData, specs: newSpecs });
                                                }} placeholder="Tên thông số" style={{ flex: 1 }} />
                                            )}
                                            <input type="text" className={styles.formInput} value={spec.value} onChange={(e) => {
                                                const newSpecs = [...formData.specs];
                                                newSpecs[si].value = e.target.value;
                                                setFormData({ ...formData, specs: newSpecs });
                                            }} placeholder={presetDef?.placeholder || "Giá trị"} style={{ flex: 2 }} />
                                            <button type="button" onClick={() => {
                                                const newSpecs = [...formData.specs];
                                                newSpecs.splice(si, 1);
                                                setFormData({ ...formData, specs: newSpecs });
                                            }} style={{ background: 'rgba(240, 53, 106, 0.1)', color: '#F0356A', border: '1px solid currentColor', width: '40px', borderRadius: '4px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>✕</button>
                                        </div>
                                    );
                                })}
                            </div>

                            {/* Variants */}
                            <div className={styles.formGroup}>
                                <div className={styles.variantsHeader}>
                                    <label className={styles.formLabel}>Biến thể sản phẩm</label>
                                    <button type="button" className={styles.addVariantBtn} onClick={addVariant}>+ Thêm biến thể</button>
                                </div>
                                {formData.variants.length === 0 && (
                                    <p className={styles.variantsEmpty}>Chưa có biến thể. Thêm biến thể nếu sản phẩm có nhiều phiên bản (màu sắc, switch, size...)</p>
                                )}
                                {formData.variants.map((variant, vi) => (
                                    <div key={vi} className={styles.variantCard}>
                                        <div className={styles.variantCardHeader}>
                                            <span className={styles.variantIndex}>#{vi + 1}</span>
                                            <button type="button" className={styles.variantRemoveBtn} onClick={() => removeVariant(vi)}>✕ Xóa</button>
                                        </div>
                                        <div className={styles.formRow}>
                                            <div className={styles.formGroup}>
                                                <label className={styles.formLabel}>Tên biến thể *</label>
                                                <input type="text" className={styles.formInput} value={variant.name} onChange={(e) => updateVariant(vi, 'name', e.target.value)} placeholder="VD: Đen - Red Switch" />
                                            </div>
                                            <div className={styles.formGroup}>
                                                <label className={styles.formLabel}>SKU biến thể</label>
                                                <input type="text" className={styles.formInput} value={variant.sku} onChange={(e) => updateVariant(vi, 'sku', e.target.value)} placeholder="VD: NGR-AKK-100-BLK-RED" />
                                            </div>
                                        </div>
                                        <div className={styles.formRow}>
                                            <div className={styles.formGroup}>
                                                <label className={styles.formLabel}>Giá riêng (VNĐ) — trống = dùng giá chung</label>
                                                <input type="text" className={styles.formInput} value={variant.price} onChange={(e) => updateVariant(vi, 'price', e.target.value)} onBlur={() => handleVariantPriceBlur(vi)} placeholder="VD: 9tr8, 890k (trống = giá chung)" />
                                                {variant.price && <span style={{ fontSize: '12px', color: 'var(--accent, #00e5ff)', marginTop: '4px', display: 'block' }}>{formatVND(variant.price)}</span>}
                                            </div>
                                            <div className={styles.formGroup}>
                                                <label className={styles.formLabel}>Tồn kho biến thể</label>
                                                <input type="number" className={styles.formInput} value={variant.stock} onChange={(e) => updateVariant(vi, 'stock', e.target.value)} placeholder="0" />
                                            </div>
                                        </div>
                                        {/* Variant attributes */}
                                        <div className={styles.formGroup}>
                                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                                                <label className={styles.formLabel} style={{ margin: 0 }}>Thuộc tính (RAM, SSD, CPU, Màu...)</label>
                                                <button type="button" className={styles.addVariantBtn} style={{ fontSize: '11px', padding: '2px 8px' }} onClick={() => {
                                                    setFormData(prev => ({
                                                        ...prev,
                                                        variants: prev.variants.map((v, i) => i === vi ? { ...v, attributes: [...v.attributes, { key: '', value: '' }] } : v)
                                                    }));
                                                }}>+ Thuộc tính</button>
                                            </div>
                                            {variant.attributes.map((attr, ai) => (
                                                <div key={ai} style={{ display: 'flex', gap: '6px', marginBottom: '4px' }}>
                                                    <input type="text" className={styles.formInput} value={attr.key} onChange={(e) => {
                                                        setFormData(prev => ({
                                                            ...prev,
                                                            variants: prev.variants.map((v, i) => i === vi ? {
                                                                ...v,
                                                                attributes: v.attributes.map((a, j) => j === ai ? { ...a, key: e.target.value } : a)
                                                            } : v)
                                                        }));
                                                    }} placeholder="VD: RAM" style={{ flex: 1 }} />
                                                    <input type="text" className={styles.formInput} value={attr.value} onChange={(e) => {
                                                        setFormData(prev => ({
                                                            ...prev,
                                                            variants: prev.variants.map((v, i) => i === vi ? {
                                                                ...v,
                                                                attributes: v.attributes.map((a, j) => j === ai ? { ...a, value: e.target.value } : a)
                                                            } : v)
                                                        }));
                                                    }} placeholder="VD: 16GB DDR5" style={{ flex: 2 }} />
                                                    <button type="button" onClick={() => {
                                                        setFormData(prev => ({
                                                            ...prev,
                                                            variants: prev.variants.map((v, i) => i === vi ? {
                                                                ...v,
                                                                attributes: v.attributes.filter((_, j) => j !== ai)
                                                            } : v)
                                                        }));
                                                    }} style={{ background: 'rgba(240, 53, 106, 0.1)', color: '#F0356A', border: '1px solid currentColor', width: '32px', minWidth: '32px', borderRadius: '4px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '10px' }}>✕</button>
                                                </div>
                                            ))}
                                        </div>

                                        {/* Variant images */}
                                        <div className={styles.formGroup}>
                                            <label className={styles.formLabel}>Ảnh biến thể</label>
                                            <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', marginBottom: '6px' }}>
                                                {variant.images.map((img, ii) => (
                                                    <div key={ii} style={{ position: 'relative', width: '56px', height: '56px', border: img.file ? '2px solid #F0B100' : '1px solid #333', borderRadius: '4px', overflow: 'hidden' }}>
                                                        <LazyImage src={img.url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                                        {img.file && <span style={{ position: 'absolute', bottom: '1px', left: '1px', background: '#F0B100', color: '#000', fontSize: '7px', padding: '0 3px', borderRadius: '2px', fontWeight: 700 }}>MỚI</span>}
                                                        <button onClick={() => removeVariantImage(vi, ii)} style={{ position: 'absolute', top: '1px', right: '1px', background: 'rgba(0,0,0,0.5)', color: '#fff', border: 'none', borderRadius: '50%', width: '16px', height: '16px', cursor: 'pointer', fontSize: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>✕</button>
                                                    </div>
                                                ))}
                                            </div>
                                            <label className={styles.variantUploadBtn}>
                                                <input type="file" style={{ display: 'none' }} onChange={(e) => handleVariantImageSelect(vi, e)} accept="image/*" multiple />
                                                📷 Thêm ảnh
                                            </label>
                                        </div>
                                    </div>
                                ))}
                            </div>

                        </div>
                        <div className={styles.modalFooter}>
                            <button className={styles.cancelBtn} onClick={() => setShowModal(false)} disabled={saving || uploadingImages}>HỦY</button>
                            <button className={styles.saveBtn} onClick={handleSaveItem} disabled={saving || uploadingImages}>
                                {uploadingImages
                                    ? '⬆️ Đang upload ảnh...'
                                    : saving
                                        ? '⏳ Đang lưu...'
                                        : `💾 ${editingId ? 'CẬP NHẬT' : 'LƯU SẢN PHẨM'}`
                                }
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
}
