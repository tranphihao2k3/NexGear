"use client";

import React, { useState } from "react";
import Link from "next/link";
import Button from "@/components/ui/Button";
import styles from "./page.module.scss";

// ── Mock compare data ───────────────────────────────────────
const COMPARE_LIST = [
    {
        id: "1",
        name: "AKKO 3068B Plus Multi-Mode",
        brand: "AKKO",
        slug: "akko-3068b",
        price: 1_240_000,
        original: 1_890_000,
        rating: 4.7,
        img: "⌨",
        specs: {
            "Loại Switch": "CS Jelly Pink (Linear)",
            "Kết Nối": "Wireless 2.4G / Bluetooth / Type-C",
            "Layout": "65% (68 phím)",
            "Keycap": "PBT Double-Shot, ASA profile",
            "LED": "RGB 16.8 triệu màu",
            "Pin": "1800mAh",
            "Trọng Lượng": "0.64 kg",
            "Bảo Hành": "12 tháng"
        }
    },
    {
        id: "2",
        name: "Keychron K2 Pro QMK",
        brand: "Keychron",
        slug: "keychron-k2",
        price: 1_032_000,
        original: 1_290_000,
        rating: 4.5,
        img: "⌨",
        specs: {
            "Loại Switch": "Keychron K Pro Red (Linear)",
            "Kết Nối": "Bluetooth / Type-C",
            "Layout": "75% (84 phím)",
            "Keycap": "OSA Profile (Double-shot PBT)",
            "LED": "RGB (South-facing)",
            "Pin": "4000mAh",
            "Trọng Lượng": "0.94 kg",
            "Bảo Hành": "12 tháng"
        }
    },
    {
        id: "3",
        name: "Ducky One 3 Mini",
        brand: "Ducky",
        slug: "ducky-one3",
        price: 1_323_000,
        original: 1_890_000,
        rating: 4.7,
        img: "⌨",
        specs: {
            "Loại Switch": "Cherry MX Red (Linear)",
            "Kết Nối": "Type-C (Có dây)",
            "Layout": "60% (61 phím)",
            "Keycap": "PBT Double-Shot",
            "LED": "RGB 16.8 triệu màu",
            "Pin": "Không có",
            "Trọng Lượng": "0.59 kg",
            "Bảo Hành": "24 tháng"
        }
    }
];

function fmt(n: number) {
    return new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(n);
}

// Hàm lấy tất cả các keys (specs)
const getSpecKeys = () => {
    const keys = new Set<string>();
    COMPARE_LIST.forEach(item => {
        Object.keys(item.specs).forEach(k => keys.add(k));
    });
    return Array.from(keys);
};

export default function ComparePage() {
    const [items, setItems] = useState(COMPARE_LIST);
    const [diffOnly, setDiffOnly] = useState(false);

    const specKeys = getSpecKeys();

    // Kiểm tra xem 1 hàng spec có giống nhau hoàn toàn ở tất cả các SP không
    const isDiff = (key: string) => {
        if (items.length <= 1) return false;
        const val1 = items[0].specs[key as keyof typeof items[0]['specs']] || "";
        for (let i = 1; i < items.length; i++) {
            if ((items[i].specs[key as keyof typeof items[0]['specs']] || "") !== val1) {
                return true;
            }
        }
        return false;
    };

    const removeBox = (id: string) => {
        setItems(items.filter(i => i.id !== id));
    };

    const clearAll = () => {
        setItems([]);
    };

    return (
        <div className={styles.page}>
            <div className={styles.container}>

                {/* Header */}
                <div className={styles.header}>
                    <div className={styles.headerTitleBox}>
                        <h1 className={styles.title}>SO SÁNH SẢN PHẨM</h1>
                        <p className={styles.subtitle}>So sánh để tìm ra gaming gear phù hợp nhất với bạn.</p>
                    </div>

                    <div className={styles.headerActions}>
                        <label className={styles.toggleLabel}>
                            <input
                                type="checkbox"
                                className={styles.toggleInput}
                                checked={diffOnly}
                                onChange={() => setDiffOnly(!diffOnly)}
                            />
                            <span className={styles.toggleBox} />
                            Chỉ hiện điểm khác biệt
                        </label>
                        <button className={styles.clearBtn} onClick={clearAll}>Xóa tất cả</button>
                    </div>
                </div>

                {items.length === 0 ? (
                    <div className={styles.emptyWrap}>
                        <div className={styles.emptyIcon}>⚖️</div>
                        <h2 className={styles.emptyTitle}>Chưa có sản phẩm nào</h2>
                        <p className={styles.emptySub}>Thêm sản phẩm vào bảng để bắt đầu so sánh.</p>
                        <Button variant="cyan" size="lg" href="/ban-phim">Duyệt sản phẩm →</Button>
                    </div>
                ) : (
                    <div className={styles.tableWrap}>
                        <table className={styles.table}>
                            <thead>
                                <tr>
                                    <th className={styles.fixedCol}>SẢN PHẨM</th>
                                    {items.map(item => (
                                        <th key={item.id} className={styles.itemCol}>
                                            <button className={styles.removeBtn} onClick={() => removeBox(item.id)}>✕</button>
                                            <Link href={`/products/${item.slug}`} className={styles.itemCardWrap}>
                                                <div className={styles.itemImg}>{item.img}</div>
                                                <div className={styles.itemBrand}>{item.brand}</div>
                                                <div className={styles.itemName}>{item.name}</div>
                                                <div className={styles.itemPriceCard}>
                                                    <span className={styles.priceCurrent}>{fmt(item.price)}</span>
                                                    <span className={styles.priceOld}>{fmt(item.original)}</span>
                                                </div>
                                            </Link>
                                            <Button variant="cyan" size="sm" fullWidth>THÊM VÀO GIỎ</Button>
                                        </th>
                                    ))}
                                    {/* Empty slot if less than 3 */}
                                    {items.length < 3 && (
                                        <th className={styles.emptyCol}>
                                            <div className={styles.addSlot}>
                                                <div className={styles.addSlotIcon}>+</div>
                                                <span className={styles.addSlotText}>Thêm sản phẩm</span>
                                            </div>
                                        </th>
                                    )}
                                </tr>
                            </thead>
                            <tbody>
                                {specKeys.map(key => {
                                    const diff = isDiff(key);
                                    if (diffOnly && !diff) return null; // Ẩn nếu chọn "Chỉ hiện điểm khác biệt" và hàng này giống nhau

                                    return (
                                        <tr key={key} className={diff ? styles.rowDiff : ""}>
                                            <td className={`${styles.fixedCol} ${styles.specLabel}`}>{key}</td>
                                            {items.map(item => (
                                                <td key={item.id} className={styles.itemCell}>
                                                    {item.specs[key as keyof typeof item.specs] || "-"}
                                                </td>
                                            ))}
                                            {items.length < 3 && <td className={styles.emptyCell} />}
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                )}

            </div>
        </div>
    );
}
