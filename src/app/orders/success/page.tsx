"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import Button from "@/components/ui/Button";
import { useSiteSettings } from "@/contexts/SiteSettingsContext";
import styles from "./page.module.scss";

import { useSearchParams } from 'next/navigation';

function OrderSuccessPageInner() {
    const siteSettings = useSiteSettings();
    const searchParams = useSearchParams();
    const orderIdParam = searchParams.get('orderId');
    const [mounted, setMounted] = useState(false);
    const [order, setOrder] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        setMounted(true);
        if (orderIdParam) {
            fetch(`/api/orders/${orderIdParam}`)
                .then(res => res.json())
                .then(json => {
                    if (json.success) setOrder(json.data);
                    setLoading(false);
                })
                .catch(() => setLoading(false));
        } else {
            setLoading(false);
        }
    }, [orderIdParam]);

    if (loading) return <div style={{ padding: 40, textAlign: 'center' }}>Đang tải thông tin đơn hàng...</div>;
    if (!order) return <div style={{ padding: 40, textAlign: 'center' }}>Không tìm thấy đơn hàng.</div>;

    const orderId = order.orderCode;
    const email = order.customerInfo?.email;
    const dateStr = new Date(order.createdAt).toLocaleDateString("vi-VN");
    const totalFmt = new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(order.total);
    const paymentMethodMap: Record<string, string> = { vnpay: "Thanh toán VNPay", stripe: "Thẻ thanh toán (Stripe)", transfer: "Chuyển khoản", cash: "Thanh toán khi nhận hàng (COD)" };
    const pMethod = paymentMethodMap[order.payment?.method] || "Thanh toán";


    return (
        <div className={styles.page}>
            <div className={styles.container}>
                {/* Animated Checkmark */}
                <div className={`${styles.checkWrap} ${mounted ? styles.animate : ""}`}>
                    <div className={styles.checkCircle}>
                        <svg viewBox="0 0 52 52" className={styles.checkSvg}>
                            <circle className={styles.checkOutline} cx="26" cy="26" r="25" fill="none" />
                            <path className={styles.checkMark} fill="none" d="M14.1 27.2l7.1 7.2 16.7-16.8" />
                        </svg>
                    </div>
                </div>

                {/* Success Message */}
                <h1 className={styles.title}>ĐẶT HÀNG THÀNH CÔNG!</h1>
                <p className={styles.subtitle}>
                    {`Cảm ơn bạn đã mua sắm tại ${siteSettings.storeName}. Đơn hàng của bạn đang được xử lý.`}
                </p>

                {/* Order Brief */}
                <div className={styles.orderCard}>
                    <div className={styles.cardHeader}>
                        <div className={styles.cardCol}>
                            <span className={styles.colLabel}>MÃ ĐƠN HÀNG</span>
                            <span className={styles.colValueHighlight}>#{orderId}</span>
                        </div>
                        <div className={styles.cardCol}>
                            <span className={styles.colLabel}>NGÀY ĐẶT</span>
                            <span className={styles.colValue}>{dateStr}</span>
                        </div>
                        <div className={styles.cardCol}>
                            <span className={styles.colLabel}>TỔNG TIỀN</span>
                            <span className={styles.colValueHighlightCyan}>{totalFmt}</span>
                        </div>
                        <div className={styles.cardCol}>
                            <span className={styles.colLabel}>PHƯƠNG THỨC</span>
                            <span className={styles.colValue}>{pMethod}</span>
                        </div>
                    </div>

                    <div className={styles.cardBody}>
                        <p className={styles.emailNotice}>
                            📄 Một email xác nhận kèm biên lai đã được gửi tới <strong>{email}</strong>.
                        </p>

                        <div className={styles.steps}>
                            <div className={`${styles.step} ${styles.stepDone}`}>
                                <div className={styles.stepDot}>✓</div>
                                <div className={styles.stepText}>Đã thanh toán</div>
                            </div>
                            <div className={styles.stepLine} />
                            <div className={`${styles.step} ${styles.stepActive}`}>
                                <div className={styles.stepDot}>📦</div>
                                <div className={styles.stepText}>Đang chuẩn bị</div>
                            </div>
                            <div className={styles.stepLine} />
                            <div className={styles.step}>
                                <div className={styles.stepDot}>🚚</div>
                                <div className={styles.stepText}>Đang giao</div>
                            </div>
                        </div>
                    </div>
                </div>

                <div className={styles.actions}>
                    <Button variant="cyan" size="lg" href={`/orders/${order._id}`}>
                        THEO DÕI ĐƠN HÀNG
                    </Button>
                    <Button variant="outline" size="lg" href="/">
                        TIẾP TỤC MUA SẮM
                    </Button>
                </div>
            </div>
        </div>
    );
}

export default function OrderSuccessPage() {
    return (
        <React.Suspense fallback={<div style={{ padding: 40, textAlign: 'center' }}>Đang tải...</div>}>
            <OrderSuccessPageInner />
        </React.Suspense>
    );
}
