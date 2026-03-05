"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import styles from "./page.module.scss";

const STATUS_MAP: Record<string, { label: string; emoji: string }> = {
    pending: { label: "Chờ xác nhận", emoji: "⏳" },
    confirmed: { label: "Đã xác nhận", emoji: "✅" },
    packing: { label: "Đang đóng gói", emoji: "📦" },
    shipped: { label: "Đang giao", emoji: "🚚" },
    delivered: { label: "Đã giao", emoji: "✅" },
    cancelled: { label: "Đã hủy", emoji: "❌" },
    refunded: { label: "Hoàn tiền", emoji: "💸" },
};

function fmt(n: number) {
    return new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(n);
}

export default function OrdersPage() {
    const { data: session, status: authStatus } = useSession();
    const router = useRouter();
    const [orders, setOrders] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState("all");
    const [expanded, setExpanded] = useState<Set<string>>(new Set());

    const userId = (session?.user as any)?.id;
    const userEmail = session?.user?.email;

    useEffect(() => {
        if (authStatus === "unauthenticated") {
            router.push("/login?callbackUrl=/account/orders");
        }
    }, [authStatus, router]);

    useEffect(() => {
        if (authStatus !== "authenticated" || !session?.user) return;

        async function fetchOrders() {
            setLoading(true);
            try {
                // Resolve user id
                let uid = userId;
                if (!uid && userEmail) {
                    const res = await fetch(`/api/users?email=${encodeURIComponent(userEmail)}&limit=1`).then(r => r.json());
                    if (res.success && res.data?.length > 0) uid = res.data[0]._id;
                }
                if (!uid) { setOrders([]); return; }

                const res = await fetch(`/api/orders?user=${uid}&limit=50`).then(r => r.json());
                if (res.success) {
                    setOrders(res.data || []);
                }
            } catch (err) {
                console.error("Failed to fetch orders:", err);
            } finally {
                setLoading(false);
            }
        }

        fetchOrders();
    }, [authStatus, userId, userEmail]);

    function toggleExpand(id: string) {
        setExpanded(prev => {
            const next = new Set(prev);
            next.has(id) ? next.delete(id) : next.add(id);
            return next;
        });
    }

    const filtered = filter === "all"
        ? orders
        : orders.filter(o => {
            if (filter === "shipping") return o.status === "shipped";
            return o.status === filter;
        });

    const statusCounts = {
        all: orders.length,
        shipping: orders.filter(o => o.status === "shipped").length,
        delivered: orders.filter(o => o.status === "delivered").length,
        cancelled: orders.filter(o => o.status === "cancelled").length,
    };

    const STATUS_FILTERS = [
        { id: "all", label: "Tất cả", count: statusCounts.all },
        { id: "shipping", label: "Đang giao", count: statusCounts.shipping },
        { id: "delivered", label: "Đã giao", count: statusCounts.delivered },
        { id: "cancelled", label: "Đã hủy", count: statusCounts.cancelled },
    ];

    if (authStatus === "loading" || loading) {
        return (
            <div className={styles.page}>
                <div style={{ display: "flex", justifyContent: "center", alignItems: "center", minHeight: "40vh", gap: 12 }}>
                    <div style={{ width: 28, height: 28, border: "3px solid #e5e5e5", borderTop: "3px solid #111", borderRadius: "50%", animation: "spin 0.8s linear infinite" }} />
                    <span>Đang tải đơn hàng...</span>
                </div>
            </div>
        );
    }

    return (
        <div className={styles.page}>
            {/* Breadcrumb */}
            <div className={styles.breadcrumbBar}>
                <div className={styles.breadcrumbInner}>
                    <nav className={styles.breadcrumb}>
                        <Link href="/" className={styles.bcLink}>Trang chủ</Link>
                        <span className={styles.bcSep}>›</span>
                        <Link href="/account" className={styles.bcLink}>Tài khoản</Link>
                        <span className={styles.bcSep}>›</span>
                        <span className={styles.bcCurrent}>Lịch sử đơn hàng</span>
                    </nav>
                </div>
            </div>

            <div className={styles.pageInner}>
                {/* Filter tabs */}
                <div className={styles.filterTabs}>
                    {STATUS_FILTERS.map(f => (
                        <button
                            key={f.id}
                            className={`${styles.filterTab} ${filter === f.id ? styles.filterTabActive : ""}`}
                            onClick={() => setFilter(f.id)}
                        >
                            {f.label}
                            <span className={styles.filterCount}>{f.count}</span>
                        </button>
                    ))}
                </div>

                {/* Order list */}
                {filtered.length === 0 ? (
                    <div className={styles.empty}>
                        <span className={styles.emptyIcon}>📦</span>
                        <p>Không có đơn hàng nào</p>
                    </div>
                ) : (
                    <div className={styles.orderList}>
                        {filtered.map(order => {
                            const isOpen = expanded.has(order._id);
                            const st = STATUS_MAP[order.status] || { label: order.status, emoji: "📋" };
                            return (
                                <div key={order._id} className={`${styles.orderCard} ${styles[`order_${order.status}`]}`}>
                                    {/* Card header */}
                                    <div className={styles.orderHeader}>
                                        <div className={styles.orderMeta}>
                                            <span className={styles.orderId}>#{order.orderCode}</span>
                                            <span className={styles.orderDate}>
                                                {new Date(order.createdAt).toLocaleDateString("vi-VN")}
                                            </span>
                                        </div>
                                        <div className={`${styles.statusBadge} ${styles[`badge_${order.status}`]}`}>
                                            {st.emoji} {st.label}
                                        </div>
                                    </div>

                                    {/* Items preview */}
                                    <div className={styles.itemsPreview}>
                                        {order.items?.map((item: any, i: number) => (
                                            <div key={i} className={styles.itemRow}>
                                                <div className={styles.itemImg}>
                                                    {item.image ? (
                                                        <img src={item.image} alt={item.name} style={{ width: "100%", height: "100%", objectFit: "cover", borderRadius: 4 }} />
                                                    ) : "📷"}
                                                </div>
                                                <div className={styles.itemInfo}>
                                                    <div className={styles.itemName}>{item.name || item.productName}</div>
                                                    <div className={styles.itemVariant}>
                                                        {item.variant || ""} · x{item.qty}
                                                    </div>
                                                </div>
                                                <div className={styles.itemPrice}>
                                                    {fmt((item.unitPrice || item.price || 0) * item.qty)}
                                                </div>
                                            </div>
                                        ))}
                                    </div>

                                    {/* Footer */}
                                    <div className={styles.orderFooter}>
                                        <button
                                            className={styles.detailToggle}
                                            onClick={() => toggleExpand(order._id)}
                                        >
                                            {isOpen ? "Ẩn chi tiết ▲" : "Xem chi tiết ▼"}
                                        </button>
                                        <div className={styles.orderTotal}>
                                            Tổng: <strong>{fmt(order.total)}</strong>
                                        </div>
                                        {order.status === "delivered" && (
                                            <button className={styles.reviewBtn}>⭐ Đánh giá</button>
                                        )}
                                        {order.status === "shipped" && (
                                            <button className={styles.trackBtn}>🔍 Theo dõi</button>
                                        )}
                                    </div>

                                    {/* Detail expand */}
                                    {isOpen && (
                                        <div className={styles.orderDetail}>
                                            <div className={styles.detailRow}>
                                                <span className={styles.detailKey}>Vận chuyển:</span>
                                                <span className={styles.detailVal}>
                                                    {order.shippingProvider || "Chưa xác định"}
                                                </span>
                                            </div>
                                            <div className={styles.detailRow}>
                                                <span className={styles.detailKey}>Giao đến:</span>
                                                <span className={styles.detailVal}>
                                                    {order.shippingAddress
                                                        ? `${order.shippingAddress.street || ""}, ${order.shippingAddress.ward || ""}, ${order.shippingAddress.district || ""}, ${order.shippingAddress.city || ""}`
                                                        : "—"}
                                                </span>
                                            </div>
                                            {order.paymentMethod && (
                                                <div className={styles.detailRow}>
                                                    <span className={styles.detailKey}>Thanh toán:</span>
                                                    <span className={styles.detailVal}>{order.paymentMethod}</span>
                                                </div>
                                            )}

                                            {/* Tracking timeline */}
                                            {order.timeline && order.timeline.length > 0 && (
                                                <div className={styles.timeline}>
                                                    {order.timeline.map((t: any, i: number) => {
                                                        const tSt = STATUS_MAP[t.status] || { label: t.status, emoji: "📋" };
                                                        return (
                                                            <div key={i} className={`${styles.timelineItem} ${styles.timelineDone}`}>
                                                                <span className={styles.timelineDot} />
                                                                <div className={styles.timelineInfo}>
                                                                    <span className={styles.timelineLabel}>
                                                                        {tSt.emoji} {t.note || tSt.label}
                                                                    </span>
                                                                    <span className={styles.timelineTime}>
                                                                        {t.updatedAt
                                                                            ? new Date(t.updatedAt).toLocaleString("vi-VN")
                                                                            : "--"}
                                                                    </span>
                                                                </div>
                                                            </div>
                                                        );
                                                    })}
                                                </div>
                                            )}
                                        </div>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>
        </div>
    );
}
