import React, { useState, useRef, useCallback, useEffect } from 'react';
import { Mail, Calendar, User as UserIcon, Camera, Loader2, Edit2, Check, X } from 'lucide-react';
import Cropper, { Area } from 'react-easy-crop';
import { format } from 'date-fns';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { CustomDatePicker } from '@/components/ui/date-picker';
import { supabase } from '@/lib/supabaseClient';
import { toast } from 'sonner';
import { StandardDialog } from '@/components/common/standard-dialog';
import { getCroppedImg } from '@/utils/image-crop';

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5 MB before crop (crop reduces size)
const ACCEPTED_TYPES = ['image/jpeg', 'image/png', 'image/webp'];

interface ProfileInfoProps {
    user: any;
    profile?: { fullName?: string; dob?: string; avatarUrl?: string } | null;
    saveProfile?: (updates: any) => Promise<void>;
    isEditing: boolean;
    setIsEditing: (val: boolean) => void;
    loading: boolean;
    onSave: () => Promise<void>;
    fullName: string;
    setFullName: (val: string) => void;
    dob: string;
    setDob: (val: string) => void;
}

export const ProfileInfo: React.FC<ProfileInfoProps> = ({
    user,
    profile,
    saveProfile,
    isEditing,
    setIsEditing,
    loading,
    onSave,
    fullName,
    setFullName,
    dob,
    setDob,
}) => {
    const displayName = profile?.fullName || user.user_metadata?.full_name || '';
    const initials = displayName
        ? displayName.substring(0, 2).toUpperCase()
        : user.email?.substring(0, 2).toUpperCase() || 'U';

    // Prefer user_profiles.avatar_url (persists across OAuth) over user_metadata.avatar_url (overwritten on login)
    const avatarUrl = profile?.avatarUrl || user.user_metadata?.avatar_url || null;
    const [previewUrl, setPreviewUrl] = useState<string | null>(avatarUrl);
    const [uploading, setUploading] = useState(false);
    const [cropModalOpen, setCropModalOpen] = useState(false);
    const [cropImageSrc, setCropImageSrc] = useState<string | null>(null);
    const [crop, setCrop] = useState({ x: 0, y: 0 });
    const [zoom, setZoom] = useState(1);
    const [croppedAreaPixels, setCroppedAreaPixels] = useState<Area | null>(null);
    const fileRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        setPreviewUrl(avatarUrl);
    }, [avatarUrl]);

    // Migrate: persist user_metadata.avatar_url to user_profiles so it survives OAuth re-login
    useEffect(() => {
        const metaUrl = user.user_metadata?.avatar_url;
        if (metaUrl && !profile?.avatarUrl && saveProfile) {
            saveProfile({ avatarUrl: metaUrl }).catch(() => {});
        }
    // eslint-disable-next-line react-hooks/exhaustive-deps -- only run when meta has avatar but profile doesn't
    }, [user.user_metadata?.avatar_url, profile?.avatarUrl]);

    const onCropComplete = useCallback((_croppedArea: Area, area: Area) => {
        setCroppedAreaPixels(area);
    }, []);

    const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        e.target.value = '';
        if (!file) return;

        if (!ACCEPTED_TYPES.includes(file.type)) {
            toast.error('Only JPG, PNG or WebP allowed');
            return;
        }
        if (file.size > MAX_FILE_SIZE) {
            toast.error('Image must be under 5 MB');
            return;
        }

        const reader = new FileReader();
        reader.onload = () => {
            setCropImageSrc(reader.result as string);
            setCrop({ x: 0, y: 0 });
            setZoom(1);
            setCroppedAreaPixels(null);
            setCropModalOpen(true);
        };
        reader.readAsDataURL(file);
    };

    const handleCropConfirm = async () => {
        if (!cropImageSrc || !croppedAreaPixels) {
            toast.error('Please adjust the crop area');
            return;
        }

        setUploading(true);
        try {
            const croppedBlob = await getCroppedImg(cropImageSrc, croppedAreaPixels);
            const ext = 'jpg';
            const path = `${user.id}/avatar.${ext}`;

            const { error: uploadErr } = await supabase.storage
                .from('avatars')
                .upload(path, croppedBlob, { upsert: true, cacheControl: '3600' });

            if (uploadErr) {
                toast.error('Upload failed: ' + uploadErr.message);
                return;
            }

            const { data: { publicUrl } } = supabase.storage.from('avatars').getPublicUrl(path);
            const urlWithBust = `${publicUrl}?t=${Date.now()}`;

            const { error: updateErr } = await supabase.auth.updateUser({
                data: { avatar_url: urlWithBust }
            });

            if (updateErr) {
                toast.error('Failed to save avatar');
            } else {
                setPreviewUrl(urlWithBust);
                await supabase.auth.refreshSession();
                if (saveProfile) {
                    await saveProfile({ avatarUrl: urlWithBust });
                }
                toast.success('Profile picture updated');
            }
        } catch (err: unknown) {
            toast.error(err instanceof Error ? err.message : 'Crop failed');
        } finally {
            setUploading(false);
            setCropModalOpen(false);
            setCropImageSrc(null);
            setCroppedAreaPixels(null);
        }
    };

    const handleCropCancel = () => {
        setCropModalOpen(false);
        setCropImageSrc(null);
        setCroppedAreaPixels(null);
    };

    return (
        <div className="bg-card/50 backdrop-blur-sm border border-border rounded-2xl p-4 sm:p-6 space-y-4 sm:space-y-6">
            {/* Avatar + Name */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <div className="relative group">
                        {uploading ? (
                            <div className="h-14 w-14 rounded-2xl bg-muted/50 border border-primary/20 flex items-center justify-center">
                                <Loader2 size={20} className="text-primary animate-spin" />
                            </div>
                        ) : previewUrl ? (
                            <img
                                src={previewUrl}
                                alt="Avatar"
                                className="h-14 w-14 rounded-2xl object-cover border border-primary/20"
                            />
                        ) : (
                            <div className="h-14 w-14 rounded-2xl bg-primary/15 border border-primary/20 flex items-center justify-center">
                                <span className="text-lg font-bold text-primary tracking-tight select-none">{initials}</span>
                            </div>
                        )}
                        <button
                            onClick={() => fileRef.current?.click()}
                            disabled={uploading || isEditing}
                            className="absolute inset-0 rounded-2xl bg-background/50 flex items-center justify-center opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity cursor-pointer"
                        >
                            <Camera size={16} className="text-foreground" />
                        </button>
                        <input ref={fileRef} type="file" accept="image/jpeg,image/png,image/webp" className="hidden" onChange={handleFileSelect} />
                    </div>
                    <div>
                        <h3 className="font-bold text-lg">{displayName || 'User'}</h3>
                        <p className="text-xs text-muted-foreground">{user.email}</p>
                    </div>
                </div>

                {!isEditing && (
                    <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => setIsEditing(true)}
                        className="h-8 w-8 rounded-lg text-muted-foreground hover:text-primary hover:bg-accent shrink-0"
                    >
                        <Edit2 className="h-4 w-4" />
                    </Button>
                )}
            </div>

            {isEditing ? (
                <div className="space-y-4 pt-4 border-t border-border animate-in fade-in duration-300">
                    <div className="space-y-1.5">
                        <label className="text-xs font-semibold text-muted-foreground ml-0.5">Full Name</label>
                        <Input value={fullName} onChange={(e) => setFullName(e.target.value)} className="h-10 rounded-xl bg-muted border-border" />
                    </div>
                    <div className="space-y-1.5">
                        <label className="text-xs font-semibold text-muted-foreground ml-0.5">Date of Birth</label>
                        <CustomDatePicker
                            selected={dob ? new Date(dob) : null}
                            onChange={(date) => setDob(date ? format(date, 'yyyy-MM-dd') : '')}
                            placeholderText="Select date"
                        />
                    </div>
                    <div className="flex gap-3 pt-2">
                        <Button onClick={onSave} disabled={loading} className="flex-1 h-10 rounded-xl font-semibold">
                            <Check className="h-4 w-4 mr-1.5" /> Save
                        </Button>
                        <Button variant="outline" onClick={() => setIsEditing(false)} disabled={loading} className="flex-1 h-10 rounded-xl font-semibold border-border">
                            <X className="h-4 w-4 mr-1.5" /> Cancel
                        </Button>
                    </div>
                </div>
            ) : (
                /* Details */
                <div className="space-y-3 pt-4 border-t border-border">
                    <div className="flex items-center gap-3 text-sm">
                        <Mail className="h-4 w-4 text-muted-foreground shrink-0" />
                        <span className="text-muted-foreground">{user.email}</span>
                    </div>
                    <div className="flex items-center gap-3 text-sm">
                        <UserIcon className="h-4 w-4 text-muted-foreground shrink-0" />
                        <span className="text-muted-foreground">DOB: {profile?.dob || user.user_metadata?.dob || 'Not set'}</span>
                    </div>
                    <div className="flex items-center gap-3 text-sm">
                        <Calendar className="h-4 w-4 text-muted-foreground shrink-0" />
                        <span className="text-muted-foreground">Joined {new Date(user.created_at).toLocaleDateString()}</span>
                    </div>
                </div>
            )}

            {/* Crop Modal */}
            <StandardDialog
                isOpen={cropModalOpen}
                onClose={handleCropCancel}
                title="Crop profile picture"
                subtitle="Adjust the crop area and zoom"
                maxWidth="lg"
                scrollable={false}
                hideClose={false}
                closeOnBackdrop={true}
                footer={
                    <div className="flex gap-2 justify-end">
                        <Button variant="outline" onClick={handleCropCancel}>Cancel</Button>
                        <Button onClick={handleCropConfirm} disabled={!croppedAreaPixels || uploading}>
                            {uploading ? <Loader2 size={16} className="animate-spin mr-2" /> : null}
                            Save
                        </Button>
                    </div>
                }
            >
                {cropImageSrc && (
                    <div className="relative w-full bg-muted/30 min-h-[min(70vw,320px)] h-[min(70vw,320px)] sm:min-h-[320px] sm:h-[320px]">
                        <Cropper
                            image={cropImageSrc}
                            crop={crop}
                            zoom={zoom}
                            aspect={1}
                            cropShape="round"
                            showGrid={false}
                            onCropChange={setCrop}
                            onZoomChange={setZoom}
                            onCropComplete={onCropComplete}
                        />
                    </div>
                )}
            </StandardDialog>
        </div>
    );
};
