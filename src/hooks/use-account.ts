// ============================================================
// LTV — Account (User Profile) Hooks
// File: src/hooks/use-account.ts
// ============================================================
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { queryKeys } from '@/lib/query-keys'

/** Lấy data tài khoản người dùng hiện tại */
export function useAccountData(userId: string | null, userEmail?: string | null) {
    return useQuery({
        queryKey: queryKeys.users.me(),
        queryFn: async () => {
            // Thử lấy theo id trước
            if (userId) {
                const res = await fetch(`/api/users/${userId}`).then(r => r.json())
                if (res.success) return res.data
            }
            // Fallback: tìm theo email
            if (userEmail) {
                const res = await fetch(
                    `/api/users?email=${encodeURIComponent(userEmail)}&limit=1`
                ).then(r => r.json())
                if (res.success && res.data?.length > 0) return res.data[0]
            }
            return null
        },
        enabled: !!(userId || userEmail),
        staleTime: 1000 * 60 * 5,
    })
}

/** Cập nhật thông tin tài khoản */
export function useUpdateAccount() {
    const qc = useQueryClient()
    return useMutation({
        mutationFn: ({ id, data }: { id: string; data: { name?: string; email?: string; phone?: string } }) =>
            fetch(`/api/users/${id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(data),
            }).then(r => r.json()),
        onSuccess: () => {
            qc.invalidateQueries({ queryKey: queryKeys.users.me() })
        },
    })
}
