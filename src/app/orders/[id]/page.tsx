"use client";

import React from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import Button from "@/components/ui/Button";
import styles from "./page.module.scss";

// ── Mock Order Data ───────────────────────────────────────
const ORDER = {
    id: "NGR-89241A",
    date: "05/03/2026 14:30",
    status: "packing", // pending, packing, shipped, delivered, cancelled
    items: [
        { title: "AKKO 3068B Plus Multi-Mode", variant: "CS Jelly Pink", price: 1_240_000, qty: 1, img: "📷" },
        { title: "Razer Gigantus V2 - Large", variant: "Đen", price: 350_000, qty: 1, img: "📷" },
    ],
    subtotal: 1_590_000,
    shipping: 30_000,
    discount: 380_000,
    total: 1_240_000,
    address: {
        name: "Nguyễn Minh Tuấn",
        phone: "0901234567",
        street: "123 Đường Điện Biên Phủ, Phường 15",
        city: "Quận Bình Thạnh, TP. Hồ Chí Minh"
    },
    payment: "VNPay (Đã thanh toán)"
};

const TIMELINE = [
    { time: "05/03/2026 14:30", type: "success", title: "Đơn hàng thành công", desc: "Đơn hàng đã được đặt và thanh toán." },
    { time: "05/03/2026 15:45", type: "current", title: "Đã xác nhận thanh toán", desc: "Hệ thống đã nhận được thanh toán qua VNPay." },
    { time: "", type: "pending", title: "Đang đóng gói", desc: "Kho hàng đang chuẩn bị sản phẩm." },
    { time: "", type: "pending", title: "Bàn giao vận chuyển", desc: "Bàn giao cho đơn vị Giao Hàng Nhanh." },
    { time: "", type: "pending", title: "Giao hàng thành công", desc: "Bạn đã nhận được hàng." },
];

function fmt(n: number) {
    return new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(n);
}

export default function OrderDetailsPage() {
    const params = useParams();
    const id = params.id as string || ORDER.id;

    return (
        <div className={styles.page}>

            {/* Header */}
            <div className={styles.header}>
                <div className={styles.container}>
                    <Link href="/account/orders" className={styles.backLink}>
                        ← Quay lại Lịch sử đơn hàng
                    </Link>
                    <div className={styles.titleRow}>
                        <h1 className={styles.pageTitle}>ĐƠN HÀNG #{id}</h1>
                        <span className={styles.statusBadge}>📦 ĐANG ĐÓNG GÓI</span>
                    </div>
                    <p className={styles.dateText}>Đặt lúc: {ORDER.date}</p>
                </div>
            </div>

            {/* Main Layout */}
            <div className={`${styles.container} ${styles.layout}`}>

                {/* LEFT COLUMN: 7 cols */}
                <div className={styles.colLeft}>

                    {/* Order Items */}
                    <div className={styles.card}>
                        <div className={styles.cardHeader}>
                            <h2 className={styles.cardTitle}>Sản Phẩm Đã Đặt</h2>
                            <span className={styles.itemCount}>{ORDER.items.length} món</span>
                        </div>
                        <div className={styles.cardContent}>
                            <div className={styles.itemList}>
                                {ORDER.items.map((item, i) => (
                                    <div key={i} className={styles.itemRow}>
                                        <div className={styles.itemImg}>{item.img}</div>
                                        <div className={styles.itemInfo}>
                                            <div className={styles.itemName}>{item.title}</div>
                                            <div className={styles.itemVar}>{item.variant}</div>
                                            <div className={styles.itemPriceMobile}>{fmt(item.price)} x{item.qty}</div>
                                        </div>
                                        <div className={styles.itemQty}>x{item.qty}</div>
                                        <div className={styles.itemPrice}>{fmt(item.price * item.qty)}</div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* Customer & Payment Info */}
                    <div className={styles.infoGrid}>
                        <div className={styles.card}>
                            <div className={styles.cardHeader}>
                                <h2 className={styles.cardTitle}>📍 Thông Tin Nhận Hàng</h2>
                            </div>
                            <div className={styles.cardContent}>
                                <div className={styles.infoLine}><strong>{ORDER.address.name}</strong></div>
                                <div className={styles.infoLine}>{ORDER.address.phone}</div>
                                <div className={styles.infoLine}>{ORDER.address.street}</div>
                                <div className={styles.infoLine}>{ORDER.address.city}</div>
                            </div>
                        </div>

                        <div className={styles.card}>
                            <div className={styles.cardHeader}>
                                <h2 className={styles.cardTitle}>💳 Phương Thức Thanh Toán</h2>
                            </div>
                            <div className={styles.cardContent}>
                                <div className={styles.infoLine}>{ORDER.payment}</div>
                                <div className={styles.supportBox}>
                                    <p>Cần hỗ trợ về đơn hàng này?</p>
                                    <Button variant="outline" size="sm" fullWidth>LIÊN HỆ HỖ TRỢ</Button>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Summary */}
                    <div className={styles.card}>
                        <div className={styles.cardContent}>
                            <div className={styles.sumRow}>
                                <span>Tạm tính</span>
                                <span>{fmt(ORDER.subtotal)}</span>
                            </div>
                            <div className={styles.sumRow}>
                                <span>Phí vận chuyển</span>
                                <span>{fmt(ORDER.shipping)}</span>
                            </div>
                            <div className={`${styles.sumRow} ${styles.sumDiscount}`}>
                                <span>Voucher giảm giá</span>
                                <span>-{fmt(ORDER.discount)}</span>
                            </div>
                            <div className={styles.divider} />
                            <div className={`${styles.sumRow} ${styles.sumTotal}`}>
                                <span>Tổng cộng</span>
                                <span className={styles.totalPrice}>{fmt(ORDER.total)}</span>
                            </div>
                        </div>
                    </div>

                </div>

                {/* RIGHT COLUMN: 5 cols */}
                <div className={styles.colRight}>

                    <div className={`${styles.card} ${styles.sticky}`}>
                        <div className={styles.cardHeader}>
                            <h2 className={styles.cardTitle}>🚚 Hành Trình Đơn Hàng</h2>
                        </div>

                        {/* Map Placeholder */}
                        <div className={styles.mapVisual}>
                            <div className={styles.mapPin}>📍</div>
                            <div className={styles.mapLine} />
                            <div className={styles.mapTruck}>🚚</div>
                        </div>

                        <div className={styles.timeline}>
                            {TIMELINE.map((step, i) => (
                                <div key={i} className={`${styles.tlItem} ${styles[`tl_${step.type}`]}`}>
                                    <div className={styles.tlGraphic}>
                                        <div className={styles.tlDot} />
                                        {i !== TIMELINE.length - 1 && <div className={styles.tlLine} />}
                                    </div>
                                    <div className={styles.tlContent}>
                                        <div className={styles.tlTitle}>{step.title}</div>
                                        <div className={styles.tlDesc}>{step.desc}</div>
                                        {step.time && <div className={styles.tlTime}>{step.time}</div>}
                                    </div>
                                </div>
                            ))}
                        </div>

                    </div>

                </div>

            </div>
        </div>
    );
}
