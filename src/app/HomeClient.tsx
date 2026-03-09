"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import Link from "next/link";
import ProductCard from "@/components/product/ProductCard";
import styles from "./page.module.scss";

// ── INTERSECTION OBSERVER HOOK ──────────────────────────────
function useInView(options?: IntersectionObserverInit) {
  const ref = useRef<HTMLDivElement>(null);
  const [inView, setInView] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(([e]) => {
      if (e.isIntersecting) { setInView(true); obs.disconnect(); }
    }, { threshold: 0.15, ...options });
    obs.observe(el);
    return () => obs.disconnect();
  }, []);
  return { ref, inView };
}

// ── TYPING EFFECT HOOK ──────────────────────────────────────
function useTyping(texts: string[], speed = 80, pause = 2000) {
  const [display, setDisplay] = useState("");
  const [idx, setIdx] = useState(0);
  const [charIdx, setCharIdx] = useState(0);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    const text = texts[idx];
    const timeout = deleting ? speed / 2 : speed;

    if (!deleting && charIdx === text.length) {
      setTimeout(() => setDeleting(true), pause);
      return;
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
    case "keyboard": return <svg {...s}><rect x="2" y="8" width="20" height="10" rx="2" /><line x1="6" y1="12" x2="6" y2="12" /><line x1="10" y1="12" x2="10" y2="12" /><line x1="14" y1="12" x2="14" y2="12" /><line x1="18" y1="12" x2="18" y2="12" /><line x1="8" y1="15" x2="16" y2="15" /></svg>;
    case "mouse": return <svg {...s}><rect x="6" y="2" width="12" height="20" rx="6" /><line x1="12" y1="6" x2="12" y2="10" /><line x1="12" y1="2" x2="12" y2="5" /></svg>;
    case "headphone": return <svg {...s}><path d="M3 18v-6a9 9 0 0 1 18 0v6" /><path d="M21 19a2 2 0 0 1-2 2h-1a2 2 0 0 1-2-2v-3a2 2 0 0 1 2-2h3z" /><path d="M3 19a2 2 0 0 0 2 2h1a2 2 0 0 0 2-2v-3a2 2 0 0 0-2-2H3z" /></svg>;
    case "speaker": return <svg {...s}><rect x="4" y="2" width="16" height="20" rx="2" /><circle cx="12" cy="14" r="4" /><line x1="12" y1="6" x2="12.01" y2="6" /></svg>;
    case "mic": return <svg {...s}><rect x="9" y="2" width="6" height="11" rx="3" /><path d="M5 10a7 7 0 0 0 14 0" /><line x1="12" y1="17" x2="12" y2="22" /><line x1="8" y1="22" x2="16" y2="22" /></svg>;
    case "mousepad": return <svg {...s}><rect x="2" y="6" width="20" height="14" rx="2" /><path d="M6 10h12" /><circle cx="12" cy="15" r="2" /></svg>;
    case "keycap": return <svg {...s}><path d="M6 4h12l2 4v10a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V8l2-4z" /><rect x="8" y="10" width="8" height="6" rx="1" /></svg>;
    case "accessory": return <svg {...s}><circle cx="12" cy="12" r="3" /><path d="M12 2v4" /><path d="M12 18v4" /><path d="M4.93 4.93l2.83 2.83" /><path d="M16.24 16.24l2.83 2.83" /><path d="M2 12h4" /><path d="M18 12h4" /><path d="M4.93 19.07l2.83-2.83" /><path d="M16.24 7.76l2.83-2.83" /></svg>;
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

const HERO_CATEGORIES = CATEGORIES.slice(0, 6);

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
export default function HomeClient() {
  const brandsRef = useRef<HTMLDivElement>(null);
  const { h, m, s } = useCountdown(5);
  const heroRef = useInView();
  const typingText = useTyping(["NEXT LEVEL", "YOUR SETUP", "THE GAME"], 90, 2500);

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
      fetch('/api/brands?limit=20&hasProducts=true').then(r => r.json()),
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
      <section className={styles.hero} ref={heroRef.ref}>
        <div className={styles.heroBg} aria-hidden />
        <div className={styles.heroAccent} aria-hidden />
        {/* Floating particles */}
        <div className={styles.heroParticles} aria-hidden>
          {Array.from({ length: 6 }).map((_, i) => (
            <span key={i} className={styles.particle} style={{ '--i': i } as React.CSSProperties} />
          ))}
        </div>

        <div className={styles.heroInner}>
          {/* Left */}
          <div className={`${styles.heroLeft} ${heroRef.inView ? styles.animateIn : ''}`}>
            <div className={styles.heroEyebrow}>
              <span className={styles.eyebrowDot} />
              // SPRING DROPS — THÁNG 3/2026
            </div>

            <h1 className={styles.heroTitle}>
              <span className={styles.heroTitleGlitch} data-text="GEAR UP">GEAR UP</span>
              <span className={styles.heroTitleOutline}><br />NEXT</span>{" "}
              <span className={styles.heroTitleAccent}>LEVEL</span>
            </h1>

            <p className={styles.heroTagline}>
              Bàn phím cơ · Chuột gaming · Tai nghe Hi-Fi<br />
              Micro stream · Loa studio · Phụ kiện cao cấp
            </p>

            <div className={styles.heroActions}>
              <Link href="/products" className={styles.heroBtnPrimary}>
                <span className={styles.btnGlow} />
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

          {/* Right: Category Grid */}
          <div className={styles.heroRight}>
            <div className={styles.heroGrid}>
              {HERO_CATEGORIES.map((cat, i) => (
                <Link key={cat.id} href={cat.href} className={styles.heroMiniCard} style={{ '--delay': `${i * 0.08}s` } as React.CSSProperties}>
                  <div className={styles.heroMiniIcon}>
                    <CategorySvg id={cat.id} />
                  </div>
                  <div className={styles.heroMiniName}>{cat.label}</div>
                  <div className={styles.heroMiniSub}>{cat.tag} sản phẩm</div>
                  <div className={styles.cardGlow} aria-hidden />
                </Link>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── TẠI SAO CHỌN NEXGEAR ── */}
      <section className={styles.uspSection}>
        <div className={styles.uspInner}>
          <div className={styles.uspHeader}>
            <span className={styles.uspLabel}>// TẠI SAO CHỌN NEXGEAR</span>
            <span className={styles.uspLine} />
          </div>
          <div className={styles.uspGrid}>
            {[
              { icon: <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" /><path d="M9 12l2 2 4-4" /></svg>, title: "100% Chính Hãng", desc: "Cam kết hàng chính hãng, tem bảo hành đầy đủ từ nhà phân phối." },
              { icon: <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10" /><path d="M12 6v6l4 2" /></svg>, title: "Giao Hàng 2H", desc: "Giao nhanh trong 2 giờ nội thành, ship toàn quốc 24-48h." },
              { icon: <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z" /></svg>, title: "Tư Vấn 24/7", desc: "Đội ngũ tư vấn chuyên nghiệp, hỗ trợ online mọi lúc mọi nơi." },
              { icon: <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M23 6l-9.5 9.5-5-5L1 18" /><path d="M17 6h6v6" /></svg>, title: "Giá Tốt Nhất", desc: "Hoàn tiền nếu bạn tìm được giá rẻ hơn ở nơi khác." },
            ].map((item, i) => (
              <div key={i} className={styles.uspCard}>
                <div className={styles.uspIconWrap}>{item.icon}</div>
                <div className={styles.uspContent}>
                  <h3 className={styles.uspTitle}>{item.title}</h3>
                  <p className={styles.uspDesc}>{item.desc}</p>
                </div>
              </div>
            ))}
          </div>
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
                <ProductCard key={product._id} product={product as any} onAddToCart={() => { }} />
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
                <ProductCard key={product._id} product={product as any} onAddToCart={() => { }} />
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
                  <ProductCard product={product as any} onAddToCart={() => { }} />
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
