// ============================================================
// NEXGEAR — React Query Client Config
// File: src/lib/query-client.ts
// ============================================================
import { QueryClient } from '@tanstack/react-query'

export const queryClient = new QueryClient({
    defaultOptions: {
        queries: {
            staleTime: 1000 * 60 * 5,     // 5 phút — data không coi là "cũ"
            gcTime: 1000 * 60 * 10,        // 10 phút — giữ trong bộ nhớ cache
            retry: 2,                       // thử lại 2 lần khi lỗi mạng
            refetchOnWindowFocus: false,    // KHÔNG refetch tự động khi focus tab
            refetchOnReconnect: true,       // refetch khi mạng kết nối lại
        },
        mutations: {
            retry: 0,                       // mutation không retry tự động
        },
    },
})
