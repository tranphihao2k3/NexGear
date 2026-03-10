"use client";

import React, { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import styles from "./page.module.scss";
import { Mail, Lock, Eye, EyeOff, ShieldAlert, ArrowLeft } from "lucide-react";

export default function AdminLoginClient() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const callbackUrl = searchParams.get("callbackUrl") || "/admin";

    const [form, setForm] = useState({ email: "", password: "" });
    const [errors, setErrors] = useState<Record<string, string>>({});
    const [loading, setLoading] = useState(false);
    const [showPw, setShowPw] = useState(false);

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
                setLoading(false);
            } else {
                router.push(callbackUrl);
                router.refresh();
            }
        } catch (e) {
            setErrors({ form: "Đã xảy ra lỗi, vui lòng thử lại" });
            setLoading(false);
        }
    }

    return (
        <div className={styles.page}>
            <div className={styles.gridBg} />
            <div className={styles.formCol}>
                <div className={styles.formWrap}>
                    <div className={styles.brand}>
                        <span className={styles.logoNex}>NEX</span>
                        <span className={styles.logoGear}>GEAR</span>
                    </div>
                    <div className={styles.formHead}>
                        <h1 className={styles.formTitle}>Quản trị hệ thống</h1>
                        <p className={styles.formSub}>Đăng nhập để vào Admin Dashboard</p>
                    </div>

                    <form className={styles.form} onSubmit={handleSubmit} noValidate>
                        <div className={styles.fieldWrap}>
                            <div className={styles.fieldLabelRow}>
                                <label className={styles.fieldLabel}>Email Admin</label>
                            </div>
                            <div className={styles.fieldInner}>
                                <Mail className={styles.fieldIcon} size={18} />
                                <input
                                    type="email"
                                    placeholder="admin@nexgear.com"
                                    className={`${styles.fieldInput} ${errors.email ? styles.fieldErr : ""}`}
                                    value={form.email}
                                    onChange={(e) => setForm({ ...form, email: e.target.value })}
                                />
                            </div>
                        </div>

                        <div className={styles.fieldWrap}>
                            <div className={styles.fieldLabelRow}>
                                <label className={styles.fieldLabel}>Mật khẩu</label>
                            </div>
                            <div className={styles.fieldInner}>
                                <Lock className={styles.fieldIcon} size={18} />
                                <input
                                    type={showPw ? "text" : "password"}
                                    placeholder="••••••••"
                                    className={`${styles.fieldInput} ${errors.password ? styles.fieldErr : ""}`}
                                    value={form.password}
                                    onChange={(e) => setForm({ ...form, password: e.target.value })}
                                />
                                <button
                                    type="button"
                                    className={styles.showPwBtn}
                                    onClick={() => setShowPw(!showPw)}
                                >
                                    {showPw ? <EyeOff size={18} /> : <Eye size={18} />}
                                </button>
                            </div>
                        </div>

                        {errors.form && (
                            <div className={styles.errMsg}>
                                <ShieldAlert size={16} />
                                <span>{errors.form}</span>
                            </div>
                        )}

                        <button type="submit" className={styles.submitBtn} disabled={loading}>
                            {loading ? "ĐANG TIẾN HÀNH..." : "ĐĂNG NHẬP"}
                        </button>

                        <div style={{ textAlign: 'center' }}>
                            <Link href="/login" className={styles.backLink}>
                                <ArrowLeft size={16} /> Quay lại trang đăng nhập khách
                            </Link>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
}
