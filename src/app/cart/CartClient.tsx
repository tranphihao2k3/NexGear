"use client";

import React, { useState } from "react";
import Link from "next/link";
import Button from "@/components/ui/Button";
import LazyImage from "@/components/ui/LazyImage";
import { useCart, CartItem } from "@/contexts/CartContext";
import styles from "./page.module.scss";

// Removing hardcoded COUPON_CODES
function fmt(n: number) {
    return new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(n);
}

function cartKey(i: CartItem) {
    return i.variant ? `${i.productId}_${i.variant}` : i.productId;
}

function CartItemRow({
    item, checked, onCheck, onQty, onRemove,
}: {
    item: CartItem; checked: boolean;
    onCheck: () => void; onQty: (delta: number) => void; onRemove: () => void;
}) {
    const price = item.salePrice ?? item.basePrice;
    const pct = item.salePrice ? Math.round((1 - item.salePrice / item.basePrice) * 100) : 0;

    return (
        <div className={`${styles.cartItem} ${checked ? styles.cartItemChecked : ""}`}>
            <label className={styles.checkWrap} aria-label="Chọn sản phẩm">
                <input type="checkbox" className={styles.checkNative} checked={checked} onChange={onCheck} />
                <span className={styles.checkBox} />
            </label>
            <div className={styles.itemImg}>
                {item.image ? (
                    <LazyImage src={item.image} alt={item.name} fill objectFit="cover" borderRadius={4} />
                ) : (
                    <span className={styles.itemImgFallback}>📷</span>
                )}
                {pct > 0 && <span className={styles.itemSaleBadge}>-{pct}%</span>}
            </div>
            <div className={styles.itemInfo}>
                <div className={styles.itemBrand}>{item.brand}</div>
                <Link href={`/products/${item.slug}`} className={styles.itemName}>{item.name}</Link>
                {item.variant && <div className={styles.itemVariant}>{item.variant}</div>}
                <div className={styles.itemSku}>SKU: {item.sku}</div>
            </div>
            <div className={styles.itemPriceCol}>
                <span className={styles.itemPrice}>{fmt(price)}</span>
                {item.salePrice && <span className={styles.itemOldPrice}>{fmt(item.basePrice)}</span>}
            </div>
            <div className={styles.itemQtyCol}>
                <div className={styles.qtyStepper}>
                    <button className={styles.qtyBtn} onClick={() => onQty(-1)} disabled={item.qty <= 1}>−</button>
                    <span className={styles.qtyNum}>{item.qty}</span>
                    <button className={styles.qtyBtn} onClick={() => onQty(1)} disabled={item.qty >= item.stock}>+</button>
                </div>
                {item.qty >= item.stock && <span className={styles.stockWarn}>Tối đa {item.stock}</span>}
            </div>
            <div className={styles.itemTotal}>{fmt(price * item.qty)}</div>
            <button className={styles.removeBtn} onClick={onRemove} aria-label="Xóa sản phẩm" title="Xóa">✕</button>
        </div>
    );
}

export default function CartPage() {
    const { items, updateQty, removeItem } = useCart();
    const [checked, setChecked] = useState<Set<string>>(() => new Set(items.map(cartKey)));
    const [couponCode, setCouponCode] = useState("");
    const [couponInput, setCouponInput] = useState("");
    const [couponErr, setCouponErr] = useState("");
    const [couponOk, setCouponOk] = useState(false);
    const [couponDiscount, setCouponDiscount] = useState<{ type: string, value: number } | null>(null);

    // Sync checked when items change
    React.useEffect(() => {
        setChecked(prev => {
            const validKeys = new Set(items.map(cartKey));
            const next = new Set<string>();
            prev.forEach(k => { if (validKeys.has(k)) next.add(k); });
            // Auto-check new items
            items.forEach(i => { if (!prev.size || prev.has(cartKey(i))) next.add(cartKey(i)); });
            return next;
        });
    }, [items]);

    const allChecked = checked.size === items.length && items.length > 0;

    function toggleAll() {
        if (allChecked) setChecked(new Set());
        else setChecked(new Set(items.map(cartKey)));
    }

    function toggleItem(key: string) {
        const next = new Set(checked);
        next.has(key) ? next.delete(key) : next.add(key);
        setChecked(next);
    }

    async function applyCoupon() {
        const code = couponInput.trim().toUpperCase();
        if (!code) return;
        setCouponErr("");
        setCouponOk(false);
        try {
            const res = await fetch(`/api/coupons?code=${code}&active=true`);
            const json = await res.json();
            if (json.success && json.data.length > 0) {
                const coupon = json.data[0];
                setCouponCode(code);
                setCouponDiscount({ type: coupon.type, value: coupon.value });
                setCouponOk(true);
            } else {
                setCouponErr("Mã không hợp lệ hoặc đã hết hạn");
            }
        } catch (err) {
            setCouponErr("Lỗi kiểm tra mã");
        }
    }

    const selectedItems = items.filter(i => checked.has(cartKey(i)));
    const subtotal = selectedItems.reduce((s, i) => s + (i.salePrice ?? i.basePrice) * i.qty, 0);
    let discAmt = 0;
    if (couponDiscount) {
        if (couponDiscount.type === 'percent') {
            discAmt = Math.round(subtotal * (couponDiscount.value / 100));
        } else {
            discAmt = couponDiscount.value;
        }
        if (discAmt > subtotal) discAmt = subtotal;
    }
    const shipping = subtotal >= 1_000_000 ? 0 : 30_000;
    const total = subtotal - discAmt + shipping;

    return (
        <div className={styles.page}>
            <div className={styles.breadcrumbBar}>
                <div className={styles.breadcrumbInner}>
                    <nav className={styles.breadcrumb}>
                        <Link href="/" className={styles.bcLink}>Trang chủ</Link>
                        <span className={styles.bcSep}>›</span>
                        <span className={styles.bcCurrent}>Giỏ hàng ({items.length})</span>
                    </nav>
                </div>
            </div>

            <div className={styles.pageInner}>
                <div className={styles.pageGrid}>
                    <div className={styles.cartCol}>
                        <div className={styles.cartCard}>
                            <div className={styles.cartHeader}>
                                <label className={styles.checkWrap} style={{ marginRight: 0 }}>
                                    <input type="checkbox" className={styles.checkNative} checked={allChecked} onChange={toggleAll} />
                                    <span className={styles.checkBox} />
                                </label>
                                <span className={styles.cartHeaderText}>Chọn tất cả ({items.length} sản phẩm)</span>
                                {checked.size > 0 && (
                                    <button className={styles.deleteSelectedBtn} onClick={() => {
                                        items.filter(i => checked.has(cartKey(i))).forEach(i => removeItem(i.productId, i.variant));
                                        setChecked(new Set());
                                    }}>
                                        Xóa đã chọn ({checked.size})
                                    </button>
                                )}
                                <div className={styles.colLabels}>
                                    <span>Đơn giá</span><span>Số lượng</span><span>Thành tiền</span>
                                </div>
                            </div>

                            {items.length === 0 ? (
                                <div className={styles.emptyCart}>
                                    <div className={styles.emptyIcon}>🛒</div>
                                    <p className={styles.emptyText}>Giỏ hàng trống</p>
                                    <Button variant="cyan" size="lg" href="/products">TIẾP TỤC MUA SẮM →</Button>
                                </div>
                            ) : (
                                <div className={styles.itemList}>
                                    {items.map(item => (
                                        <CartItemRow
                                            key={cartKey(item)}
                                            item={item}
                                            checked={checked.has(cartKey(item))}
                                            onCheck={() => toggleItem(cartKey(item))}
                                            onQty={d => updateQty(item.productId, item.qty + d, item.variant)}
                                            onRemove={() => removeItem(item.productId, item.variant)}
                                        />
                                    ))}
                                </div>
                            )}
                        </div>

                        <div className={styles.couponCard}>
                            <div className={styles.couponTitle}>🎟 Mã Giảm Giá</div>
                            <div className={styles.couponRow}>
                                <input
                                    className={`${styles.couponInput} ${couponErr ? styles.couponInputErr : ""} ${couponOk ? styles.couponInputOk : ""}`}
                                    placeholder="Nhập mã giảm giá..."
                                    value={couponInput}
                                    onChange={e => { setCouponInput(e.target.value); setCouponErr(""); }}
                                    onKeyDown={e => e.key === "Enter" && applyCoupon()}
                                />
                                <Button variant="cyan" size="md" onClick={applyCoupon}>ÁP DỤNG</Button>
                            </div>
                            {couponErr && <div className={styles.couponMsg + " " + styles.couponMsgErr}>✕ {couponErr}</div>}
                            {couponOk && (
                                <div className={styles.couponMsg + " " + styles.couponMsgOk}>
                                    ✓ Mã <strong>{couponCode}</strong> — Giảm {couponDiscount?.type === 'percent' ? `${couponDiscount.value}%` : fmt(couponDiscount?.value || 0)} (-{fmt(discAmt)})
                                    <button className={styles.removeCoupon} onClick={() => { setCouponCode(""); setCouponDiscount(null); setCouponOk(false); setCouponInput(""); }}>Xóa ✕</button>
                                </div>
                            )}
                            <div className={styles.couponHint}>Thử: THANHVO10 · SUMMER15 · NEWUSER20</div>
                        </div>
                        <Link href="/products" className={styles.continueShopping}>← Tiếp tục mua sắm</Link>
                    </div>

                    <aside className={styles.summaryCol}>
                        <div className={styles.summaryCard}>
                            <h2 className={styles.summaryTitle}>Tóm Tắt Đơn Hàng</h2>
                            <div className={styles.summaryRows}>
                                <div className={styles.summaryRow}><span>Tạm tính ({selectedItems.length} SP)</span><span>{fmt(subtotal)}</span></div>
                                {discAmt > 0 && <div className={`${styles.summaryRow} ${styles.summaryRowDisc}`}><span>Giảm giá ({couponCode})</span><span>-{fmt(discAmt)}</span></div>}
                                <div className={styles.summaryRow}>
                                    <span>Phí vận chuyển</span>
                                    <span className={shipping === 0 ? styles.freeShip : ""}>{shipping === 0 ? "MIỄN PHÍ" : fmt(shipping)}</span>
                                </div>
                                {shipping > 0 && subtotal > 0 && <div className={styles.shipNote}>Mua thêm {fmt(1_000_000 - subtotal)} để miễn phí ship</div>}
                            </div>
                            <div className={styles.summaryDivider} />
                            <div className={styles.totalRow}><span className={styles.totalLabel}>Tổng cộng</span><span className={styles.totalAmount}>{fmt(total)}</span></div>
                            <div className={styles.totalVat}>Đã bao gồm VAT</div>
                            <div className={styles.summaryActions}>
                                <Button variant="primary" size="xl" fullWidth href={selectedItems.length > 0 ? `/checkout${couponCode ? `?coupon=${couponCode}` : ''}` : undefined} disabled={selectedItems.length === 0}>
                                    TIẾN HÀNH THANH TOÁN →
                                </Button>
                                <div className={styles.secureNote}>🔒 Thanh toán an toàn, mã hóa SSL</div>
                            </div>
                            <div className={styles.payBadges}>
                                {["VNPay", "Visa", "Mastercard", "COD", "Transfer"].map(b => (
                                    <span key={b} className={styles.payBadge}>{b}</span>
                                ))}
                            </div>
                        </div>
                    </aside>
                </div>
            </div>
        </div>
    );
}
