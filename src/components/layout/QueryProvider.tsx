'use client'
// ============================================================
// NEXGEAR — Query Provider
// File: src/components/layout/QueryProvider.tsx
// ============================================================
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { ReactQueryDevtools } from '@tanstack/react-query-devtools'

function makeQueryClient() {
    return new QueryClient({
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
}

let browserQueryClient: QueryClient | undefined = undefined

function getQueryClient() {
    if (typeof window === 'undefined') {
        // Luôn tạo QueryClient mới trên server mỗi request (chống leak)
        return makeQueryClient()
    } else {
        // Tái sử dụng QueryClient trên trình duyệt nếu đã có
        if (!browserQueryClient) browserQueryClient = makeQueryClient()
        return browserQueryClient
    }
}

export function QueryProvider({ children }: { children: React.ReactNode }) {
    const queryClient = getQueryClient()

    return (
        <QueryClientProvider client={queryClient}>
            {children}
            {process.env.NODE_ENV === 'development' && (
                <ReactQueryDevtools initialIsOpen={false} position="bottom" />
            )}
        </QueryClientProvider>
    )
}
