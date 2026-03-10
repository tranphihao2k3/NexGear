// ============================================================
// NEXGEAR — Products Hooks
// File: src/hooks/use-products.ts
// ============================================================
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { queryKeys } from '@/lib/query-keys'
import { apiFetch, apiFetchList, apiMutate } from '@/lib/api-fetcher'

// ── PUBLIC CATALOG ────────────────────────────────────────────

/** Danh sách sản phẩm public (có pagination) */
export function useProducts(params: Record<string, any>) {
    const filtered = Object.fromEntries(
        Object.entries(params).filter(([, v]) => v !== '' && v !== null && v !== undefined)
    )
    const sp = new URLSearchParams(Object.fromEntries(Object.entries(filtered).map(([k, v]) => [k, String(v)])))
    return useQuery({
        queryKey: queryKeys.products.list(filtered),
        queryFn: () => apiFetchList(`/api/products?${sp}`),
        placeholderData: (prev) => prev, // giữ data cũ khi đổi filter/page
    })
}

/** Chi tiết sản phẩm theo slug */
export function useProduct(slug: string) {
    return useQuery({
        queryKey: queryKeys.products.detail(slug),
        queryFn: () => apiFetch(`/api/products/${slug}`),
        enabled: !!slug,
        staleTime: 1000 * 60 * 10, // product detail: 10 phút
    })
}

/** Homepage — featured products */
export function useFeaturedProducts(limit = 4) {
    return useQuery({
        queryKey: queryKeys.products.list({ featured: true, active: true, limit }),
        queryFn: () => fetch(`/api/products?featured=true&active=true&limit=${limit}`)
            .then(r => r.json()).then(d => d.success ? d.data : []),
        staleTime: 1000 * 60 * 10,
    })
}

/** Homepage — sale products */
export function useSaleProducts(limit = 4) {
    return useQuery({
        queryKey: queryKeys.products.list({ tag: 'sale', active: true, limit, sort: '-createdAt' }),
        queryFn: () => fetch(`/api/products?tag=sale&active=true&limit=${limit}&sort=-createdAt`)
            .then(r => r.json()).then(d => d.success ? d.data : []),
        staleTime: 1000 * 60 * 10,
    })
}

/** Homepage — bestseller products */
export function useBestsellerProducts(limit = 4) {
    return useQuery({
        queryKey: queryKeys.products.list({ active: true, limit, sort: '-soldCount' }),
        queryFn: () => fetch(`/api/products?active=true&limit=${limit}&sort=-soldCount`)
            .then(r => r.json()).then(d => d.success ? d.data : []),
        staleTime: 1000 * 60 * 10,
    })
}

// ── ADMIN ─────────────────────────────────────────────────────

/** Admin — danh sách sản phẩm (có pagination + full fields) */
export function useAdminProducts(params: Record<string, any> = {}) {
    const sp = new URLSearchParams({
        limit: '50', admin: 'true', ...Object.fromEntries(
            Object.entries(params).filter(([, v]) => !!v).map(([k, v]) => [k, String(v)])
        )
    })
    return useQuery({
        queryKey: queryKeys.products.admin(params),
        queryFn: () => apiFetchList(`/api/products?${sp}`),
        staleTime: 1000 * 60 * 2, // admin: 2 phút
    })
}

/** Toggle active/inactive sản phẩm */
export function useToggleProduct() {
    const qc = useQueryClient()
    return useMutation({
        mutationFn: ({ id, isActive }: { id: string; isActive: boolean }) =>
            apiMutate(`/api/products/${id}`, 'PUT', { isActive }),
        onSuccess: () => {
            qc.invalidateQueries({ queryKey: queryKeys.products.all() })
        },
    })
}

/** Xóa sản phẩm */
export function useDeleteProduct() {
    const qc = useQueryClient()
    return useMutation({
        mutationFn: (id: string) => apiMutate(`/api/products/${id}`, 'DELETE'),
        onSuccess: () => {
            qc.invalidateQueries({ queryKey: queryKeys.products.all() })
        },
    })
}

/** Tạo sản phẩm mới */
export function useCreateProduct() {
    const qc = useQueryClient()
    return useMutation({
        mutationFn: (data: any) => fetch('/api/products', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data),
        }).then(r => r.json()),
        onSuccess: () => {
            qc.invalidateQueries({ queryKey: queryKeys.products.all() })
        },
    })
}

/** Cập nhật sản phẩm */
export function useUpdateProduct() {
    const qc = useQueryClient()
    return useMutation({
        mutationFn: ({ id, data }: { id: string; data: any }) =>
            fetch(`/api/products/${id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(data),
            }).then(r => r.json()),
        onSuccess: () => {
            qc.invalidateQueries({ queryKey: queryKeys.products.all() })
        },
    })
}
