# ⚡ NEXGEAR — Project Blueprint & Roadmap

> **Next-Gen Gaming Gear Store**  
> Cyberpunk Light Theme | Next.js 15 App Router | SCSS Modules | MongoDB Atlas

---

## 🏗️ Project Architecture & Source of Truth

This project is built with a strict adherence to the **Cyberpunk Light** design system. All styling MUST follow the design tokens defined in `src/styles/_tokens.scss` and utilize the mixins in `src/styles/_mixins.scss`.

### 🚨 Core Styling Rules (MANDATORY)
- **Framework**: Next.js 15 App Router + TypeScript.
- **Styling**: **SCSS Modules ONLY** (No Tailwind).
- **Fonts**: 
  - `Orbitron`: Headings (H1, H2), Buttons, Badges, Logo.
  - `DM Sans`: Body text, Descriptions, Form labels.
  - `JetBrains Mono`: Prices, SKU, Order IDs, Stats.
- **Color Palette**:
  - `Cream BG`: `#F4F2ED` (Main background)
  - `Cyber Cyan`: `#00C4AD` (Primary accent/CTA)
  - `Neon Magenta`: `#F0356A` (Secondary accent/Sale/Error)
  - `Ink Black`: `#0C0C0C` (Primary text/Dark buttons)

---

## 🛠️ Technical Stack

- **Frontend**: Next.js 15 (App Router), React 19, Framer Motion (Animations), Zustand (State), React Query (Data Fetching).
- **Backend**: Next.js API Routes, MongoDB Atlas + Mongoose.
- **Auth**: NextAuth.js v5.
- **Media**: Cloudinary CDN.
- **Payments**: VNPay integration.
- **Shipping**: Giao Hàng Nhanh (GHN) API.

---

## 📦 Component Status

| Component | Status | Path |
| :--- | :---: | :--- |
| **Navbar** | ✅ | `src/components/layout/Navbar.tsx` |
| **Button** | ✅ | `src/components/ui/Button.tsx` |
| **Badge** | ✅ | `src/components/ui/Badge.tsx` |
| **Input** | ✅ | `src/components/ui/Input.tsx` |
| **Skeleton**| ✅ | `src/components/ui/Skeleton.tsx` |
| **Toast** | ✅ | `src/components/ui/Toast.tsx` |
| **Product Card** | ✅ | `src/components/product/ProductCard.tsx` |
| **Product Grid** | ⏳ | `src/components/product/ProductGrid.tsx` |

---

## 🗺️ Implementation Roadmap

### Phase 1: Foundation (Current)
- [x] Project initialization (Next.js 15 + SCSS)
- [x] Global design tokens & mixins
- [x] Base UI Components (Button, Badge, Input, Toast, Skeleton)
- [x] Responsive layout structure

### Phase 2: Product Catalog (Next Up)
- [ ] MongoDB Schema implementation (Products, Categories, Brands)
- [ ] Product List page with Filters (Sidebar)
- [ ] Product Detail page (Gallery + Specs + Reviews)
- [ ] Atlas Search integration

### Phase 3: Cart & Checkout
- [ ] Zustand Cart Store
- [ ] Checkout Flow (Information -> Shipping -> Payment)
- [ ] VNPay Webhook & Order creation

### Phase 4: Admin & POS
- [ ] Dark Mode Admin Dashboard
- [ ] Inventory Management System
- [ ] POS Interface for Offline Sales (Tablet Optimized)

---

## 🗄️ Database Schema (MongoDB)

Key collections planned:
1. `products`: Core product data & variants.
2. `orders`: Online & POS transactions.
3. `users`: Customer & Staff (RBAC: Admin, Manager, Staff, Cashier).
4. `inventory_logs`: Stock movement history.
5. `transactions`: P&L recording.
6. `reviews`: Verified purchase ratings.

---

## 🎨 Design Reference
Refer to `NEXGEAR-UISpec.html` for detailed wireframes and UI state specifications. All components must support:
- **Responsive**: Mobile (1 col) | Tablet (2 col) | Desktop (4 col).
- **Animations**: Fade + Slide Up transitions (200ms ease-out).
- **Micro-interactions**: Scale bounce on cart add, skeleton shimmer on load.

---
*Created by Antigravity AI — NEXGEAR Project Assistant*
