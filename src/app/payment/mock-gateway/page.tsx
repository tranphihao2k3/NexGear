"use client";

import React, { useEffect, useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Button from "@/components/ui/Button";
import styles from "./page.module.scss";

function MockGatewayInner() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const orderId = searchParams.get("orderId");
    const method = searchParams.get("method"); // 'vnpay' or 'stripe'

    const [order, setOrder] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [paying, setPaying] = useState(false);

    useEffect(() => {
        if (orderId) {
            fetch(`/api/orders/${orderId}`)
                .then(res => res.json())
                .then(json => {
                    if (json.success) setOrder(json.data);
                    setLoading(false);
                })
                .catch(() => setLoading(false));
        } else {
            setLoading(false);
        }
    }, [orderId]);

    if (loading) return <div className={styles.page}>Đang tải cổng thanh toán...</div>;
    if (!order) return <div className={styles.page}>Không tìm thấy đơn hàng</div>;

    const isVNPay = method === "vnpay";
    const gatewayName = isVNPay ? "VNPay Sandbox" : "Stripe Test Mode";
    const totalFmt = new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(order.total);

    async function handlePay(success: boolean) {
        setPaying(true);
        if (success) {
            // Update order status to paid
            await fetch(`/api/orders/${orderId}`, {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    payment: {
                        method: method,
                        status: "paid",
                        txnId: isVNPay ? `VNP${Date.now()}` : `pi_${Date.now()}`,
                        paidAt: new Date()
                    },
                    status: "confirmed" // Also update order status
                })
            });
            router.push(`/orders/success?orderId=${orderId}`);
        } else {
            // Reject payment
            await fetch(`/api/orders/${orderId}`, {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    payment: {
                        method: method,
                        status: "failed",
                        txnId: "",
                        paidAt: null
                    }
                })
            });
            alert("Thanh toán thất bại hoặc người dùng hủy!");
            router.push(`/checkout`); // Usually back to checkout or an error page
        }
    }

    return (
        <div className={styles.page}>
            <div className={styles.paymentCard}>
                <div className={styles.logo}>{gatewayName}</div>
                <h1 className={styles.title}>THANH TOÁN ĐƠN HÀNG</h1>
                <p className={styles.subtitle}>
                    Môi trường thử nghiệm. Không sử dụng thẻ thật.
                </p>

                <div className={styles.orderId}>Mã đơn hàng: {order.orderCode}</div>
                <div className={styles.amount}>{totalFmt}</div>

                <div className={styles.actions}>
                    <Button variant="primary" size="lg" onClick={() => handlePay(true)} disabled={paying} style={{ backgroundColor: isVNPay ? '#005A9E' : '#635BFF', borderColor: isVNPay ? '#005A9E' : '#635BFF' }}>
                        {paying ? "ĐANG XỬ LÝ..." : `MÔ PHỎNG THANH TOÁN THÀNH CÔNG`}
                    </Button>
                    <Button variant="danger" size="md" onClick={() => handlePay(false)} disabled={paying}>
                        HỦY GIAO DỊCH
                    </Button>
                </div>
                <p className={styles.successNote}>
                    Đây là cổng giao dịch dùng để demo cho {gatewayName}. Bạn có thể xem dòng này nghĩa là API đã gọi thành công VNPay/Stripe Create Token.
                </p>
            </div>
        </div>
    );
}

export default function MockGatewayPage() {
    return (
        <Suspense fallback={<div className={styles.page}>Đang tải cổng thanh toán...</div>}>
            <MockGatewayInner />
        </Suspense>
    );
}
