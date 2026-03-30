"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import styles from "./page.module.scss";
import ProductCard from "@/components/product/ProductCard";
import ScrollReveal, { ScrollStagger } from "@/components/animations/ScrollReveal";
import { useSiteSettings } from "@/contexts/SiteSettingsContext";
import { CyberpunkLoader, ProductGridSkeleton } from "@/components/ui";

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

// Sub-component to fetch and render products for a specific category
function CategoryRow({ category, index }: { category: Category; index: number }) {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`/api/products?categorySlug=${category.slug}&limit=8`)
      .then((res) => res.json())
      .then((data) => {
        if (data.success) {
          setProducts(data.data);
        }
      })
      .catch((err) => console.error(err))
      .finally(() => setLoading(false));
  }, [category.slug]);

  if (loading) {
    const isDark = index % 2 === 1;
    return (
      <section className={`${styles.section} ${isDark ? styles.sectionDark : ""}`}>
        <div className={styles.container}>
          <div className={styles.sectionHeader} style={{ marginBottom: "2rem", display: "flex", justifyContent: "space-between", alignItems: "flex-end" }}>
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

  if (products.length === 0) return null; // Don't show empty categories

  const isDark = index % 2 === 1; // Alternate background colors

  return (
    <section className={`${styles.section} ${isDark ? styles.sectionDark : ""}`}>
      <div className={styles.container}>
        <ScrollReveal>
          <div className={styles.sectionHeader} style={{ marginBottom: "2rem", display: "flex", justifyContent: "space-between", alignItems: "flex-end" }}>
            <div>
              <p className={styles.label} style={{ color: "var(--color-primary)", fontWeight: "bold", letterSpacing: "2px", textTransform: "uppercase", fontSize: "14px", marginBottom: "8px" }}>// DANH MỤC NỔI BẬT</p>
              <h2 className={styles.heading} style={{ margin: 0, fontSize: "clamp(24px, 4vw, 36px)", lineHeight: 1.1, color: "var(--color-ink)", textTransform: "uppercase" }}>
                {category.name}
              </h2>
            </div>
            <Link href={`/${category.slug}`} className={styles.viewAll} style={{ color: "var(--color-ink)", textDecoration: "none", fontWeight: 600, borderBottom: "1px solid var(--color-border)", paddingBottom: "4px" }}>
              XEM TẤT CẢ →
            </Link>
          </div>
        </ScrollReveal>

        <ScrollStagger className={styles.featuredGrid}>
          {products.map((p) => (
            <ProductCard key={p._id} product={p as any} />
          ))}
        </ScrollStagger>
      </div>
    </section>
  );
}

export default function StorefrontClient() {
  const siteSettings = useSiteSettings();
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/categories?active=true")
      .then((res) => res.json())
      .then((data) => {
        if (data.success && Array.isArray(data.data)) {
          const rootCats = [...data.data];
          // Sắp xếp: Ưu tiên mục "Laptop" (Gốc) lên đầu, sau đó đến các danh mục con (Gaming Laptop, Ultrabook)
          rootCats.sort((a, b) => {
            const aStr = a.name.toLowerCase() + a.slug.toLowerCase();
            const bStr = b.name.toLowerCase() + b.slug.toLowerCase();
            const aIsLaptop = aStr.includes('laptop') || aStr.includes('ultrabook') || aStr.includes('workstation');
            const bIsLaptop = bStr.includes('laptop') || bStr.includes('ultrabook') || bStr.includes('workstation');
            
            if (a.slug === "laptop") return -1;
            if (b.slug === "laptop") return 1;
            if (aIsLaptop && !bIsLaptop) return -1;
            if (!aIsLaptop && bIsLaptop) return 1;
            
            return 0; 
          });
          setCategories(rootCats);
        }
      })
      .catch((err) => console.error("Error fetching categories:", err))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
       <div className={styles.home} style={{ paddingTop: "80px" }}>
         {/* Giả lập Banner Header */}
         <section style={{ backgroundColor: "var(--color-bg)", padding: "40px 0", borderBottom: "1px solid var(--color-border)" }}>
            <div className={styles.container} style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 16 }}>
               <div style={{ width: "60%", height: 48, backgroundColor: "var(--color-border)", borderRadius: 8 }} />
               <div style={{ width: "40%", height: 20, backgroundColor: "var(--color-border)", borderRadius: 4 }} />
            </div>
         </section>
         
         {/* Giả lập các mảng Sản phẩm */}
         <div style={{ paddingBottom: "80px" }}>
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
         </div>
       </div>
    );
  }

  return (
    <div className={styles.home} style={{ paddingTop: "80px" }}> {/* Offset for Navbar */}
      
      {/* ─── Hero Banner Siêu Gọn Nhẹ ─── */}
      <section style={{ backgroundColor: "var(--color-bg)", padding: "40px 0", borderBottom: "1px solid var(--color-border)" }}>
        <div className={styles.container} style={{ textAlign: "center" }}>
          <ScrollReveal>
            <h1 style={{ fontSize: "clamp(32px, 5vw, 48px)", margin: "0 0 16px 0", color: "var(--color-ink)", lineHeight: 1.1 }}>
              {(siteSettings as any).bannerText || `Chào mừng đến với ${siteSettings.storeName}`}
            </h1>
            <p style={{ fontSize: "16px", color: "var(--color-ink2)", maxWidth: "600px", margin: "0 auto" }}>
              {siteSettings.siteTagline} — Cung cấp các sản phẩm Laptop, PC & Phụ kiện chính hãng với giá tốt nhất thị trường.
            </p>
          </ScrollReveal>
        </div>
      </section>

      {/* ─── Render Category Rows ─── */}
      <div style={{ paddingBottom: "80px" }}>
        {categories.map((cat, idx) => (
          <CategoryRow key={cat._id} category={cat} index={idx} />
        ))}
        
        {categories.length === 0 && (
          <div style={{ textAlign: "center", padding: "100px 0", color: "var(--color-ink2)" }}>
            Chưa có danh mục sản phẩm nào.
          </div>
        )}
      </div>
      
    </div>
  );
}
