"use client";

import React, { useState } from "react";
import Link from "next/link";
import { signIn } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import Button from "@/components/ui/Button";
import styles from "./page.module.scss";

export default function LoginPage() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const callbackUrl = searchParams.get("callbackUrl") || "/";

    const [form, setForm] = useState({ email: "", password: "" });
    const [errors, setErrors] = useState<Record<string, string>>({});
    const [loading, setLoading] = useState(false);
    const [showPw, setShowPw] = useState(false);
    const [rememberMe, setRememberMe] = useState(false);

    // Load saved email on mount
    React.useEffect(() => {
        const savedEmail = localStorage.getItem("nexgear_remember_email");
        if (savedEmail) {
            setForm(prev => ({ ...prev, email: savedEmail }));
            setRememberMe(true);
        }
    }, []);

    function validate() {
        const e: Record<string, string> = {};
        if (!form.email.includes("@")) e.email = "Email không hợp lệ";
        if (form.password.length < 6) e.password = "Mật khẩu tối thiểu 6 ký tự";
        setErrors(e);
        return Object.keys(e).length === 0;
    }

    async function handleSubmit(ev: React.FormEvent) {
        ev.preventDefault();
        if (!validate()) return;
        setLoading(true);
        setErrors({});

        try {
            const res = await signIn("credentials", {
                email: form.email,
                password: form.password,
                redirect: false,
            });

            if (res?.error) {
                setErrors({ form: "Email hoặc mật khẩu không đúng" });
            } else {
                // Save or clear remembered email
                if (rememberMe) {
                    localStorage.setItem("nexgear_remember_email", form.email);
                } else {
                    localStorage.removeItem("nexgear_remember_email");
                }
                router.push(callbackUrl);
                router.refresh();
            }
        } catch (e) {
            setErrors({ form: "Đã xảy ra lỗi, vui lòng thử lại" });
        } finally {
            setLoading(false);
        }
    }

    function handleGoogleLogin() {
        signIn("google", { callbackUrl });
    }

    return (
        <div className={styles.page}>
            {/* Left — Hero branding */}
            <div className={styles.heroCol}>
                <div className={styles.heroInner}>
                    <div className={styles.heroLogo}>
                        <span className={styles.logoNex}>NEX</span>
                        <span className={styles.logoGear}>GEAR</span>
                    </div>
                    <h1 className={styles.heroTitle}>
                        NEXT-LEVEL<br />GAMING GEAR
                    </h1>
                    <p className={styles.heroSub}>
                        Keyboard · Mouse · Headset · Audio<br />
                        Được tin dùng bởi hơn 50.000 gamers Việt Nam
                    </p>

                    <div className={styles.heroStats}>
                        {[
                            { num: "50K+", label: "Khách hàng" },
                            { num: "500+", label: "Sản phẩm" },
                            { num: "4.9★", label: "Đánh giá" },
                        ].map(s => (
                            <div key={s.label} className={styles.statItem}>
                                <span className={styles.statNum}>{s.num}</span>
                                <span className={styles.statLabel}>{s.label}</span>
                            </div>
                        ))}
                    </div>

                    <div className={styles.heroBadges}>
                        <span className={styles.heroBadge}>🔒 SSL Secured</span>
                        <span className={styles.heroBadge}>⚡ Giao 2H HCM</span>
                        <span className={styles.heroBadge}>🔄 Đổi 7 ngày</span>
                    </div>
                </div>
                {/* Decorative grid */}
                <div className={styles.heroBg} aria-hidden="true">
                    {Array.from({ length: 30 }).map((_, i) => (
                        <span key={i} className={styles.heroDot} />
                    ))}
                </div>
            </div>

            {/* Right — Login form */}
            <div className={styles.formCol}>
                <div className={styles.formWrap}>
                    <div className={styles.formHead}>
                        <h2 className={styles.formTitle}>ĐĂNG NHẬP</h2>
                        <p className={styles.formSub}>
                            Chưa có tài khoản?{" "}
                            <Link href="/register" className={styles.formLink}>Đăng ký ngay</Link>
                        </p>
                    </div>

                    {/* Google OAuth */}
                    <button className={styles.oauthBtn} type="button" onClick={handleGoogleLogin}>
                        <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
                            <path d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844a4.14 4.14 0 01-1.796 2.716v2.259h2.908c1.702-1.567 2.684-3.875 2.684-6.615z" fill="#4285F4" />
                            <path d="M9 18c2.43 0 4.467-.806 5.956-2.18l-2.908-2.259c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 009 18z" fill="#34A853" />
                            <path d="M3.964 10.71A5.41 5.41 0 013.682 9c0-.593.102-1.17.282-1.71V4.958H.957A8.996 8.996 0 000 9c0 1.452.348 2.827.957 4.042l3.007-2.332z" fill="#FBBC05" />
                            <path d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 00.957 4.958L3.964 6.29C4.672 4.163 6.656 3.58 9 3.58z" fill="#EA4335" />
                        </svg>
                        Tiếp tục với Google
                    </button>

                    <div className={styles.dividerRow}>
                        <span className={styles.dividerLine} />
                        <span className={styles.dividerText}>hoặc</span>
                        <span className={styles.dividerLine} />
                    </div>

                    {errors.form && (
                        <div style={{ background: 'rgba(240,53,106,0.1)', border: '1px solid rgba(240,53,106,0.3)', borderRadius: '8px', padding: '12px 16px', marginBottom: '16px', color: '#F0356A', fontSize: '14px', textAlign: 'center' }}>
                            {errors.form}
                        </div>
                    )}

                    <form onSubmit={handleSubmit} className={styles.form} noValidate>
                        {/* Email */}
                        <div className={styles.fieldWrap}>
                            <label className={styles.fieldLabel} htmlFor="email">
                                Email
                            </label>
                            <div className={styles.fieldInner}>
                                <span className={styles.fieldIcon}>✉</span>
                                <input
                                    id="email"
                                    type="email"
                                    className={`${styles.fieldInput} ${errors.email ? styles.fieldErr : ""}`}
                                    placeholder="your@email.com"
                                    autoComplete="email"
                                    value={form.email}
                                    onChange={e => setForm({ ...form, email: e.target.value })}
                                />
                            </div>
                            {errors.email && <span className={styles.errMsg}>{errors.email}</span>}
                        </div>

                        {/* Password */}
                        <div className={styles.fieldWrap}>
                            <div className={styles.fieldLabelRow}>
                                <label className={styles.fieldLabel} htmlFor="password">Mật khẩu</label>
                                <Link href="/forgot-password" className={styles.forgotLink}>Quên mật khẩu?</Link>
                            </div>
                            <div className={styles.fieldInner}>
                                <span className={styles.fieldIcon}>🔑</span>
                                <input
                                    id="password"
                                    type={showPw ? "text" : "password"}
                                    className={`${styles.fieldInput} ${errors.password ? styles.fieldErr : ""}`}
                                    placeholder="••••••••"
                                    autoComplete="current-password"
                                    value={form.password}
                                    onChange={e => setForm({ ...form, password: e.target.value })}
                                />
                                <button
                                    type="button"
                                    className={styles.showPwBtn}
                                    onClick={() => setShowPw(!showPw)}
                                    aria-label="Hiện/ẩn mật khẩu"
                                >
                                    {showPw ? "🙈" : "👁"}
                                </button>
                            </div>
                            {errors.password && <span className={styles.errMsg}>{errors.password}</span>}
                        </div>

                        {/* Remember me */}
                        <label className={styles.rememberRow}>
                            <input
                                type="checkbox"
                                className={styles.checkNative}
                                checked={rememberMe}
                                onChange={e => setRememberMe(e.target.checked)}
                            />
                            <span className={styles.checkBox} />
                            <span className={styles.rememberText}>Ghi nhớ đăng nhập</span>
                        </label>

                        <Button variant="primary" size="lg" fullWidth loading={loading} type="submit">
                            {loading ? "Đang đăng nhập..." : "ĐĂNG NHẬP →"}
                        </Button>
                    </form>

                    <p className={styles.registerNote}>
                        Bằng cách đăng nhập, bạn đồng ý với{" "}
                        <Link href="/warranty" className={styles.formLink}>Điều khoản dịch vụ</Link>
                    </p>
                </div>
            </div>
        </div>
    );
}
