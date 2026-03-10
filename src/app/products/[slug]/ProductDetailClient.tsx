"use client";

import React, { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import Lightbox from "yet-another-react-lightbox";
import Zoom from "yet-another-react-lightbox/plugins/zoom";
import "yet-another-react-lightbox/styles.css";
import ProductCard from "@/components/product/ProductCard";
import Button from "@/components/ui/Button";
import styles from "./page.module.scss";
import { useToast } from "@/components/ui";
import { useCart } from "@/contexts/CartContext";

// ── STAR COMPONENT ────────────────────────────────────────
function Stars({ value, max = 5, size = "md" }: { value: number; max?: number; size?: string }) {
    return (
        <span className={`${styles.stars} ${size === "lg" ? styles.starsLg : ""}`} aria-label={`${value} sao`}>
            {Array.from({ length: max }, (_, i) => {
                const filled = i + 1 <= Math.floor(value);
                const half = !filled && i < value;
                return (
                    <span key={i} className={filled ? styles.starFull : half ? styles.starHalf : styles.starEmpty}>
                        ★
                    </span>
                );
            })}
        </span>
    );
}

// ── FORMAT PRICE ──────────────────────────────────────────
function fmt(n: number) {
    return new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(n);
}

// ── ACCORDION ITEM ────────────────────────────────────────
function AccordionItem({
    title, icon, children, defaultOpen = false,
}: { title: string; icon: string; children: React.ReactNode; defaultOpen?: boolean }) {
    const [open, setOpen] = useState(defaultOpen);
    return (
        <div className={`${styles.accordion} ${open ? styles.accordionOpen : ""}`}>
            <button
                className={styles.accordionBtn}
                onClick={() => setOpen(!open)}
                aria-expanded={open}
            >
                <span className={styles.accordionTitle}>
                    <span className={styles.accordionIcon}>{icon}</span>
                    {title}
                </span>
                <span className={styles.accordionChevron}>{open ? "−" : "+"}</span>
            </button>
            {open && <div className={styles.accordionBody}>{children}</div>}
        </div>
    );
}

// ── PAGE ─────────────────────────────────────────────────
export default function ProductDetailClient({ slug }: { slug: string }) {
    const { error, success } = useToast();
    const { data: session } = useSession();
    const { addItem } = useCart();
    const router = useRouter();

    const [product, setProduct] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [related, setRelated] = useState<any[]>([]);

    const [activeImg, setActiveImg] = useState(0);
    const [lightboxOpen, setLightboxOpen] = useState(false);
    const [qty, setQty] = useState(1);
    const [addedToCart, setAddedToCart] = useState(false);
    const [wishlisted, setWishlisted] = useState(false);
    const [selectedVariant, setSelectedVariant] = useState<number | null>(null);
    const [activeTab, setActiveTab] = useState<"desc" | "specs" | "reviews">("desc");

    const imgRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (!slug) return;
        const fetchProduct = async () => {
            try {
                const res = await fetch(`/api/products/${slug}`);
                const data = await res.json();
                if (data.success) {
                    setProduct(data.data);
                    if (data.data.category?._id) {
                        const relRes = await fetch(`/api/products?category=${data.data.category._id}&limit=4&active=true`);
                        const relData = await relRes.json();
                        if (relData.success) {
                            setRelated(relData.data.filter((p: any) => p._id !== data.data._id));
                        }
                    }
                } else {
                    error("Không tìm thấy sản phẩm");
                }
            } catch (e: any) {
                error(e.message || "Lỗi tải sản phẩm");
            } finally {
                setLoading(false);
            }
        };
        fetchProduct();
    }, [slug, error]);

    // Check wishlist
    useEffect(() => {
        if (!product) return;
        try {
            const wl = JSON.parse(localStorage.getItem("nexgear_wishlist") || "[]");
            setWishlisted(wl.includes(product._id));
        } catch { }
    }, [product]);

    if (loading) {
        return (
            <div className={styles.page}>
                <div className={styles.loadingWrap}>
                    <div className={styles.loadingPulse} />
                    <span className={styles.loadingText}>// ĐANG TẢI SẢN PHẨM...</span>
                </div>
            </div>
        );
    }

    if (!product) {
        return (
            <div className={styles.page}>
                <div className={styles.loadingWrap}>
                    <span style={{ fontSize: 48 }}>⚠</span>
                    <span className={styles.loadingText}>Sản phẩm không tồn tại</span>
                    <Link href="/products" className={styles.backLink}>← Quay lại danh sách</Link>
                </div>
            </div>
        );
    }

    const variants = product.variants || [];
    const activeVariant = selectedVariant !== null ? variants[selectedVariant] : null;
    const variantPrice = activeVariant?.price || null;
    const effectiveBasePrice = variantPrice || product.basePrice;
    const effectiveSalePrice = product.salePrice;
    const currentPrice = effectiveSalePrice && effectiveSalePrice < effectiveBasePrice ? effectiveSalePrice : effectiveBasePrice;
    const pct = effectiveSalePrice && effectiveSalePrice < effectiveBasePrice ? Math.round((1 - effectiveSalePrice / effectiveBasePrice) * 100) : 0;
    const effectiveStock = activeVariant ? activeVariant.stock : product.stock;

    const variantImages = activeVariant?.images?.length > 0 ? activeVariant.images : null;
    const images = variantImages || (product.images?.length > 0 ? product.images : ["https://placehold.co/600x600/141414/00c4ad?text=No+Image"]);

    const specs = product.specs || {};
    const specEntries = Object.entries(specs).filter(([, v]) => v !== null && v !== undefined && v !== "");

    // handleMouseMove removed — using lightbox instead

    function doAddToCart() {
        addItem({
            productId: product._id,
            slug: product.slug,
            name: product.name,
            brand: product.brand?.name || "",
            variant: activeVariant?.name,
            variantIndex: selectedVariant ?? undefined,
            sku: activeVariant?.sku || product.sku,
            image: images[0] || "",
            basePrice: effectiveBasePrice,
            salePrice: effectiveSalePrice && effectiveSalePrice < effectiveBasePrice ? effectiveSalePrice : null,
            stock: effectiveStock,
            qty,
        });
    }

    function handleAddToCart() {
        doAddToCart();
        setAddedToCart(true);
        success("Đã thêm vào giỏ hàng");
        setTimeout(() => setAddedToCart(false), 2000);
    }

    function handleBuyNow() {
        doAddToCart();
        router.push("/cart");
    }

    function toggleWishlist() {
        try {
            const wl: string[] = JSON.parse(localStorage.getItem("nexgear_wishlist") || "[]");
            const idx = wl.indexOf(product._id);
            if (idx >= 0) {
                wl.splice(idx, 1);
                setWishlisted(false);
            } else {
                wl.push(product._id);
                setWishlisted(true);
            }
            localStorage.setItem("nexgear_wishlist", JSON.stringify(wl));
        } catch { }
    }

    const tags = product.tags || [];
    const ratingAvg = product.ratings?.avg || 0;
    const ratingCount = product.ratings?.count || 0;
    const soldCount = product.soldCount || 0;

    return (
        <div className={styles.page}>
            {/* ── BREADCRUMB ── */}
            <div className={styles.breadcrumbBar}>
                <div className={styles.breadcrumbInner}>
                    <nav className={styles.breadcrumb} aria-label="Breadcrumb">
                        <Link href="/" className={styles.bcLink}>Trang chủ</Link>
                        <span className={styles.bcSep}>/</span>
                        <Link href="/products" className={styles.bcLink}>Sản phẩm</Link>
                        {product.category?.name && (
                            <>
                                <span className={styles.bcSep}>/</span>
                                <Link href={`/${product.category.slug || "products"}`} className={styles.bcLink}>
                                    {product.category.name}
                                </Link>
                            </>
                        )}
                        <span className={styles.bcSep}>/</span>
                        <span className={styles.bcCurrent}>{product.name}</span>
                    </nav>
                </div>
            </div>

            {/* ── MAIN: GALLERY + INFO ── */}
            <div className={styles.productMain}>
                <div className={styles.productMainInner}>

                    {/* ── GALLERY COLUMN ── */}
                    <div className={styles.galleryCol}>
                        <div className={styles.gallerySticky}>

                            {/* Badges */}
                            <div className={styles.imgBadges}>
                                {pct > 0 && (
                                    <span className={`${styles.imgBadge} ${styles.imgBadgeSale}`}>
                                        −{pct}%
                                    </span>
                                )}
                                {tags.includes("new") && (
                                    <span className={`${styles.imgBadge} ${styles.imgBadgeNew}`}>
                                        NEW
                                    </span>
                                )}
                                {product.featured && (
                                    <span className={`${styles.imgBadge} ${styles.imgBadgeFeatured}`}>
                                        ★ HOT
                                    </span>
                                )}
                            </div>

                            {/* Main image — click to open lightbox */}
                            <div
                                className={styles.mainImg}
                                onClick={() => setLightboxOpen(true)}
                                style={{
                                    backgroundImage: `url(${images[activeImg]})`,
                                    backgroundPosition: 'center',
                                    backgroundSize: 'contain',
                                    backgroundRepeat: 'no-repeat',
                                    cursor: 'zoom-in',
                                }}
                            >
                                <div className={styles.imgCorners}>
                                    <span /><span /><span /><span />
                                </div>
                                <span className={styles.zoomHint}>🔍 XEM ẢNH</span>
                                <span className={styles.imgCounter}>
                                    {activeImg + 1} / {images.length}
                                </span>
                            </div>

                            <Lightbox
                                open={lightboxOpen}
                                close={() => setLightboxOpen(false)}
                                index={activeImg}
                                slides={images.map((src: string) => ({ src }))}
                                plugins={[Zoom]}
                                on={{ view: ({ index }) => setActiveImg(index) }}
                            />

                            {/* Thumbnails */}
                            <div className={styles.thumbRow}>
                                {images.map((img: string, i: number) => (
                                    <button
                                        key={i}
                                        className={`${styles.thumb} ${i === activeImg ? styles.thumbActive : ""}`}
                                        onClick={() => setActiveImg(i)}
                                    >
                                        <img src={img} alt={`${product.name} ${i + 1}`} />
                                    </button>
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* ── PRODUCT INFO COLUMN ── */}
                    <div className={styles.infoCol}>

                        {/* Brand + Tags */}
                        <div className={styles.topMeta}>
                            {product.brand?.name && (
                                <span className={styles.brandLabel}>{product.brand.name}</span>
                            )}
                            {tags.map((t: string) => (
                                <span key={t} className={styles.tagPill}>{t}</span>
                            ))}
                        </div>

                        {/* Title */}
                        <h1 className={styles.productTitle}>{product.name}</h1>

                        {/* Rating + SKU + Sold row */}
                        <div className={styles.ratingRow}>
                            <Stars value={ratingAvg} />
                            <span className={styles.ratingNum}>{ratingAvg.toFixed(1)}</span>
                            <a href="#detail-tabs" className={styles.ratingLink}>
                                ({ratingCount} đánh giá)
                            </a>
                            <span className={styles.metaDivider} />
                            <span className={styles.metaText}>Đã bán: <strong>{soldCount}</strong></span>
                            <span className={styles.metaDivider} />
                            <span className={styles.skuText}>SKU: {activeVariant?.sku || product.sku}</span>
                        </div>

                        {/* ── PRICE BLOCK ── */}
                        <div className={styles.priceCard}>
                            <div className={styles.priceCardGlow} />
                            <div className={styles.priceRow}>
                                <span className={styles.salePrice}>{fmt(currentPrice)}</span>
                                {pct > 0 && (
                                    <>
                                        <span className={styles.basePrice}>{fmt(effectiveBasePrice)}</span>
                                        <span className={styles.discountBadge}>Tiết kiệm {fmt(effectiveBasePrice - currentPrice)}</span>
                                    </>
                                )}
                            </div>
                            {pct > 0 && (
                                <div className={styles.savingsBar}>
                                    <div className={styles.savingsFill} style={{ width: `${pct}%` }} />
                                    <span className={styles.savingsText}>Giảm {pct}%</span>
                                </div>
                            )}
                        </div>

                        <div className={styles.neonDivider} />

                        {/* ── VARIANT SELECTOR ── */}
                        {variants.length > 0 && (
                            <div className={styles.variantGroup}>
                                <div className={styles.variantLabel}>
                                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="3" /><path d="M12 2v4m0 12v4M4.93 4.93l2.83 2.83m8.48 8.48l2.83 2.83M2 12h4m12 0h4M4.93 19.07l2.83-2.83m8.48-8.48l2.83-2.83" /></svg>
                                    Phân loại:
                                    {activeVariant && <strong>{activeVariant.name}</strong>}
                                </div>
                                <div className={styles.variantOptions}>
                                    {variants.map((v: any, i: number) => (
                                        <button
                                            key={i}
                                            className={`${styles.variantBtn} ${selectedVariant === i ? styles.variantBtnActive : ''} ${v.stock === 0 ? styles.variantBtnDisabled : ''}`}
                                            onClick={() => {
                                                setSelectedVariant(selectedVariant === i ? null : i);
                                                setActiveImg(0);
                                                setQty(1);
                                            }}
                                            disabled={v.stock === 0}
                                        >
                                            {v.images?.[0] && (
                                                <img src={v.images[0]} alt="" className={styles.variantThumb} />
                                            )}
                                            <div className={styles.variantInfo}>
                                                <span className={styles.variantName}>{v.name}</span>
                                                {v.price && <span className={styles.variantPrice}>{fmt(v.price)}</span>}
                                            </div>
                                            {v.stock === 0 && <span className={styles.variantSoldOut}>Hết</span>}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* ── VARIANT ATTRIBUTES ── */}
                        {activeVariant?.attributes?.length > 0 && (
                            <div className={styles.variantAttributes}>
                                <div className={styles.variantLabel}>
                                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M4 7h16M4 12h16M4 17h10" /></svg>
                                    Thông số biến thể
                                </div>
                                <div className={styles.attrGrid}>
                                    {activeVariant.attributes.map((attr: { key: string; value: string }, ai: number) => (
                                        <div key={ai} className={styles.attrItem}>
                                            <span className={styles.attrKey}>{attr.key}</span>
                                            <span className={styles.attrValue}>{attr.value}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {variants.length > 0 && <div className={styles.neonDivider} />}

                        {/* ── QUANTITY ── */}
                        <div className={styles.variantGroup}>
                            <div className={styles.variantLabel}>
                                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="3" width="18" height="18" rx="2" /><line x1="12" y1="8" x2="12" y2="16" /><line x1="8" y1="12" x2="16" y2="12" /></svg>
                                Số lượng:
                            </div>
                            <div className={styles.qtyRow}>
                                <div className={styles.qtyStepper}>
                                    <button
                                        className={styles.qtyBtn}
                                        onClick={() => setQty(q => Math.max(1, q - 1))}
                                        disabled={qty <= 1}
                                    >−</button>
                                    <span className={styles.qtyNum}>{qty}</span>
                                    <button
                                        className={styles.qtyBtn}
                                        onClick={() => setQty(q => Math.min(effectiveStock, q + 1))}
                                        disabled={qty >= effectiveStock}
                                    >+</button>
                                </div>
                                <span className={styles.stockText}>
                                    {effectiveStock > 0 ? (
                                        <>
                                            <span className={styles.stockDot} />
                                            Còn <strong>{effectiveStock}</strong> sản phẩm
                                        </>
                                    ) : (
                                        <>
                                            <span className={styles.stockDotOut} />
                                            <span style={{ color: '#F0356A' }}>Tạm hết hàng</span>
                                        </>
                                    )}
                                </span>
                            </div>

                            {/* Total preview */}
                            {qty > 1 && (
                                <div className={styles.totalPreview}>
                                    Tạm tính: <strong>{fmt(currentPrice * qty)}</strong>
                                </div>
                            )}
                        </div>

                        <div className={styles.neonDivider} />

                        {/* ── CTAs ── */}
                        <div className={styles.ctaStack}>
                            {variants.length > 0 && selectedVariant === null && (
                                <p className={styles.ctaWarning}>
                                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" /><line x1="12" y1="9" x2="12" y2="13" /><line x1="12" y1="17" x2="12.01" y2="17" /></svg>
                                    Vui lòng chọn phân loại
                                </p>
                            )}
                            <div className={styles.ctaRow}>
                                <Button
                                    variant="outline-cyan"
                                    size="lg"
                                    fullWidth
                                    onClick={handleAddToCart}
                                    disabled={effectiveStock === 0 || (variants.length > 0 && selectedVariant === null)}
                                    className={styles.cartBtn}
                                >
                                    {addedToCart ? "✓ ĐÃ THÊM" : "🛒 THÊM VÀO GIỎ"}
                                </Button>
                                <Button
                                    variant="primary"
                                    size="lg"
                                    fullWidth
                                    disabled={effectiveStock === 0 || (variants.length > 0 && selectedVariant === null)}
                                    onClick={handleBuyNow}
                                    className={styles.buyBtn}
                                >
                                    MUA NGAY →
                                </Button>
                            </div>

                            <button className={styles.wishlistBtn} onClick={toggleWishlist}>
                                <svg width="16" height="16" viewBox="0 0 24 24" fill={wishlisted ? "currentColor" : "none"} stroke="currentColor" strokeWidth="2"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" /></svg>
                                {wishlisted ? "Đã yêu thích" : "Thêm vào yêu thích"}
                            </button>
                        </div>

                        {/* ── SERVICE PROMISES ── */}
                        <div className={styles.serviceGrid}>
                            <div className={styles.serviceCard}>
                                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><rect x="1" y="3" width="15" height="13" /><polygon points="16 8 20 8 23 11 23 16 16 16 16 8" /><circle cx="5.5" cy="18.5" r="2.5" /><circle cx="18.5" cy="18.5" r="2.5" /></svg>
                                <div>
                                    <strong>Giao nhanh 2H</strong>
                                    <span>Nội thành HCM / HN</span>
                                </div>
                            </div>
                            <div className={styles.serviceCard}>
                                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><polyline points="23 4 23 10 17 10" /><path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10" /></svg>
                                <div>
                                    <strong>Đổi trả 7 ngày</strong>
                                    <span>Miễn phí, không lý do</span>
                                </div>
                            </div>
                            <div className={styles.serviceCard}>
                                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" /></svg>
                                <div>
                                    <strong>Bảo hành 12T</strong>
                                    <span>Chính hãng toàn quốc</span>
                                </div>
                            </div>
                            <div className={styles.serviceCard}>
                                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><rect x="1" y="4" width="22" height="16" rx="2" ry="2" /><line x1="1" y1="10" x2="23" y2="10" /></svg>
                                <div>
                                    <strong>Trả góp 0%</strong>
                                    <span>Visa / Mastercard</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* ── DETAIL TABS: Mô tả / Thông số / Đánh giá ── */}
            <div className={styles.detailSection} id="detail-tabs">
                <div className={styles.detailInner}>

                    {/* Tab navigation */}
                    <div className={styles.tabNav}>
                        <div className={styles.tabNavLine} />
                        {[
                            { id: "desc" as const, label: "Mô tả sản phẩm", icon: "📝" },
                            { id: "specs" as const, label: "Thông số kỹ thuật", icon: "⚙" },
                            { id: "reviews" as const, label: `Đánh giá (${ratingCount})`, icon: "⭐" },
                        ].map(tab => (
                            <button
                                key={tab.id}
                                className={`${styles.tabBtn} ${activeTab === tab.id ? styles.tabBtnActive : ""}`}
                                onClick={() => setActiveTab(tab.id)}
                            >
                                <span className={styles.tabIcon}>{tab.icon}</span>
                                {tab.label}
                                {activeTab === tab.id && <span className={styles.tabIndicator} />}
                            </button>
                        ))}
                    </div>

                    {/* Tab content */}
                    <div className={styles.tabContent}>

                        {/* Description Tab */}
                        {activeTab === "desc" && (
                            <div className={styles.descTab}>
                                <div className={styles.descMain}>
                                    {product.description ? (
                                        <div
                                            className={styles.descText}
                                            dangerouslySetInnerHTML={{ __html: product.description }}
                                        />
                                    ) : (
                                        <p className={styles.descText}>Đang cập nhật mô tả chi tiết cho sản phẩm này.</p>
                                    )}
                                </div>

                                {/* Quick info sidebar */}
                                <div className={styles.descSidebar}>
                                    <div className={styles.quickInfoCard}>
                                        <h3 className={styles.quickInfoTitle}>// THÔNG TIN NHANH</h3>
                                        <div className={styles.quickInfoRow}>
                                            <span>Thương hiệu</span>
                                            <strong>{product.brand?.name || "—"}</strong>
                                        </div>
                                        <div className={styles.quickInfoRow}>
                                            <span>Danh mục</span>
                                            <strong>{product.category?.name || "—"}</strong>
                                        </div>
                                        <div className={styles.quickInfoRow}>
                                            <span>Tình trạng</span>
                                            <strong style={{ color: effectiveStock > 0 ? "#1DB96A" : "#F0356A" }}>
                                                {effectiveStock > 0 ? "Còn hàng" : "Hết hàng"}
                                            </strong>
                                        </div>
                                        <div className={styles.quickInfoRow}>
                                            <span>Đã bán</span>
                                            <strong>{soldCount}</strong>
                                        </div>
                                        <div className={styles.quickInfoRow}>
                                            <span>Phân loại</span>
                                            <strong>Chính hãng</strong>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Specs Tab */}
                        {activeTab === "specs" && (
                            <div className={styles.specsTab}>
                                {specEntries.length > 0 ? (
                                    <table className={styles.specTable}>
                                        <tbody>
                                            {specEntries.map(([key, val], i) => (
                                                <tr key={key} className={i % 2 === 0 ? styles.specRowEven : styles.specRowOdd}>
                                                    <td className={styles.specKey}>{key}</td>
                                                    <td className={styles.specVal}>{String(val)}</td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                ) : (
                                    <div className={styles.emptyTab}>
                                        <span>⚙</span>
                                        <p>Thông số kỹ thuật đang được cập nhật</p>
                                    </div>
                                )}

                                {/* Always show basic info */}
                                <div className={styles.specBasic}>
                                    <h3 className={styles.specBasicTitle}>// THÔNG TIN CƠ BẢN</h3>
                                    <div className={styles.specBasicGrid}>
                                        <div className={styles.specBasicItem}>
                                            <span className={styles.specBasicLabel}>Thương hiệu</span>
                                            <span className={styles.specBasicVal}>{product.brand?.name || "—"}</span>
                                        </div>
                                        <div className={styles.specBasicItem}>
                                            <span className={styles.specBasicLabel}>Danh mục</span>
                                            <span className={styles.specBasicVal}>{product.category?.name || "—"}</span>
                                        </div>
                                        <div className={styles.specBasicItem}>
                                            <span className={styles.specBasicLabel}>SKU</span>
                                            <span className={styles.specBasicVal}>{product.sku || "—"}</span>
                                        </div>
                                        <div className={styles.specBasicItem}>
                                            <span className={styles.specBasicLabel}>Bảo hành</span>
                                            <span className={styles.specBasicVal}>
                                                {typeof product.warranty === 'object' && product.warranty !== null
                                                    ? `${product.warranty.duration || product.warrantyMonths || 3} tháng`
                                                    : product.warranty || `${product.warrantyMonths || 3} tháng`}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Reviews Tab */}
                        {activeTab === "reviews" && (
                            <div className={styles.reviewsTab}>
                                {/* Rating overview */}
                                <div className={styles.reviewOverview}>
                                    <div className={styles.ratingBig}>
                                        <span className={styles.ratingBigNum}>{ratingAvg.toFixed(1)}</span>
                                        <Stars value={ratingAvg} size="lg" />
                                        <span className={styles.ratingBigCount}>{ratingCount} đánh giá</span>
                                    </div>
                                    <div className={styles.ratingBreakdown}>
                                        {[5, 4, 3, 2, 1].map(star => {
                                            const count = product.ratings?.[`star${star}`] || 0;
                                            const pctBar = ratingCount > 0 ? (count / ratingCount) * 100 : 0;
                                            return (
                                                <div key={star} className={styles.breakdownRow}>
                                                    <span className={styles.breakdownStar}>{star}★</span>
                                                    <div className={styles.breakdownBar}>
                                                        <div className={styles.breakdownFill} style={{ width: `${pctBar}%` }} />
                                                    </div>
                                                    <span className={styles.breakdownCount}>{count}</span>
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>

                                {ratingCount === 0 && (
                                    <div className={styles.emptyTab}>
                                        <span>💬</span>
                                        <p>Chưa có đánh giá nào</p>
                                        <span className={styles.emptyHint}>Hãy là người đầu tiên đánh giá sản phẩm này!</span>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* ── RELATED PRODUCTS ── */}
            {related.length > 0 && (
                <section className={styles.relatedSection}>
                    <div className={styles.relatedInner}>
                        <div className={styles.relatedHeader}>
                            <span className={styles.relatedLabel}>// SẢN PHẨM LIÊN QUAN</span>
                            <span className={styles.relatedLine} />
                        </div>
                        <div className={styles.relatedGrid}>
                            {related.map((prod) => (
                                <ProductCard
                                    key={prod._id}
                                    product={{
                                        _id: prod._id,
                                        name: prod.name,
                                        slug: prod.slug,
                                        sku: prod.sku || '',
                                        brand: prod.brand || { name: '' },
                                        images: prod.images || [],
                                        basePrice: Number(prod.basePrice) || 0,
                                        salePrice: prod.salePrice ? Number(prod.salePrice) : null,
                                        stock: prod.stock ?? 0,
                                        ratings: prod.ratings || { avg: 0, count: 0 },
                                        tags: prod.tags || [],
                                        category: prod.category,
                                        specs: prod.specs || {},
                                    }}
                                    onAddToCart={() => { }}
                                />
                            ))}
                        </div>
                    </div>
                </section>
            )}
        </div>
    );
}
