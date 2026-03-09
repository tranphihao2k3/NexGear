'use client';

import { useState, useEffect } from 'react';

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
    label = 'GiÃ¡ bÃ¡n (VNÄ)',
    placeholder = 'Nháº­p giÃ¡ (nghÃ¬n Ä‘á»“ng)...',
    required = false,
}: PriceInputProps) {
    // Convert VND to thousands (e.g. 70000 -> 70) for display
    // Store as string to handle empty inputs comfortably
    const [displayValue, setDisplayValue] = useState('');

    useEffect(() => {
        // If external value changes (and is not in sync with current display * 1000), update display
        // Use a small epsilon or just direct comparison if integers
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
        if (!displayValue) return '0Ä‘';
        const priceInVND = parseInt(displayValue) * 1000;
        return new Intl.NumberFormat('vi-VN', {
            style: 'currency',
            currency: 'VND',
        }).format(priceInVND);
    };

    return (
        <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
                {label} {required && '*'}
            </label>
            <div className="relative">
                <input
                    type="text"
                    value={displayValue}
                    onChange={handleChange}
                    placeholder={placeholder}
                    required={required}
                    className="w-full pl-4 pr-24 py-3 border border-gray-200 rounded-lg outline-none focus:border-blue-500 transition-colors"
                />
                <div className="absolute right-3 top-1/2 -translate-y-1/2 text-sm font-medium text-gray-400 bg-gray-50 px-2 py-1 rounded">
                    x 1.000Ä‘
                </div>
            </div>
            {displayValue && (
                <p className="text-sm text-gray-600 mt-1 flex justify-between">
                    <span>Thá»±c táº¿:</span> <span className="font-bold text-blue-600">{formatPreview()}</span>
                </p>
            )}
        </div>
    );
}
