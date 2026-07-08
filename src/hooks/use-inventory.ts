// ============================================================
// LTV — Inventory Hooks
// File: src/hooks/use-inventory.ts
// ============================================================
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { queryKeys } from '@/lib/query-keys'

/** Danh sách sản phẩm trong kho */
export function useInventoryProducts() {
    return useQuery({
        queryKey: queryKeys.inventory.all(),
        queryFn: () => fetch('/api/products?limit=100&admin=true')
            .then(r => r.json()).then(d => d.data ?? []),
        staleTime: 1000 * 60 * 2,
    })
}

/** Lịch sử xuất/nhập kho */
export function useInventoryLogs() {
    return useQuery({
        queryKey: queryKeys.inventory.logs(),
        queryFn: () => fetch('/api/inventory?limit=20')
            .then(r => r.json()).then(d => d.data ?? []),
        staleTime: 1000 * 60,
    })
}

/** Nhập hàng */
export function useImportStock() {
    const qc = useQueryClient()
    return useMutation({
        mutationFn: (data: { product: string; quantity: number; note: string }) =>
            fetch('/api/inventory', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ ...data, type: 'import', createdBy: '000000000000000000000000' }),
            }).then(r => r.json()),
        onSuccess: () => {
            // Invalidate cả inventory lẫn products (stock đã thay đổi)
            qc.invalidateQueries({ queryKey: queryKeys.inventory.all() })
            qc.invalidateQueries({ queryKey: queryKeys.inventory.logs() })
            qc.invalidateQueries({ queryKey: queryKeys.products.all() })
        },
    })
}
