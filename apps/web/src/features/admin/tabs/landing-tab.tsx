import React, { useState } from 'react';
import { Save, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useLandingSettings, useUpdateLandingSettings } from '@/api/services/feedback-service';


export const LandingTab: React.FC = () => {
    const { data: settings, isLoading: isSettingsLoading } = useLandingSettings();
    const updateSettings = useUpdateLandingSettings();

    // Form states for video and galleries
    const [desktopVideo, setDesktopVideo] = useState('');
    const [mobileVideo, setMobileVideo] = useState('');
    const [desktopGallery, setDesktopGallery] = useState<string[]>([]);
    const [mobileGallery, setMobileGallery] = useState<string[]>([]);
    const [newDesktopUrl, setNewDesktopUrl] = useState('');
    const [newMobileUrl, setNewMobileUrl] = useState('');

    // Sync state when settings query resolves
    React.useEffect(() => {
        if (settings) {
            setDesktopVideo(settings.desktop_video_url || '');
            setMobileVideo(settings.mobile_video_url || '');
            setDesktopGallery(settings.desktop_gallery || []);
            setMobileGallery(settings.mobile_gallery || []);
        }
    }, [settings]);

    const handleSaveSettings = () => {
        updateSettings.mutate({
            desktop_video_url: desktopVideo,
            mobile_video_url: mobileVideo,
            desktop_gallery: desktopGallery,
            mobile_gallery: mobileGallery,
        });
    };

    const handleAddDesktopUrl = () => {
        if (newDesktopUrl.trim()) {
            setDesktopGallery(prev => [...prev, newDesktopUrl.trim()]);
            setNewDesktopUrl('');
        }
    };

    const handleRemoveDesktopUrl = (index: number) => {
        setDesktopGallery(prev => prev.filter((_, i) => i !== index));
    };

    const handleAddMobileUrl = () => {
        if (newMobileUrl.trim()) {
            setMobileGallery(prev => [...prev, newMobileUrl.trim()]);
            setNewMobileUrl('');
        }
    };

    const handleRemoveMobileUrl = (index: number) => {
        setMobileGallery(prev => prev.filter((_, i) => i !== index));
    };

    if (isSettingsLoading) {
        return (
            <div className="space-y-4">
                {Array.from({ length: 3 }).map((_, i) => (
                    <div key={i} className="bg-card/60 border border-border rounded-2xl p-5 h-32 animate-pulse" />
                ))}
            </div>
        );
    }

    return (
        <div className="space-y-8 pb-20">
            {/* Hero Video & Product Gallery Config */}
            <div className="bg-card/60 border border-border rounded-2xl p-5 space-y-6">
                <div>
                  <h3 className="text-sm font-bold uppercase tracking-wider text-foreground">Media Settings</h3>
                  <p className="text-xs text-muted-foreground mt-1">Configure landing page hero videos and preview screenshots.</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Desktop Hero Video */}
                    <div className="space-y-2">
                        <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Desktop Video URL</label>
                        <Input
                            value={desktopVideo}
                            onChange={(e) => setDesktopVideo(e.target.value)}
                            placeholder="Enter Cloudinary/MP4 Video URL"
                            className="bg-muted text-xs h-10 rounded-xl"
                        />
                    </div>

                    {/* Mobile Hero Video */}
                    <div className="space-y-2">
                        <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Mobile Video URL</label>
                        <Input
                            value={mobileVideo}
                            onChange={(e) => setMobileVideo(e.target.value)}
                            placeholder="Enter Cloudinary/MP4 Video URL"
                            className="bg-muted text-xs h-10 rounded-xl"
                        />
                    </div>
                </div>

                {/* Galleries */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8 border-t border-border pt-6">
                    {/* Desktop Gallery */}
                    <div className="space-y-4">
                        <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider block">Desktop Gallery Images</label>
                        <div className="flex gap-2">
                            <Input
                                value={newDesktopUrl}
                                onChange={(e) => setNewDesktopUrl(e.target.value)}
                                placeholder="Add desktop image URL"
                                className="bg-muted text-xs h-10 rounded-xl flex-1"
                            />
                            <Button onClick={handleAddDesktopUrl} size="sm" className="rounded-xl h-10 px-4">Add</Button>
                        </div>
                        <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                            {desktopGallery.map((url, i) => (
                                <div key={i} className="flex items-center justify-between gap-3 bg-muted/40 border border-border/60 p-2 rounded-xl text-xs">
                                    <span className="truncate flex-1 text-muted-foreground">{url}</span>
                                    <Button onClick={() => handleRemoveDesktopUrl(i)} variant="ghost" size="icon" className="h-6 w-6 text-destructive hover:bg-destructive/15">
                                        &times;
                                    </Button>
                                </div>
                            ))}
                            {desktopGallery.length === 0 && (
                                <span className="text-xs text-muted-foreground/60 italic">No custom desktop screenshots added. Defaults will be shown.</span>
                            )}
                        </div>
                    </div>

                    {/* Mobile Gallery */}
                    <div className="space-y-4">
                        <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider block">Mobile Gallery Images</label>
                        <div className="flex gap-2">
                            <Input
                                value={newMobileUrl}
                                onChange={(e) => setNewMobileUrl(e.target.value)}
                                placeholder="Add mobile image URL"
                                className="bg-muted text-xs h-10 rounded-xl flex-1"
                            />
                            <Button onClick={handleAddMobileUrl} size="sm" className="rounded-xl h-10 px-4">Add</Button>
                        </div>
                        <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                            {mobileGallery.map((url, i) => (
                                <div key={i} className="flex items-center justify-between gap-3 bg-muted/40 border border-border/60 p-2 rounded-xl text-xs">
                                    <span className="truncate flex-1 text-muted-foreground">{url}</span>
                                    <Button onClick={() => handleRemoveMobileUrl(i)} variant="ghost" size="icon" className="h-6 w-6 text-destructive hover:bg-destructive/15">
                                        &times;
                                    </Button>
                                </div>
                            ))}
                            {mobileGallery.length === 0 && (
                                <span className="text-xs text-muted-foreground/60 italic">No custom mobile screenshots added. Defaults will be shown.</span>
                            )}
                        </div>
                    </div>
                </div>

                <div className="flex justify-end pt-4 border-t border-border">
                    <Button onClick={handleSaveSettings} disabled={updateSettings.isPending} className="gap-2 rounded-xl h-10 px-5">
                        {updateSettings.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                        Save Settings
                    </Button>
                </div>
            </div>

            <div className="bg-card/60 border border-border rounded-2xl p-5">
                <h3 className="text-sm font-bold uppercase tracking-wider text-foreground">Testimonials</h3>
                <p className="text-xs text-muted-foreground mt-1">
                    Testimonials are now managed in the Feedbacks tab: add your own, edit, or publish any user review directly to the landing page.
                </p>
            </div>
        </div>
    );
};

