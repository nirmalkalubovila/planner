import React, { useState, useRef, useCallback, useEffect } from 'react';
import { Mail, Calendar, User as UserIcon, Camera, Loader2 } from 'lucide-react';
import Cropper, { Area } from 'react-easy-crop';
import { Button } from '@/components/ui/button';
import { supabase } from '@/lib/supabaseClient';
import { toast } from 'sonner';
import { StandardDialog } from '@/components/common/standard-dialog';
import { getCroppedImg } from '@/utils/image-crop';

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5 MB before crop (crop reduces size)
const ACCEPTED_TYPES = ['image/jpeg', 'image/png', 'image/webp'];

interface ProfileInfoProps {
    user: any;
}

export const ProfileInfo: React.FC<ProfileInfoProps> = ({ user }) => {
    const initials = user.user_metadata?.full_name
        ? user.user_metadata.full_name.substring(0, 2).toUpperCase()
        : user.email?.substring(0, 2).toUpperCase() || 'U';

    const avatarUrl = user.user_metadata?.avatar_url || null;
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
                toast.success('Profile picture updated');
            }
        } catch (err: unknown) {
            toast.error(err instanceof Error ? err.message : 'Crop failed');
        } finally {
            setUploading(false);
            setCropModalOpen(false);
            setCropImageSrc(null);
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
                        disabled={uploading}
                        className="absolute inset-0 rounded-2xl bg-background/50 flex items-center justify-center opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity cursor-pointer"
                    >
                        <Camera size={16} className="text-foreground" />
                    </button>
                    <input ref={fileRef} type="file" accept="image/jpeg,image/png,image/webp" className="hidden" onChange={handleFileSelect} />
                </div>
                <div>
                    <h3 className="font-bold text-lg">{user.user_metadata?.full_name || 'User'}</h3>
                    <p className="text-xs text-muted-foreground">{user.email}</p>
                </div>
            </div>

            {/* Details */}
            <div className="space-y-3 pt-4 border-t border-border">
                <div className="flex items-center gap-3 text-sm">
                    <Mail className="h-4 w-4 text-muted-foreground shrink-0" />
                    <span className="text-muted-foreground">{user.email}</span>
                </div>
                <div className="flex items-center gap-3 text-sm">
                    <UserIcon className="h-4 w-4 text-muted-foreground shrink-0" />
                    <span className="text-muted-foreground">DOB: {user.user_metadata?.dob || 'Not set'}</span>
                </div>
                <div className="flex items-center gap-3 text-sm">
                    <Calendar className="h-4 w-4 text-muted-foreground shrink-0" />
                    <span className="text-muted-foreground">Joined {new Date(user.created_at).toLocaleDateString()}</span>
                </div>
            </div>

            {/* Crop Modal — centered like habits create popup, responsive for both screens */}
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
