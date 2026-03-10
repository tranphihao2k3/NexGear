// ============================================================
// NEXGEAR — Customers Hooks
// File: src/hooks/use-customers.ts
// ============================================================
import { useQuery } from '@tanstack/react-query'
import { queryKeys } from '@/lib/query-keys'

/** Admin — danh sách khách hàng (có search) */
export function useCustomers(search = '') {
    const sp = new URLSearchParams({ role: 'customer', limit: '50' })
    if (search) sp.set('q', search)
    return useQuery({
        queryKey: queryKeys.users.list({ role: 'customer', q: search }),
        queryFn: () => fetch(`/api/users?${sp}`)
            .then(r => r.json())
            .then(d => ({
                data: d.data ?? [],
                total: d.pagination?.total ?? d.data?.length ?? 0,
            })),
        staleTime: 1000 * 60 * 2,
    })
}
