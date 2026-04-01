'use client';

import { useState, useEffect, useRef } from 'react';
import { X, Upload, Image as ImageIcon, Loader2 } from 'lucide-react';
import s from './ImageUploader.module.scss';
import { useToast, LazyImage } from '@/components/ui';

interface ImageUploaderProps {
    value?: string[];
    onChange: (urls: string[]) => void;
    maxImages?: number;
    files?: File[];
    onFilesChange?: (files: File[]) => void;
}

interface PendingImage {
    id: string;
    file: File;
    preview: string;
    progress: number;
    status: 'uploading' | 'error' | 'success';
}

export default function ImageUploader({
    value = [],
    onChange,
    maxImages = 5,
    files = [],
    onFilesChange
}: ImageUploaderProps) {
    const { error: showError } = useToast();
    const [pendingImages, setPendingImages] = useState<PendingImage[]>([]);
    const [dragActive, setDragActive] = useState(false);

    const latestValueRef = useRef(value);
    const latestFilesRef = useRef(files);

    useEffect(() => {
        latestValueRef.current = value;
    }, [value]);

    useEffect(() => {
        latestFilesRef.current = files;
    }, [files]);

    const handleFileUpload = async (selectedFiles: FileList | null) => {
        if (!selectedFiles || selectedFiles.length === 0) return;

        const currentCount = onFilesChange ? files.length : value.length;
        const pendingCount = pendingImages.length;
        const totalCount = currentCount + pendingCount;
        const remainingSlots = maxImages - totalCount;

        if (remainingSlots <= 0) {
            showError(`Chỉ được upload tối đa ${maxImages} ảnh`);
            return;
        }

        const filesToUpload = Array.from(selectedFiles).slice(0, remainingSlots);

        // MANUAL MODE: Use onFilesChange if provided
        if (onFilesChange) {
            onFilesChange([...files, ...filesToUpload]);
            return;
        }

        // AUTO UPLOAD MODE:
        const newPendingItems: PendingImage[] = filesToUpload.map(file => ({
            id: Math.random().toString(36).substring(2, 11),
            file,
            preview: URL.createObjectURL(file), // create local preview immediately
            progress: 0,
            status: 'uploading'
        }));

        setPendingImages(prev => [...prev, ...newPendingItems]);

        // Process uploads in parallel
        try {
            const uploadPromises = newPendingItems.map(async (item) => {
                const formData = new FormData();
                formData.append('file', item.file);

                try {
                    const response = await fetch('/api/upload', {
                        method: 'POST',
                        body: formData,
                    });
                    const result = await response.json();

                    if (result.success) {
                        setPendingImages(prev => prev.map(p =>
                            p.id === item.id ? { ...p, status: 'success', progress: 100 } : p
                        ));
                        return result.data.url;
                    } else {
                        throw new Error(result.message);
                    }
                } catch (error) {
                    console.error(`Error uploading ${item.file.name}:`, error);
                    setPendingImages(prev => prev.map(p =>
                        p.id === item.id ? { ...p, status: 'error' } : p
                    ));
                    showError(error instanceof Error ? error.message : `Lỗi upload ${item.file.name}`);
                    return null;
                }
            });

            const results = await Promise.all(uploadPromises);
            const successfulUrls = results.filter((url): url is string => url !== null);

            if (successfulUrls.length > 0) {
                onChange([...latestValueRef.current, ...successfulUrls]);
            }

            // Cleanup successful pending items
            setPendingImages(prev => prev.filter(p => !newPendingItems.find(newItem => newItem.id === p.id)));

            // Revoke object URLs
            newPendingItems.forEach(item => URL.revokeObjectURL(item.preview));

        } catch (error) {
            console.error('Batch upload error:', error);
        }
    };

    const handleDrag = (e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        if (e.type === 'dragenter' || e.type === 'dragover') {
            setDragActive(true);
        } else if (e.type === 'dragleave') {
            setDragActive(false);
        }
    };

    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        setDragActive(false);

        if (e.dataTransfer.files) {
            handleFileUpload(e.dataTransfer.files);
        }
    };

    const removeImage = (index: number) => {
        if (onFilesChange) {
            const newFiles = files.filter((_, i) => i !== index);
            onFilesChange(newFiles);
        } else {
            const newImages = value.filter((_, i) => i !== index);
            onChange(newImages);
        }
    };

    const isLimitReached = (onFilesChange ? files.length : value.length) + pendingImages.length >= maxImages;

    return (
        <div className={s.wrapper}>
            <div
                onDragEnter={handleDrag}
                onDragLeave={handleDrag}
                onDragOver={handleDrag}
                onDrop={handleDrop}
                className={`${s.uploadArea} ${dragActive ? s.dragActive : ''}`}
            >
                <input
                    type="file"
                    multiple
                    accept="image/jpeg,image/jpg,image/png,image/webp"
                    onChange={(e) => handleFileUpload(e.target.files)}
                    className={s.fileInput}
                    disabled={isLimitReached}
                />

                <div className={s.uploadContent}>
                    {pendingImages.length > 0 ? (
                        <Loader2 className={`${s.icon} ${s.spinner}`} size={48} />
                    ) : (
                        <Upload className={s.icon} size={48} />
                    )}
                    <div>
                        <p className={s.uploadTitle}>
                            Kéo thả ảnh vào đây hoặc click để chọn
                        </p>
                        <p className={s.uploadHint}>
                            PNG, JPG, WebP (tối đa 5MB) - {(onFilesChange ? files.length : value.length) + pendingImages.length}/{maxImages} ảnh
                        </p>
                    </div>
                </div>
            </div>

            {(value.length > 0 || (files && files.length > 0) || pendingImages.length > 0) && (
                <div className={s.previewGrid}>
                    {(onFilesChange ? files : value).map((item, index) => {
                        const url = typeof item === 'string' ? item : URL.createObjectURL(item);
                        return (
                            <div key={`existing-${index}`} className={s.previewItem}>
                                <LazyImage
                                    src={url}
                                    alt={`Preview ${index + 1}`}
                                    onLoad={() => {
                                        if (typeof item !== 'string') URL.revokeObjectURL(url);
                                    }}
                                />
                                <button
                                    type="button"
                                    onClick={() => removeImage(index)}
                                    className={s.removeBtn}
                                    aria-label="Thu nhỏ ảnh"
                                >
                                    <X size={14} strokeWidth={3} />
                                </button>
                                {index === 0 && (
                                    <div className={s.primaryBadge}>Ảnh chính</div>
                                )}
                            </div>
                        );
                    })}

                    {pendingImages.map((item) => (
                        <div key={item.id} className={s.previewItem}>
                            <LazyImage src={item.preview} alt="Đang upload..." style={{ opacity: 0.5 }} />
                            <div className={s.pendingOverlay}>
                                <Loader2 className={s.spinner} size={24} />
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {value.length === 0 && (!files || files.length === 0) && pendingImages.length === 0 && (
                <div className={s.emptyState}>
                    <ImageIcon className={s.icon} size={64} />
                    <p>Chưa có ảnh nào được thêm</p>
                </div>
            )}
        </div>
    );
}
