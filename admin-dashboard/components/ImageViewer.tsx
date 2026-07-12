import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, ZoomIn, ZoomOut, RotateCw, Download, Image as ImageIcon, Trash2, Upload } from 'lucide-react';

interface ImageViewerProps {
    src: string;
    alt: string;
    isOpen: boolean;
    onClose: () => void;
    onDelete?: () => void;
    onReplace?: (e: React.ChangeEvent<HTMLInputElement>) => void;
}

export default function ImageViewer({ src, alt, isOpen, onClose, onDelete, onReplace }: ImageViewerProps) {
    const [scale, setScale] = useState(1);
    const [rotation, setRotation] = useState(0);

    useEffect(() => {
        if (isOpen) {
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = 'auto';
            setScale(1);
            setRotation(0);
        }
        return () => {
            document.body.style.overflow = 'auto';
        };
    }, [isOpen]);

    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'Escape') onClose();
            if (e.key === '=' || e.key === '+') setScale(s => Math.min(s + 0.25, 3));
            if (e.key === '-') setScale(s => Math.max(s - 0.25, 0.5));
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [onClose]);

    const handleDownload = async () => {
        try {
            const response = await fetch(src);
            const blob = await response.blob();
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = alt || 'image';
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            window.URL.revokeObjectURL(url);
        } catch (error) {
            console.error('Error downloading image:', error);
        }
    };

    if (!isOpen) return null;

    return (
        <AnimatePresence>
            {isOpen && (
                <div className="fixed inset-0 z-[999999] flex items-center justify-center bg-black/90 backdrop-blur-sm">
                    {/* Top Bar */}
                    <div className="absolute top-0 inset-x-0 h-16 flex items-center justify-between px-6 bg-gradient-to-b from-black/80 to-transparent z-50">
                        <div className="text-white font-medium truncate max-w-sm">
                            {alt || 'Image Viewer'}
                        </div>
                        <div className="flex items-center gap-4 text-gray-300">
                            {onReplace && (
                                <label className="cursor-pointer hover:text-white transition-colors flex items-center gap-2 px-3 py-1.5 rounded-lg bg-white/10 hover:bg-white/20">
                                    <Upload size={18} />
                                    <span className="text-sm font-medium">Replace</span>
                                    <input type="file" accept="image/*" className="hidden" onChange={onReplace} />
                                </label>
                            )}
                            {onDelete && (
                                <button onClick={onDelete} className="hover:text-red-500 transition-colors p-2" title="Delete">
                                    <Trash2 size={20} />
                                </button>
                            )}
                            <div className="w-[1px] h-6 bg-white/20 mx-2" />
                            <button onClick={() => setScale(s => Math.min(s + 0.25, 3))} className="hover:text-white transition-colors" title="Zoom In">
                                <ZoomIn size={24} />
                            </button>
                            <button onClick={() => setScale(s => Math.max(s - 0.25, 0.5))} className="hover:text-white transition-colors" title="Zoom Out">
                                <ZoomOut size={24} />
                            </button>
                            <button onClick={() => setRotation(r => r + 90)} className="hover:text-white transition-colors" title="Rotate">
                                <RotateCw size={24} />
                            </button>
                            <button onClick={handleDownload} className="hover:text-white transition-colors" title="Download">
                                <Download size={24} />
                            </button>
                            <button onClick={onClose} className="hover:text-white transition-colors ml-4" title="Close (Esc)">
                                <X size={28} />
                            </button>
                        </div>
                    </div>

                    {/* Image Area */}
                    <div className="w-full h-full p-16 flex items-center justify-center overflow-hidden" onClick={onClose}>
                        <motion.img
                            src={src}
                            alt={alt}
                            initial={{ opacity: 0, scale: 0.8 }}
                            animate={{ opacity: 1, scale: scale, rotate: rotation }}
                            exit={{ opacity: 0, scale: 0.8 }}
                            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
                            className="max-w-full max-h-full object-contain cursor-grab active:cursor-grabbing shadow-2xl"
                            onClick={(e) => e.stopPropagation()}
                            drag
                            dragConstraints={{ left: 0, right: 0, top: 0, bottom: 0 }}
                            dragElastic={0.8}
                        />
                    </div>
                </div>
            )}
        </AnimatePresence>
    );
}
