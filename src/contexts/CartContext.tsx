"use client";

import React, { createContext, useContext, useState, useEffect, useCallback } from "react";

export interface CartItem {
    productId: string;
    slug: string;
    name: string;
    brand: string;
    variant?: string;
    variantIndex?: number;
    sku: string;
    image: string;
    basePrice: number;
    salePrice: number | null;
    qty: number;
    stock: number;
}

interface CartContextType {
    items: CartItem[];
    addItem: (item: Omit<CartItem, "qty"> & { qty?: number }) => void;
    removeItem: (productId: string, variant?: string) => void;
    updateQty: (productId: string, qty: number, variant?: string) => void;
    clearCart: () => void;
    totalItems: number;
    subtotal: number;
}

const CartContext = createContext<CartContextType | null>(null);

const STORAGE_KEY = "nexgear_cart";

function loadCart(): CartItem[] {
    if (typeof window === "undefined") return [];
    try {
        return JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]");
    } catch {
        return [];
    }
}

function saveCart(items: CartItem[]) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
}

export function CartProvider({ children }: { children: React.ReactNode }) {
    const [items, setItems] = useState<CartItem[]>([]);
    const [loaded, setLoaded] = useState(false);

    useEffect(() => {
        setItems(loadCart());
        setLoaded(true);
    }, []);

    useEffect(() => {
        if (loaded) saveCart(items);
    }, [items, loaded]);

    const addItem = useCallback((newItem: Omit<CartItem, "qty"> & { qty?: number }) => {
        setItems(prev => {
            const key = newItem.variant
                ? `${newItem.productId}_${newItem.variant}`
                : newItem.productId;
            const existing = prev.find(i =>
                i.variant ? `${i.productId}_${i.variant}` === key : i.productId === key
            );
            if (existing) {
                return prev.map(i => {
                    const iKey = i.variant ? `${i.productId}_${i.variant}` : i.productId;
                    if (iKey === key) {
                        const newQty = Math.min(i.qty + (newItem.qty || 1), i.stock);
                        return { ...i, qty: newQty };
                    }
                    return i;
                });
            }
            return [...prev, { ...newItem, qty: newItem.qty || 1 }];
        });
    }, []);

    const removeItem = useCallback((productId: string, variant?: string) => {
        setItems(prev => prev.filter(i => {
            if (variant) return !(i.productId === productId && i.variant === variant);
            return i.productId !== productId;
        }));
    }, []);

    const updateQty = useCallback((productId: string, qty: number, variant?: string) => {
        setItems(prev => prev.map(i => {
            const match = variant
                ? i.productId === productId && i.variant === variant
                : i.productId === productId;
            if (match) return { ...i, qty: Math.max(1, Math.min(qty, i.stock)) };
            return i;
        }));
    }, []);

    const clearCart = useCallback(() => setItems([]), []);

    const totalItems = items.reduce((s, i) => s + i.qty, 0);
    const subtotal = items.reduce((s, i) => s + (i.salePrice ?? i.basePrice) * i.qty, 0);

    return (
        <CartContext.Provider value={{ items, addItem, removeItem, updateQty, clearCart, totalItems, subtotal }}>
            {children}
        </CartContext.Provider>
    );
}

export function useCart() {
    const ctx = useContext(CartContext);
    if (!ctx) throw new Error("useCart must be used within CartProvider");
    return ctx;
}
