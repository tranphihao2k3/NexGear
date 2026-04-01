'use client';

import { useState, useEffect } from 'react';
import {
    Plus, Edit, Trash2, Search, Filter,
    Cpu, HardDrive, Mouse, Keyboard, Package,
    X, CheckCircle, XCircle, Monitor, ArrowLeft,
    Layers, Settings, Info, ShoppingBag
} from 'lucide-react';
import { Button, Badge, Input, useToast, LazyImage } from '@/components/ui';
import PriceInput from '@/components/admin/PriceInput';
import ImageUploader from '@/components/admin/ImageUploader';
import s from './page.module.scss';
import Link from 'next/link';

interface ComponentSpec {
    // RAM
    ramType?: string;
    bus?: string;
    capacity?: string;

    // SSD/HDD
    storageType?: string;
    interface?: string;
    // capacity reused

    // Mouse/Keyboard/Accessory
    connection?: string;
    color?: string;

    // CPU
    socket?: string;
    cores?: string;
    threads?: string;

    // Switch for keyboard
    switchType?: string;
}

interface Component {
    _id: string;
    name: string;
    slug: string;
    sku: string;
    componentType: 'RAM' | 'SSD' | 'MOUSE' | 'KEYBOARD' | 'CPU' | 'VGA' | 'MAINBOARD' | 'PSU' | 'CASE' | 'COOLING' | 'OTHER';
    basePrice: number;
    specs: ComponentSpec;
    images: string[];
    stock: number;
    isActive: boolean;
    description?: string;
}

const COMPONENT_TYPES = [
    { id: 'RAM', label: 'RAM', icon: Layers },
    { id: 'SSD', label: 'SSD/HDD', icon: HardDrive },
    { id: 'CPU', label: 'CPU', icon: Cpu },
    { id: 'MOUSE', label: 'Chuột', icon: Mouse },
    { id: 'KEYBOARD', label: 'Bàn phím', icon: Keyboard },
    { id: 'VGA', label: 'VGA', icon: Monitor },
    { id: 'MAINBOARD', label: 'Mainboard', icon: Settings },
    { id: 'OTHER', label: 'Khác', icon: Package },
];

export default function ComponentsPage() {
    const { success, error } = useToast();
    const [components, setComponents] = useState<Component[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [filterType, setFilterType] = useState('ALL');

    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingComponent, setEditingComponent] = useState<Component | null>(null);

    const [formData, setFormData] = useState<Partial<Component>>({
        name: '',
        slug: '',
        sku: '',
        componentType: 'RAM',
        basePrice: 0,
        stock: 0,
        images: [],
        isActive: true,
        specs: {},
        description: ''
    });

    const fetchComponents = async () => {
        setLoading(true);
        try {
            const res = await fetch('/api/products?productType=component&limit=200&admin=true');
            const data = await res.json();
            if (data.success) {
                setComponents(data.data);
            }
        } catch (err) {
            error('Không thể tải dữ liệu linh kiện');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchComponents();
    }, []);

    const handleOpenModal = (component?: Component) => {
        if (component) {
            setEditingComponent(component);
            setFormData({ ...component });
        } else {
            setEditingComponent(null);
            setFormData({
                name: '',
                slug: '',
                sku: '',
                componentType: 'RAM',
                basePrice: 0,
                stock: 0,
                images: [],
                isActive: true,
                specs: {},
                description: ''
            });
        }
        setIsModalOpen(true);
    };

    const handleCloseModal = () => {
        setIsModalOpen(false);
        setEditingComponent(null);
    };

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            const url = editingComponent ? `/api/products/${editingComponent._id}` : '/api/products';
            const method = editingComponent ? 'PUT' : 'POST';

            const payload = { ...formData, productType: 'component' };
            const res = await fetch(url, {
                method,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });

            const data = await res.json();
            if (data.success) {
                success(editingComponent ? 'Cập nhật thành công!' : 'Thêm mới thành công!');
                handleCloseModal();
                fetchComponents();
            } else {
                error(data.error || 'Có lỗi xảy ra');
            }
        } catch (err) {
            error('Lỗi kết nối server');
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm('Xóa linh kiện này?')) return;
        try {
            const res = await fetch(`/api/products/${id}`, { method: 'DELETE' });
            if (res.ok) {
                success('Đã xóa linh kiện');
                fetchComponents();
            }
        } catch (err) {
            error('Lỗi khi xóa');
        }
    };

    const handleSpecChange = (key: string, value: string) => {
        setFormData(prev => ({
            ...prev,
            specs: { ...prev.specs, [key]: value }
        }));
    };

    const filteredComponents = components.filter(c => {
        const matchesSearch = c.name.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesType = filterType === 'ALL' || c.componentType === filterType;
        return matchesSearch && matchesType;
    });

    return (
        <div className={s.page}>
            <div className={s.header}>
                <div className={s.titleArea}>
                    <h1>Linh kiện & Phụ kiện</h1>
                    <p className={s.headerDesc}>Quản lý kho hàng RAM, SSD, Gear và các thiết bị nâng cấp</p>
                </div>
                <Button variant="cyan" onClick={() => handleOpenModal()}>
                    <Plus size={18} /> THÊM LINH KIỆN
                </Button>
            </div>

            <div className={s.filtersBar}>
                <div className={s.searchBox}>
                    <Input
                        placeholder="Tìm theo tên linh kiện..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        leftIcon={<Search size={18} />}
                    />
                </div>
                <div className={s.filterTabs}>
                    <button
                        className={`${s.filterBtn} ${filterType === 'ALL' ? s.filterBtnActive : ''}`}
                        onClick={() => setFilterType('ALL')}
                    >TẤT CẢ</button>
                    {COMPONENT_TYPES.map(t => (
                        <button
                            key={t.id}
                            className={`${s.filterBtn} ${filterType === t.id ? s.filterBtnActive : ''}`}
                            onClick={() => setFilterType(t.id)}
                        >{t.label}</button>
                    ))}
                </div>
            </div>

            <div className={s.content}>
                {loading ? (
                    <div className={s.loadingState}>
                        <div className={s.loadingSpinner}></div>
                        <p>Đang tải dữ liệu...</p>
                    </div>
                ) : filteredComponents.length === 0 ? (
                    <div className={s.emptyState}>
                        <div className={s.emptyIcon}><Package size={48} /></div>
                        <h3>Không tìm thấy linh kiện</h3>
                        <p>Thử thay đổi bộ lọc hoặc từ khóa tìm kiếm của bạn.</p>
                        <Button variant="cyan" onClick={() => handleOpenModal()}>TẠO MỚI NGAY</Button>
                    </div>
                ) : (
                    <div className={s.componentsGrid}>
                        <div className={s.gridHeader}>
                            <div>Sản phẩm</div>
                            <div>Loại</div>
                            <div className={s.center}>Giá bán</div>
                            <div className={s.center}>Tồn kho</div>
                            <div className={s.center}>Trạng thái</div>
                            <div className={s.right}>Thao tác</div>
                        </div>
                        <div className={s.componentsList}>
                            {filteredComponents.map((item) => (
                                <div key={item._id} className={s.componentCard}>
                                    <div className={s.componentContent}>
                                        <div className={s.componentPreview}>
                                            <div className={s.componentImg}>
                                                {item.images?.[0] ? (
                                                    <LazyImage src={item.images[0]} alt={item.name} />
                                                ) : (
                                                    <div className={s.placeholderIcon}><Package size={24} /></div>
                                                )}
                                            </div>
                                            <div className={s.componentMeta}>
                                                <h3 className={s.componentName}>{item.name}</h3>
                                                <div className={s.componentSpecs}>
                                                    {item.componentType === 'RAM' && (
                                                        <span>{item.specs.capacity} {item.specs.ramType} {item.specs.bus}</span>
                                                    )}
                                                    {item.componentType === 'SSD' && (
                                                        <span>{item.specs.capacity} {item.specs.storageType}</span>
                                                    )}
                                                    {item.componentType === 'MOUSE' && (
                                                        <span>{item.specs.connection} {item.specs.color}</span>
                                                    )}
                                                </div>
                                            </div>
                                        </div>

                                        <div className={s.componentTypeBadge}>
                                            <Badge variant={item.componentType === 'RAM' || item.componentType === 'SSD' ? 'cyan' : 'purple'}>
                                                {item.componentType}
                                            </Badge>
                                        </div>

                                        <div className={`${s.componentPrice} ${s.center}`}>
                                            <span className={s.priceValue}>{item.basePrice.toLocaleString()}đ</span>
                                        </div>

                                        <div className={`${s.componentStock} ${s.center}`}>
                                            <span className={item.stock > 10 ? s.stockOk : s.stockLow}>
                                                {item.stock} cái
                                            </span>
                                        </div>

                                        <div className={`${s.componentStatus} ${s.center}`}>
                                            {item.isActive ? (
                                                <Badge variant="green">ĐANG HIỆN</Badge>
                                            ) : (
                                                <Badge variant="ink">ĐANG ẨN</Badge>
                                            )}
                                        </div>

                                        <div className={s.componentActions}>
                                            <button className={s.editBtn} onClick={() => handleOpenModal(item)}>
                                                <Edit size={16} />
                                            </button>
                                            <button className={s.deleteBtn} onClick={() => handleDelete(item._id)}>
                                                <Trash2 size={16} />
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </div>

            <div className={s.footer}>
                <Link href="/admin" className={s.backLink}>
                    <ArrowLeft size={16} /> QUAY LẠI DASHBOARD
                </Link>
            </div>

            {/* Modal */}
            {isModalOpen && (
                <div className={s.modalOverlay} onClick={(e) => e.target === e.currentTarget && handleCloseModal()}>
                    <div className={s.modalContent}>
                        <div className={s.modalHeader}>
                            <h2>{editingComponent ? 'CẬP NHẬT LINH KIỆN' : 'THÊM LINH KIỆN MỚI'}</h2>
                            <button onClick={handleCloseModal} className={s.closeBtn}><X size={24} /></button>
                        </div>

                        <form onSubmit={handleSave} className={s.form}>
                            <div className={s.formSections}>
                                <div className={s.formSection}>
                                    <div className={s.sectionHeader}>
                                        <Info size={16} />
                                        <span>THÔNG TIN CƠ BẢN</span>
                                    </div>
                                    <div className={s.formGrid}>
                                        <div className={s.fullWidth}>
                                            <Input
                                                label="Tên linh kiện *"
                                                required
                                                value={formData.name}
                                                onChange={e => {
                                                    const name = e.target.value;
                                                    const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
                                                    setFormData({ ...formData, name, slug });
                                                }}
                                                placeholder="VD: RAM Kingston Fury Beast 16GB DDR5 5200MHz"
                                            />
                                        </div>
                                        <div>
                                            <Input
                                                label="SKU *"
                                                required
                                                value={formData.sku}
                                                onChange={e => setFormData({ ...formData, sku: e.target.value })}
                                                placeholder="VD: RAM-KF-16-DDR5"
                                            />
                                        </div>
                                        <div>
                                            <label className={s.fieldLabel}>Phân loại *</label>
                                            <select
                                                className={s.select}
                                                value={formData.componentType}
                                                onChange={e => setFormData({ ...formData, componentType: e.target.value as any })}
                                            >
                                                {COMPONENT_TYPES.map(t => (
                                                    <option key={t.id} value={t.id}>{t.label}</option>
                                                ))}
                                            </select>
                                        </div>
                                        <div>
                                            <PriceInput
                                                value={formData.basePrice || 0}
                                                onChange={val => setFormData({ ...formData, basePrice: val })}
                                                required
                                            />
                                        </div>
                                        <div>
                                            <Input
                                                label="Số lượng tồn kho"
                                                type="number"
                                                min="0"
                                                value={formData.stock}
                                                onChange={e => setFormData({ ...formData, stock: Number(e.target.value) })}
                                            />
                                        </div>
                                        <div className={s.flexCenter}>
                                            <div className={s.toggle}>
                                                <input
                                                    type="checkbox"
                                                    id="active"
                                                    checked={formData.isActive}
                                                    onChange={e => setFormData({ ...formData, isActive: e.target.checked })}
                                                />
                                                <label htmlFor="active">Sẵn sàng bán</label>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                <div className={s.formSection}>
                                    <div className={s.sectionHeader}>
                                        <Settings size={16} />
                                        <span>THÔNG SỐ KỸ THUẬT</span>
                                    </div>
                                    <div className={s.formGrid}>
                                        {formData.componentType === 'RAM' && (
                                            <>
                                                <Input label="Dung lượng" placeholder="8GB, 16GB..." value={formData.specs?.capacity} onChange={e => handleSpecChange('capacity', e.target.value)} />
                                                <Input label="Loại RAM" placeholder="DDR4, DDR5..." value={formData.specs?.ramType} onChange={e => handleSpecChange('ramType', e.target.value)} />
                                                <Input label="Bus" placeholder="3200MHz, 5200MHz..." value={formData.specs?.bus} onChange={e => handleSpecChange('bus', e.target.value)} />
                                            </>
                                        )}
                                        {formData.componentType === 'SSD' && (
                                            <>
                                                <Input label="Dung lượng" placeholder="256GB, 512GB..." value={formData.specs?.capacity} onChange={e => handleSpecChange('capacity', e.target.value)} />
                                                <Input label="Loại ổ cứng" placeholder="SATA 3, NVMe..." value={formData.specs?.storageType} onChange={e => handleSpecChange('storageType', e.target.value)} />
                                            </>
                                        )}
                                        {(formData.componentType === 'MOUSE' || formData.componentType === 'KEYBOARD') && (
                                            <>
                                                <Input label="Kết nối" placeholder="Có dây, Wireless, Bluetooth..." value={formData.specs?.connection} onChange={e => handleSpecChange('connection', e.target.value)} />
                                                <Input label="Màu sắc" placeholder="Đen, Trắng, Hồng..." value={formData.specs?.color} onChange={e => handleSpecChange('color', e.target.value)} />
                                            </>
                                        )}
                                        {formData.componentType === 'CPU' && (
                                            <>
                                                <Input label="Socket" placeholder="LGA 1700, AM5..." value={formData.specs?.socket} onChange={e => handleSpecChange('socket', e.target.value)} />
                                                <Input label="Số nhân/luồng" placeholder="6C/12T, 10C/16T..." value={formData.specs?.cores} onChange={e => handleSpecChange('cores', e.target.value)} />
                                            </>
                                        )}
                                        {/* Fallback for others */}
                                        {(!['RAM', 'SSD', 'MOUSE', 'KEYBOARD', 'CPU'].includes(formData.componentType as string)) && (
                                            <div className={s.fullWidth}>
                                                <p className={s.hint}>Vui lòng nhập thông số vào phần mô tả bên dưới.</p>
                                            </div>
                                        )}
                                    </div>
                                </div>

                                <div className={s.formSection}>
                                    <div className={s.sectionHeader}>
                                        <ShoppingBag size={16} />
                                        <span>HÌNH ẢNH & CHI TIẾT</span>
                                    </div>
                                    <ImageUploader
                                        maxImages={4}
                                        value={formData.images || []}
                                        onChange={urls => setFormData({ ...formData, images: urls })}
                                    />
                                    <div className={s.fullWidth} style={{ marginTop: '16px' }}>
                                        <textarea
                                            className={s.textarea}
                                            rows={3}
                                            placeholder="Mô tả tóm tắt linh kiện..."
                                            value={formData.description}
                                            onChange={e => setFormData({ ...formData, description: e.target.value })}
                                        />
                                    </div>
                                </div>
                            </div>

                            <div className={s.formActions}>
                                <Button variant="ghost" type="button" onClick={handleCloseModal}>HỦY BỎ</Button>
                                <Button variant="primary" type="submit">
                                    {editingComponent ? 'LƯU THAY ĐỔI' : 'THÊM MỚI NGAY'}
                                </Button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
