'use client';

import { createContext, useContext, ReactNode } from 'react';

export interface NavCategory {
    _id: string;
    name: string;
    slug: string;
    description?: string;
    children?: NavCategory[];
}

const CategoriesContext = createContext<NavCategory[]>([]);

export function CategoriesProvider({
    children,
    categories,
}: {
    children: ReactNode;
    categories: NavCategory[];
}) {
    return (
        <CategoriesContext.Provider value={categories}>
            {children}
        </CategoriesContext.Provider>
    );
}

export function useCategories(): NavCategory[] {
    return useContext(CategoriesContext);
}
