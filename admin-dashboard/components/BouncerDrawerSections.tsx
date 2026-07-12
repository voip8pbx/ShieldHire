import { useState, useRef } from 'react';
import { Camera, Mail, Phone, Calendar, User, MapPin, Activity, FileText, CheckCircle, Shield, ArrowRight, UploadCloud, FileType2, Image as ImageIcon } from 'lucide-react';
import RichTextEditor from './RichTextEditor';
import ImageViewer from './ImageViewer';
import toast from 'react-hot-toast';

// --- Shared Components ---

function InfoCard({ label, value, icon: Icon, isEditing, onChange, type = "text" }: any) {
    return (
        <div className="bg-surface p-4 rounded-xl border border-border-gray flex items-start gap-4 hover:border-zinc-700 transition-colors">
            <div className="bg-zinc-800 p-2 rounded-lg text-gray-400 mt-0.5">
                <Icon size={20} />
            </div>
            <div className="flex-1">
                <div className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">{label}</div>
                {isEditing ? (
                    <input
                        type={type}
                        value={value || ''}
                        onChange={(e) => onChange(type === 'number' ? parseFloat(e.target.value) || 0 : e.target.value)}
                        className="w-full bg-zinc-800 border border-zinc-700 rounded-md px-3 py-2 text-sm text-white focus:outline-none focus:border-primary-yellow"
                    />
                ) : (
                    <div className="text-sm text-gray-200 font-medium">{value || <span className="text-gray-600 italic">Not provided</span>}</div>
                )}
            </div>
        </div>
    );
}

// --- Sections ---

export function OverviewSection({ bouncer }: { bouncer: any }) {
    return (
        <div className="space-y-6 animate-fade-in">
            {/* Header Profile */}
            <div className="bg-surface rounded-2xl p-6 border border-border-gray flex flex-col md:flex-row gap-8 items-center md:items-start relative overflow-hidden">
                <div className="absolute top-0 left-0 w-full h-32 bg-gradient-to-r from-zinc-800 to-zinc-900 z-0"></div>
                
                <div className="relative z-10 w-32 h-32 rounded-full border-4 border-surface shadow-2xl overflow-hidden bg-zinc-800 shrink-0">
                    {bouncer.profilePhoto || bouncer.profileImageUrl ? (
                        <img src={bouncer.profileImageUrl || bouncer.profilePhoto} alt={bouncer.name} className="w-full h-full object-cover" />
                    ) : (
                        <div className="w-full h-full flex items-center justify-center text-gray-600">
                            <User size={48} />
                        </div>
                    )}
                </div>

                <div className="relative z-10 flex-1 pt-4 md:pt-10 text-center md:text-left">
                    <h2 className="text-3xl font-bold text-white mb-2">{bouncer.name}</h2>
                    <div className="flex flex-wrap items-center justify-center md:justify-start gap-3 mb-4">
                        <span className={`px-3 py-1 rounded-full text-xs font-bold border ${bouncer.isAvailable ? 'bg-success/10 text-success border-success/20' : 'bg-error/10 text-error border-error/20'}`}>
                            {bouncer.isAvailable ? 'Available' : 'Unavailable'}
                        </span>
                        <span className="px-3 py-1 rounded-full text-xs font-bold border bg-info/10 text-info border-info/20">
                            {bouncer.registrationType}
                        </span>
                        {bouncer.hasGunLicense && (
                            <span className="px-3 py-1 rounded-full text-xs font-bold border bg-primary-yellow/10 text-primary-yellow border-primary-yellow/20 flex items-center gap-1">
                                <Shield size={12} /> Gunman
                            </span>
                        )}
                        <span className="px-3 py-1 rounded-full text-xs font-bold border bg-purple-500/10 text-purple-400 border-purple-500/20">
                            ★ {bouncer.rating.toFixed(1)} Rating
                        </span>
                    </div>
                    <div className="text-sm text-gray-400 flex flex-wrap items-center justify-center md:justify-start gap-x-6 gap-y-2">
                        <span className="flex items-center gap-1.5"><Mail size={16} /> {bouncer.user?.email}</span>
                        <span className="flex items-center gap-1.5"><Phone size={16} /> {bouncer.contactNo}</span>
                        <span className="flex items-center gap-1.5"><Calendar size={16} /> Joined {new Date(bouncer.createdAt).toLocaleDateString()}</span>
                    </div>
                </div>
            </div>

            {/* Quick Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                 {[
                    { label: "Experience", value: `${bouncer.experience || 0} Years` },
                    { label: "Age", value: `${bouncer.age} Years` },
                    { label: "Gender", value: bouncer.gender },
                    { label: "Status", value: bouncer.verificationStatus }
                 ].map((stat, i) => (
                    <div key={i} className="bg-surface p-5 rounded-xl border border-border-gray text-center">
                        <div className="text-2xl font-bold text-white mb-1">{stat.value}</div>
                        <div className="text-xs font-bold text-gray-500 uppercase tracking-wider">{stat.label}</div>
                    </div>
                 ))}
            </div>
        </div>
    );
}

export function ProfileSection({ bouncer, isEditing, onUpdate }: any) {
    return (
        <div className="space-y-8 animate-fade-in pb-20">
            <div>
                <h3 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
                    <User className="text-primary-yellow" /> Personal Information
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <InfoCard label="Full Name" value={bouncer.name} icon={User} isEditing={isEditing} onChange={(val: string) => onUpdate('name', val)} />
                    <InfoCard label="Email" value={bouncer.user?.email} icon={Mail} isEditing={false} />
                    <InfoCard label="Phone Number" value={bouncer.contactNo} icon={Phone} isEditing={isEditing} onChange={(val: string) => onUpdate('contactNo', val)} />
                    <InfoCard label="Age" value={bouncer.age} icon={Calendar} type="number" isEditing={isEditing} onChange={(val: number) => onUpdate('age', val)} />
                    <InfoCard label="Gender" value={bouncer.gender} icon={User} isEditing={isEditing} onChange={(val: string) => onUpdate('gender', val)} />
                    <InfoCard label="Height (cm)" value={bouncer.height} icon={Activity} type="number" isEditing={isEditing} onChange={(val: number) => onUpdate('height', val)} />
                    <InfoCard label="Weight (kg)" value={bouncer.weight} icon={Activity} type="number" isEditing={isEditing} onChange={(val: number) => onUpdate('weight', val)} />
                    <InfoCard label="Blood Group" value={bouncer.bloodGroup} icon={Activity} isEditing={isEditing} onChange={(val: string) => onUpdate('bloodGroup', val)} />
                    <InfoCard label="Emergency Contact" value={bouncer.emergencyContact} icon={Phone} isEditing={isEditing} onChange={(val: string) => onUpdate('emergencyContact', val)} />
                </div>
            </div>

            <div>
                 <h3 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
                    <MapPin className="text-primary-yellow" /> Address Details
                </h3>
                {/* Note: Address might be stored in Client or User model, or added here. We'll simulate with basic fields if missing */}
                <div className="bg-surface p-6 rounded-2xl border border-border-gray">
                    <div className="text-gray-400 italic">Address management can be implemented based on the detailed schema. Ensure Google Maps API is enabled for map previews.</div>
                </div>
            </div>
        </div>
    );
}

export function NotesSection({ bouncer, isEditing, onUpdate }: any) {
    return (
        <div className="space-y-8 animate-fade-in pb-20">
            <div>
                <h3 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
                    <FileText className="text-primary-yellow" /> Professional Description
                </h3>
                <RichTextEditor 
                    value={bouncer.professionalDescription || ''} 
                    onChange={(val) => onUpdate('professionalDescription', val)} 
                    readOnly={!isEditing}
                    placeholder="Enter professional summary, special skills, and background..."
                />
            </div>
            <div>
                <h3 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
                    <Shield className="text-primary-yellow" /> Admin Notes
                </h3>
                <RichTextEditor 
                    value={bouncer.adminNotes || ''} 
                    onChange={(val) => onUpdate('adminNotes', val)} 
                    readOnly={!isEditing}
                    placeholder="Private notes visible only to administrators..."
                />
            </div>
        </div>
    );
}

export function GallerySection({ bouncer, onImageUpload, isUploading }: any) {
    const [viewerOpen, setViewerOpen] = useState(false);
    const [currentImg, setCurrentImg] = useState('');
    const [currentField, setCurrentField] = useState('');

    const openViewer = (url: string, field: string) => {
        if (!url) return;
        setCurrentImg(url);
        setCurrentField(field);
        setViewerOpen(true);
    };

    const handleReplace = async (e: React.ChangeEvent<HTMLInputElement>, field: string, oldUrl: string) => {
        if (e.target.files && e.target.files[0]) {
            await onImageUpload(field, e.target.files[0], oldUrl);
            setViewerOpen(false); // Close viewer after replace starts to see loading
        }
    };

    const ImageBox = ({ field, url, label }: { field: string, url: string, label: string }) => (
        <div className="relative group bg-zinc-800 rounded-xl overflow-hidden aspect-square border border-border-gray">
            {url ? (
                <>
                    <img src={url} alt={label} className="w-full h-full object-cover cursor-pointer transition-transform duration-500 group-hover:scale-110" onClick={() => openViewer(url, field)} />
                    <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-4 pointer-events-none">
                         <span className="text-white font-medium text-sm drop-shadow-md">Click to view</span>
                    </div>
                </>
            ) : (
                <div className="w-full h-full flex flex-col items-center justify-center text-gray-500">
                    <Camera size={32} className="mb-2 opacity-50" />
                    <span className="text-sm">{label}</span>
                    <label className="mt-4 px-4 py-2 bg-zinc-700 hover:bg-zinc-600 rounded-lg text-white text-xs font-bold cursor-pointer transition-colors cursor-pointer">
                        Upload
                        <input type="file" accept="image/*" className="hidden" onChange={(e) => handleReplace(e, field, '')} disabled={isUploading} />
                    </label>
                </div>
            )}
            <div className="absolute top-2 left-2 bg-black/60 px-2 py-1 rounded text-[10px] font-bold text-white uppercase tracking-wider backdrop-blur-sm">
                {label}
            </div>
        </div>
    );

    return (
        <div className="space-y-6 animate-fade-in pb-20">
            <h3 className="text-xl font-bold text-white flex items-center gap-2">
                <ImageIcon className="text-primary-yellow" /> Image Gallery
            </h3>
            
            {isUploading && (
                <div className="bg-primary-yellow/10 border border-primary-yellow/20 p-4 rounded-xl text-primary-yellow flex items-center gap-3 animate-pulse">
                    <UploadCloud className="animate-bounce" /> Uploading image to secure blob storage and syncing database...
                </div>
            )}

            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                <div className="col-span-2 md:col-span-1 row-span-2">
                    <div className="relative group bg-zinc-800 rounded-xl overflow-hidden h-full min-h-[300px] border border-border-gray">
                        {bouncer.profileImageUrl || bouncer.profilePhoto ? (
                             <>
                                <img src={bouncer.profileImageUrl || bouncer.profilePhoto} alt="Profile" className="w-full h-full object-cover cursor-pointer transition-transform duration-500 group-hover:scale-105" onClick={() => openViewer(bouncer.profileImageUrl || bouncer.profilePhoto, 'profileImageUrl')} />
                                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center pointer-events-none">
                                    <span className="text-white font-medium">View Profile</span>
                                </div>
                             </>
                        ) : (
                             <div className="w-full h-full flex flex-col items-center justify-center text-gray-500">
                                <User size={48} className="mb-2 opacity-50" />
                                <label className="mt-4 px-4 py-2 bg-zinc-700 hover:bg-zinc-600 rounded-lg text-white text-xs font-bold cursor-pointer transition-colors cursor-pointer">
                                    Upload Profile
                                    <input type="file" accept="image/*" className="hidden" onChange={(e) => handleReplace(e, 'profileImageUrl', '')} disabled={isUploading} />
                                </label>
                            </div>
                        )}
                        <div className="absolute top-3 left-3 bg-primary-yellow text-black px-2 py-1 rounded text-[10px] font-bold uppercase tracking-wider shadow-lg">
                            Primary Profile
                        </div>
                    </div>
                </div>
                
                <ImageBox field="galleryImage1" url={bouncer.galleryImage1} label="Gallery 1" />
                <ImageBox field="galleryImage2" url={bouncer.galleryImage2} label="Gallery 2" />
                <ImageBox field="galleryImage3" url={bouncer.galleryImage3} label="Gallery 3" />
                <ImageBox field="galleryImage4" url={bouncer.galleryImage4} label="Gallery 4" />
            </div>

            <ImageViewer 
                src={currentImg} 
                alt="Gallery Viewer" 
                isOpen={viewerOpen} 
                onClose={() => setViewerOpen(false)} 
                onReplace={(e) => handleReplace(e, currentField, currentImg)}
                onDelete={async () => {
                     // Delete functionality can be added similarly by calling onImageUpload with null file and just oldUrl to delete
                     toast.error('Delete is not fully implemented in this demo script.');
                }}
            />
        </div>
    );
}

export function DocumentsSection({ bouncer, onImageUpload, isUploading }: any) {
    const [viewerOpen, setViewerOpen] = useState(false);

    const handleReplace = async (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            await onImageUpload('gunLicenseUrl', e.target.files[0], bouncer.gunLicenseUrl);
        }
    };

    return (
        <div className="space-y-6 animate-fade-in pb-20">
            <h3 className="text-xl font-bold text-white flex items-center gap-2">
                <FileType2 className="text-primary-yellow" /> Official Documents
            </h3>

             {isUploading && (
                <div className="bg-primary-yellow/10 border border-primary-yellow/20 p-4 rounded-xl text-primary-yellow flex items-center gap-3 animate-pulse">
                    <UploadCloud className="animate-bounce" /> Processing document upload...
                </div>
            )}

            <div className="bg-surface p-6 rounded-2xl border border-border-gray">
                <div className="flex items-center justify-between mb-6">
                    <div>
                        <h4 className="text-lg font-bold text-white mb-1">Gun License</h4>
                        <p className="text-sm text-gray-400">Required for Armed Bouncer registration</p>
                    </div>
                    <div>
                         {bouncer.hasGunLicense ? (
                            <span className="px-3 py-1 rounded-full text-xs font-bold bg-success/20 text-success border border-success/30 flex items-center gap-2">
                                <CheckCircle size={14} /> Verified
                            </span>
                        ) : (
                            <span className="px-3 py-1 rounded-full text-xs font-bold bg-zinc-700 text-gray-400 border border-zinc-600">
                                Not Required
                            </span>
                        )}
                    </div>
                </div>

                <div className="relative group bg-zinc-900 rounded-xl overflow-hidden h-[400px] border border-border-gray flex items-center justify-center">
                    {bouncer.gunLicenseUrl || bouncer.gunLicensePhoto ? (
                        <>
                            {bouncer.gunLicenseUrl?.endsWith('.pdf') ? (
                                <div className="text-center text-gray-400">
                                    <FileType2 size={64} className="mx-auto mb-4 opacity-50" />
                                    <p className="mb-4">PDF Document Uploaded</p>
                                    <a href={bouncer.gunLicenseUrl} target="_blank" rel="noreferrer" className="text-primary-yellow hover:underline">View PDF</a>
                                </div>
                            ) : (
                                <img 
                                    src={bouncer.gunLicenseUrl || bouncer.gunLicensePhoto} 
                                    alt="Gun License" 
                                    className="max-w-full max-h-full object-contain cursor-pointer transition-transform duration-500" 
                                    onClick={() => setViewerOpen(true)} 
                                />
                            )}
                            <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center gap-4">
                                <button onClick={() => setViewerOpen(true)} className="px-6 py-2 bg-white text-black rounded-lg font-bold shadow-lg hover:scale-105 transition-transform">
                                    View Fullscreen
                                </button>
                                <label className="px-6 py-2 bg-zinc-800 text-white border border-zinc-600 rounded-lg font-bold shadow-lg hover:bg-zinc-700 transition-colors cursor-pointer">
                                    Replace License
                                    <input type="file" accept="image/*,.pdf" className="hidden" onChange={handleReplace} disabled={isUploading} />
                                </label>
                            </div>
                        </>
                    ) : (
                        <div className="text-center text-gray-500">
                            <Shield size={64} className="mx-auto mb-4 opacity-30" />
                            <p className="mb-6">No license document uploaded</p>
                            <label className="px-6 py-3 bg-primary-yellow hover:brightness-110 text-black rounded-lg font-bold shadow-lg transition-all cursor-pointer">
                                Upload Document
                                <input type="file" accept="image/*,.pdf" className="hidden" onChange={handleReplace} disabled={isUploading} />
                            </label>
                        </div>
                    )}
                </div>
            </div>

            <ImageViewer 
                src={bouncer.gunLicenseUrl || bouncer.gunLicensePhoto} 
                alt="Gun License Viewer" 
                isOpen={viewerOpen} 
                onClose={() => setViewerOpen(false)} 
                onReplace={handleReplace}
            />
        </div>
    );
}

export function ActivityTimeline({ bouncer }: any) {
    const timeline = [
        { title: "Registered on Platform", date: new Date(bouncer.createdAt).toLocaleString(), icon: User, color: "bg-blue-500" },
        { title: "Profile Completed", date: new Date(bouncer.createdAt).toLocaleString(), icon: CheckCircle, color: "bg-green-500" },
        ...(bouncer.lastAdminUpdate ? [{ title: "Admin Updated Profile", date: new Date(bouncer.lastAdminUpdate).toLocaleString(), icon: Activity, color: "bg-primary-yellow text-black" }] : []),
    ];

    return (
        <div className="space-y-8 animate-fade-in pb-20">
            <h3 className="text-xl font-bold text-white flex items-center gap-2 mb-8">
                <Activity className="text-primary-yellow" /> Activity Timeline
            </h3>

            <div className="relative border-l-2 border-zinc-800 ml-4 space-y-8">
                {timeline.map((item, i) => (
                    <div key={i} className="relative pl-8">
                        <div className={`absolute -left-[17px] top-1 w-8 h-8 rounded-full flex items-center justify-center border-4 border-surface ${item.color}`}>
                            <item.icon size={14} className={item.color.includes('text-black') ? '' : 'text-white'} />
                        </div>
                        <div className="bg-surface border border-border-gray p-4 rounded-xl">
                            <div className="font-bold text-white mb-1">{item.title}</div>
                            <div className="text-sm text-gray-400">{item.date}</div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}
