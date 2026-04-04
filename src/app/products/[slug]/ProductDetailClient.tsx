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
import LazyImage from "@/components/ui/LazyImage";
import styles from "./page.module.scss";
import { useToast } from "@/components/ui";
import { useCart } from "@/contexts/CartContext";
import { useSiteSettings } from "@/contexts/SiteSettingsContext";

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

// ── INSTALLMENT HELPERS ───────────────────────────────────
interface InstallmentPlan { provider: string; term: number; entries: { loanAmount: number; monthly: number }[] }

function calculateMonthly(price: number, entries: { loanAmount: number; monthly: number }[]) {
    if (!entries.length) return null;
    
    // Ensure entries are sorted
    const sorted = [...entries].sort((a, b) => a.loanAmount - b.loanAmount);
    
    if (price < sorted[0].loanAmount) return null;
    
    // Find lower and upper bounds
    let lower = sorted[0];
    let upper = sorted[0];
    
    for (let i = 0; i < sorted.length; i++) {
        if (sorted[i].loanAmount <= price) {
            lower = sorted[i];
            upper = sorted[i + 1] || sorted[i];
        } else {
            break;
        }
    }
    
    if (lower === upper || price === lower.loanAmount) return lower;
    
    // Linear interpolation for "chuẩn" calculation
    const ratio = (price - lower.loanAmount) / (upper.loanAmount - lower.loanAmount);
    const interpolatedMonthly = lower.monthly + (upper.monthly - lower.monthly) * ratio;
    
    return {
        loanAmount: price, // exact match now
        monthly: Math.round(interpolatedMonthly),
        isInterpolated: true,
        baseMốc: lower.loanAmount
    };
}

function fmtShort(n: number) {
    return new Intl.NumberFormat("vi-VN").format(n) + "đ";
}

function parseVND(raw: string): number {
    return Number(raw.replace(/\D/g, "")) || 0;
}

function InstallmentTab({ price }: { price: number }) {
    const siteSettings = useSiteSettings();
    const [plans, setPlans] = useState<InstallmentPlan[]>([]);
    const [providers, setProviders] = useState<string[]>([]);
    const [provider, setProvider] = useState("");
    const [downRaw, setDownRaw] = useState("");
    const [loaded, setLoaded] = useState(false);

    useEffect(() => {
        fetch("/api/installments?active=true")
            .then(r => r.json())
            .then(json => {
                if (json.success && json.data?.length) {
                    setPlans(json.data);
                    const provs = [...new Set(json.data.map((p: InstallmentPlan) => p.provider))] as string[];
                    setProviders(provs);
                    setProvider(provs[0] || "");
                }
                setLoaded(true);
            })
            .catch(() => setLoaded(true));
    }, []);

    const downPayment = parseVND(downRaw);
    const loanAmount = Math.max(price - downPayment, 0);
    const downError = downPayment > 0 && downPayment >= price;

    const providerPlans = plans
        .filter(p => p.provider === provider)
        .sort((a, b) => a.term - b.term);

    const handleDownInput = (e: React.ChangeEvent<HTMLInputElement>) => {
        const num = parseVND(e.target.value);
        setDownRaw(num ? new Intl.NumberFormat("vi-VN").format(num) : "");
    };

    if (!loaded) return <div className={styles.emptyTab}><p>Đang tải bảng trả góp...</p></div>;
    if (providers.length === 0) return (
        <div className={styles.emptyTab}>
            <span>💳</span>
            <p>Chưa có bảng trả góp nào</p>
            <span className={styles.emptyHint}>{`Vui lòng liên hệ ${siteSettings.storeName} để được tư vấn trả góp.`}</span>
        </div>
    );

    // Find min loan for current provider
    const allEntries = providerPlans.flatMap(p => p.entries);
    const minLoan = allEntries.length > 0 ? Math.min(...allEntries.map(e => e.loanAmount)) : 0;

    return (
        <div className={styles.installmentTab}>
            <div className={styles.installProviders}>
                {providers.map(p => (
                    <button
                        key={p}
                        className={`${styles.providerBtn} ${provider === p ? styles.providerActive : ""}`}
                        onClick={() => setProvider(p)}
                    >
                        {p}
                    </button>
                ))}
            </div>

            <div className={styles.installInputRow}>
                <div className={styles.installPriceBox}>
                    <span className={styles.installLabel}>Giá sản phẩm</span>
                    <strong>{fmtShort(price)}</strong>
                </div>
                <div className={styles.installDownBox}>
                    <label className={styles.installLabel} htmlFor="down-payment">Trả trước (VNĐ)</label>
                    <input
                        id="down-payment"
                        type="text"
                        inputMode="numeric"
                        className={styles.installInput}
                        placeholder="Ví dụ: 3.000.000"
                        value={downRaw}
                        onChange={handleDownInput}
                    />
                </div>
            </div>

            {downError && (
                <div className={styles.installError}>Số tiền trả trước phải nhỏ hơn giá sản phẩm</div>
            )}

            {loanAmount > 0 && !downError && (
                <div className={styles.installLoan}>
                    Số tiền cần trả góp: <strong>{fmtShort(loanAmount)}</strong>
                </div>
            )}

            {!downError && loanAmount > 0 && providerPlans.length > 0 ? (
                loanAmount < minLoan ? (
                    <div className={styles.emptyTab}>
                        <span>💳</span>
                        <p>Số tiền trả góp chưa đủ điều kiện qua {provider}</p>
                        <span className={styles.emptyHint}>Mức tối thiểu: {fmtShort(minLoan)}</span>
                    </div>
                ) : (
                    <div className={styles.installGrid}>
                        {providerPlans.map(plan => {
                            const match = calculateMonthly(loanAmount, plan.entries);
                            if (!match) return null;
                            return (
                                <div key={plan.term} className={styles.installCard}>
                                    <div className={styles.installTerm}>{plan.term} tháng</div>
                                    <div className={styles.installMonthly}>{fmtShort(match.monthly)}<span>/tháng</span></div>
                                    <div className={styles.installTotal}>Tổng: {fmtShort(match.monthly * plan.term)}</div>
                                    {(match as any).isInterpolated && (
                                        <div className={styles.installNote}>TB lãi suất mốc {fmtShort((match as any).baseMốc)}</div>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                )
            ) : !downError && loanAmount <= 0 && (
                <div className={styles.emptyTab}>
                    <span>💳</span>
                    <p>Nhập số tiền trả trước để xem bảng trả góp</p>
                </div>
            )}

            <div className={styles.installInfo}>
                <p>⚠ Bảng lãi suất chỉ có tính chất minh họa, tùy vào từng giấy tờ mà khách hàng cung cấp sẽ có lãi suất thấp hoặc cao hơn.</p>
                <p>📋 Thủ tục: CCCD gắn chip (dưới 20 triệu). Trên 20 triệu liên hệ nhân viên tư vấn.</p>
                <p>📞 Liên hệ: <strong>0344365847</strong> (Zalo) — Nhân viên Thái Hiền</p>
            </div>
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
    const [loadingProduct, setLoadingProduct] = useState(true);
    const [related, setRelated] = useState<any[]>([]);
    const [loadingRelated, setLoadingRelated] = useState(false);

    const [activeImg, setActiveImg] = useState(0);
    const [lightboxOpen, setLightboxOpen] = useState(false);
    const [qty, setQty] = useState(1);
    const [addedToCart, setAddedToCart] = useState(false);
    const [wishlisted, setWishlisted] = useState(false);
    const [selectedVariant, setSelectedVariant] = useState<number | null>(null);
    const [activeTab, setActiveTab] = useState<"desc" | "specs" | "reviews" | "installment">("desc");
    const [scrolledPast, setScrolledPast] = useState(false);

    useEffect(() => {
        const handleScroll = () => {
            setScrolledPast(window.scrollY > 800);
        };
        window.addEventListener("scroll", handleScroll);
        return () => window.removeEventListener("scroll", handleScroll);
    }, []);

    const imgRef = useRef<HTMLDivElement>(null);

    // Fetch product data — không block bởi related
    useEffect(() => {
        if (!slug) return;
        const fetchProduct = async () => {
            try {
                const res = await fetch(`/api/products/${slug}`);
                const data = await res.json();
                if (data.success) {
                    setProduct(data.data);
                } else {
                    error("Không tìm thấy sản phẩm");
                }
            } catch (e: any) {
                error(e.message || "Lỗi tải sản phẩm");
            } finally {
                setLoadingProduct(false);
            }
        };
        fetchProduct();
    }, [slug, error]);

    // Fetch related products — chạy độc lập sau khi có product
    useEffect(() => {
        if (!product?.category?._id) return;
        setLoadingRelated(true);
        fetch(`/api/products?category=${product.category._id}&limit=4&active=true`)
            .then(r => r.json())
            .then(relData => {
                if (relData.success) {
                    setRelated(relData.data.filter((p: any) => p._id !== product._id));
                }
            })
            .catch(() => {})
            .finally(() => setLoadingRelated(false));
    }, [product?._id, product?.category?._id]);

    // Check wishlist
    useEffect(() => {
        if (!product) return;
        try {
            const wl = JSON.parse(localStorage.getItem("nexgear_wishlist") || "[]");
            setWishlisted(wl.includes(product._id));
        } catch { }
    }, [product]);

    // ── SKELETON UI ──────────────────────────────────────────
    if (loadingProduct) {
        return (
            <div className={styles.page}>
                {/* Breadcrumb skeleton */}
                <div className={styles.breadcrumbBar}>
                    <div className={styles.breadcrumbInner}>
                        <div className={styles.skeletonBreadcrumb}>
                            <span className={styles.skeletonPill} style={{ width: 60 }} />
                            <span className={styles.skeletonDot} />
                            <span className={styles.skeletonPill} style={{ width: 80 }} />
                            <span className={styles.skeletonDot} />
                            <span className={styles.skeletonPill} style={{ width: 200 }} />
                        </div>
                    </div>
                </div>

                {/* Main skeleton — gallery + info */}
                <div className={styles.productMain}>
                    <div className={styles.productMainInner}>
                        {/* Gallery skeleton */}
                        <div className={styles.galleryCol}>
                            <div className={styles.gallerySticky}>
                                <div className={styles.skeletonMainImg} />
                                <div className={styles.skeletonThumbRow}>
                                    {[0,1,2,3].map(i => (
                                        <div key={i} className={styles.skeletonThumb} />
                                    ))}
                                </div>
                            </div>
                        </div>

                        {/* Info skeleton */}
                        <div className={styles.infoCol}>
                            <div className={styles.skeletonBrandRow}>
                                <div className={styles.skeletonBlock} style={{ width: 80, height: 24, borderRadius: 9999 }} />
                                <div className={styles.skeletonBlock} style={{ width: 48, height: 20 }} />
                            </div>
                            <div className={styles.skeletonBlock} style={{ width: '90%', height: 40 }} />
                            <div className={styles.skeletonBlock} style={{ width: '60%', height: 28 }} />
                            <div className={styles.skeletonInfoRow}>
                                <div className={styles.skeletonBlock} style={{ width: 80, height: 16 }} />
                                <div className={styles.skeletonBlock} style={{ width: 120, height: 16 }} />
                                <div className={styles.skeletonBlock} style={{ width: 100, height: 16 }} />
                            </div>
                            <div className={styles.skeletonPriceCard}>
                                <div className={styles.skeletonBlock} style={{ width: 200, height: 44 }} />
                            </div>
                            <div className={styles.skeletonDivider} />
                            <div className={styles.skeletonBlock} style={{ width: '100%', height: 48 }} />
                            <div className={styles.skeletonBlock} style={{ width: '100%', height: 48 }} />
                            <div className={styles.skeletonServiceGrid}>
                                {[0,1,2,3].map(i => (
                                    <div key={i} className={styles.skeletonServiceCard} />
                                ))}
                            </div>
                        </div>
                    </div>
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
            {/* ── STICKY BUY BAR (VISIBLE ON SCROLL) ── */}
            <div className={`${styles.stickyBar} ${scrolledPast ? styles.stickyBarShow : ""}`}>
                <div className={styles.stickyBarInner}>
                    <div className={styles.stickyProduct}>
                        <LazyImage src={images[0]} alt={product.name} width={48} height={48} objectFit="cover" borderRadius={4} />
                        <div>
                            <div className={styles.stickyName}>{product.name}</div>
                            <div className={styles.stickyPrice}>{fmt(currentPrice)}</div>
                        </div>
                    </div>
                    <div className={styles.stickyActions}>
                        <button className={styles.buyBtn} onClick={handleBuyNow}>MUA NGAY</button>
                    </div>
                </div>
            </div>

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
                                        <LazyImage src={img} alt={`${product.name} ${i + 1}`} fill objectFit="cover" />
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
                                                <LazyImage src={v.images[0]} alt="" width={40} height={40} objectFit="cover" borderRadius={4} className={styles.variantThumb} />
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

                        {/* ── SERVICE GRID ── */}
                        <div className={styles.serviceGrid}>
                            <div className={styles.serviceCard}>
                                <div className={styles.serviceIcon}>🚚</div>
                                <div className={styles.serviceInfo}>
                                    <span className={styles.serviceTitle}>Giao hàng nhanh</span>
                                    <span className={styles.serviceDesc}>Miễn phí từ 2.000.000đ</span>
                                </div>
                            </div>
                            <div className={styles.serviceCard}>
                                <div className={styles.serviceIcon}>🛡️</div>
                                <div className={styles.serviceInfo}>
                                    <span className={styles.serviceTitle}>Bảo hành chính hãng</span>
                                    <span className={styles.serviceDesc}>Từ 12 - 24 tháng</span>
                                </div>
                            </div>
                            <div className={styles.serviceCard}>
                                <div className={styles.serviceIcon}>🔄</div>
                                <div className={styles.serviceInfo}>
                                    <span className={styles.serviceTitle}>Đổi trả dễ dàng</span>
                                    <span className={styles.serviceDesc}>Trong vòng 7 ngày</span>
                                </div>
                            </div>
                            <div className={styles.serviceCard}>
                                <div className={styles.serviceIcon}>💳</div>
                                <div className={styles.serviceInfo}>
                                    <span className={styles.serviceTitle}>Trả góp 0%</span>
                                    <span className={styles.serviceDesc}>Qua thẻ tín dụng</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* ── DETAIL TABS ── */}
            <section id="detail-tabs" className={styles.detailSection}>
                <div className={styles.detailInner}>

                    {/* Tab navigation */}
                    <div className={styles.tabNav}>
                        <div className={styles.tabNavLine} />
                        {[
                            { id: "desc" as const, label: "Mô tả chi tiết", icon: "📝" },
                            { id: "specs" as const, label: "Thông số kỹ thuật", icon: "⚙" },
                            { id: "installment" as const, label: "Trả góp", icon: "💳" },
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

                        {/* Installment Tab */}
                        {activeTab === "installment" && (
                            <InstallmentTab price={currentPrice} />
                        )}
                    </div>
                </div>
            </section>

            {/* ── RELATED PRODUCTS ── */}
            {(loadingRelated || related.length > 0) && (
                <section className={styles.relatedSection}>
                    <div className={styles.relatedInner}>
                        <div className={styles.relatedHeader}>
                            <span className={styles.relatedLabel}>// SẢN PHẨM LIÊN QUAN</span>
                            <span className={styles.relatedLine} />
                        </div>
                        {loadingRelated ? (
                            <div className={styles.relatedGrid}>
                                {[0,1,2,3].map(i => (
                                    <div key={i} className={styles.skeletonRelatedCard} />
                                ))}
                            </div>
                        ) : (
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
                        )}
                    </div>
                </section>
            )}
        </div>
    );
}
