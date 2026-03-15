import React, { useState, useRef, useEffect } from 'react';
import styles from './SearchableSelect.module.scss';
import { ChevronDown, Search } from 'lucide-react';

interface Option {
    label: string;
    value: string;
}

interface Props {
    options: Option[];
    value: string;
    onChange: (val: string) => void;
    placeholder?: string;
    name?: string;
}

export default function SearchableSelect({ options, value, onChange, placeholder = "Chọn...", name }: Props) {
    const [isOpen, setIsOpen] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const wrapperRef = useRef<HTMLDivElement>(null);

    const selectedOption = options.find(o => o.value === value);

    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        }
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    const removeTones = (str: string) => 
        str.normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/đ/g, 'd').replace(/Đ/g, 'D');

    const filteredOptions = options.filter(o => 
        removeTones(o.label.toLowerCase()).includes(removeTones(searchTerm.toLowerCase())) ||
        // Đôi khi người dùng gõ có dấu nhưng tên option không dấu, giữ lại điều kiện fallback
        o.label.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className={styles.wrapper} ref={wrapperRef}>
            <div
                className={`${styles.control} ${isOpen ? styles.open : ''}`}
                onClick={() => { setIsOpen(!isOpen); setSearchTerm(''); }}
            >
                <span className={selectedOption ? styles.value : styles.placeholder}>
                    {selectedOption ? selectedOption.label : placeholder}
                </span>
                <ChevronDown size={16} className={styles.icon} />
            </div>

            {isOpen && (
                <div className={styles.menu}>
                    <div className={styles.searchBox}>
                        <Search size={14} className={styles.searchIcon} />
                        <input
                            type="text"
                            className={styles.searchInput}
                            placeholder="Tìm kiếm..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            onClick={(e) => e.stopPropagation()}
                            autoFocus
                        />
                    </div>
                    <div className={styles.options}>
                        {filteredOptions.length > 0 ? filteredOptions.map(opt => (
                            <div
                                key={opt.value}
                                className={`${styles.option} ${opt.value === value ? styles.selected : ''}`}
                                onClick={() => {
                                    onChange(opt.value);
                                    setIsOpen(false);
                                }}
                            >
                                {opt.label}
                            </div>
                        )) : (
                            <div className={styles.noOptions}>Không tìm thấy kết quả</div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}
