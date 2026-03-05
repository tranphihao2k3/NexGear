"use client";

import React, { useState, useEffect, Suspense } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useSession } from "next-auth/react";
import Button from "@/components/ui/Button";
import { useCart } from "@/contexts/CartContext";
import styles from "./page.module.scss";

const TINH_LIST = ["Hà Nội", "TP. Hồ Chí Minh", "Đà Nẵng", "Hải Phòng", "Cần Thơ", "Bình Dương", "Đồng Nai"];

const SHIPPING_OPTIONS = [
    { id: "standard", label: "GHN Giao thường", desc: "2–3 ngày làm việc", fee: 30_000, icon: "📦" },
    { id: "express", label: "GHN Giao nhanh", desc: "Trong ngày / 2H nội thành", fee: 50_000, icon: "⚡" },
    { id: "pickup", label: "Nhận tại cửa hàng", desc: "123 Lê Văn Việt, Q.9, TP.HCM", fee: 0, icon: "🏪" },
];

const PAYMENT_OPTIONS = [
    { id: "vnpay", label: "VNPay QR", desc: "Quét mã QR bằng app ngân hàng", icon: "📱" },
    { id: "atm", label: "ATM / Visa", desc: "Thẻ nội địa hoặc quốc tế", icon: "💳" },
    { id: "transfer", label: "Chuyển khoản", desc: "STK: 0123456789 · MB Bank · NEXGEAR", icon: "🏦" },
    { id: "cod", label: "COD", desc: "Thanh toán khi nhận hàng", icon: "💵" },
];

function fmt(n: number) {
    return new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(n);
}

function StepBar({ step }: { step: number }) {
    const steps = ["Thông tin", "Vận chuyển", "Thanh toán"];
    return (
        <div className={styles.stepBar}>
            {steps.map((label, i) => {
                const idx = i + 1;
                return (
                    <React.Fragment key={idx}>
                        <div className={`${styles.stepItem} ${step === idx ? styles.stepActive : ""} ${step > idx ? styles.stepDone : ""}`}>
                            <div className={styles.stepCircle}>{step > idx ? "✓" : idx}</div>
                            <span className={styles.stepLabel}>{label}</span>
                        </div>
                        {i < steps.length - 1 && <div className={`${styles.stepLine} ${step > idx ? styles.stepLineDone : ""}`} />}
                    </React.Fragment>
                );
            })}
        </div>
    );
}

function RadioCard({ id, name, label, desc, icon, fee, active, onClick }: {
    id: string; name: string; label: string; desc: string; icon: string; fee?: number; active: boolean; onClick: () => void;
}) {
    return (
        <label className={`${styles.radioCard} ${active ? styles.radioCardActive : ""}`} htmlFor={id} onClick={onClick}>
            <input type="radio" id={id} name={name} className={styles.radioNative} readOnly checked={active} />
            <span className={styles.radioIcon}>{icon}</span>
            <div className={styles.radioInfo}>
                <div className={styles.radioLabel}>{label}</div>
                <div className={styles.radioDesc}>{desc}</div>
            </div>
            {fee !== undefined && (
                <div className={styles.radioFee}>{fee === 0 ? <span className={styles.feeFree}>MIỄN PHÍ</span> : fmt(fee)}</div>
            )}
            <span className={styles.radioCheck} />
        </label>
    );
}

function CheckoutPageInner() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const { data: session } = useSession();
    const { items, clearCart } = useCart();
    const [step, setStep] = useState(1);
    const [form, setForm] = useState({ name: "", phone: "", email: "", tinh: "", huyen: "", xa: "", address: "", note: "" });
    const [errors, setErrors] = useState<Record<string, string>>({});
    const [shipping, setShipping] = useState("standard");
    const [payment, setPayment] = useState("vnpay");
    const [placing, setPlacing] = useState(false);
    const [couponCode, setCouponCode] = useState<string | null>(null);
    const [couponDiscount, setCouponDiscount] = useState<{ type: string, value: number, _id: string } | null>(null);

    useEffect(() => {
        const code = searchParams.get('coupon');
        if (code) {
            fetch(`/api/coupons?code=${code}&active=true`)
                .then(res => res.json())
                .then(json => {
                    if (json.success && json.data.length > 0) {
                        const coupon = json.data[0];
                        setCouponCode(code);
                        setCouponDiscount({ type: coupon.type, value: coupon.value, _id: coupon._id });
                    }
                });
        }
    }, [searchParams]);

    const shippingFee = SHIPPING_OPTIONS.find(o => o.id === shipping)?.fee ?? 0;
    const subtotal = items.reduce((s, i) => s + (i.salePrice ?? i.basePrice) * i.qty, 0);

    let discAmt = 0;
    if (couponDiscount) {
        if (couponDiscount.type === 'percent') {
            discAmt = Math.round(subtotal * (couponDiscount.value / 100));
        } else {
            discAmt = couponDiscount.value;
        }
        if (discAmt > subtotal) discAmt = subtotal;
    }

    const total = subtotal - discAmt + shippingFee;

    function validateStep1() {
        const errs: Record<string, string> = {};
        if (!form.name.trim()) errs.name = "Vui lòng nhập họ tên";
        if (!form.phone.match(/^0\d{9}$/)) errs.phone = "Số điện thoại không hợp lệ";
        if (!form.email.includes("@")) errs.email = "Email không hợp lệ";
        if (!form.tinh) errs.tinh = "Chọn tỉnh/thành";
        if (!form.address.trim()) errs.address = "Nhập địa chỉ cụ thể";
        setErrors(errs);
        return Object.keys(errs).length === 0;
    }

    function nextStep() {
        if (step === 1 && !validateStep1()) return;
        setStep(s => Math.min(3, s + 1));
    }

    async function handlePlace() {
        setPlacing(true);
        try {
            const paymentMethodMap: Record<string, string> = { vnpay: "vnpay", atm: "stripe", transfer: "transfer", cod: "cash" };
            const body = {
                channel: "online",
                user: (session?.user as any)?.id || null,
                customerInfo: { name: form.name, phone: form.phone, email: form.email },
                items: items.map(i => ({
                    product: i.productId,
                    variant: i.variantIndex ?? null,
                    name: i.name,
                    sku: i.sku,
                    qty: i.qty,
                    unitPrice: i.salePrice ?? i.basePrice,
                })),
                shippingAddress: {
                    name: form.name, phone: form.phone,
                    address: form.address, ward: form.xa, district: form.huyen, province: form.tinh,
                },
                shippingFee,
                shippingProvider: SHIPPING_OPTIONS.find(o => o.id === shipping)?.label || "",
                payment: { method: paymentMethodMap[payment] || "cash", status: payment === "cod" ? "pending" : "pending" },
                notes: form.note || "",
                discount: discAmt,
                coupon: couponDiscount?._id || undefined,
            };

            const res = await fetch("/api/orders", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
            const data = await res.json();

            if (data.success || data.data) {
                const order = data.data || data;
                clearCart();
                const m = order.payment?.method;
                if (m === 'vnpay' || m === 'stripe') {
                    router.push(`/payment/mock-gateway?orderId=${order._id}&method=${m}`);
                } else {
                    router.push(`/orders/success?orderId=${order._id}`);
                }
            } else {
                alert("Đặt hàng thất bại: " + (data.message || "Lỗi không xác định"));
            }
        } catch (err: any) {
            alert("Lỗi kết nối: " + err.message);
        } finally {
            setPlacing(false);
        }
    }

    // Redirect if cart empty
    if (items.length === 0) {
        return (
            <div className={styles.page}>
                <div className={styles.successWrap}>
                    <div className={styles.successIcon}>🛒</div>
                    <h1 className={styles.successTitle}>Giỏ hàng trống</h1>
                    <p className={styles.successSub}>Vui lòng thêm sản phẩm vào giỏ trước khi thanh toán.</p>
                    <div className={styles.successActions}>
                        <Button variant="cyan" size="lg" href="/products">MUA SẮM NGAY →</Button>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className={styles.page}>
            <div className={styles.breadcrumbBar}>
                <div className={styles.breadcrumbInner}>
                    <nav className={styles.breadcrumb}>
                        <Link href="/" className={styles.bcLink}>Trang chủ</Link>
                        <span className={styles.bcSep}>›</span>
                        <Link href="/cart" className={styles.bcLink}>Giỏ hàng</Link>
                        <span className={styles.bcSep}>›</span>
                        <span className={styles.bcCurrent}>Thanh toán</span>
                    </nav>
                </div>
            </div>

            <div className={styles.pageInner}>
                <StepBar step={step} />
                <div className={styles.pageGrid}>
                    <div className={styles.formCol}>
                        {step === 1 && (
                            <div className={styles.formCard}>
                                <h2 className={styles.formCardTitle}>① Thông Tin Giao Hàng</h2>
                                <div className={styles.formGrid2}>
                                    <div className={styles.fieldWrap}>
                                        <label className={styles.fieldLabel}>Họ và tên *</label>
                                        <input className={`${styles.fieldInput} ${errors.name ? styles.fieldInputErr : ""}`} placeholder="Nguyễn Văn A" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} />
                                        {errors.name && <span className={styles.fieldErr}>{errors.name}</span>}
                                    </div>
                                    <div className={styles.fieldWrap}>
                                        <label className={styles.fieldLabel}>Số điện thoại *</label>
                                        <input className={`${styles.fieldInput} ${errors.phone ? styles.fieldInputErr : ""}`} placeholder="0901234567" value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })} />
                                        {errors.phone && <span className={styles.fieldErr}>{errors.phone}</span>}
                                    </div>
                                </div>
                                <div className={styles.fieldWrap}>
                                    <label className={styles.fieldLabel}>Email *</label>
                                    <input type="email" className={`${styles.fieldInput} ${errors.email ? styles.fieldInputErr : ""}`} placeholder="your@email.com" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} />
                                    {errors.email && <span className={styles.fieldErr}>{errors.email}</span>}
                                </div>
                                <div className={styles.formGrid3}>
                                    <div className={styles.fieldWrap}>
                                        <label className={styles.fieldLabel}>Tỉnh / Thành *</label>
                                        <select className={`${styles.fieldSelect} ${errors.tinh ? styles.fieldInputErr : ""}`} value={form.tinh} onChange={e => setForm({ ...form, tinh: e.target.value, huyen: "", xa: "" })}>
                                            <option value="">Chọn tỉnh/thành</option>
                                            {TINH_LIST.map(t => <option key={t} value={t}>{t}</option>)}
                                        </select>
                                        {errors.tinh && <span className={styles.fieldErr}>{errors.tinh}</span>}
                                    </div>
                                    <div className={styles.fieldWrap}>
                                        <label className={styles.fieldLabel}>Quận / Huyện</label>
                                        <select className={styles.fieldSelect} value={form.huyen} disabled={!form.tinh} onChange={e => setForm({ ...form, huyen: e.target.value, xa: "" })}>
                                            <option value="">Chọn quận/huyện</option>
                                            {form.tinh && ["Quận 1", "Quận 2", "Quận 9", "Thủ Đức"].map(h => <option key={h} value={h}>{h}</option>)}
                                        </select>
                                    </div>
                                    <div className={styles.fieldWrap}>
                                        <label className={styles.fieldLabel}>Phường / Xã</label>
                                        <select className={styles.fieldSelect} value={form.xa} disabled={!form.huyen} onChange={e => setForm({ ...form, xa: e.target.value })}>
                                            <option value="">Chọn phường/xã</option>
                                            {form.huyen && ["Phường 1", "Phường 2", "Phường 3", "Phường Hiệp Phú"].map(x => <option key={x} value={x}>{x}</option>)}
                                        </select>
                                    </div>
                                </div>
                                <div className={styles.fieldWrap}>
                                    <label className={styles.fieldLabel}>Địa chỉ cụ thể *</label>
                                    <input className={`${styles.fieldInput} ${errors.address ? styles.fieldInputErr : ""}`} placeholder="Số nhà, tên đường..." value={form.address} onChange={e => setForm({ ...form, address: e.target.value })} />
                                    {errors.address && <span className={styles.fieldErr}>{errors.address}</span>}
                                </div>
                                <div className={styles.fieldWrap}>
                                    <label className={styles.fieldLabel}>Ghi chú (tùy chọn)</label>
                                    <textarea className={styles.fieldTextarea} placeholder="Ghi chú đặc biệt..." rows={3} value={form.note} onChange={e => setForm({ ...form, note: e.target.value })} />
                                </div>
                                <div className={styles.formActions}>
                                    <Button variant="cyan" size="lg" onClick={nextStep} fullWidth>TIẾP THEO: VẬN CHUYỂN →</Button>
                                </div>
                            </div>
                        )}

                        {step === 2 && (
                            <div className={styles.formCard}>
                                <h2 className={styles.formCardTitle}>② Phương Thức Vận Chuyển</h2>
                                <div className={styles.infoReview}>
                                    <div className={styles.infoReviewRow}><span className={styles.infoKey}>Giao đến:</span><span className={styles.infoVal}>{form.name} · {form.phone}</span></div>
                                    <div className={styles.infoReviewRow}><span className={styles.infoKey}>Địa chỉ:</span><span className={styles.infoVal}>{[form.address, form.xa, form.huyen, form.tinh].filter(Boolean).join(", ")}</span></div>
                                    <button className={styles.editBtn} onClick={() => setStep(1)}>Sửa ✎</button>
                                </div>
                                <div className={styles.radioGroup}>
                                    {SHIPPING_OPTIONS.map(opt => (
                                        <RadioCard key={opt.id} id={`ship-${opt.id}`} name="shipping" label={opt.label} desc={opt.desc} icon={opt.icon} fee={opt.fee} active={shipping === opt.id} onClick={() => setShipping(opt.id)} />
                                    ))}
                                </div>
                                <div className={styles.formActions}>
                                    <Button variant="ghost" size="md" onClick={() => setStep(1)}>← Quay lại</Button>
                                    <Button variant="cyan" size="lg" onClick={nextStep}>TIẾP THEO: THANH TOÁN →</Button>
                                </div>
                            </div>
                        )}

                        {step === 3 && (
                            <div className={styles.formCard}>
                                <h2 className={styles.formCardTitle}>③ Phương Thức Thanh Toán</h2>
                                <div className={styles.radioGroup}>
                                    {PAYMENT_OPTIONS.map(opt => (
                                        <RadioCard key={opt.id} id={`pay-${opt.id}`} name="payment" label={opt.label} desc={opt.desc} icon={opt.icon} active={payment === opt.id} onClick={() => setPayment(opt.id)} />
                                    ))}
                                </div>
                                {payment === "cod" && <div className={styles.codNote}>💡 COD: Phí thu hộ 10.000₫ sẽ được cộng khi giao hàng.</div>}
                                {payment === "transfer" && (
                                    <div className={styles.transferInfo}>
                                        <div className={styles.transferRow}><span>Ngân hàng:</span><strong>MB Bank</strong></div>
                                        <div className={styles.transferRow}><span>Số tài khoản:</span><strong>0123456789</strong></div>
                                        <div className={styles.transferRow}><span>Tên TK:</span><strong>NEXGEAR VIETNAM</strong></div>
                                        <div className={styles.transferRow}><span>Nội dung:</span><strong>NEXGEAR + SĐT</strong></div>
                                    </div>
                                )}
                                <div className={styles.termsNote}>
                                    Bằng cách đặt hàng, bạn đồng ý với{" "}
                                    <Link href="/warranty" className={styles.termsLink}>Điều khoản dịch vụ</Link> của NEXGEAR.
                                </div>
                                <div className={styles.formActions}>
                                    <Button variant="ghost" size="md" onClick={() => setStep(2)}>← Quay lại</Button>
                                    <Button variant="primary" size="xl" onClick={handlePlace} disabled={placing}>
                                        {placing ? "ĐANG XỬ LÝ..." : "ĐẶT HÀNG →"}
                                    </Button>
                                </div>
                            </div>
                        )}
                    </div>

                    <aside className={styles.summaryCol}>
                        <div className={styles.summaryCard}>
                            <h2 className={styles.summaryTitle}>Đơn Hàng Của Bạn</h2>
                            <div className={styles.summaryItems}>
                                {items.map(item => (
                                    <div key={item.productId + (item.variant || "")} className={styles.summaryItem}>
                                        <div className={styles.summaryItemImg}>
                                            {item.image ? <img src={item.image} alt="" style={{ width: "100%", height: "100%", objectFit: "cover", borderRadius: 4 }} /> : <span>📷</span>}
                                            <span className={styles.summaryItemQty}>{item.qty}</span>
                                        </div>
                                        <div className={styles.summaryItemInfo}>
                                            <div className={styles.summaryItemName}>{item.name}</div>
                                            <div className={styles.summaryItemVariant}>{item.variant || ""}</div>
                                        </div>
                                        <div className={styles.summaryItemPrice}>{fmt((item.salePrice ?? item.basePrice) * item.qty)}</div>
                                    </div>
                                ))}
                            </div>
                            <div className={styles.summaryDivider} />
                            <div className={styles.summaryRows}>
                                <div className={styles.summaryRow}><span>Tạm tính</span><span>{fmt(subtotal)}</span></div>
                                {discAmt > 0 && <div className={styles.summaryRow}><span>Giảm giá ({couponCode})</span><span>-{fmt(discAmt)}</span></div>}
                                <div className={styles.summaryRow}>
                                    <span>Vận chuyển</span>
                                    <span className={shippingFee === 0 ? styles.freeShip : ""}>{shippingFee === 0 ? "MIỄN PHÍ" : fmt(shippingFee)}</span>
                                </div>
                            </div>
                            <div className={styles.summaryDivider} />
                            <div className={styles.totalRow}><span className={styles.totalLabel}>Tổng cộng</span><span className={styles.totalAmount}>{fmt(total)}</span></div>
                            <div className={styles.totalVat}>Đã bao gồm VAT</div>
                        </div>
                    </aside>
                </div>
            </div>
        </div>
    );
}

export default function CheckoutPage() {
    return (
        <Suspense fallback={<div style={{ padding: 40, textAlign: 'center' }}>Đang tải thông tin...</div>}>
            <CheckoutPageInner />
        </Suspense>
    );
}
