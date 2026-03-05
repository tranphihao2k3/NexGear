'use client';

import { useState, useEffect } from 'react';
import styles from './page.module.scss';
import { useToast } from '@/components/ui';

interface Category {
    _id: string;
    name: string;
}

interface Brand {
    _id: string;
    name: string;
}

interface ImageItem {
    url: string;       // blob URL (local preview) or cloudinary URL
    file?: File;       // pending file to upload (undefined = already on cloud)
    public_id?: string; // cloudinary public_id (for deletion)
}

interface Variant {
    name: string;
    sku: string;
    price: string;
    stock: string;
    images: ImageItem[];
}

interface Product {
    _id: string;
    name: string;
    slug: string;
    sku: string;
    category: Category;
    brand: Brand;
    basePrice: number;
    stock: number;
    isActive: boolean;
    images: string[];
    variants?: Variant[];
}

export default function AdminProductsPage() {
    const { success, error, info } = useToast();

    const [products, setProducts] = useState<Product[]>([]);
    const [categories, setCategories] = useState<Category[]>([]);
    const [brands, setBrands] = useState<Brand[]>([]);

    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');

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
        stock: '',
        description: '',
        images: [] as ImageItem[],
        tags: '' as string,
        isFeatured: false,
        variants: [] as Variant[],
    });
    const [saving, setSaving] = useState(false);

    const fetchProducts = async () => {
        try {
            const res = await fetch('/api/products?limit=50&admin=true');
            const json = await res.json();
            if (json.success) setProducts(json.data);
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    };

    const fetchDependencies = async () => {
        try {
            const [catRes, brandRes] = await Promise.all([
                fetch('/api/categories?limit=100'),
                fetch('/api/brands?limit=100')
            ]);
            const catJson = await catRes.json();
            const brandJson = await brandRes.json();

            if (catJson.success) setCategories(catJson.data);
            if (brandJson.success) setBrands(brandJson.data);
        } catch (e) {
            console.error(e);
        }
    };

    useEffect(() => {
        fetchProducts();
        fetchDependencies();
    }, []);

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setFormData((prev) => ({
            ...prev,
            [name]: value,
            // Auto-generate slug and SKU from name if empty and typing name
            ...(name === 'name' && !editingId
                ? {
                    slug: value.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, ''),
                    sku: 'NGR-' + value.toUpperCase().replace(/[^A-Z0-9]+/g, '').substring(0, 6) + '-' + Math.floor(Math.random() * 1000)
                }
                : {})
        }));
    };

    const openAddModal = () => {
        setEditingId(null);
        setFormData({
            name: '', slug: '', sku: '', category: categories[0]?._id || '', brand: brands[0]?._id || '', basePrice: '', salePrice: '', stock: '0', description: '', images: [], tags: '', isFeatured: false, variants: [],
        });
        setShowModal(true);
    };

    const urlToImageItem = (url: string): ImageItem => ({
        url,
        public_id: extractPublicId(url),
    });

    const extractPublicId = (url: string): string | undefined => {
        // Extract public_id from cloudinary URL: .../upload/v123/nexgear/products/abc.jpg
        const match = url.match(/\/upload\/(?:v\d+\/)?(nexgear\/.+)\.\w+$/);
        return match ? match[1] : undefined;
    };

    const openEditModal = (product: Product) => {
        setEditingId(product._id);
        setFormData({
            name: product.name,
            slug: product.slug,
            sku: product.sku,
            category: product.category._id,
            brand: product.brand._id,
            basePrice: product.basePrice.toString(),
            salePrice: (product as any).salePrice?.toString() || '',
            stock: product.stock.toString(),
            description: (product as any).description || '',
            images: (product.images || []).map(urlToImageItem),
            tags: ((product as any).tags || []).join(', '),
            isFeatured: (product as any).isFeatured || false,
            variants: ((product as any).variants || []).map((v: any) => ({
                name: v.name || '',
                sku: v.sku || '',
                price: v.price?.toString() || '',
                stock: v.stock?.toString() || '0',
                images: (v.images || []).map(urlToImageItem),
            })),
        });
        setShowModal(true);
    };

    // Add image as local preview (no upload yet)
    const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (!e.target.files || e.target.files.length === 0) return;
        const file = e.target.files[0];
        const blobUrl = URL.createObjectURL(file);
        setFormData(prev => ({
            ...prev,
            images: [...prev.images, { url: blobUrl, file }]
        }));
        e.target.value = '';
    };

    // Remove image — if already on Cloudinary, delete from cloud too
    const removeImage = async (index: number) => {
        const img = formData.images[index];
        if (img.public_id) {
            try {
                await fetch('/api/upload', {
                    method: 'DELETE',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ public_id: img.public_id }),
                });
            } catch (e) {
                console.error('Failed to delete from Cloudinary:', e);
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
            variants: [...prev.variants, { name: '', sku: '', price: '', stock: '0', images: [] }]
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
        const file = e.target.files[0];
        const blobUrl = URL.createObjectURL(file);
        setFormData(prev => ({
            ...prev,
            variants: prev.variants.map((v, i) => i === index ? { ...v, images: [...v.images, { url: blobUrl, file }] } : v)
        }));
        e.target.value = '';
    };

    // Remove variant image — delete from cloud if needed
    const removeVariantImage = async (variantIndex: number, imgIndex: number) => {
        const img = formData.variants[variantIndex].images[imgIndex];
        if (img.public_id) {
            try {
                await fetch('/api/upload', {
                    method: 'DELETE',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ public_id: img.public_id }),
                });
            } catch (e) {
                console.error('Failed to delete from Cloudinary:', e);
            }
        }
        if (img.file) URL.revokeObjectURL(img.url);
        setFormData(prev => ({
            ...prev,
            variants: prev.variants.map((v, i) => i === variantIndex ? { ...v, images: v.images.filter((_, j) => j !== imgIndex) } : v)
        }));
    };

    // Upload a single file to Cloudinary, return URL string
    const uploadFileToCloud = async (file: File): Promise<string> => {
        const fd = new FormData();
        fd.append('file', file);
        const res = await fetch('/api/upload', { method: 'POST', body: fd });
        const text = await res.text();
        if (!text) throw new Error('Cloudinary trả về rỗng');
        const json = JSON.parse(text);
        if (!json.success) throw new Error(json.error || 'Upload thất bại');
        return json.data.url;
    };

    // Upload all pending images in an ImageItem array, return string[] of URLs
    const uploadPendingImages = async (items: ImageItem[]): Promise<string[]> => {
        const urls: string[] = [];
        for (const item of items) {
            if (item.file) {
                const url = await uploadFileToCloud(item.file);
                urls.push(url);
            } else {
                urls.push(item.url);
            }
        }
        return urls;
    };

    const handleSaveItem = async () => {
        if (!formData.name || !formData.slug || !formData.sku || !formData.category || !formData.brand || !formData.basePrice) {
            error('Vui lòng điền đủ các trường bắt buộc');
            return;
        }

        setSaving(true);
        try {
            // Upload all pending product images
            const imageUrls = await uploadPendingImages(formData.images);

            // Upload all pending variant images
            const variantsData = [];
            for (const v of formData.variants) {
                const vImageUrls = await uploadPendingImages(v.images);
                variantsData.push({
                    name: v.name,
                    sku: v.sku,
                    price: v.price ? Number(v.price) : null,
                    stock: Number(v.stock) || 0,
                    images: vImageUrls,
                });
            }

            const url = editingId ? `/api/products/${editingId}` : '/api/products';
            const method = editingId ? 'PUT' : 'POST';

            const res = await fetch(url, {
                method,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    ...formData,
                    basePrice: Number(formData.basePrice),
                    salePrice: formData.salePrice ? Number(formData.salePrice) : null,
                    stock: Number(formData.stock),
                    tags: formData.tags ? formData.tags.split(',').map((t: string) => t.trim()).filter(Boolean) : [],
                    images: imageUrls,
                    variants: variantsData,
                })
            });

            const data = await res.json();
            if (!data.success) throw new Error(data.error || 'Server error');

            // Cleanup blob URLs
            formData.images.forEach(img => { if (img.file) URL.revokeObjectURL(img.url); });
            formData.variants.forEach(v => v.images.forEach(img => { if (img.file) URL.revokeObjectURL(img.url); }));

            success(editingId ? 'Đã cập nhật sản phẩm' : 'Đã thêm sản phẩm');
            setShowModal(false);
            fetchProducts();
        } catch (e: any) {
            error(e.message);
        } finally {
            setSaving(false);
        }
    };

    const toggleActive = async (product: Product) => {
        try {
            const res = await fetch(`/api/products/${product._id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ isActive: !product.isActive })
            });
            const data = await res.json();
            if (data.success) {
                setProducts((prev) => prev.map((p) => p._id === product._id ? { ...p, isActive: !p.isActive } : p));
                info('Đã cập nhật trạng thái');
            }
        } catch (e: any) {
            error('Lỗi khi cập nhật trạng thái');
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm('Bạn có chắc chắn muốn xóa sản phẩm này?')) return;
        try {
            const res = await fetch(`/api/products/${id}`, { method: 'DELETE' });
            const data = await res.json();
            if (data.success) {
                success('Đã xóa sản phẩm');
                fetchProducts();
            } else {
                error(data.error || 'Không thể xóa');
            }
        } catch (e: any) {
            error('Lỗi khi xóa');
        }
    };

    const filtered = products.filter((p) =>
        p.name.toLowerCase().includes(search.toLowerCase()) ||
        p.sku.toLowerCase().includes(search.toLowerCase())
    );

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
                <button className={styles.filterBtn}>📁 Danh mục</button>
                <button className={styles.filterBtn}>📊 Trạng thái</button>
                <div className={styles.viewToggle}>
                    <button className={`${styles.viewBtn} ${styles.active}`}>☰</button>
                    <button className={styles.viewBtn}>▦</button>
                </div>
            </div>

            {/* Products Table */}
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
                        {loading ? (
                            <tr><td colSpan={6} style={{ textAlign: 'center', padding: '20px' }}>Đang tải dữ liệu...</td></tr>
                        ) : filtered.length === 0 ? (
                            <tr><td colSpan={6} style={{ textAlign: 'center', padding: '20px' }}>Không tìm thấy sản phẩm nào</td></tr>
                        ) : (
                            filtered.map((product) => (
                                <tr key={product._id}>
                                    <td>
                                        <div className={styles.productCell}>
                                            <div className={styles.productImage}>
                                                {product.images?.[0] ? <img src={product.images[0]} alt="" /> : '📦'}
                                            </div>
                                            <div className={styles.productInfo}>
                                                <div className={styles.productName}>{product.name}</div>
                                                <div className={styles.productSku}>{product.sku}</div>
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

            {/* Add/Edit Product Modal */}
            {showModal && (
                <div className={styles.modalOverlay} onClick={() => setShowModal(false)}>
                    <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
                        <div className={styles.modalHeader}>
                            <span className={styles.modalTitle}>{editingId ? 'Chỉnh sửa sản phẩm' : 'Thêm sản phẩm mới'}</span>
                            <button className={styles.modalClose} onClick={() => setShowModal(false)}>✕</button>
                        </div>
                        <div className={styles.modalBody}>

                            {/* Image Upload */}
                            <div className={styles.formGroup}>
                                <label className={styles.formLabel}>Hình ảnh sản phẩm</label>
                                <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginBottom: '8px' }}>
                                    {formData.images.map((img, i) => (
                                        <div key={i} style={{ position: 'relative', width: '80px', height: '80px', border: img.file ? '2px solid #F0B100' : '1px solid #333', borderRadius: '4px', overflow: 'hidden' }}>
                                            <img src={img.url} alt={`Preview ${i}`} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                            {img.file && <span style={{ position: 'absolute', bottom: '2px', left: '2px', background: '#F0B100', color: '#000', fontSize: '8px', padding: '1px 4px', borderRadius: '2px', fontWeight: 700 }}>MỚI</span>}
                                            <button
                                                onClick={() => removeImage(i)}
                                                style={{ position: 'absolute', top: '2px', right: '2px', background: 'rgba(0,0,0,0.5)', color: '#fff', border: 'none', borderRadius: '50%', width: '20px', height: '20px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '10px' }}
                                            >✕</button>
                                        </div>
                                    ))}
                                </div>
                                <label className={styles.imageUpload}>
                                    <input type="file" style={{ display: 'none' }} onChange={handleImageSelect} accept="image/*" />
                                    <span className={styles.uploadIcon}>📷</span>
                                    <span className={styles.uploadText}>Chọn ảnh (sẽ upload khi lưu sản phẩm)</span>
                                </label>
                            </div>

                            {/* Name & Slug */}
                            <div className={styles.formRow}>
                                <div className={styles.formGroup}>
                                    <label className={styles.formLabel}>Tên sản phẩm *</label>
                                    <input type="text" name="name" className={styles.formInput} value={formData.name} onChange={handleInputChange} placeholder="VD: Akko 3068B Plus" />
                                </div>
                                <div className={styles.formGroup}>
                                    <label className={styles.formLabel}>Slug *</label>
                                    <input type="text" name="slug" className={styles.formInput} value={formData.slug} onChange={handleInputChange} placeholder="vd: akko-3068b-plus" />
                                </div>
                            </div>

                            {/* Category & Brand */}
                            <div className={styles.formRow}>
                                <div className={styles.formGroup}>
                                    <label className={styles.formLabel}>Danh mục *</label>
                                    <select name="category" className={styles.formInput} value={formData.category} onChange={handleInputChange}>
                                        <option value="">-- Chọn danh mục --</option>
                                        {categories.map(c => <option key={c._id} value={c._id}>{c.name}</option>)}
                                    </select>
                                </div>
                                <div className={styles.formGroup}>
                                    <label className={styles.formLabel}>Thương hiệu *</label>
                                    <select name="brand" className={styles.formInput} value={formData.brand} onChange={handleInputChange}>
                                        <option value="">-- Chọn thương hiệu --</option>
                                        {brands.map(b => <option key={b._id} value={b._id}>{b.name}</option>)}
                                    </select>
                                </div>
                            </div>

                            {/* SKU & Price */}
                            <div className={styles.formRow}>
                                <div className={styles.formGroup}>
                                    <label className={styles.formLabel}>Mã SKU *</label>
                                    <input type="text" name="sku" className={styles.formInput} value={formData.sku} onChange={handleInputChange} placeholder="VD: NGR-AKK-100" />
                                </div>
                                <div className={styles.formGroup}>
                                    <label className={styles.formLabel}>Giá bán chung (Base Price VNĐ) *</label>
                                    <input type="number" name="basePrice" className={styles.formInput} value={formData.basePrice} onChange={handleInputChange} placeholder="VD: 1290000" />
                                </div>
                            </div>

                            {/* Sale Price & Tags */}
                            <div className={styles.formRow}>
                                <div className={styles.formGroup}>
                                    <label className={styles.formLabel}>Giá khuyến mãi (VNĐ) — để trống nếu không sale</label>
                                    <input type="number" name="salePrice" className={styles.formInput} value={formData.salePrice} onChange={handleInputChange} placeholder="VD: 990000 (trống = không sale)" />
                                </div>
                                <div className={styles.formGroup}>
                                    <label className={styles.formLabel}>Tags (cách bởi dấu phẩy)</label>
                                    <input type="text" name="tags" className={styles.formInput} value={formData.tags} onChange={handleInputChange} placeholder="sale, hot, new" />
                                </div>
                            </div>

                            {/* Featured */}
                            <div className={styles.formGroup}>
                                <label className={styles.formLabel} style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
                                    <input type="checkbox" checked={formData.isFeatured} onChange={(e) => setFormData(prev => ({ ...prev, isFeatured: e.target.checked }))} />
                                    Sản phẩm nổi bật (hiện trên trang chủ)
                                </label>
                            </div>

                            {/* Description */}
                            <div className={styles.formGroup}>
                                <label className={styles.formLabel}>Mô tả sản phẩm</label>
                                <textarea
                                    name="description"
                                    className={styles.formTextarea}
                                    placeholder="Mô tả chi tiết sản phẩm..."
                                    value={formData.description}
                                    onChange={handleInputChange}
                                />
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
                                                <input type="number" className={styles.formInput} value={variant.price} onChange={(e) => updateVariant(vi, 'price', e.target.value)} placeholder="Trống = giá chung" />
                                            </div>
                                            <div className={styles.formGroup}>
                                                <label className={styles.formLabel}>Tồn kho biến thể</label>
                                                <input type="number" className={styles.formInput} value={variant.stock} onChange={(e) => updateVariant(vi, 'stock', e.target.value)} placeholder="0" />
                                            </div>
                                        </div>
                                        {/* Variant images */}
                                        <div className={styles.formGroup}>
                                            <label className={styles.formLabel}>Ảnh biến thể</label>
                                            <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', marginBottom: '6px' }}>
                                                {variant.images.map((img, ii) => (
                                                    <div key={ii} style={{ position: 'relative', width: '56px', height: '56px', border: img.file ? '2px solid #F0B100' : '1px solid #333', borderRadius: '4px', overflow: 'hidden' }}>
                                                        <img src={img.url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                                        {img.file && <span style={{ position: 'absolute', bottom: '1px', left: '1px', background: '#F0B100', color: '#000', fontSize: '7px', padding: '0 3px', borderRadius: '2px', fontWeight: 700 }}>MỚI</span>}
                                                        <button onClick={() => removeVariantImage(vi, ii)} style={{ position: 'absolute', top: '1px', right: '1px', background: 'rgba(0,0,0,0.5)', color: '#fff', border: 'none', borderRadius: '50%', width: '16px', height: '16px', cursor: 'pointer', fontSize: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>✕</button>
                                                    </div>
                                                ))}
                                            </div>
                                            <label className={styles.variantUploadBtn}>
                                                <input type="file" style={{ display: 'none' }} onChange={(e) => handleVariantImageSelect(vi, e)} accept="image/*" />
                                                📷 Thêm ảnh
                                            </label>
                                        </div>
                                    </div>
                                ))}
                            </div>

                            {/* Stock */}
                            <div className={styles.formRow}>
                                <div className={styles.formGroup}>
                                    <label className={styles.formLabel}>Số lượng tồn kho ban đầu {formData.variants.length > 0 ? '(tổng chung — nếu dùng biến thể thì tồn kho tính theo từng biến thể)' : ''}</label>
                                    <input type="number" name="stock" className={styles.formInput} value={formData.stock} onChange={handleInputChange} placeholder="0" />
                                </div>
                            </div>

                        </div>
                        <div className={styles.modalFooter}>
                            <button className={styles.cancelBtn} onClick={() => setShowModal(false)} disabled={saving}>HỦY</button>
                            <button className={styles.saveBtn} onClick={handleSaveItem} disabled={saving}>
                                {saving ? '⏳ Đang tải ảnh & lưu...' : `💾 ${editingId ? 'CẬP NHẬT' : 'LƯU SẢN PHẨM'}`}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
}
