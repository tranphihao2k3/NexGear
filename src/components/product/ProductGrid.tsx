import React from 'react';

export interface ProductGridProps {
    children?: React.ReactNode;
}

// TODO: Implement actual grid layout styles and responsive behavior
export const ProductGrid: React.FC<ProductGridProps> = ({ children }) => {
    return (
        <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
            gap: '24px',
            padding: '24px'
        }}>
            {children}
        </div>
    );
};
