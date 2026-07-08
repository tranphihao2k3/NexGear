// ============================================================
// LTV — Categories & Brands Hooks
// File: src/hooks/use-categories-brands.ts
// staleTime cao (30 phút) vì data hiếm thay đổi
// ============================================================
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { queryKeys } from '@/lib/query-keys'

// ── CATEGORIES ───────────────────────────────────────────────

export function useCategories(params?: { limit?: number; hasProducts?: boolean }) {
    const sp = new URLSearchParams({ limit: String(params?.limit || 100) })
    if (params?.hasProducts) sp.set('hasProducts', 'true')
    return useQuery({
        queryKey: queryKeys.categories.list(params),
        queryFn: () => fetch(`/api/categories?${sp}`).then(r => r.json()).then(d => d.data ?? []),
        staleTime: 1000 * 60 * 30, // 30 phút
    })
}

export function useSaveCategory() {
    const qc = useQueryClient()
    return useMutation({
        mutationFn: ({ id, data }: { id?: string; data: any }) => {
            const url = id ? `/api/categories/${id}` : '/api/categories'
            return fetch(url, {
                method: id ? 'PUT' : 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(data),
            }).then(r => r.json())
        },
        onSuccess: () => {
            qc.invalidateQueries({ queryKey: queryKeys.categories.all() })
        },
    })
}

export function useDeleteCategory() {
    const qc = useQueryClient()
    return useMutation({
        mutationFn: (id: string) =>
            fetch(`/api/categories/${id}`, { method: 'DELETE' }).then(r => r.json()),
        onSuccess: () => {
            qc.invalidateQueries({ queryKey: queryKeys.categories.all() })
        },
    })
}

// ── BRANDS ───────────────────────────────────────────────────

export function useBrands(params?: { limit?: number; hasProducts?: boolean }) {
    const sp = new URLSearchParams({ limit: String(params?.limit || 100) })
    if (params?.hasProducts) sp.set('hasProducts', 'true')
    return useQuery({
        queryKey: queryKeys.brands.list(params),
        queryFn: () => fetch(`/api/brands?${sp}`).then(r => r.json()).then(d => d.data ?? []),
        staleTime: 1000 * 60 * 30, // 30 phút
    })
}

export function useSaveBrand() {
    const qc = useQueryClient()
    return useMutation({
        mutationFn: ({ id, data }: { id?: string; data: any }) => {
            const url = id ? `/api/brands/${id}` : '/api/brands'
            return fetch(url, {
                method: id ? 'PUT' : 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(data),
            }).then(r => r.json())
        },
        onSuccess: () => {
            qc.invalidateQueries({ queryKey: queryKeys.brands.all() })
        },
    })
}

export function useDeleteBrand() {
    const qc = useQueryClient()
    return useMutation({
        mutationFn: (id: string) =>
            fetch(`/api/brands/${id}`, { method: 'DELETE' }).then(r => r.json()),
        onSuccess: () => {
            qc.invalidateQueries({ queryKey: queryKeys.brands.all() })
        },
    })
}
