"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { Button, LazyImage } from "@/components/ui";
import styles from "./page.module.scss";

import { useCompareStore, CompareProduct } from "@/store/useCompareStore";

function fmt(n: number) {
    return new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(n);
}

const getSpecKeys = (list: CompareProduct[]) => {
    const keys = new Set<string>();
    list.forEach(item => {
        Object.keys(item.specs).forEach(k => keys.add(k));
    });
    return Array.from(keys);
};

export default function ComparePage() {
    const { items, removeItem, clearAll } = useCompareStore();
    const [diffOnly, setDiffOnly] = useState(false);
    const [isMounted, setIsMounted] = useState(false);

    useEffect(() => {
        setIsMounted(true);
    }, []);

    const specKeys = getSpecKeys(items);

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

    if (!isMounted) return <div className={styles.page} />;

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
                                            <button className={styles.removeBtn} onClick={() => removeItem(item.id)}>✕</button>
                                            <Link href={`/products/${item.slug}`} className={styles.itemCardWrap}>
                                                <div className={styles.itemImg}>
                                                    {item.img && (item.img.startsWith('http') || item.img.startsWith('/')) ? (
                                                        <LazyImage src={item.img} alt={item.name} fill objectFit="contain" />
                                                    ) : (
                                                        item.img
                                                    )}
                                                </div>
                                                <div className={styles.itemBrand}>{item.brand}</div>
                                                <div className={styles.itemName}>{item.name}</div>
                                                <div className={styles.itemPriceCard}>
                                                    <span className={styles.priceCurrent}>{fmt(item.price)}</span>
                                                    {item.price < item.original && (
                                                        <span className={styles.priceOld}>{fmt(item.original)}</span>
                                                    )}
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
