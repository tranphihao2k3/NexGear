// ============================================================
// NEXGEAR — API Fetcher Helpers
// File: src/lib/api-fetcher.ts
// Dùng với useQuery — tự throw khi API trả về error
// ============================================================

/** Generic fetcher — trả về json.data */
export async function apiFetch<T>(url: string, options?: RequestInit): Promise<T> {
    const res = await fetch(url, options)
    if (!res.ok) {
        throw new Error(`HTTP ${res.status}: ${res.statusText}`)
    }
    const json = await res.json()
    if (!json.success) {
        throw new Error(json.error || json.message || 'API Error')
    }
    return json.data as T
}

/** Fetcher cho list + pagination */
export async function apiFetchList<T>(url: string): Promise<{
    data: T[]
    pagination: {
        total: number
        page: number
        limit: number
        totalPages: number
    }
}> {
    const res = await fetch(url)
    if (!res.ok) throw new Error(`HTTP ${res.status}: ${res.statusText}`)
    const json = await res.json()
    if (!json.success) throw new Error(json.error || json.message || 'API Error')
    return {
        data: json.data ?? [],
        pagination: json.pagination ?? { total: 0, page: 1, limit: 20, totalPages: 1 },
    }
}

/** Mutation helper — POST/PUT/DELETE */
export async function apiMutate<T>(
    url: string,
    method: 'POST' | 'PUT' | 'DELETE' | 'PATCH',
    body?: unknown
): Promise<T> {
    const res = await fetch(url, {
        method,
        headers: body ? { 'Content-Type': 'application/json' } : undefined,
        body: body ? JSON.stringify(body) : undefined,
    })
    if (!res.ok) throw new Error(`HTTP ${res.status}: ${res.statusText}`)
    const json = await res.json()
    if (!json.success) throw new Error(json.error || json.message || 'API Error')
    return json.data as T
}
