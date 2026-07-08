// ============================================================
// LTV — Dashboard Hooks
// File: src/hooks/use-dashboard.ts
// ============================================================
import { useQuery } from '@tanstack/react-query'
import { queryKeys } from '@/lib/query-keys'
import { apiFetch } from '@/lib/api-fetcher'

/** Admin dashboard KPIs — auto-refresh 5 phút */
export function useDashboard() {
    return useQuery({
        queryKey: queryKeys.dashboard.all(),
        queryFn: () => apiFetch('/api/dashboard'),
        staleTime: 1000 * 60 * 5,         // 5 phút
        refetchInterval: 1000 * 60 * 5,   // auto-refresh mỗi 5 phút
    })
}
