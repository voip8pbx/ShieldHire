import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Save, ShieldAlert, CheckCircle2, User, ImageIcon, FileType2, FileText, Activity } from 'lucide-react';
import toast from 'react-hot-toast';
import { OverviewSection, ProfileSection, GallerySection, DocumentsSection, NotesSection, ActivityTimeline } from './BouncerDrawerSections';

interface BouncerDrawerProps {
    bouncerId: string;
    isOpen: boolean;
    onClose: () => void;
    onRefresh: () => void;
}

const TABS = [
    { id: 'overview', label: 'Overview', icon: User },
    { id: 'profile', label: 'Profile Data', icon: FileText },
    { id: 'gallery', label: 'Gallery', icon: ImageIcon },
    { id: 'documents', label: 'Documents', icon: FileType2 },
    { id: 'notes', label: 'Admin Notes', icon: ShieldAlert },
    { id: 'activity', label: 'Activity', icon: Activity },
];

export default function BouncerDrawer({ bouncerId, isOpen, onClose, onRefresh }: BouncerDrawerProps) {
    const [bouncer, setBouncer] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState('overview');
    const [isEditing, setIsEditing] = useState(false);
    const [editedData, setEditedData] = useState<any>({});
    const [isSaving, setIsSaving] = useState(false);
    const [isUploading, setIsUploading] = useState(false);

    useEffect(() => {
        if (isOpen && bouncerId) {
            fetchBouncer();
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = 'auto';
            setBouncer(null);
            setEditedData({});
            setIsEditing(false);
            setActiveTab('overview');
        }
        return () => { document.body.style.overflow = 'auto'; };
    }, [isOpen, bouncerId]);

    const fetchBouncer = async () => {
        setLoading(true);
        try {
            const res = await fetch(`/api/bouncers/${bouncerId}`);
            if (!res.ok) throw new Error('Failed to fetch');
            const data = await res.json();
            setBouncer(data);
            setEditedData({});
        } catch (error) {
            toast.error('Failed to load bouncer details');
            onClose();
        } finally {
            setLoading(false);
        }
    };

    const handleUpdateField = (field: string, value: any) => {
        setEditedData((prev: any) => ({ ...prev, [field]: value }));
    };

    const handleSave = async () => {
        setIsSaving(true);
        try {
            const res = await fetch(`/api/bouncers/${bouncerId}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(editedData),
            });
            
            if (!res.ok) throw new Error('Failed to update');
            
            const updated = await res.json();
            setBouncer(updated);
            setEditedData({});
            setIsEditing(false);
            toast.success('Bouncer updated successfully');
            onRefresh();
        } catch (error) {
            toast.error('Failed to save changes');
        } finally {
            setIsSaving(false);
        }
    };

    const handleImageUpload = async (field: string, file: File, oldUrl?: string) => {
        setIsUploading(true);
        const toastId = toast.loading('Uploading file...');
        try {
            // 1. Upload to Blob
            const filename = `${bouncerId}-${field}-${Date.now()}-${file.name}`;
            const uploadRes = await fetch(`/api/upload?filename=${encodeURIComponent(filename)}${oldUrl ? `&oldUrl=${encodeURIComponent(oldUrl)}` : ''}`, {
                method: 'POST',
                body: file,
            });
            
            if (!uploadRes.ok) throw new Error('Upload failed');
            const blob = await uploadRes.json();
            
            // 2. Update DB
            const patchRes = await fetch(`/api/bouncers/${bouncerId}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ [field]: blob.url }),
            });

            if (!patchRes.ok) throw new Error('DB update failed');
            const updated = await patchRes.json();
            
            setBouncer(updated);
            toast.success('Image replaced successfully', { id: toastId });
            onRefresh();
        } catch (error) {
            console.error(error);
            toast.error('Failed to upload image', { id: toastId });
        } finally {
            setIsUploading(false);
        }
    };

    if (!isOpen) return null;

    const mergedData = { ...bouncer, ...editedData };

    return (
        <AnimatePresence>
            {isOpen && (
                <>
                    {/* Backdrop */}
                    <motion.div 
                        initial={{ opacity: 0 }} 
                        animate={{ opacity: 1 }} 
                        exit={{ opacity: 0 }} 
                        className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100] cursor-pointer"
                        onClick={() => {
                            if (Object.keys(editedData).length > 0) {
                                if(window.confirm('You have unsaved changes. Are you sure you want to close?')) onClose();
                            } else {
                                onClose();
                            }
                        }}
                    />

                    {/* Drawer */}
                    <motion.div 
                        initial={{ x: '100%', boxShadow: '-20px 0 50px rgba(0,0,0,0)' }} 
                        animate={{ x: 0, boxShadow: '-20px 0 50px rgba(0,0,0,0.5)' }} 
                        exit={{ x: '100%', boxShadow: '-20px 0 50px rgba(0,0,0,0)' }} 
                        transition={{ type: 'spring', damping: 25, stiffness: 200 }}
                        className="fixed inset-y-0 right-0 w-full md:w-[85vw] lg:w-[75vw] max-w-6xl bg-background border-l border-border-gray z-[101] flex flex-col shadow-2xl"
                    >
                        {loading ? (
                            <div className="flex-1 flex items-center justify-center">
                                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-yellow"></div>
                            </div>
                        ) : (
                            <>
                                {/* Drawer Header */}
                                <div className="h-20 border-b border-border-gray flex items-center justify-between px-6 bg-surface shrink-0">
                                    <div className="flex items-center gap-4">
                                        <button onClick={onClose} className="p-2 hover:bg-zinc-800 rounded-lg transition-colors text-gray-400 hover:text-white">
                                            <X size={24} />
                                        </button>
                                        <div>
                                            <h2 className="text-xl font-bold text-white leading-tight">{bouncer?.name}</h2>
                                            <div className="text-xs text-gray-400 flex items-center gap-2">
                                                ID: {bouncer?.id}
                                                {Object.keys(editedData).length > 0 && (
                                                    <span className="text-primary-yellow font-bold flex items-center gap-1">
                                                        <span className="w-1.5 h-1.5 rounded-full bg-primary-yellow animate-pulse"></span> Unsaved changes
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-3">
                                        {isEditing ? (
                                            <>
                                                <button 
                                                    onClick={() => { setEditedData({}); setIsEditing(false); }} 
                                                    className="px-4 py-2 text-sm font-bold text-gray-300 hover:text-white transition-colors"
                                                >
                                                    Cancel
                                                </button>
                                                <button 
                                                    onClick={handleSave} 
                                                    disabled={isSaving}
                                                    className="px-6 py-2 bg-primary-yellow hover:brightness-110 text-black text-sm font-bold rounded-lg shadow-lg transition-all flex items-center gap-2 disabled:opacity-50"
                                                >
                                                    {isSaving ? <span className="animate-spin w-4 h-4 border-2 border-black border-t-transparent rounded-full" /> : <Save size={16} />}
                                                    Save Changes
                                                </button>
                                            </>
                                        ) : (
                                            <button 
                                                onClick={() => setIsEditing(true)} 
                                                className="px-6 py-2 bg-zinc-800 hover:bg-zinc-700 text-white border border-zinc-700 text-sm font-bold rounded-lg transition-colors flex items-center gap-2"
                                            >
                                                Edit Profile
                                            </button>
                                        )}
                                    </div>
                                </div>

                                {/* Drawer Body */}
                                <div className="flex-1 flex overflow-hidden">
                                    {/* Sidebar Navigation */}
                                    <div className="w-64 border-r border-border-gray bg-surface/50 overflow-y-auto hidden md:block shrink-0 p-4">
                                        <div className="space-y-2">
                                            {TABS.map(tab => (
                                                <button
                                                    key={tab.id}
                                                    onClick={() => setActiveTab(tab.id)}
                                                    className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all font-medium text-sm ${activeTab === tab.id ? 'bg-primary-yellow/10 text-primary-yellow border border-primary-yellow/20' : 'text-gray-400 hover:bg-zinc-800 hover:text-white border border-transparent'}`}
                                                >
                                                    <tab.icon size={18} className={activeTab === tab.id ? 'text-primary-yellow' : 'text-gray-500'} />
                                                    {tab.label}
                                                </button>
                                            ))}
                                        </div>
                                    </div>

                                    {/* Mobile Navigation */}
                                    <div className="md:hidden flex overflow-x-auto border-b border-border-gray bg-surface shrink-0 absolute top-20 left-0 right-0 z-10 px-4 py-2 gap-2 hide-scrollbar">
                                         {TABS.map(tab => (
                                            <button
                                                key={tab.id}
                                                onClick={() => setActiveTab(tab.id)}
                                                className={`flex-shrink-0 flex items-center gap-2 px-4 py-2 rounded-lg transition-all font-medium text-sm ${activeTab === tab.id ? 'bg-primary-yellow/10 text-primary-yellow border border-primary-yellow/20' : 'text-gray-400 border border-border-gray'}`}
                                            >
                                                <tab.icon size={14} />
                                                {tab.label}
                                            </button>
                                        ))}
                                    </div>

                                    {/* Content Area */}
                                    <div className="flex-1 overflow-y-auto p-6 md:p-10 pt-20 md:pt-10 scroll-smooth">
                                        <div className="max-w-4xl mx-auto">
                                            {activeTab === 'overview' && <OverviewSection bouncer={mergedData} />}
                                            {activeTab === 'profile' && <ProfileSection bouncer={mergedData} isEditing={isEditing} onUpdate={handleUpdateField} />}
                                            {activeTab === 'gallery' && <GallerySection bouncer={mergedData} onImageUpload={handleImageUpload} isUploading={isUploading} />}
                                            {activeTab === 'documents' && <DocumentsSection bouncer={mergedData} onImageUpload={handleImageUpload} isUploading={isUploading} />}
                                            {activeTab === 'notes' && <NotesSection bouncer={mergedData} isEditing={isEditing} onUpdate={handleUpdateField} />}
                                            {activeTab === 'activity' && <ActivityTimeline bouncer={mergedData} />}
                                        </div>
                                    </div>
                                </div>
                            </>
                        )}
                    </motion.div>
                </>
            )}
        </AnimatePresence>
    );
}
