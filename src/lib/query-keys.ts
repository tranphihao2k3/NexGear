// ============================================================
// NEXGEAR — Query Key Factory
// File: src/lib/query-keys.ts
// Centralized keys — tránh typo, hỗ trợ invalidate theo nhóm
// ============================================================

export const queryKeys = {
    // ── PRODUCTS ──────────────────────────────────────────────
    products: {
        all: () => ['products'] as const,
        list: (params: Record<string, any>) => ['products', 'list', params] as const,
        detail: (slug: string) => ['products', 'detail', slug] as const,
        admin: (params?: Record<string, any>) => ['products', 'admin', params ?? {}] as const,
    },

    // ── ORDERS ────────────────────────────────────────────────
    orders: {
        all: () => ['orders'] as const,
        list: (params: Record<string, any>) => ['orders', 'list', params] as const,
        detail: (id: string) => ['orders', 'detail', id] as const,
        counts: () => ['orders', 'counts'] as const,
        user: (userId: string) => ['orders', 'user', userId] as const,
    },

    // ── CATEGORIES ────────────────────────────────────────────
    categories: {
        all: () => ['categories'] as const,
        list: (params?: Record<string, any>) => ['categories', 'list', params ?? {}] as const,
    },

    // ── BRANDS ────────────────────────────────────────────────
    brands: {
        all: () => ['brands'] as const,
        list: (params?: Record<string, any>) => ['brands', 'list', params ?? {}] as const,
    },

    // ── USERS / CUSTOMERS ─────────────────────────────────────
    users: {
        all: () => ['users'] as const,
        list: (params: Record<string, any>) => ['users', 'list', params] as const,
        detail: (id: string) => ['users', 'detail', id] as const,
        me: () => ['users', 'me'] as const,
    },

    // ── DASHBOARD ─────────────────────────────────────────────
    dashboard: {
        all: () => ['dashboard'] as const,
    },

    // ── INVENTORY ─────────────────────────────────────────────
    inventory: {
        all: () => ['inventory'] as const,
        logs: () => ['inventory', 'logs'] as const,
    },

    // ── REVIEWS ───────────────────────────────────────────────
    reviews: {
        all: () => ['reviews'] as const,
        list: (params?: Record<string, any>) => ['reviews', 'list', params ?? {}] as const,
        product: (productId: string) => ['reviews', 'product', productId] as const,
    },

    // ── WISHLIST ──────────────────────────────────────────────
    wishlist: {
        me: () => ['wishlist', 'me'] as const,
    },

    // ── SETTINGS ─────────────────────────────────────────────
    settings: {
        all: () => ['settings'] as const,
    },

    // ── BANNERS ──────────────────────────────────────────────
    banners: {
        all: () => ['banners'] as const,
        list: (params?: Record<string, any>) => ['banners', 'list', params ?? {}] as const,
    },

    // ── COUPONS ──────────────────────────────────────────────
    coupons: {
        all: () => ['coupons'] as const,
        list: (params?: Record<string, any>) => ['coupons', 'list', params ?? {}] as const,
    },

    // ── BLOG ─────────────────────────────────────────────────
    blog: {
        all: () => ['blog'] as const,
        list: (params?: Record<string, any>) => ['blog', 'list', params ?? {}] as const,
        detail: (slug: string) => ['blog', 'detail', slug] as const,
    },

    // ── VISITORS ─────────────────────────────────────────────
    visitors: {
        all: () => ['visitors'] as const,
    },
}
