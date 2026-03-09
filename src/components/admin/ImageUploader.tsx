'use client';

import { useState, useEffect, useRef } from 'react';
import { X, Upload, Image as ImageIcon, Loader2 } from 'lucide-react';

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
    const [pendingImages, setPendingImages] = useState<PendingImage[]>([]);
    const [dragActive, setDragActive] = useState(false);

    // Keep track of latest value for race-condition mitigation
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
            alert(`Chá»‰ Ä‘Æ°á»£c upload tá»‘i Ä‘a ${maxImages} áº£nh`);
            return;
        }

        const filesToUpload = Array.from(selectedFiles).slice(0, remainingSlots);

        // MANUAL MODE: Use onFilesChange if provided
        if (onFilesChange) {
            onFilesChange([...files, ...filesToUpload]);
            return;
        }

        // LEGACY MODE: Parallel upload
        // Create pending items
        const newPendingItems: PendingImage[] = filesToUpload.map(file => ({
            id: Math.random().toString(36).substr(2, 9),
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
                    alert(error instanceof Error ? error.message : `Lá»—i upload ${item.file.name}`);
                    return null;
                }
            });

            const results = await Promise.all(uploadPromises);
            const successfulUrls = results.filter((url): url is string => url !== null);

            if (successfulUrls.length > 0) {
                // Update parent with new URLs properly merged
                onChange([...latestValueRef.current, ...successfulUrls]);
            }

            // Cleanup successful/failed pending items after a short delay
            // (or immediately if we just want to replace them with the real URL in value)
            // Here we remove them immediately because onChange updates 'value' which renders the real items
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

    // Combine current value/files with pending images for display?
    // Actually, distinct display is better so we see what is "real" and what is "uploading"
    // Pending images shown at the end? Or start? 
    // Usually end makes sense for new uploads.

    return (
        <div className="space-y-4">
            {/* Upload Area */}
            <div
                onDragEnter={handleDrag}
                onDragLeave={handleDrag}
                onDragOver={handleDrag}
                onDrop={handleDrop}
                className={`
                    relative border-2 border-dashed rounded-lg p-8 text-center
                    transition-colors cursor-pointer
                    ${dragActive
                        ? 'border-blue-500 bg-blue-50'
                        : 'border-gray-300 hover:border-gray-400'
                    }
                `}
            >
                <input
                    type="file"
                    multiple
                    accept="image/jpeg,image/jpg,image/png,image/webp"
                    onChange={(e) => handleFileUpload(e.target.files)}
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                    disabled={(onFilesChange ? files.length : value.length) + pendingImages.length >= maxImages}
                />

                <div className="flex flex-col items-center gap-2">
                    {pendingImages.length > 0 ? (
                        <Loader2 className="w-12 h-12 text-blue-500 animate-spin" />
                    ) : (
                        <Upload className="w-12 h-12 text-gray-400" />
                    )}

                    <div>
                        <p className="text-sm font-medium text-gray-700">
                            KÃ©o tháº£ áº£nh vÃ o Ä‘Ã¢y hoáº·c click Ä‘á»ƒ chá»n
                        </p>
                        <p className="text-xs text-gray-500 mt-1">
                            PNG, JPG, WebP (tá»‘i Ä‘a 5MB) - {(onFilesChange ? files.length : value.length) + pendingImages.length}/{maxImages} áº£nh
                        </p>
                    </div>
                </div>
            </div>

            {/* Image Preview Grid */}
            {(value.length > 0 || (files && files.length > 0) || pendingImages.length > 0) && (
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
                    {/* Render Real/Existing Images */}
                    {(onFilesChange ? files : value).map((item, index) => {
                        const url = typeof item === 'string' ? item : URL.createObjectURL(item);
                        return (
                            <div key={`existing-${index}`} className="relative group aspect-square">
                                <img
                                    src={url}
                                    alt={`Product ${index + 1}`}
                                    className="w-full h-full object-cover rounded-lg border border-gray-200"
                                    onLoad={() => {
                                        if (typeof item !== 'string') URL.revokeObjectURL(url);
                                    }}
                                />
                                <button
                                    type="button"
                                    onClick={() => removeImage(index)}
                                    className="
                                        absolute top-2 right-2 
                                        bg-red-500 text-white rounded-full p-1
                                        opacity-0 group-hover:opacity-100
                                        transition-opacity
                                        hover:bg-red-600
                                    "
                                >
                                    <X className="w-4 h-4" />
                                </button>
                                {index === 0 && (
                                    <div className="absolute bottom-2 left-2 bg-blue-500 text-white text-xs px-2 py-1 rounded">
                                        áº¢nh chÃ­nh
                                    </div>
                                )}
                            </div>
                        );
                    })}

                    {/* Render Pending/Uploading Images */}
                    {pendingImages.map((item) => (
                        <div key={item.id} className="relative aspect-square">
                            <img
                                src={item.preview}
                                alt="Uploading..."
                                className="w-full h-full object-cover rounded-lg border border-blue-200 opacity-70"
                            />
                            <div className="absolute inset-0 flex items-center justify-center bg-black/20 rounded-lg">
                                <Loader2 className="w-8 h-8 text-white animate-spin" />
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {value.length === 0 && (!files || files.length === 0) && pendingImages.length === 0 && (
                <div className="text-center py-8 text-gray-400">
                    <ImageIcon className="w-16 h-16 mx-auto mb-2 opacity-50" />
                    <p className="text-sm">ChÆ°a cÃ³ áº£nh nÃ o</p>
                </div>
            )}
        </div>
    );
}
