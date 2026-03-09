"use client";

import React, { useState } from "react";
import Link from "next/link";
import { signIn } from "next-auth/react";
import Button from "@/components/ui/Button";
import styles from "./page.module.scss";

export default function RegisterPage() {
    const [form, setForm] = useState({
        name: "", email: "", password: "", confirm: "", agree: false,
    });
    const [errors, setErrors] = useState<Record<string, string>>({});
    const [loading, setLoading] = useState(false);
    const [showPw, setShowPw] = useState(false);
    const [step, setStep] = useState<"form" | "success">("form");

    const pwStrength = (() => {
        const p = form.password;
        if (!p) return 0;
        let s = 0;
        if (p.length >= 8) s++;
        if (/[A-Z]/.test(p)) s++;
        if (/\d/.test(p)) s++;
        if (/[!@#$%]/.test(p)) s++;
        return s;
    })();

    const pwLabel = ["", "Yếu", "Trung bình", "Tốt", "Mạnh"][pwStrength];
    const pwColor = ["", styles.pwWeak, styles.pwFair, styles.pwGood, styles.pwStrong][pwStrength];

    function validate() {
        const e: Record<string, string> = {};
        if (!form.name.trim()) e.name = "Nhập họ và tên";
        if (!form.email.includes("@")) e.email = "Email không hợp lệ";
        if (form.password.length < 6) e.password = "Tối thiểu 6 ký tự";
        if (form.password !== form.confirm) e.confirm = "Mật khẩu không khớp";
        if (!form.agree) e.agree = "Vui lòng đồng ý điều khoản";
        setErrors(e);
        return Object.keys(e).length === 0;
    }

    async function handleSubmit(ev: React.FormEvent) {
        ev.preventDefault();
        if (!validate()) return;
        setLoading(true);
        setErrors({});

        try {
            const res = await fetch('/api/auth/register', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    name: form.name,
                    email: form.email,
                    password: form.password,
                }),
            });
            const data = await res.json();
            if (!data.success) {
                setErrors({ form: data.error || 'Đăng ký thất bại' });
                return;
            }
            setStep("success");
        } catch (e) {
            setErrors({ form: 'Đã xảy ra lỗi, vui lòng thử lại' });
        } finally {
            setLoading(false);
        }
    }

    function handleGoogleRegister() {
        signIn("google", { callbackUrl: "/" });
    }

    if (step === "success") {
        return (
            <div className={styles.page}>
                <div className={styles.heroCol}>
                    <div className={styles.heroInner}>
                        <div className={styles.heroLogo}>
                            <span className={styles.logoNex}>NEX</span><span className={styles.logoGear}>GEAR</span>
                        </div>
                        <h1 className={styles.heroTitle}>CHÀO MỪNG ĐẾN VỚI NEXGEAR!</h1>
                        <p className={styles.heroSub}>Tài khoản của bạn đã được tạo thành công.</p>
                    </div>
                    <div className={styles.heroBg} aria-hidden="true">
                        {Array.from({ length: 30 }).map((_, i) => <span key={i} className={styles.heroDot} />)}
                    </div>
                </div>
                <div className={styles.formCol}>
                    <div className={styles.successWrap}>
                        <div className={styles.successIcon}>🎉</div>
                        <h2 className={styles.successTitle}>ĐĂNG KÝ THÀNH CÔNG!</h2>
                        <p className={styles.successMsg}>
                            Xin chào <strong>{form.name}</strong>! Chúng tôi đã gửi email xác nhận đến <strong>{form.email}</strong>.
                        </p>
                        <Button variant="cyan" size="lg" href="/login">ĐĂNG NHẬP NGAY →</Button>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className={styles.page}>
            {/* Hero */}
            <div className={styles.heroCol}>
                <div className={styles.heroInner}>
                    <div className={styles.heroLogo}>
                        <span className={styles.logoNex}>NEX</span>
                        <span className={styles.logoGear}>GEAR</span>
                    </div>
                    <h1 className={styles.heroTitle}>JOIN THE NEXGEAR COMMUNITY</h1>
                    <p className={styles.heroSub}>
                        Tạo tài khoản để theo dõi đơn hàng, nhận ưu đãi độc quyền và
                        tích điểm đổi quà.
                    </p>

                    <div className={styles.perks}>
                        {[
                            { icon: "🎁", text: "Voucher 50K khi đăng ký lần đầu" },
                            { icon: "⭐", text: "Tích điểm mỗi đơn hàng" },
                            { icon: "🔔", text: "Thông báo flash sale sớm nhất" },
                            { icon: "👑", text: "Ưu tiên hỗ trợ thành viên VIP" },
                        ].map(p => (
                            <div key={p.icon} className={styles.perkItem}>
                                <span className={styles.perkIcon}>{p.icon}</span>
                                <span>{p.text}</span>
                            </div>
                        ))}
                    </div>
                </div>
                <div className={styles.heroBg} aria-hidden="true">
                    {Array.from({ length: 30 }).map((_, i) => <span key={i} className={styles.heroDot} />)}
                </div>
            </div>

            {/* Form */}
            <div className={styles.formCol}>
                <div className={styles.formWrap}>
                    <div className={styles.formHead}>
                        <h2 className={styles.formTitle}>ĐĂNG KÝ</h2>
                        <p className={styles.formSub}>
                            Đã có tài khoản?{" "}
                            <Link href="/login" className={styles.formLink}>Đăng nhập</Link>
                        </p>
                    </div>

                    {errors.form && (
                        <div style={{ background: 'rgba(240,53,106,0.1)', border: '1px solid rgba(240,53,106,0.3)', borderRadius: '8px', padding: '12px 16px', marginBottom: '16px', color: '#F0356A', fontSize: '14px', textAlign: 'center' }}>
                            {errors.form}
                        </div>
                    )}

                    {/* Google */}
                    <button className={styles.oauthBtn} type="button" onClick={handleGoogleRegister}>
                        <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
                            <path d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844a4.14 4.14 0 01-1.796 2.716v2.259h2.908c1.702-1.567 2.684-3.875 2.684-6.615z" fill="#4285F4" />
                            <path d="M9 18c2.43 0 4.467-.806 5.956-2.18l-2.908-2.259c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 009 18z" fill="#34A853" />
                            <path d="M3.964 10.71A5.41 5.41 0 013.682 9c0-.593.102-1.17.282-1.71V4.958H.957A8.996 8.996 0 000 9c0 1.452.348 2.827.957 4.042l3.007-2.332z" fill="#FBBC05" />
                            <path d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 00.957 4.958L3.964 6.29C4.672 4.163 6.656 3.58 9 3.58z" fill="#EA4335" />
                        </svg>
                        Đăng ký với Google
                    </button>

                    <div className={styles.dividerRow}>
                        <span className={styles.dividerLine} />
                        <span className={styles.dividerText}>hoặc</span>
                        <span className={styles.dividerLine} />
                    </div>

                    <form onSubmit={handleSubmit} className={styles.form} noValidate>
                        {/* Name */}
                        <div className={styles.fieldWrap}>
                            <label className={styles.fieldLabel} htmlFor="name">Họ và tên</label>
                            <div className={styles.fieldInner}>
                                <span className={styles.fieldIcon}>👤</span>
                                <input
                                    id="name" type="text"
                                    className={`${styles.fieldInput} ${errors.name ? styles.fieldErr : ""}`}
                                    placeholder="Nguyễn Văn A"
                                    value={form.name}
                                    onChange={e => setForm({ ...form, name: e.target.value })}
                                />
                            </div>
                            {errors.name && <span className={styles.errMsg}>{errors.name}</span>}
                        </div>

                        {/* Email */}
                        <div className={styles.fieldWrap}>
                            <label className={styles.fieldLabel} htmlFor="email">Email</label>
                            <div className={styles.fieldInner}>
                                <span className={styles.fieldIcon}>✉</span>
                                <input
                                    id="email" type="email"
                                    className={`${styles.fieldInput} ${errors.email ? styles.fieldErr : ""}`}
                                    placeholder="your@email.com"
                                    value={form.email}
                                    onChange={e => setForm({ ...form, email: e.target.value })}
                                />
                            </div>
                            {errors.email && <span className={styles.errMsg}>{errors.email}</span>}
                        </div>

                        {/* Password */}
                        <div className={styles.fieldWrap}>
                            <label className={styles.fieldLabel} htmlFor="password">Mật khẩu</label>
                            <div className={styles.fieldInner}>
                                <span className={styles.fieldIcon}>🔑</span>
                                <input
                                    id="password" type={showPw ? "text" : "password"}
                                    className={`${styles.fieldInput} ${errors.password ? styles.fieldErr : ""}`}
                                    placeholder="Tối thiểu 6 ký tự"
                                    value={form.password}
                                    onChange={e => setForm({ ...form, password: e.target.value })}
                                />
                                <button type="button" className={styles.showPwBtn}
                                    onClick={() => setShowPw(!showPw)}>
                                    {showPw ? "🙈" : "👁"}
                                </button>
                            </div>
                            {/* Strength indicator */}
                            {form.password && (
                                <div className={styles.pwStrengthRow}>
                                    <div className={styles.pwBars}>
                                        {[1, 2, 3, 4].map(i => (
                                            <span
                                                key={i}
                                                className={`${styles.pwBar} ${i <= pwStrength ? pwColor : ""}`}
                                            />
                                        ))}
                                    </div>
                                    <span className={`${styles.pwLabel} ${pwColor}`}>{pwLabel}</span>
                                </div>
                            )}
                            {errors.password && <span className={styles.errMsg}>{errors.password}</span>}
                        </div>

                        {/* Confirm */}
                        <div className={styles.fieldWrap}>
                            <label className={styles.fieldLabel} htmlFor="confirm">Xác nhận mật khẩu</label>
                            <div className={styles.fieldInner}>
                                <span className={styles.fieldIcon}>🔒</span>
                                <input
                                    id="confirm" type="password"
                                    className={`${styles.fieldInput} ${errors.confirm ? styles.fieldErr : ""}`}
                                    placeholder="Nhập lại mật khẩu"
                                    value={form.confirm}
                                    onChange={e => setForm({ ...form, confirm: e.target.value })}
                                />
                                {form.confirm && form.password === form.confirm && (
                                    <span className={styles.matchOk}>✓</span>
                                )}
                            </div>
                            {errors.confirm && <span className={styles.errMsg}>{errors.confirm}</span>}
                        </div>

                        {/* Terms checkbox */}
                        <label className={`${styles.rememberRow} ${errors.agree ? styles.agreeErr : ""}`}>
                            <input
                                type="checkbox"
                                className={styles.checkNative}
                                checked={form.agree}
                                onChange={e => setForm({ ...form, agree: e.target.checked })}
                            />
                            <span className={styles.checkBox} />
                            <span className={styles.rememberText}>
                                Tôi đồng ý với{" "}
                                <Link href="/warranty" className={styles.formLink}>Điều khoản sử dụng</Link>
                                {" "}và{" "}
                                <Link href="/warranty" className={styles.formLink}>Chính sách bảo mật</Link>
                            </span>
                        </label>
                        {errors.agree && <span className={styles.errMsg}>{errors.agree}</span>}

                        <Button variant="primary" size="lg" fullWidth loading={loading} type="submit">
                            {loading ? "Đang tạo tài khoản..." : "TẠO TÀI KHOẢN →"}
                        </Button>
                    </form>
                </div>
            </div>
        </div>
    );
}
