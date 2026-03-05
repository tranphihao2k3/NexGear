"use client";

import React, { useState, useEffect, useRef } from "react";
import Link from "next/link";
import ProductCard from "@/components/product/ProductCard";
import styles from "./page.module.scss";

// ── STATIC DATA (không cần API) ──────────────────────────────
const CATEGORIES = [
  { id: "keyboard", label: "Bàn Phím", sub: "Cơ · Không dây · Custom", href: "/ban-phim", tag: "500+" },
  { id: "mouse", label: "Chuột", sub: "Gaming · Wireless · Ergo", href: "/chuot", tag: "300+" },
  { id: "headphone", label: "Tai Nghe", sub: "Over-ear · TWS · Gaming", href: "/tai-nghe", tag: "200+" },
  { id: "speaker", label: "Loa", sub: "Bluetooth · Soundbar · Studio", href: "/loa", tag: "150+" },
  { id: "mic", label: "Micro", sub: "Stream · Podcast · USB", href: "/micro", tag: "80+" },
  { id: "mousepad", label: "Lót Chuột", sub: "Speed · Control · XXL", href: "/phu-kien?type=pad", tag: "120+" },
  { id: "keycap", label: "Keycap", sub: "PBT · Cherry · SA", href: "/phu-kien?type=keycap", tag: "250+" },
  { id: "accessory", label: "Phụ Kiện", sub: "Switch · Cable · Hub", href: "/phu-kien", tag: "400+" },
];

// SVG icons per category (cyberpunk-style line icons)
function CategorySvg({ id }: { id: string }) {
  const s = { width: 32, height: 32, viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: 1.5, strokeLinecap: "round" as const, strokeLinejoin: "round" as const };
  switch (id) {
    case "keyboard": return <svg {...s}><rect x="2" y="8" width="20" height="10" rx="2"/><line x1="6" y1="12" x2="6" y2="12"/><line x1="10" y1="12" x2="10" y2="12"/><line x1="14" y1="12" x2="14" y2="12"/><line x1="18" y1="12" x2="18" y2="12"/><line x1="8" y1="15" x2="16" y2="15"/></svg>;
    case "mouse": return <svg {...s}><rect x="6" y="2" width="12" height="20" rx="6"/><line x1="12" y1="6" x2="12" y2="10"/><line x1="12" y1="2" x2="12" y2="5"/></svg>;
    case "headphone": return <svg {...s}><path d="M3 18v-6a9 9 0 0 1 18 0v6"/><path d="M21 19a2 2 0 0 1-2 2h-1a2 2 0 0 1-2-2v-3a2 2 0 0 1 2-2h3z"/><path d="M3 19a2 2 0 0 0 2 2h1a2 2 0 0 0 2-2v-3a2 2 0 0 0-2-2H3z"/></svg>;
    case "speaker": return <svg {...s}><rect x="4" y="2" width="16" height="20" rx="2"/><circle cx="12" cy="14" r="4"/><line x1="12" y1="6" x2="12.01" y2="6"/></svg>;
    case "mic": return <svg {...s}><rect x="9" y="2" width="6" height="11" rx="3"/><path d="M5 10a7 7 0 0 0 14 0"/><line x1="12" y1="17" x2="12" y2="22"/><line x1="8" y1="22" x2="16" y2="22"/></svg>;
    case "mousepad": return <svg {...s}><rect x="2" y="6" width="20" height="14" rx="2"/><path d="M6 10h12"/><circle cx="12" cy="15" r="2"/></svg>;
    case "keycap": return <svg {...s}><path d="M6 4h12l2 4v10a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V8l2-4z"/><rect x="8" y="10" width="8" height="6" rx="1"/></svg>;
    case "accessory": return <svg {...s}><circle cx="12" cy="12" r="3"/><path d="M12 2v4"/><path d="M12 18v4"/><path d="M4.93 4.93l2.83 2.83"/><path d="M16.24 16.24l2.83 2.83"/><path d="M2 12h4"/><path d="M18 12h4"/><path d="M4.93 19.07l2.83-2.83"/><path d="M16.24 7.76l2.83-2.83"/></svg>;
    default: return null;
  }
}

const REVIEWS = [
  {
    id: 1,
    name: "Nguyễn Minh Tuấn",
    avatar: "🧑‍💻",
    rating: 5,
    product: "Keychron K2 Pro",
    text: "Bàn phím đánh rất đã, switch red linear mượt như bơ. Đóng gói cẩn thận, giao nhanh. Sẽ ủng hộ shop dài dài!",
  },
  {
    id: 2,
    name: "Trần Thanh Hương",
    avatar: "👩‍🎨",
    rating: 5,
    product: "Razer DeathAdder V3",
    text: "Chuột nhẹ, cảm biến cực nhạy. Mua cho chồng chơi game, ai mà ngờ mình xài luôn kkk. Rất hài lòng!",
  },
  {
    id: 3,
    name: "Lê Công Danh",
    avatar: "🎮",
    rating: 4,
    product: "HyperX Cloud Alpha",
    text: "Âm thanh vô cùng chất, đi làm lâu không đau tai. Giá hơi cao nhưng xứng đáng với chất lượng bỏ ra.",
  },
];

const HERO_MINI_PRODUCTS = [
  { id: 1, name: "Keychron K2", price: "2.290.000₫", badge: "NEW", emoji: "⌨️" },
  { id: 2, name: "Razer Viper V3", price: "1.890.000₫", badge: "HOT", emoji: "🖱️" },
  { id: 3, name: "HyperX Cloud III", price: "2.490.000₫", badge: "SALE", emoji: "🎧" },
  { id: 4, name: "Edifier MX-U6", price: "3.290.000₫", badge: null, emoji: "🎙️" },
  { id: 5, name: "Sony SRS-XB100", price: "1.290.000₫", badge: "NEW", emoji: "🔊" },
  { id: 6, name: "AKKO Deskpad XXL", price: "390.000₫", badge: null, emoji: "🖱️" },
];

// ── COUNTDOWN TIMER ──────────────────────────────────────────
function useCountdown(targetHours = 6) {
  const [time, setTime] = useState({ h: targetHours, m: 0, s: 0 });
  useEffect(() => {
    const end = Date.now() + targetHours * 3600 * 1000;
    const tick = () => {
      const diff = Math.max(0, end - Date.now());
      const h = Math.floor(diff / 3600000);
      const m = Math.floor((diff % 3600000) / 60000);
      const s = Math.floor((diff % 60000) / 1000);
      setTime({ h, m, s });
    };
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [targetHours]);
  return time;
}

function pad(n: number) { return String(n).padStart(2, "0"); }

// ── PAGE ─────────────────────────────────────────────────────
export default function Home() {
  const brandsRef = useRef<HTMLDivElement>(null);
  const { h, m, s } = useCountdown(5);

  // Real API data
  const [featuredProducts, setFeaturedProducts] = useState<any[]>([]);
  const [saleProducts, setSaleProducts] = useState<any[]>([]);
  const [bestsellerProducts, setBestsellerProducts] = useState<any[]>([]);
  const [brands, setBrands] = useState<string[]>([]);

  useEffect(() => {
    // Fetch featured, sale, bestseller products + brands in parallel
    Promise.all([
      fetch('/api/products?featured=true&active=true&limit=4').then(r => r.json()),
      fetch('/api/products?tag=sale&active=true&limit=4&sort=-createdAt').then(r => r.json()),
      fetch('/api/products?active=true&limit=4&sort=-soldCount').then(r => r.json()),
      fetch('/api/brands?limit=20').then(r => r.json()),
    ]).then(([featuredRes, saleRes, bestRes, brandRes]) => {
      if (featuredRes.success) setFeaturedProducts(featuredRes.data);
      if (saleRes.success) setSaleProducts(saleRes.data);
      if (bestRes.success) setBestsellerProducts(bestRes.data);
      if (brandRes.success) setBrands(brandRes.data.map((b: any) => b.name));
    }).catch(console.error);
  }, []);

  // Ensure enough brands for marquee (min 6), pad with defaults if needed
  const defaultBrands = ["AKKO", "Logitech", "Sony", "HyperX", "Edifier", "Razer", "Keychron", "Corsair", "SteelSeries", "Bose", "Sennheiser", "Audio-Technica"];
  const displayBrands = brands.length >= 6 ? brands : (brands.length > 0 ? [...brands, ...defaultBrands.filter(b => !brands.includes(b))].slice(0, 12) : defaultBrands);

  return (
    <div className={styles.home}>

      {/* ── HERO SECTION ── */}
      <section className={styles.hero}>
        <div className={styles.heroBg} aria-hidden />
        <div className={styles.heroAccent} aria-hidden />

        <div className={styles.heroInner}>
          {/* Left */}
          <div className={styles.heroLeft}>
            <div className={styles.heroEyebrow}>
              <span className={styles.eyebrowDot} />
              // SPRING DROPS — THÁNG 3/2026
            </div>

            <h1 className={styles.heroTitle}>
              GEAR UP
              <span className={styles.heroTitleOutline}><br />NEXT</span>{" "}
              <span className={styles.heroTitleAccent}>LEVEL</span>
            </h1>

            <p className={styles.heroTagline}>
              Bàn phím cơ · Chuột gaming · Tai nghe Hi-Fi<br />
              Micro stream · Loa studio · Phụ kiện cao cấp
            </p>

            <div className={styles.heroActions}>
              <Link href="/products" className={styles.heroBtnPrimary}>
                KHÁM PHÁ NGAY →
              </Link>
              <Link href="/deals" className={styles.heroBtnOutline}>
                XEM DEAL 🔥
              </Link>
            </div>

            <div className={styles.heroStats}>
              <div className={styles.heroStatItem}>
                <span className={styles.heroStatValue}>500+</span>
                <span className={styles.heroStatLabel}>Sản phẩm</span>
              </div>
              <div className={styles.heroStatDivider} />
              <div className={styles.heroStatItem}>
                <span className={`${styles.heroStatValue} ${styles.statGold}`}>4.9★</span>
                <span className={styles.heroStatLabel}>Đánh giá</span>
              </div>
              <div className={styles.heroStatDivider} />
              <div className={styles.heroStatItem}>
                <span className={`${styles.heroStatValue} ${styles.statMag}`}>2H</span>
                <span className={styles.heroStatLabel}>Giao nhanh</span>
              </div>
            </div>
          </div>

          {/* Right: Mini Product Preview Grid */}
          <div className={styles.heroRight}>
            <div className={styles.heroGrid}>
              {HERO_MINI_PRODUCTS.map((p) => (
                <div key={p.id} className={styles.heroMiniCard}>
                  <div className={styles.heroMiniEmoji}>{p.emoji}</div>
                  {p.badge && (
                    <span className={`${styles.heroMiniBadge} ${p.badge === "SALE" ? styles.badgeSale :
                        p.badge === "HOT" ? styles.badgeHot : styles.badgeNew
                      }`}>{p.badge}</span>
                  )}
                  <div className={styles.heroMiniName}>{p.name}</div>
                  <div className={styles.heroMiniPrice}>{p.price}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── CATEGORY SHOWCASE ── */}
      <section className={styles.categoryShowcase}>
        <div className={styles.catHeader}>
          <span className={styles.catLabel}>// DANH MỤC</span>
          <span className={styles.catLine} />
          <Link href="/products" className={styles.catViewAll}>Tất cả sản phẩm →</Link>
        </div>
        <div className={styles.categoryShowcaseInner}>
          {CATEGORIES.map((cat, i) => (
            <Link key={i} href={cat.href} className={styles.categoryCard}>
              <div className={styles.catCardGlow} />
              <div className={styles.catCardScanline} />
              <div className={styles.catIconWrap}>
                <CategorySvg id={cat.id} />
                <span className={styles.catIconRing} />
              </div>
              <span className={styles.categoryName}>{cat.label}</span>
              <span className={styles.categorySub}>{cat.sub}</span>
              <div className={styles.catFooter}>
                <span className={styles.catTag}>{cat.tag}</span>
                <span className={styles.categoryArrow}>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><path d="M5 12h14M12 5l7 7-7 7"/></svg>
                </span>
              </div>
              <div className={styles.catTopBar} />
            </Link>
          ))}
        </div>
      </section>

      {/* ── SẢN PHẨM NỔI BẬT ── */}
      <section className={styles.section}>
        <div className={styles.sectionInner}>
          <div className={styles.sectionHead}>
            <div>
              <div className={styles.sectionLabel}>✦ Nổi Bật</div>
              <h2 className={styles.sectionTitle}>SẢN PHẨM NỔI BẬT</h2>
            </div>
            <Link href="/products?featured=true" className={styles.seeAll}>
              Xem tất cả →
            </Link>
          </div>

          <div className={styles.productGrid}>
            {featuredProducts.length > 0
              ? featuredProducts.map((product) => (
                  <ProductCard key={product._id} product={product as any} onAddToCart={() => {}} />
                ))
              : <div style={{ gridColumn: '1/-1', textAlign: 'center', padding: '30px', color: 'rgba(255,255,255,0.4)' }}>Chưa có sản phẩm nổi bật</div>
            }
          </div>
        </div>
      </section>

      {/* ── FLASH SALE BANNER ── */}
      <section className={styles.flashSale}>
        <div className={styles.flashSaleInner}>
          <div className={styles.flashSaleHead}>
            <div className={styles.flashSaleLeft}>
              <div className={styles.flashSaleLabel}>⚡ FLASH SALE</div>
              <h2 className={styles.flashSaleTitle}>DEAL SỐC HÔM NAY</h2>
            </div>
            <div className={styles.flashSaleTimer}>
              <span className={styles.timerLabel}>Kết thúc sau</span>
              <div className={styles.timerBlocks}>
                <div className={styles.timerBlock}>
                  <span className={styles.timerNum}>{pad(h)}</span>
                  <span className={styles.timerUnit}>GIỜ</span>
                </div>
                <span className={styles.timerSep}>:</span>
                <div className={styles.timerBlock}>
                  <span className={styles.timerNum}>{pad(m)}</span>
                  <span className={styles.timerUnit}>PHÚT</span>
                </div>
                <span className={styles.timerSep}>:</span>
                <div className={styles.timerBlock}>
                  <span className={styles.timerNum}>{pad(s)}</span>
                  <span className={styles.timerUnit}>GIÂY</span>
                </div>
              </div>
            </div>
          </div>

          <div className={styles.flashGrid}>
            {saleProducts.length > 0
              ? saleProducts.map((product) => (
                  <ProductCard key={product._id} product={product as any} onAddToCart={() => {}} />
                ))
              : <div style={{ gridColumn: '1/-1', textAlign: 'center', padding: '30px', color: 'rgba(255,255,255,0.4)' }}>Chưa có deal hôm nay</div>
            }
          </div>
        </div>
      </section>

      {/* ── BÁN CHẠY NHẤT ── */}
      <section className={styles.section}>
        <div className={styles.sectionInner}>
          <div className={styles.sectionHead}>
            <div>
              <div className={styles.sectionLabel}>🔥 Top Picks</div>
              <h2 className={styles.sectionTitle}>BÁN CHẠY NHẤT</h2>
            </div>
            <Link href="/products?sort=soldCount" className={styles.seeAll}>
              Xem tất cả →
            </Link>
          </div>

          <div className={styles.productGrid}>
            {bestsellerProducts.length > 0
              ? bestsellerProducts.map((product, i) => (
                  <div key={product._id} className={styles.bestsellerWrap}>
                    <span className={styles.bestsellerRank}>#{i + 1}</span>
                    <ProductCard product={product as any} onAddToCart={() => {}} />
                  </div>
                ))
              : <div style={{ gridColumn: '1/-1', textAlign: 'center', padding: '30px', color: 'rgba(255,255,255,0.4)' }}>Chưa có sản phẩm bán chạy</div>
            }
          </div>
        </div>
      </section>

      {/* ── THƯƠNG HIỆU ĐỐI TÁC ── */}
      <section className={styles.brands}>
        <div className={styles.brandsInner}>
          <div className={styles.sectionLabel} style={{ textAlign: "center", marginBottom: "24px" }}>
            ✦ Đối Tác Chính Hãng
          </div>
          <div className={styles.brandsTrack} ref={brandsRef}>
            <div className={styles.brandsScroll}>
              {[...displayBrands, ...displayBrands].map((brand, i) => (
                <div key={i} className={styles.brandLogo}>{brand}</div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── ĐÁNH GIÁ KHÁCH HÀNG ── */}
      <section className={styles.section}>
        <div className={styles.sectionInner}>
          <div className={styles.sectionHead}>
            <div>
              <div className={styles.sectionLabel}>💬 Reviews</div>
              <h2 className={styles.sectionTitle}>KHÁCH HÀNG NÓI GÌ</h2>
            </div>
          </div>

          <div className={styles.reviewGrid}>
            {REVIEWS.map((rev) => (
              <div key={rev.id} className={styles.reviewCard}>
                <div className={styles.reviewTop}>
                  <div className={styles.reviewAvatar}>{rev.avatar}</div>
                  <div>
                    <div className={styles.reviewName}>{rev.name}</div>
                    <div className={styles.reviewProduct}>đã mua {rev.product}</div>
                  </div>
                </div>
                <div className={styles.reviewStars}>
                  {"★".repeat(rev.rating)}{"☆".repeat(5 - rev.rating)}
                </div>
                <p className={styles.reviewText}>"{rev.text}"</p>
              </div>
            ))}
          </div>
        </div>
      </section>

    </div>
  );
}
