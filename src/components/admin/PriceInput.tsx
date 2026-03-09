'use client';

import { useState, useEffect } from 'react';
import { Input } from '@/components/ui';

interface PriceInputProps {
    value: number; // Value in VND (full price)
    onChange: (value: number) => void;
    label?: string;
    placeholder?: string;
    required?: boolean;
}

export default function PriceInput({
    value,
    onChange,
    label = 'Giá bán (VNĐ)',
    placeholder = 'Nhập giá (nghìn đồng)...',
    required = false,
}: PriceInputProps) {
    // Convert VND to thousands (e.g. 70000 -> 70) for display
    // Store as string to handle empty inputs comfortably
    const [displayValue, setDisplayValue] = useState('');

    useEffect(() => {
        // If external value changes (and is not in sync with current display * 1000), update display
        const currentRef = displayValue === '' ? 0 : parseInt(displayValue.replace(/[^0-9]/g, '')) * 1000;

        if (value !== currentRef) {
            if (value > 0) {
                setDisplayValue(Math.floor(value / 1000).toString());
            } else {
                setDisplayValue('');
            }
        }
    }, [value]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const input = e.target.value;
        const numericValue = input.replace(/[^0-9]/g, '');

        setDisplayValue(numericValue);

        // Convert thousands to VND (e.g. 70 -> 70000)
        const priceInVND = numericValue ? parseInt(numericValue) * 1000 : 0;
        onChange(priceInVND);
    };

    // Format preview in VND
    const formatPreview = () => {
        if (!displayValue) return '0đ';
        const priceInVND = parseInt(displayValue) * 1000;
        return new Intl.NumberFormat('vi-VN', {
            style: 'currency',
            currency: 'VND',
        }).format(priceInVND);
    };

    return (
        <div>
            <Input
                label={label}
                required={required}
                value={displayValue}
                onChange={handleChange}
                placeholder={placeholder}
                rightIcon={
                    <span style={{
                        fontFamily: 'JetBrains Mono, monospace',
                        fontSize: '11px',
                        fontWeight: 600,
                        color: 'var(--ink3, #7A7870)',
                        backgroundColor: 'var(--bg2, #ECEAE3)',
                        padding: '2px 6px',
                        borderRadius: '4px'
                    }}>
                        x 1.000đ
                    </span>
                }
                hint={displayValue ? `Thực tế: ${formatPreview()}` : undefined}
            />
        </div>
    );
}
