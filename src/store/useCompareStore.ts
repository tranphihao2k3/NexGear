import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface CompareProduct {
    id: string;
    slug: string;
    name: string;
    brand: string;
    categoryId: string; // Ensure products can only be compared within the same category
    price: number;
    original: number;
    rating: number;
    img: string;
    specs: Record<string, string>;
}

interface CompareState {
    items: CompareProduct[];
    addItem: (item: CompareProduct) => void;
    removeItem: (id: string) => void;
    clearAll: () => void;
}

export const useCompareStore = create<CompareState>()(
    persist(
        (set) => ({
            items: [],
            addItem: (item) =>
                set((state) => {
                    // Prevent duplicates
                    if (state.items.some((i) => i.id === item.id)) return state;

                    // Validate category match
                    if (state.items.length > 0) {
                        if (state.items[0].categoryId !== item.categoryId) {
                            alert("Bạn chỉ có thể so sánh các sản phẩm cùng loại (ví dụ: chỉ so sánh Chuột với Chuột, không thể so sánh Chuột với Bàn phím). Vui lòng xoá danh sách hiện tại nếu muốn so sánh loại sản phẩm khác.");
                            return state;
                        }
                    }

                    // Max 3 items
                    if (state.items.length >= 3) {
                        return { items: [...state.items.slice(1, 3), item] };
                    }
                    return { items: [...state.items, item] };
                }),
            removeItem: (id) =>
                set((state) => ({ items: state.items.filter((i) => i.id !== id) })),
            clearAll: () => set({ items: [] }),
        }),
        {
            name: 'nexgear-compare', // localStorage key
        }
    )
);
