import React, { useState, useRef } from 'react';
import { Mail, Calendar, User as UserIcon, LogOut, Camera } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { supabase } from '@/lib/supabaseClient';
import { toast } from 'sonner';

const MAX_FILE_SIZE = 512 * 1024; // 512 KB
const ACCEPTED_TYPES = ['image/jpeg', 'image/png', 'image/webp'];

interface ProfileInfoProps {
    user: any;
    signOut: () => void;
}

export const ProfileInfo: React.FC<ProfileInfoProps> = ({ user, signOut }) => {
    const initials = user.user_metadata?.full_name
        ? user.user_metadata.full_name.substring(0, 2).toUpperCase()
        : user.email?.substring(0, 2).toUpperCase() || 'U';

    const avatarUrl = user.user_metadata?.avatar_url || null;
    const [uploading, setUploading] = useState(false);
    const [previewUrl, setPreviewUrl] = useState<string | null>(avatarUrl);
    const fileRef = useRef<HTMLInputElement>(null);

    const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        if (!ACCEPTED_TYPES.includes(file.type)) {
            toast.error('Only JPG, PNG or WebP allowed');
            return;
        }
        if (file.size > MAX_FILE_SIZE) {
            toast.error('Image must be under 512 KB');
            return;
        }

        setUploading(true);
        const ext = file.name.split('.').pop();
        const path = `${user.id}/avatar.${ext}`;

        const { error: uploadErr } = await supabase.storage
            .from('avatars')
            .upload(path, file, { upsert: true, cacheControl: '3600' });

        if (uploadErr) {
            toast.error('Upload failed: ' + uploadErr.message);
            setUploading(false);
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
        setUploading(false);
    };

    return (
        <div className="bg-card/50 backdrop-blur-sm border border-white/5 rounded-2xl p-4 sm:p-6 space-y-4 sm:space-y-6 shadow-xl">
            {/* Avatar + Name */}
            <div className="flex items-center gap-4">
                <div className="relative group">
                    {previewUrl ? (
                        <img
                            src={previewUrl}
                            alt="Avatar"
                            className="h-14 w-14 rounded-2xl object-cover border border-primary/20"
                        />
                    ) : (
                        <div className="h-14 w-14 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center">
                            <UserIcon size={24} className="text-primary/70" />
                        </div>
                    )}
                    <button
                        onClick={() => fileRef.current?.click()}
                        disabled={uploading}
                        className="absolute inset-0 rounded-2xl bg-black/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
                    >
                        <Camera size={16} className="text-white/80" />
                    </button>
                    <input ref={fileRef} type="file" accept="image/jpeg,image/png,image/webp" className="hidden" onChange={handleUpload} />
                </div>
                <div>
                    <h3 className="font-bold text-lg">{user.user_metadata?.full_name || 'User'}</h3>
                    <p className="text-xs text-muted-foreground">{user.email}</p>
                </div>
            </div>

            {/* Details */}
            <div className="space-y-3 pt-4 border-t border-white/5">
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

            {/* Sign Out */}
            <Button
                onClick={signOut}
                variant="ghost"
                className="w-full h-10 rounded-xl text-sm font-semibold text-destructive hover:bg-destructive/10 border border-white/5 hover:border-destructive/20 transition-all"
            >
                <LogOut className="h-4 w-4 mr-2" />
                Sign Out
            </Button>
        </div>
    );
};
