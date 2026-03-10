// ============================================================
// NEXGEAR — Orders Hooks
// File: src/hooks/use-orders.ts
// ============================================================
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { queryKeys } from '@/lib/query-keys'
import { apiFetchList } from '@/lib/api-fetcher'

export interface OrdersParams {
    page?: number
    status?: string
    q?: string
    user?: string
    limit?: number
    sort?: string
}

/** Danh sách đơn hàng (admin + user) */
export function useOrders(params: OrdersParams = {}) {
    const sp = new URLSearchParams({ page: String(params.page || 1), limit: String(params.limit || 20) })
    if (params.status && params.status !== 'all') sp.set('status', params.status)
    if (params.q) sp.set('q', params.q)
    if (params.user) sp.set('user', params.user)
    if (params.sort) sp.set('sort', params.sort)

    return useQuery({
        queryKey: queryKeys.orders.list(params),
        queryFn: () => apiFetchList(`/api/orders?${sp}`),
        placeholderData: (prev) => prev,
        staleTime: 1000 * 30, // 30 giây — orders thay đổi thường xuyên
    })
}

/** Đơn hàng của 1 user cụ thể (account page) */
export function useUserOrders(userId: string | null, limit = 5) {
    return useQuery({
        queryKey: queryKeys.orders.user(userId ?? ''),
        queryFn: () => fetch(`/api/orders?user=${userId}&limit=${limit}&sort=-createdAt`)
            .then(r => r.json())
            .then(d => d.success ? d.data : []),
        enabled: !!userId,
        staleTime: 1000 * 60 * 2,
    })
}

/**
 * Order status counts cho filter tabs (admin)
 * Cache 1 phút — gộp 8 API calls thành 1 query
 */
export function useOrderStatusCounts() {
    return useQuery({
        queryKey: queryKeys.orders.counts(),
        queryFn: async () => {
            const statuses = ['pending', 'confirmed', 'packing', 'shipped', 'delivered', 'cancelled', 'refunded']
            const [allRes, ...statusRes] = await Promise.all([
                fetch('/api/orders?limit=1').then(r => r.json()),
                ...statuses.map(s => fetch(`/api/orders?status=${s}&limit=1`).then(r => r.json())),
            ])
            const counts: Record<string, number> = { all: allRes.pagination?.total || 0 }
            statuses.forEach((s, i) => { counts[s] = statusRes[i].pagination?.total || 0 })
            return counts
        },
        staleTime: 1000 * 60, // 1 phút
    })
}

/** Cập nhật trạng thái đơn hàng */
export function useUpdateOrderStatus() {
    const qc = useQueryClient()
    return useMutation({
        mutationFn: ({ id, status, note }: { id: string; status: string; note?: string }) =>
            fetch(`/api/orders/${id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ status, ...(note ? { staffNotes: note } : {}) }),
            }).then(r => r.json()),
        onSuccess: () => {
            qc.invalidateQueries({ queryKey: queryKeys.orders.all() })
        },
    })
}

/** Bulk confirm orders */
export function useBulkConfirmOrders() {
    const qc = useQueryClient()
    return useMutation({
        mutationFn: (ids: string[]) =>
            Promise.all(ids.map(id =>
                fetch(`/api/orders/${id}`, {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ status: 'confirmed' }),
                })
            )),
        onSuccess: () => {
            qc.invalidateQueries({ queryKey: queryKeys.orders.all() })
        },
    })
}
