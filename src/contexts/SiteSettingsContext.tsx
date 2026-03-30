'use client';

import { createContext, useContext, ReactNode } from 'react';
import type { SiteSettings } from '@/lib/site-config';

const SiteSettingsContext = createContext<SiteSettings | null>(null);

export function SiteSettingsProvider({
    children,
    settings,
}: {
    children: ReactNode;
    settings: SiteSettings;
}) {
    return (
        <SiteSettingsContext.Provider value={settings}>
            {children}
        </SiteSettingsContext.Provider>
    );
}

export function useSiteSettings(): SiteSettings {
    const ctx = useContext(SiteSettingsContext);
    if (!ctx) {
        throw new Error('useSiteSettings must be used within SiteSettingsProvider');
    }
    return ctx;
}
