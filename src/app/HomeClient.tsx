"use client";

import React, { useState, useEffect, useRef, Suspense, lazy } from "react";
import Link from "next/link";
import Image from "next/image";
import { motion, useScroll, useTransform, useInView, AnimatePresence, useSpring } from "framer-motion";
import styles from "./page.module.scss";
import ProductCard from "@/components/product/ProductCard";
import ScrollReveal, { ScrollStagger } from "@/components/animations/ScrollReveal";
import CustomCursor from "@/components/ui/CustomCursor";

const HeroScene = lazy(() => import("@/components/3d/HeroScene"));

// ── TYPES ────────────────────────────────────────────────────
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
  tags?: string[];
  category?: { _id: string; name: string } | string;
}

interface Blog {
  _id: string;
  title: string;
  slug: string;
  excerpt: string;
  image?: string;
  tags: string[];
  createdAt: string;
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

// ── ANIMATED COUNTER ─────────────────────────────────────────
function Counter({ target, suffix = "" }: { target: number; suffix?: string }) {
  const [count, setCount] = useState(0);
  const ref = useRef<HTMLSpanElement>(null);
  const inView = useInView(ref, { once: true });

  useEffect(() => {
    if (!inView) return;
    const dur = 2000;
    const start = Date.now();
    const animate = () => {
      const p = Math.min((Date.now() - start) / dur, 1);
      setCount(Math.round((1 - Math.pow(1 - p, 3)) * target));
      if (p < 1) requestAnimationFrame(animate);
    };
    animate();
  }, [inView, target]);

  return <span ref={ref}>{count}{suffix}</span>;
}

// ── SECTION WRAPPER ──────────────────────────────────────────
function Section({ children, className = "", dark = false }: { children: React.ReactNode; className?: string; dark?: boolean }) {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: "-100px" });
  return (
    <motion.section
      ref={ref}
      className={`${styles.section} ${dark ? styles.sectionDark : ""} ${className}`}
      initial={{ opacity: 0 }}
      animate={inView ? { opacity: 1 } : {}}
      transition={{ duration: 0.8 }}
    >
      {children}
    </motion.section>
  );
}

// ── FADE UP BLOCK ────────────────────────────────────────────
function FadeUp({ children, delay = 0, className = "" }: { children: React.ReactNode; delay?: number; className?: string }) {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: "-80px" });
  return (
    <motion.div
      ref={ref}
      className={className}
      initial={{ opacity: 0, y: 50 }}
      animate={inView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.7, delay, ease: [0.16, 1, 0.3, 1] }}
    >
      {children}
    </motion.div>
  );
}

// ── DATA ─────────────────────────────────────────────────────
const STORY_STEPS = [
  { num: "01", emoji: "🎯", title: "KHÁM PHÁ", desc: "Duyệt hàng ngàn sản phẩm từ các thương hiệu hàng đầu thế giới. Bộ lọc thông minh giúp bạn tìm đúng gear trong vài giây." },
  { num: "02", emoji: "🧠", title: "TƯ VẤN 1:1", desc: "Chưa biết chọn gì? Team NexGear sẵn sàng tư vấn chuyên sâu, giúp bạn build setup hoàn hảo theo budget." },
  { num: "03", emoji: "🚀", title: "GIAO & SETUP", desc: "Giao tận nơi trong 2 giờ nội thành. Hỗ trợ setup tại nhà miễn phí cho đơn từ 2 triệu." },
  { num: "04", emoji: "🏆", title: "BẢO HÀNH VIP", desc: "Bảo hành chính hãng, đổi mới 30 ngày. Thu cũ đổi mới với giá ưu đãi nhất thị trường." },
];

const USP = [
  { icon: "🛡️", title: "100% Chính Hãng", desc: "Tem bảo hành đầy đủ từ nhà phân phối", value: 100, suffix: "%" },
  { icon: "⚡", title: "Giao Hàng 2H", desc: "Nội thành ship 2h, toàn quốc 24-48h", value: 2, suffix: "H" },
  { icon: "💬", title: "Tư Vấn 24/7", desc: "Đội ngũ chuyên nghiệp hỗ trợ mọi lúc", value: 24, suffix: "/7" },
  { icon: "💰", title: "Giá Tốt Nhất", desc: "Hoàn tiền nếu tìm được giá rẻ hơn", value: 0, suffix: "%" },
];

const BRANDS = ["AKKO", "Logitech", "Razer", "Sony", "HyperX", "Keychron", "Corsair", "SteelSeries", "Edifier", "Bose", "Sennheiser", "Audio-Technica"];

const REVIEWS = [
  { name: "Nguyễn Minh Tuấn", avatar: "🧑‍💻", rating: 5, product: "Keychron K2 Pro", text: "Bàn phím đánh rất đã, switch red linear mượt như bơ. Sẽ ủng hộ shop dài dài!" },
  { name: "Trần Thanh Hương", avatar: "👩‍🎨", rating: 5, product: "Razer DeathAdder V3", text: "Chuột nhẹ, cảm biến cực nhạy. Rất hài lòng với chất lượng!" },
  { name: "Lê Công Danh", avatar: "🎮", rating: 4, product: "HyperX Cloud Alpha", text: "Âm thanh vô cùng chất, đeo lâu không đau tai. Xứng đáng!" },
];

const FAQS = [
  { q: "NEXGEAR có bảo hành chính hãng không?", a: "Tất cả sản phẩm tại NEXGEAR đều là hàng chính hãng 100%, được bảo hành theo đúng tiêu chuẩn của nhà sản xuất (từ 12-24 tháng)." },
  { q: "Shop có hỗ trợ setup tại nhà không?", a: "Có! Với các đơn hàng từ 2 triệu đồng trở lên trong nội thành Cần Thơ, NEXGEAR hỗ trợ setup và tối ưu hóa hệ thống hoàn toàn miễn phí." },
  { q: "Tôi có thể mua trả góp tại shop không?", a: "Chắc chắn rồi. NEXGEAR hỗ trợ trả góp qua thẻ tín dụng hoặc các công ty tài chính với lãi suất cực thấp, thủ tục nhanh gọn." },
  { q: "Shop có thu cũ đổi mới không?", a: "Chúng tôi có chương trình 'Thu cũ đổi mới' cực hấp dẫn dành cho bàn phím, chuột và tai nghe gaming. Vui lòng nhắn tin để được định giá." },
];

const CATEGORIES = [
  { emoji: "⌨️", label: "Bàn Phím", count: "500+", href: "/ban-phim" },
  { emoji: "🖱️", label: "Chuột", count: "300+", href: "/chuot" },
  { emoji: "🎧", label: "Tai Nghe", count: "200+", href: "/tai-nghe" },
  { emoji: "🔊", label: "Loa", count: "150+", href: "/loa" },
  { emoji: "🎙️", label: "Micro", count: "80+", href: "/micro" },
  { emoji: "💻", label: "Laptop", count: "100+", href: "/laptop" },
  { emoji: "🔲", label: "Keycap", count: "250+", href: "/phu-kien?type=keycap" },
  { emoji: "🔌", label: "Phụ Kiện", count: "400+", href: "/phu-kien" },
];

// ══════════════════════════════════════════════════════════════
export default function HomeClient() {
  const typingText = useTyping(["Bàn phím cơ", "Chuột gaming", "Tai nghe Hi-Fi", "Micro stream", "Laptop gaming"], 90, 2500);
  const heroRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({ target: heroRef, offset: ["start start", "end start"] });
  const { scrollYProgress: globalScroll } = useScroll();
  const scaleX = useSpring(globalScroll, { stiffness: 100, damping: 30, restDelta: 0.001 });

  const heroOpacity = useTransform(scrollYProgress, [0, 1], [1, 0]);
  const heroY = useTransform(scrollYProgress, [0, 1], [0, 150]);

  const [featuredProducts, setFeaturedProducts] = useState<Product[]>([]);
  const [blogs, setBlogs] = useState<Blog[]>([]);
  const [activeFaq, setActiveFaq] = useState<number | null>(0);

  useEffect(() => {
    // Fetch featured products
    fetch("/api/products?featured=true&limit=8")
      .then(res => res.json())
      .then(data => {
        if (data.success) setFeaturedProducts(data.data);
      })
      .catch(err => console.error("Error fetching products:", err));

    // Fetch latest blogs
    fetch("/api/blog?limit=3")
      .then(res => res.json())
      .then(data => {
        if (data.success) setBlogs(data.data);
      })
      .catch(err => console.error("Error fetching blogs:", err));
  }, []);

  return (
    <div className={styles.home}>
      <CustomCursor />
      {/* ═══ SCROLL PROGRESS ═══ */}
      <motion.div className={styles.progressBar} style={{ scaleX }} />

      {/* ═══ HERO ═══ */}
      <motion.div ref={heroRef} className={styles.hero} style={{ opacity: heroOpacity }}>
        <div className={styles.heroGrid} />
        <div className={styles.hero3d}>
          <Suspense fallback={null}><HeroScene /></Suspense>
        </div>
        <div className={styles.heroOverlay} />
        <div className={styles.heroBottom} />

        <motion.div className={styles.heroContent} style={{ y: heroY }}>
          <motion.div className={styles.heroBadge} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
            <span className={styles.heroDot} />
            NEXGEAR — GAMING GEAR STORE
          </motion.div>

          <motion.h1 className={styles.heroTitle} initial={{ opacity: 0, y: 40 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4, duration: 0.8 }}>
            <span className={styles.heroGradient}>GEAR UP</span>
            <span className={styles.heroDotSep}>·</span>
            LEVEL UP
          </motion.h1>

          <motion.p className={styles.heroSub} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.7 }}>
            Nâng cấp setup với <span className={styles.heroHighlight}>{typingText}</span>
            <span className={styles.heroCursor}>|</span>
          </motion.p>

          <motion.div className={styles.heroCTA} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.9 }}>
            <Link href="/products" className={styles.btnPrimary}>KHÁM PHÁ NGAY →</Link>
            <Link href="/products?tag=sale" className={styles.btnOutline}>XEM DEAL 🔥</Link>
          </motion.div>

          <motion.div className={styles.heroStats} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 1.2 }}>
            {[
              { v: "500+", l: "Sản phẩm" },
              { v: "4.9★", l: "Đánh giá" },
              { v: "2H", l: "Giao nhanh" },
              { v: "0%", l: "Trả góp" },
            ].map((s, i) => (
              <div key={s.l} className={styles.stat}>
                <span className={styles.statV}>{s.v}</span>
                <span className={styles.statL}>{s.l}</span>
              </div>
            ))}
          </motion.div>

          <motion.div className={styles.scrollHint} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 1.5 }}>
            <span className={styles.scrollMouse}><span className={styles.scrollDot} /></span>
            <span className={styles.scrollLabel}>SCROLL</span>
          </motion.div>
        </motion.div>
      </motion.div>

      {/* ═══ STORY: HÀNH TRÌNH ═══ */}
      <Section dark>
        <div className={styles.container}>
          <ScrollReveal>
            <p className={styles.label}>// HÀNH TRÌNH CỦA BẠN</p>
            <h2 className={styles.heading}>TỪ Ý TƯỞNG ĐẾN<br />SETUP HOÀN HẢO</h2>
          </ScrollReveal>

          <ScrollStagger className={styles.timeline}>
            <div className={styles.timelineLine} />
            {STORY_STEPS.map((step, i) => (
              <div key={step.num} className={styles.timelineItem}>
                <div className={styles.timelineOrb}>
                  <span className={styles.timelineEmoji}>{step.emoji}</span>
                </div>
                <div className={styles.timelineNum}>{step.num}</div>
                <h3 className={styles.timelineTitle}>{step.title}</h3>
                <p className={styles.timelineDesc}>{step.desc}</p>
              </div>
            ))}
          </ScrollStagger>
        </div>
      </Section>

      {/* ═══ DANH MỤC ═══ */}
      <Section>
        <div className={styles.container}>
          <ScrollReveal>
            <p className={styles.label}>// DANH MỤC</p>
            <h2 className={styles.heading}>TẤT CẢ GEAR BẠN CẦN</h2>
          </ScrollReveal>

          <ScrollStagger className={styles.catGrid}>
            {CATEGORIES.map((cat, i) => (
              <Link key={cat.label} href={cat.href} className={styles.catCard}>
                <span className={styles.catEmoji}>{cat.emoji}</span>
                <span className={styles.catName}>{cat.label}</span>
                <span className={styles.catCount}>{cat.count}</span>
              </Link>
            ))}
          </ScrollStagger>
        </div>
      </Section>

      {/* ═══ SẢN PHẨM NỔI BẬT ═══ */}
      {featuredProducts.length > 0 && (
        <Section dark>
          <div className={styles.container}>
            <ScrollReveal>
              <div className={styles.sectionHeader}>
                <div>
                  <p className={styles.label}>// NEW ARRIVALS</p>
                  <h2 className={styles.heading}>SẢN PHẨM NỔI BẬT</h2>
                </div>
                <Link href="/products" className={styles.viewAll}>XEM TẤT CẢ →</Link>
              </div>
            </ScrollReveal>

            <ScrollStagger className={styles.featuredGrid}>
              {featuredProducts.map((p, i) => (
                <ProductCard key={p._id} product={p as any} />
              ))}
            </ScrollStagger>
          </div>
        </Section>
      )}

      {/* ═══ BLOG & TIN TỨC ═══ */}
      {blogs.length > 0 && (
        <Section>
          <div className={styles.container}>
            <ScrollReveal>
              <div className={styles.sectionHeader}>
                <div>
                  <p className={styles.label}>// TIN TỨC & REVIEW</p>
                  <h2 className={styles.heading}>CHIA SẺ KINH NGHIỆM</h2>
                </div>
                <Link href="/blog" className={styles.viewAll}>XEM BLOG →</Link>
              </div>
            </ScrollReveal>

            <ScrollStagger className={styles.blogGrid}>
              {blogs.map((blog, i) => (
                <Link key={blog._id} href={`/blog/${blog.slug}`} className={styles.blogCard}>
                  <div className={styles.blogImage}>
                    {blog.image ? (
                        <Image src={blog.image} alt={blog.title} fill className={styles.img} />
                      ) : (
                        <div className={styles.blogPlaceholder}>
                          <span className={styles.blogIcon}>📰</span>
                        </div>
                      )}
                  </div>
                  <div className={styles.blogContent}>
                    <div className={styles.blogMeta}>
                      <span className={styles.blogDate}>{new Date(blog.createdAt).toLocaleDateString('vi-VN')}</span>
                      {blog.tags[0] && <span className={styles.blogTag}>{blog.tags[0]}</span>}
                    </div>
                    <h3 className={styles.blogTitle}>{blog.title}</h3>
                    <p className={styles.blogExcerpt}>{blog.excerpt}</p>
                  </div>
                </Link>
              ))}
            </ScrollStagger>
          </div>
        </Section>
      )}

      {/* ═══ FAQ ═══ */}
      <Section dark>
        <div className={styles.container}>
          <div className={styles.faqWrapper}>
            <ScrollReveal className={styles.faqLeft} direction="left">
              <p className={styles.label}>// HỎI ĐÁP</p>
              <h2 className={styles.heading}>CÂU HỎI<br />THƯỜNG GẶP</h2>
              <p className={styles.faqSub}>Bạn có thắc mắc khác? Đừng ngần ngại liên hệ trực tiếp với chúng tôi qua Zalo hoặc Hotline.</p>
              <a href="https://zalo.me/0978648720" target="_blank" rel="noopener noreferrer" className={styles.btnPrimary}>LIÊN HỆ NGAY</a>
            </ScrollReveal>

            <div className={styles.faqRight}>
              {FAQS.map((faq, i) => (
                <ScrollReveal key={i} delay={i * 0.1} direction="right">
                  <div className={`${styles.faqItem} ${activeFaq === i ? styles.faqActive : ""}`} onClick={() => setActiveFaq(activeFaq === i ? null : i)}>
                    <div className={styles.faqQuestion}>
                      <span>{faq.q}</span>
                      <span className={styles.faqToggle}>{activeFaq === i ? "−" : "+"}</span>
                    </div>
                    <AnimatePresence>
                      {activeFaq === i && (
                        <motion.div
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: "auto", opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          className={styles.faqAnswer}
                        >
                          <p>{faq.a}</p>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                </ScrollReveal>
              ))}
            </div>
          </div>
        </div>
      </Section>

      {/* ═══ NEWSLETTER ═══ */}
      <Section className={styles.newsletterSection}>
        <div className={styles.container}>
          <div className={styles.newsletterCard}>
            <div className={styles.newsletterGlow} />
            <div className={styles.newsletterContent}>
              <ScrollReveal>
                <h2 className={styles.newsletterTitle}>ĐĂNG KÝ NHẬN ƯU ĐÃI</h2>
                <p className={styles.newsletterDesc}>Nhận thông báo về các sản phẩm mới nhất, deal hot và mã giảm giá độc quyền dành riêng cho bạn.</p>
              </ScrollReveal>
              <ScrollReveal delay={0.2}>
                <form className={styles.newsletterForm} onSubmit={(e) => e.preventDefault()}>
                  <input type="email" placeholder="Email của bạn..." className={styles.newsletterInput} required />
                  <button type="submit" className={styles.newsletterBtn}>ĐĂNG KÝ</button>
                </form>
              </ScrollReveal>
            </div>
          </div>
        </div>
      </Section>

      {/* ═══ LOCATION ═══ */}
      <Section>
        <div className={styles.container}>
          <div className={styles.locationWrapper}>
            <ScrollReveal className={styles.locationInfo} direction="left">
              <p className={styles.label}>// SHOWROOM</p>
              <h2 className={styles.heading}>GHÉ THĂM<br />NEXGEAR</h2>
              <div className={styles.locationDetails}>
                <div className={styles.locItem}>
                  <span className={styles.locIcon}>📍</span>
                  <div>
                    <div className={styles.locLabel}>ĐỊA CHỈ</div>
                    <div className={styles.locValue}>Ninh Kiều, Cần Thơ</div>
                  </div>
                </div>
                <div className={styles.locItem}>
                  <span className={styles.locIcon}>📞</span>
                  <div>
                    <div className={styles.locLabel}>HOTLINE</div>
                    <div className={styles.locValue}>0978.648.720</div>
                  </div>
                </div>
                <div className={styles.locItem}>
                  <span className={styles.locIcon}>⏰</span>
                  <div>
                    <div className={styles.locLabel}>GIỜ MỞ CỬA</div>
                    <div className={styles.locValue}>08:00 - 21:00 (T2 - T7)<br />09:00 - 18:00 (CN)</div>
                  </div>
                </div>
              </div>
              <a href="https://maps.google.com" target="_blank" rel="noopener noreferrer" className={styles.btnOutline}>CHỈ ĐƯỜNG ĐẾN SHOP</a>
            </ScrollReveal>

            <ScrollReveal delay={0.2} className={styles.locationMap} direction="right">
              <iframe
                src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m105.7469!2d10.0452!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x31a0895a51d6071b%3A0x9d90108343167180!2zTmluaCBLaeG7gXUsIEPhuqduIFRoxqEsIFZp4buHdCBOYW0!5e0!3m2!1svi!2svn!4v1710660000000!5m2!1svi!2svn"
                width="100%"
                height="100%"
                style={{ border: 0, borderRadius: "16px", backgroundColor: "#1a1a1a" }}
                allowFullScreen={true}
                loading="lazy"
              />
            </ScrollReveal>
          </div>
        </div>
      </Section>

      {/* ═══ USP ═══ */}
      <Section dark>
        <div className={styles.container}>
          <ScrollReveal>
            <p className={styles.label}>// TẠI SAO CHỌN NEXGEAR</p>
            <h2 className={styles.heading}>CAM KẾT CỦA CHÚNG TÔI</h2>
          </ScrollReveal>

          <ScrollStagger className={styles.uspGrid}>
            {USP.map((item, i) => (
              <div key={item.title} className={styles.uspCard}>
                <div className={styles.uspIcon}>{item.icon}</div>
                <div className={styles.uspBig}><Counter target={item.value} suffix={item.suffix} /></div>
                <h3 className={styles.uspTitle}>{item.title}</h3>
                <p className={styles.uspDesc}>{item.desc}</p>
              </div>
            ))}
          </ScrollStagger>
        </div>
      </Section>

      {/* ═══ BRANDS ═══ */}
      <Section>
        <div className={styles.container}>
          <ScrollReveal>
            <p className={styles.label} style={{ textAlign: "center" }}>✦ ĐỐI TÁC CHÍNH HÃNG</p>
          </ScrollReveal>
          <div className={styles.marqueeTrack}>
            <div className={styles.marquee}>
              {[...BRANDS, ...BRANDS].map((b, i) => (
                <div key={i} className={styles.brandItem}>{b}</div>
              ))}
            </div>
          </div>
        </div>
      </Section>

      {/* ═══ REVIEWS ═══ */}
      <Section dark>
        <div className={styles.container}>
          <ScrollReveal>
            <p className={styles.label}>💬 REVIEWS</p>
            <h2 className={styles.heading}>KHÁCH HÀNG NÓI GÌ</h2>
          </ScrollReveal>

          <ScrollStagger className={styles.reviewGrid}>
            {REVIEWS.map((rev, i) => (
              <div key={rev.name} className={styles.reviewCard}>
                <div className={styles.reviewTop}>
                  <span className={styles.reviewAvatar}>{rev.avatar}</span>
                  <div>
                    <div className={styles.reviewName}>{rev.name}</div>
                    <div className={styles.reviewProduct}>đã mua {rev.product}</div>
                  </div>
                </div>
                <div className={styles.reviewStars}>{"★".repeat(rev.rating)}{"☆".repeat(5 - rev.rating)}</div>
                <p className={styles.reviewText}>&ldquo;{rev.text}&rdquo;</p>
              </div>
            ))}
          </ScrollStagger>
        </div>
      </Section>

      {/* ═══ CTA ═══ */}
      <section className={styles.cta}>
        <div className={styles.ctaParticles}>
          {Array.from({ length: 15 }).map((_, i) => (
            <span key={i} className={styles.ctaDot} style={{ "--i": i } as React.CSSProperties} />
          ))}
        </div>
        <div className={styles.container} style={{ position: "relative", zIndex: 1 }}>
          <ScrollReveal>
            <h2 className={styles.ctaTitle}>Sẵn sàng nâng cấp setup?</h2>
          </ScrollReveal>
          <ScrollReveal delay={0.2}>
            <p className={styles.ctaDesc}>Hàng ngàn sản phẩm chính hãng, giao nhanh 2H, trả góp 0% — tất cả tại NEXGEAR.</p>
          </ScrollReveal>
          <ScrollReveal delay={0.4}>
            <div className={styles.ctaActions}>
              <Link href="/products" className={styles.btnPrimary}>MUA NGAY →</Link>
              <a href="https://zalo.me/0978648720" target="_blank" rel="noopener noreferrer" className={styles.btnGhost}>CHAT ZALO TƯ VẤN</a>
            </div>
          </ScrollReveal>
        </div>
      </section>

    </div>
  );
}
