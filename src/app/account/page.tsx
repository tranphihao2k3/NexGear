"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useSession, signOut } from "next-auth/react";
import { useRouter } from "next/navigation";
import Button from "@/components/ui/Button";
import styles from "./page.module.scss";

const MENU = [
    { href: "/account", label: "Thông tin tài khoản", icon: "👤", id: "profile" },
    { href: "/account/orders", label: "Lịch sử đơn hàng", icon: "📦", id: "orders" },
    { href: "/wishlist", label: "Danh sách yêu thích", icon: "♡", id: "wishlist" },
    { href: "/account/address", label: "Địa chỉ giao hàng", icon: "📍", id: "address" },
    { href: "/account/security", label: "Bảo mật & Mật khẩu", icon: "🔒", id: "security" },
];

function fmt(n: number) {
    return new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(n);
}

function getInitials(name: string) {
    return name.split(" ").map(w => w[0]).join("").toUpperCase().slice(0, 3);
}

function getTier(points: number) {
    if (points >= 5000) return { label: "DIAMOND", icon: "💎" };
    if (points >= 2000) return { label: "PLATINUM", icon: "🏆" };
    if (points >= 1000) return { label: "GOLD", icon: "👑" };
    if (points >= 300) return { label: "SILVER", icon: "🥈" };
    return { label: "MEMBER", icon: "🎫" };
}

const STATUS_MAP: Record<string, { label: string; emoji: string }> = {
    pending: { label: "Chờ xác nhận", emoji: "⏳" },
    confirmed: { label: "Đã xác nhận", emoji: "✅" },
    packing: { label: "Đang đóng gói", emoji: "📦" },
    shipped: { label: "Đang giao", emoji: "🚚" },
    delivered: { label: "Đã giao", emoji: "✅" },
    cancelled: { label: "Đã hủy", emoji: "❌" },
    refunded: { label: "Hoàn tiền", emoji: "💸" },
};

export default function AccountPage() {
    const { data: session, status } = useSession();
    const router = useRouter();

    const [user, setUser] = useState<any>(null);
    const [orders, setOrders] = useState<any[]>([]);
    const [stats, setStats] = useState({ orderCount: 0, points: 0, saved: 0, wishlistCount: 0 });
    const [form, setForm] = useState({ name: "", phone: "", email: "" });
    const [saving, setSaving] = useState(false);
    const [saved, setSaved] = useState(false);
    const [loading, setLoading] = useState(true);

    const userId = (session?.user as any)?.id;
    const userEmail = session?.user?.email;

    // Redirect if not logged in
    useEffect(() => {
        if (status === "unauthenticated") {
            router.push("/login?callbackUrl=/account");
        }
    }, [status, router]);

    // Fetch user data + recent orders
    useEffect(() => {
        if (status !== "authenticated" || !session?.user) return;

        async function fetchData() {
            setLoading(true);
            try {
                // 1. Find user: by id first, then by email
                let userData: any = null;
                if (userId) {
                    const res = await fetch(`/api/users/${userId}`).then(r => r.json());
                    if (res.success) userData = res.data;
                }
                if (!userData && userEmail) {
                    const res = await fetch(`/api/users?email=${encodeURIComponent(userEmail)}&limit=1`).then(r => r.json());
                    if (res.success && res.data?.length > 0) userData = res.data[0];
                }
                if (!userData) {
                    userData = {
                        _id: null, name: session?.user?.name || "", email: session?.user?.email || "",
                        role: "customer", loyaltyPoints: 0, wishlist: [], createdAt: null,
                    };
                }

                setUser(userData);
                setForm({ name: userData.name || "", phone: userData.addresses?.[0]?.phone || "", email: userData.email || "" });

                // 2. Fetch orders
                const uid = userData._id || userId;
                let orderList: any[] = [];
                let orderTotal = 0;
                if (uid) {
                    const ordersRes = await fetch(`/api/orders?user=${uid}&limit=5&sort=-createdAt`).then(r => r.json());
                    if (ordersRes.success) {
                        orderList = ordersRes.data || [];
                        orderTotal = ordersRes.pagination?.total || orderList.length;
                    }
                }
                setOrders(orderList.slice(0, 3));

                const totalSaved = orderList.reduce((sum: number, o: any) => sum + (o.discount || 0), 0);
                setStats({
                    orderCount: orderTotal,
                    points: userData.loyaltyPoints || 0,
                    saved: totalSaved,
                    wishlistCount: userData.wishlist?.length || 0,
                });
            } catch (err) {
                console.error("Failed to fetch account data:", err);
            } finally {
                setLoading(false);
            }
        }

        fetchData();
    }, [status, userId, userEmail]);

    async function handleSave() {
        const uid = user?._id || userId;
        if (!uid) return;
        setSaving(true);
        try {
            const res = await fetch(`/api/users/${uid}`, {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ name: form.name, email: form.email }),
            });
            const data = await res.json();
            if (data.success) {
                setUser(data.data);
                setSaved(true);
                setTimeout(() => setSaved(false), 2500);
            }
        } catch (err) {
            console.error("Failed to save:", err);
        } finally {
            setSaving(false);
        }
    }

    if (status === "loading" || loading) {
        return (
            <div className={styles.page}>
                <div className={styles.loadingWrap}>
                    <div className={styles.spinner} />
                    <span>Đang tải thông tin...</span>
                </div>
            </div>
        );
    }

    if (!session || !user) return null;

    const tier = getTier(stats.points);
    const joinedDate = user.createdAt
        ? new Date(user.createdAt).toLocaleDateString("vi-VN")
        : "—";

    const STATS = [
        { label: "Đơn đã mua", value: String(stats.orderCount), icon: "🛒", color: "cyan" },
        { label: "Điểm tích lũy", value: stats.points.toLocaleString("vi-VN"), icon: "⭐", color: "gold" },
        { label: "Đã tiết kiệm", value: stats.saved >= 1000000 ? `${(stats.saved / 1000000).toFixed(1)}M` : stats.saved >= 1000 ? `${Math.round(stats.saved / 1000)}K` : String(stats.saved), icon: "💰", color: "green" },
        { label: "Yêu thích", value: String(stats.wishlistCount), icon: "♡", color: "magenta" },
    ];

    return (
        <div className={styles.page}>
            {/* Breadcrumb */}
            <div className={styles.breadcrumbBar}>
                <div className={styles.breadcrumbInner}>
                    <nav className={styles.breadcrumb}>
                        <Link href="/" className={styles.bcLink}>Trang chủ</Link>
                        <span className={styles.bcSep}>›</span>
                        <span className={styles.bcCurrent}>Tài khoản</span>
                    </nav>
                </div>
            </div>

            <div className={styles.pageInner}>
                <div className={styles.pageGrid}>

                    {/* ── SIDEBAR ── */}
                    <aside className={styles.sidebar}>
                        <div className={styles.avatarCard}>
                            <div className={styles.avatarWrap}>
                                {user.image ? (
                                    <img src={user.image} alt={user.name} className={styles.avatarImg} />
                                ) : (
                                    <span className={styles.avatarText}>{getInitials(user.name)}</span>
                                )}
                            </div>
                            <div className={styles.avatarName}>{user.name}</div>
                            <div className={styles.avatarEmail}>{user.email}</div>
                            <div className={styles.tierBadge}>
                                <span className={styles.tierIcon}>{tier.icon}</span>
                                {tier.label === "MEMBER" ? "MEMBER" : `${tier.label} MEMBER`}
                            </div>
                            <div className={styles.pointsRow}>
                                <span className={styles.pointsLabel}>Điểm tích lũy</span>
                                <span className={styles.pointsVal}>{stats.points.toLocaleString("vi-VN")} ★</span>
                            </div>
                        </div>

                        <nav className={styles.sideNav}>
                            {MENU.map(item => (
                                <Link
                                    key={item.id}
                                    href={item.href}
                                    className={`${styles.navItem} ${item.id === "profile" ? styles.navItemActive : ""}`}
                                >
                                    <span className={styles.navIcon}>{item.icon}</span>
                                    {item.label}
                                    <span className={styles.navArrow}>›</span>
                                </Link>
                            ))}
                        </nav>

                        <button className={styles.logoutBtn} onClick={() => signOut({ callbackUrl: "/" })}>
                            🚪 Đăng xuất
                        </button>
                    </aside>

                    {/* ── MAIN CONTENT ── */}
                    <main className={styles.mainCol}>

                        {/* Stats row */}
                        <div className={styles.statsRow}>
                            {STATS.map(s => (
                                <div key={s.label} className={`${styles.statCard} ${styles[`stat_${s.color}`]}`}>
                                    <span className={styles.statIcon}>{s.icon}</span>
                                    <span className={styles.statValue}>{s.value}</span>
                                    <span className={styles.statLabel}>{s.label}</span>
                                </div>
                            ))}
                        </div>

                        {/* Profile form */}
                        <div className={styles.card}>
                            <h2 className={styles.cardTitle}>Thông Tin Cá Nhân</h2>

                            {saved && (
                                <div className={styles.savedBanner}>
                                    ✓ Cập nhật thông tin thành công!
                                </div>
                            )}

                            <div className={styles.formGrid}>
                                <div className={styles.fieldWrap}>
                                    <label className={styles.fieldLabel}>Họ và tên</label>
                                    <input
                                        className={styles.fieldInput}
                                        value={form.name}
                                        onChange={e => setForm({ ...form, name: e.target.value })}
                                    />
                                </div>

                                <div className={styles.fieldWrap}>
                                    <label className={styles.fieldLabel}>Số điện thoại</label>
                                    <input
                                        className={styles.fieldInput}
                                        value={form.phone}
                                        onChange={e => setForm({ ...form, phone: e.target.value })}
                                        placeholder="Nhập số điện thoại"
                                    />
                                </div>

                                <div className={`${styles.fieldWrap} ${styles.fieldFull}`}>
                                    <label className={styles.fieldLabel}>Email</label>
                                    <input
                                        type="email"
                                        className={styles.fieldInput}
                                        value={form.email}
                                        onChange={e => setForm({ ...form, email: e.target.value })}
                                    />
                                </div>

                                <div className={styles.fieldWrap}>
                                    <label className={styles.fieldLabel}>Vai trò</label>
                                    <input className={`${styles.fieldInput} ${styles.fieldReadonly}`} value={user.role === "customer" ? "Khách hàng" : user.role} readOnly />
                                </div>

                                <div className={styles.fieldWrap}>
                                    <label className={styles.fieldLabel}>Ngày tham gia</label>
                                    <input className={`${styles.fieldInput} ${styles.fieldReadonly}`} value={joinedDate} readOnly />
                                </div>
                            </div>

                            <div className={styles.cardActions}>
                                <Button variant="cyan" size="md" onClick={handleSave} disabled={saving}>
                                    {saving ? "ĐANG LƯU..." : "LƯU THAY ĐỔI"}
                                </Button>
                            </div>
                        </div>

                        {/* Recent orders */}
                        <div className={styles.card}>
                            <div className={styles.cardTitleRow}>
                                <h2 className={styles.cardTitle}>Đơn Hàng Gần Đây</h2>
                                <Link href="/account/orders" className={styles.viewAllLink}>Xem tất cả →</Link>
                            </div>

                            {orders.length === 0 ? (
                                <div className={styles.emptyOrders}>
                                    <span>📦</span>
                                    <p>Chưa có đơn hàng nào</p>
                                    <Link href="/products" className={styles.shopNowLink}>Mua sắm ngay →</Link>
                                </div>
                            ) : (
                                orders.map(o => {
                                    const st = STATUS_MAP[o.status] || { label: o.status, emoji: "📋" };
                                    return (
                                        <div key={o._id} className={styles.miniOrderRow}>
                                            <div className={styles.miniOrderId}>#{o.orderCode}</div>
                                            <div className={styles.miniOrderDate}>
                                                {new Date(o.createdAt).toLocaleDateString("vi-VN")}
                                            </div>
                                            <div className={styles.miniOrderStatus}>
                                                <span className={`${styles.statusDot} ${styles[`status_${o.status}`]}`} />
                                                {st.emoji} {st.label}
                                            </div>
                                            <div className={styles.miniOrderTotal}>{fmt(o.total)}</div>
                                            <Link href={`/orders/${o._id}`} className={styles.miniOrderView}>Chi tiết</Link>
                                        </div>
                                    );
                                })
                            )}
                        </div>

                    </main>
                </div>
            </div>
        </div>
    );
}
