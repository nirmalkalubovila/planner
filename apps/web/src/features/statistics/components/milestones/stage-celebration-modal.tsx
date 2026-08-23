import React, { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Trophy, 
  Sparkles, 
  Flame, 
  Zap, 
  Award, 
  Crown, 
  Shield, 
  Star, 
  Share2, 
  X, 
  Send, 
  CheckCircle2,
  Repeat
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { useSubmitFeedback } from '@llb/api';
import { useAuth } from '@/contexts/auth-context';
import { useUserProfile } from '@llb/api';
import type { MilestoneStage } from '@/utils/milestone-engine';
import { markMilestoneAsCelebrated } from '@/utils/milestone-engine';

interface StageCelebrationModalProps {
  stage: MilestoneStage | null;
  isOpen: boolean;
  onClose: () => void;
  onShare?: (stage: MilestoneStage) => void;
  isReplay?: boolean;
}

const ICON_MAP = {
  sparkles: Sparkles,
  flame: Flame,
  zap: Zap,
  award: Award,
  trophy: Trophy,
  shield: Shield,
  crown: Crown,
};

export const StageCelebrationModal: React.FC<StageCelebrationModalProps> = ({
  stage,
  isOpen,
  onClose,
  onShare,
  isReplay = false,
}) => {
  const { user } = useAuth();
  const { profile } = useUserProfile(user);
  const submitFeedback = useSubmitFeedback();

  const [rating, setRating] = useState<number>(5);
  const [hoverRating, setHoverRating] = useState<number | null>(null);
  const [feedbackMessage, setFeedbackMessage] = useState('');
  const [feedbackSubmitted, setFeedbackSubmitted] = useState(false);
  const [authorName, setAuthorName] = useState('');
  const [authorPosition, setAuthorPosition] = useState('');
  const [consentToShow, setConsentToShow] = useState(true);

  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    if (profile) {
      setAuthorName(profile.fullName || '');
      setAuthorPosition(profile.currentProfession || '');
    }
  }, [profile?.fullName, profile?.currentProfession]);

  // Lock body scroll when modal is active
  useEffect(() => {
    if (isOpen) {
      const originalOverflow = document.body.style.overflow;
      document.body.style.overflow = 'hidden';
      return () => {
        document.body.style.overflow = originalOverflow;
      };
    }
  }, [isOpen]);

  // Mark as celebrated in local storage
  useEffect(() => {
    if (isOpen && stage && user?.id && !isReplay) {
      markMilestoneAsCelebrated(user.id, stage.id);
    }
  }, [isOpen, stage, user?.id, isReplay]);

  // Gold & Amber celebratory particle shower on canvas
  useEffect(() => {
    if (!isOpen || !canvasRef.current) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animId: number;
    let width = (canvas.width = canvas.parentElement?.clientWidth || window.innerWidth);
    let height = (canvas.height = canvas.parentElement?.clientHeight || window.innerHeight);

    const handleResize = () => {
      if (canvas && canvas.parentElement) {
        width = canvas.width = canvas.parentElement.clientWidth;
        height = canvas.height = canvas.parentElement.clientHeight;
      }
    };
    window.addEventListener('resize', handleResize);

    // Generate sleek LLB stage-colored + gold/amber/white particles
    const stageColor = stage?.accentColor || '#F59E0B';
    const stagePalette = [stageColor, '#FBBF24', '#FFFFFF', '#FEF3C7', stageColor];
    const particleCount = 65;
    const particles = Array.from({ length: particleCount }).map(() => ({
      x: Math.random() * width,
      y: Math.random() * height * 0.4,
      vx: (Math.random() - 0.5) * 2.5,
      vy: Math.random() * 2 + 1,
      size: Math.random() * 3.5 + 1.5,
      color: stagePalette[Math.floor(Math.random() * stagePalette.length)],
      alpha: Math.random() * 0.8 + 0.2,
      decay: Math.random() * 0.005 + 0.002,
      rotation: Math.random() * Math.PI * 2,
      rotSpeed: (Math.random() - 0.5) * 0.05,
    }));

    const render = () => {
      ctx.clearRect(0, 0, width, height);

      particles.forEach((p) => {
        p.x += p.vx;
        p.y += p.vy;
        p.rotation += p.rotSpeed;
        p.alpha -= p.decay;

        if (p.alpha <= 0 || p.y > height) {
          p.x = Math.random() * width;
          p.y = -10;
          p.alpha = Math.random() * 0.8 + 0.2;
          p.vy = Math.random() * 2 + 1;
        }

        ctx.save();
        ctx.translate(p.x, p.y);
        ctx.rotate(p.rotation);
        ctx.fillStyle = p.color;
        ctx.globalAlpha = Math.max(0, p.alpha);
        ctx.fillRect(-p.size / 2, -p.size / 2, p.size, p.size);
        ctx.restore();
      });

      animId = requestAnimationFrame(render);
    };

    render();

    return () => {
      window.removeEventListener('resize', handleResize);
      cancelAnimationFrame(animId);
    };
  }, [isOpen]);

  if (!isOpen || !stage) return null;

  const StageIcon = ICON_MAP[stage.iconName] || Trophy;

  const handleFeedbackSubmit = async () => {
    if (!user) return;
    try {
      await submitFeedback.mutateAsync({
        category: 'About Legacy Life Builder',
        subject: `Stage ${stage.stageNumber} Customer Review: ${stage.title}`,
        message: feedbackMessage.trim() || `User achieved ${stage.title} (${stage.days}-day consistent streak).`,
        rating: rating,
        author_name: consentToShow && authorName.trim() ? authorName.trim() : null,
        author_position: consentToShow && authorPosition.trim() ? authorPosition.trim() : null,
        consent_to_show: consentToShow,
      });
      setFeedbackSubmitted(true);
    } catch {
      // Handled by mutation error
    }
  };

  return createPortal(
    <AnimatePresence>
      <div className="fixed inset-0 z-[99999] flex items-center justify-center p-3 sm:p-4 md:p-6 overflow-y-auto bg-black/90 backdrop-blur-xl animate-in fade-in duration-300">
        {/* Particle Canvas on Top of Card */}
        <canvas
          ref={canvasRef}
          className="absolute inset-0 pointer-events-none z-30 w-full h-full"
        />

        {/* Modal Container */}
        <motion.div
          initial={{ opacity: 0, scale: 0.9, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.9, y: 20 }}
          transition={{ duration: 0.4, ease: [0.23, 1, 0.32, 1] }}
          className={cn(
            'relative w-full max-w-lg max-h-[92vh] overflow-y-auto rounded-3xl z-20 my-auto',
            'bg-[#0b0e14] border border-white/10 shadow-2xl p-5 sm:p-7 text-center'
          )}
        >
          {/* Close Button */}
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-2 rounded-full text-muted-foreground hover:text-foreground hover:bg-white/5 transition-colors z-40"
          >
            <X size={18} />
          </button>

          {/* Replay Indicator if in replay mode */}
          {isReplay && (
            <div className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-white/5 border border-white/10 text-[9px] uppercase tracking-widest font-black text-muted-foreground mb-3">
              <Repeat size={10} /> Milestone Replay
            </div>
          )}

          {/* Glowing Stage Badge */}
          <div className="relative mx-auto my-2 flex items-center justify-center">
            <div 
              className="absolute w-24 h-24 sm:w-28 sm:h-28 rounded-full blur-2xl opacity-30 pointer-events-none"
              style={{ backgroundColor: stage.accentColor }}
            />
            <div 
              className="relative w-16 h-16 sm:w-20 sm:h-20 rounded-2xl flex items-center justify-center border border-white/20 shadow-xl"
              style={{
                background: `radial-gradient(circle at top, ${stage.accentColor}33, #0b0e14)`,
                boxShadow: `0 0 30px ${stage.accentColor}25`,
              }}
            >
              <StageIcon size={32} className="text-white drop-shadow-md" />
            </div>
          </div>

          {/* Stage Subtitle & Title */}
          <div className="space-y-1 mt-3">
            <span 
              className="text-[10px] sm:text-xs font-black uppercase tracking-[0.25em]"
              style={{ color: stage.accentColor }}
            >
              Stage {stage.stageNumber} Achieved
            </span>
            <h2 className="text-xl sm:text-2xl md:text-3xl font-black tracking-tight text-white uppercase">
              {stage.title}
            </h2>
            <p className="text-xs sm:text-sm font-bold text-white/80">
              {stage.subtitle}
            </p>
          </div>

          {/* Inspiring Milestone Message */}
          <p className="text-xs sm:text-sm text-muted-foreground mt-3 leading-relaxed max-w-md mx-auto">
            {stage.description}
          </p>

          {/* Interactive 5-Star Rating & Customer Feedback Collection (Google Search / Evidence) */}
          <div className="mt-6 pt-5 border-t border-white/10 text-left bg-white/[0.02] rounded-2xl p-4 sm:p-5 border border-white/10 space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div>
                <p className="text-[10px] font-black uppercase tracking-wider text-muted-foreground">
                  Verified User Review
                </p>
                <p className="text-sm font-bold text-foreground">
                  Rate your journey with Legacy Life Builder
                </p>
              </div>

              {/* Star Selector */}
              <div className="flex items-center gap-1">
                {[1, 2, 3, 4, 5].map((starValue) => {
                  const isFilled = (hoverRating ?? rating) >= starValue;
                  return (
                    <button
                      key={starValue}
                      type="button"
                      onClick={() => setRating(starValue)}
                      onMouseEnter={() => setHoverRating(starValue)}
                      onMouseLeave={() => setHoverRating(null)}
                      className="p-1 rounded-lg hover:scale-110 transition-transform focus:outline-none"
                    >
                      <Star
                        size={20}
                        className={cn(
                          'transition-colors',
                          isFilled
                            ? 'text-amber-400 fill-amber-400 drop-shadow-[0_0_8px_rgba(251,191,36,0.5)]'
                            : 'text-muted-foreground/40'
                        )}
                      />
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Feedback message input & consent */}
            {!feedbackSubmitted ? (
              <div className="space-y-2.5">
                <textarea
                  value={feedbackMessage}
                  onChange={(e) => setFeedbackMessage(e.target.value)}
                  placeholder="Share your experience, results achieved, or feedback on your journey..."
                  rows={2}
                  className="w-full text-xs bg-background/50 border border-white/10 rounded-xl p-3 text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:border-primary transition-colors resize-none"
                />

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  <input
                    type="text"
                    value={authorName}
                    onChange={(e) => setAuthorName(e.target.value)}
                    placeholder="Your Name (Optional)"
                    className="w-full text-xs bg-background/50 border border-white/10 rounded-xl px-3 py-2 text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:border-primary transition-colors"
                  />
                  <input
                    type="text"
                    value={authorPosition}
                    onChange={(e) => setAuthorPosition(e.target.value)}
                    placeholder="Job Role / Title (Optional)"
                    className="w-full text-xs bg-background/50 border border-white/10 rounded-xl px-3 py-2 text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:border-primary transition-colors"
                  />
                </div>

                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-[11px] pt-1">
                  <label className="flex items-center gap-2 text-muted-foreground cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={consentToShow}
                      onChange={(e) => setConsentToShow(e.target.checked)}
                      className="rounded border-white/20 bg-background/50 text-primary focus:ring-0 shrink-0"
                    />
                    <span>Allow my review, name, and job role to be displayed publicly</span>
                  </label>

                  <Button
                    size="sm"
                    onClick={handleFeedbackSubmit}
                    disabled={submitFeedback.isPending}
                    className="w-full sm:w-auto h-8 px-4 text-xs font-black uppercase tracking-wider rounded-xl bg-primary text-primary-foreground hover:bg-primary/90 shrink-0"
                  >
                    {submitFeedback.isPending ? 'Submitting...' : (
                      <span className="flex items-center gap-1.5">
                        <Send size={11} /> Submit Review
                      </span>
                    )}
                  </Button>
                </div>
              </div>
            ) : (
              <div className="flex items-center gap-2 p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-bold">
                <CheckCircle2 size={15} />
                <span>Thank you! Your verified review has been submitted.</span>
              </div>
            )}
          </div>

          {/* Action Button */}
          {onShare && (
            <div className="mt-5">
              <Button
                onClick={() => onShare(stage)}
                className="w-full h-11 rounded-2xl font-black uppercase tracking-wider text-xs flex items-center justify-center gap-2 bg-white text-black hover:bg-white/90 shadow-xl transition-all hover:scale-[1.01] active:scale-[0.99]"
              >
                <Share2 size={14} /> Add to Social Media Profile
              </Button>
            </div>
          )}
        </motion.div>
      </div>
    </AnimatePresence>,
    document.body
  );
};
