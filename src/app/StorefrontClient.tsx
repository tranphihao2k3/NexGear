"use client";

import React, { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import styles from "./page.module.scss";
import sfStyles from "./storefront-hero.module.scss";
import ProductCard from "@/components/product/ProductCard";
import ScrollReveal, { ScrollStagger } from "@/components/animations/ScrollReveal";
import { useSiteSettings } from "@/contexts/SiteSettingsContext";
import { ProductGridSkeleton } from "@/components/ui";

interface Category {
  _id: string;
  name: string;
  slug: string;
  children?: any[];
}

interface Product {
  _id: string;
  name: string;
  slug: string;
  sku: string;
  brand: { name: string };
  images: string[];
  basePrice: number;
  salePrice?: number | null;
  stock: number;
  ratings: { avg: number; count: number };
}

// ── Hook: chỉ return true khi element gần viewport ──────────
function useNearViewport(rootMargin = "600px") {
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) { setVisible(true); obs.disconnect(); } },
      { rootMargin }
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, [rootMargin]);

  return { ref, visible };
}

// ── CategoryRow: lazy fetch khi gần viewport ─────────────────
function CategoryRow({ category, index, eager = false }: { category: Category; index: number; eager?: boolean }) {
  const { ref, visible } = useNearViewport("300px");
  const shouldFetch = eager || visible; // eager = row đầu tiên, fetch ngay

  const { data: products = [], isLoading: loading } = useQuery<Product[]>({
    queryKey: ['storefront-products', category.slug],
    queryFn: async () => {
      const res = await fetch(`/api/products?categorySlug=${category.slug}&limit=8`);
      const data = await res.json();
      return data.success ? data.data : [];
    },
    staleTime: 10 * 60 * 1000,
    enabled: shouldFetch, // Chỉ fetch khi sắp vào viewport hoặc eager
  });

  const isDark = index % 2 === 1;

  // Chưa visible → render sentinel placeholder nhẹ (chiếm chỗ)
  if (!visible) {
    return (
      <div ref={ref} style={{ minHeight: 300 }}>
        <section className={`${styles.section} ${isDark ? styles.sectionDark : ""}`}>
          <div className={styles.container}>
            <div style={{ marginBottom: "2rem" }}>
              <p className={styles.label} style={{ color: "var(--color-primary)", fontWeight: "bold", letterSpacing: "2px", textTransform: "uppercase", fontSize: "14px", marginBottom: "8px" }}>// DANH MỤC NỔI BẬT</p>
              <h2 className={styles.heading} style={{ margin: 0, fontSize: "clamp(24px, 4vw, 36px)", lineHeight: 1.1, color: "var(--color-ink)", textTransform: "uppercase" }}>
                {category.name}
              </h2>
            </div>
          </div>
        </section>
      </div>
    );
  }

  if (loading) {
    return (
      <section className={`${styles.section} ${isDark ? styles.sectionDark : ""}`}>
        <div className={styles.container}>
          <div style={{ marginBottom: "2rem", display: "flex", justifyContent: "space-between", alignItems: "flex-end" }}>
            <div>
              <p className={styles.label} style={{ color: "var(--color-primary)", fontWeight: "bold", letterSpacing: "2px", textTransform: "uppercase", fontSize: "14px", marginBottom: "8px" }}>// DANH MỤC NỔI BẬT</p>
              <h2 className={styles.heading} style={{ margin: 0, fontSize: "clamp(24px, 4vw, 36px)", lineHeight: 1.1, color: "var(--color-ink)", textTransform: "uppercase" }}>
                {category.name}
              </h2>
            </div>
          </div>
          <ProductGridSkeleton count={8} />
        </div>
      </section>
    );
  }

  const isKeyLaptop = ['gaming-laptop', 'ultrabook', 'workstation', 'laptop-sinh-vien'].includes(category.slug);

  if (products.length === 0) {
    if (isKeyLaptop) {
      // Đối với các mục Laptop quan trọng, nếu chưa có sản phẩm vẫn hiện Row nhưng kèm thông tin "Sắp có hàng"
      return (
        <section className={`${styles.section} ${isDark ? styles.sectionDark : ""}`}>
          <div className={styles.container}>
            <div style={{ marginBottom: "2rem", display: "flex", justifyContent: "space-between", alignItems: "flex-end" }}>
              <div>
                <p className={styles.label} style={{ color: "var(--color-primary)", fontWeight: "bold", letterSpacing: "2px", textTransform: "uppercase", fontSize: "14px", marginBottom: "8px" }}>// DANH MỤC NỔI BẬT</p>
                <h2 className={styles.heading} style={{ margin: 0, fontSize: "clamp(24px, 4vw, 36px)", lineHeight: 1.1, color: "var(--color-ink)", textTransform: "uppercase" }}>
                  {category.name}
                </h2>
              </div>
            </div>
            <div style={{ 
              padding: "40px", 
              borderRadius: "8px", 
              border: "1px dashed var(--color-border)", 
              textAlign: "center",
              background: "rgba(0,196,173,0.02)"
            }}>
              <p style={{ color: "var(--color-ink2)", fontSize: "14px", margin: 0 }}>
                 🚀 Đang cập nhật sản phẩm {category.name}... <br/>
                 <small style={{ color: "var(--color-ink3)" }}>Vui lòng quay lại sau ít phút hoặc liên hệ hotline để được tư vấn.</small>
              </p>
            </div>
          </div>
        </section>
      );
    }
    return null;
  }

  return (
    <section className={`${styles.section} ${isDark ? styles.sectionDark : ""}`}>
      <div className={styles.container}>
        <div style={{ marginBottom: "2rem", display: "flex", justifyContent: "space-between", alignItems: "flex-end" }}>
          <div>
            <p className={styles.label} style={{ color: "var(--color-primary)", fontWeight: "bold", letterSpacing: "2px", textTransform: "uppercase", fontSize: "14px", marginBottom: "8px" }}>// DANH MỤC NỔI BẬT</p>
            <h2 className={styles.heading} style={{ margin: 0, fontSize: "clamp(24px, 4vw, 36px)", lineHeight: 1.1, color: "var(--color-ink)", textTransform: "uppercase" }}>
              {category.name}
            </h2>
          </div>
          <Link href={`/${category.slug}`} prefetch={false} className={styles.viewAll} style={{ color: "var(--color-ink)", textDecoration: "none", fontWeight: 600, borderBottom: "1px solid var(--color-border)", paddingBottom: "4px" }}>
            XEM TẤT CẢ →
          </Link>
        </div>

        <ScrollStagger className={styles.featuredGrid}>
          {products.map((p) => (
            <ProductCard key={p._id} product={p as any} />
          ))}
        </ScrollStagger>
      </div>
    </section>
  );
}

// ── TYPING EFFECT ────────────────────────────────────────────
function useTyping(texts: string[], speed = 80, pause = 2000) {
  const [display, setDisplay] = useState("");
  const [idx, setIdx] = useState(0);
  const [charIdx, setCharIdx] = useState(0);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    const text = texts[idx];
    const timeout = deleting ? speed / 2 : speed;
    if (!deleting && charIdx === text.length) {
      const t = setTimeout(() => setDeleting(true), pause);
      return () => clearTimeout(t);
    }
    if (deleting && charIdx === 0) {
      setDeleting(false);
      setIdx((i) => (i + 1) % texts.length);
      return;
    }
    const timer = setTimeout(() => {
      setDisplay(text.substring(0, deleting ? charIdx - 1 : charIdx + 1));
      setCharIdx((c) => c + (deleting ? -1 : 1));
    }, timeout);
    return () => clearTimeout(timer);
  }, [charIdx, deleting, idx, texts, speed, pause]);

  return display;
}

export default function StorefrontClient() {
  const siteSettings = useSiteSettings();
  const typingText = useTyping(["Laptop Gaming", "Ultrabook", "Workstation", "Laptop Sinh Viên", "Linh kiện PC", "Phụ kiện chính hãng"], 90, 2500);

  const { data: categories = [], isLoading: loading } = useQuery<Category[]>({
    queryKey: ['storefront-categories'],
    queryFn: async () => {
      const res = await fetch("/api/categories?active=true");
      const data = await res.json();
      if (data.success && Array.isArray(data.data)) {
        const rootCats = [...data.data];
        
        // Luôn đảm bảo 4 danh mục Laptop quan trọng có mặt (để render các row riêng biệt)
        const laptopSlugs = ['gaming-laptop', 'ultrabook', 'workstation', 'laptop-sinh-vien'];
        const laptopDefaults = [
            { _id: 'def-gaming', name: 'Gaming Laptop', slug: 'gaming-laptop' },
            { _id: 'def-ultra', name: 'Ultrabook', slug: 'ultrabook' },
            { _id: 'def-work', name: 'Workstation', slug: 'workstation' },
            { _id: 'def-student', name: 'Laptop Sinh Viên', slug: 'laptop-sinh-vien' }
        ];

        // Thêm vào nếu DB chưa có
        const existingSlugs = new Set(rootCats.map(c => c.slug));
        for (const def of laptopDefaults) {
            if (!existingSlugs.has(def.slug)) {
                rootCats.push(def as any);
            }
        }

        // Sắp xếp: Ưu tiên Laptop lên đầu, theo đúng thứ tự screenshot
        rootCats.sort((a, b) => {
          const aSlug = a.slug.toLowerCase();
          const bSlug = b.slug.toLowerCase();
          
          const aIdx = laptopSlugs.indexOf(aSlug);
          const bIdx = laptopSlugs.indexOf(bSlug);

          if (aIdx !== -1 && bIdx !== -1) return aIdx - bIdx;
          if (aIdx !== -1) return -1;
          if (bIdx !== -1) return 1;
          
          // Sau đó đến Laptop (tổng quát)
          if (aSlug === 'laptop') return -1;
          if (bSlug === 'laptop') return 1;

          return 0; 
        });
        return rootCats;
      }
      return [];
    },
    staleTime: 15 * 60 * 1000,
  });

  return (
    <div className={styles.home} style={{ paddingTop: "80px" }}> {/* Offset for Navbar */}
      
      {/* ─── Hero Banner ─── */}
      <section className={sfStyles.hero}>
        {/* Animated gradient blobs */}
        <div className={sfStyles.blobs}>
          <div className={`${sfStyles.blob} ${sfStyles.blob1}`} />
          <div className={`${sfStyles.blob} ${sfStyles.blob2}`} />
          <div className={`${sfStyles.blob} ${sfStyles.blob3}`} />
        </div>

        {/* Grid overlay */}
        <div className={sfStyles.grid} />

        {/* Floating particles */}
        <div className={sfStyles.particles}>
          {Array.from({ length: 12 }).map((_, i) => (
            <span key={i} className={sfStyles.particle} style={{ "--i": i } as React.CSSProperties} />
          ))}
        </div>

        <div className={sfStyles.content}>
          {/* Badge */}
          <div className={sfStyles.badge}>
            <span className={sfStyles.badgeDot} />
            <span>{siteSettings.storeName}</span>
            <span className={sfStyles.badgeSep}>•</span>
            <span className={sfStyles.badgeTag}>Chính hãng 100%</span>
          </div>

          {/* Title */}
          <h1 className={sfStyles.title}>
            <span className={sfStyles.titleLine1}>Laptop, PC &</span>
            <span className={sfStyles.titleLine2}>
              <span className={sfStyles.titleGradient}>Phụ Kiện</span> Chính Hãng
            </span>
          </h1>

          {/* Subtitle with typing */}
          <p className={sfStyles.subtitle}>
            Giá tốt nhất thị trường — Tìm kiếm{" "}
            <span className={sfStyles.typing}>{typingText}</span>
            <span className={sfStyles.cursor}>|</span>
          </p>

          {/* Feature pills */}
          <div className={sfStyles.features}>
            <div className={`${sfStyles.pill} ${sfStyles.pillCyan}`}>
              <span>⚡</span><span>Giao 2H nội thành</span>
            </div>
            <div className={`${sfStyles.pill} ${sfStyles.pillGold}`}>
              <span>💰</span><span>Trả góp 0%</span>
            </div>
            <div className={`${sfStyles.pill} ${sfStyles.pillMagenta}`}>
              <span>🔄</span><span>Đổi trả 7 ngày nếu có lỗi</span>
            </div>
            <div className={`${sfStyles.pill} ${sfStyles.pillPurple}`}>
              <span>🛡️</span><span>Bảo hành chính hãng</span>
            </div>
          </div>

          {/* CTA */}
          <div className={sfStyles.cta}>
            <Link href="/products" className={sfStyles.ctaPrimary}>
              KHÁM PHÁ NGAY <span className={sfStyles.ctaArrow}>→</span>
            </Link>
            <Link href="/deals" className={sfStyles.ctaDeal}>
              <span className={sfStyles.ctaFire}>🔥</span> FLASH DEAL
            </Link>
          </div>

          {/* Stats */}
          <div className={sfStyles.stats}>
            {[
              { v: "500+", l: "Sản phẩm", c: "#00C4AD" },
              { v: "4.9★", l: "Đánh giá", c: "#F0A500" },
              { v: "2H", l: "Giao nhanh", c: "#F0356A" },
              { v: "24/7", l: "Hỗ trợ", c: "#7B3FF2" },
            ].map((s) => (
              <div key={s.l} className={sfStyles.statItem}>
                <span className={sfStyles.statValue} style={{ color: s.c }}>{s.v}</span>
                <span className={sfStyles.statLabel}>{s.l}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── Render Category Rows ─── */}
      <div style={{ paddingBottom: "80px" }}>
        {loading ? (
           <>
            {[1, 2, 3].map((_, idx) => {
               const isDark = idx % 2 === 1;
               return (
                  <section key={idx} className={`${styles.section} ${isDark ? styles.sectionDark : ""}`}>
                     <div className={styles.container}>
                        <div style={{ marginBottom: "2rem" }}>
                           <div style={{ width: 150, height: 14, backgroundColor: "var(--color-primary)", opacity: 0.5, marginBottom: 8, borderRadius: 2 }} />
                           <div style={{ width: 300, height: 36, backgroundColor: "var(--color-border)", borderRadius: 4 }} />
                        </div>
                        <ProductGridSkeleton count={8} />
                     </div>
                  </section>
               );
            })}
           </>
        ) : (
          <>
            {categories.map((cat, idx) => (
              <CategoryRow key={cat._id} category={cat} index={idx} eager={idx < 2} />
            ))}
            
            {categories.length === 0 && (
              <div style={{ textAlign: "center", padding: "100px 0", color: "var(--color-ink2)" }}>
                Chưa có danh mục sản phẩm nào.
              </div>
            )}
          </>
        )}
      </div>
      
    </div>
  );
}
