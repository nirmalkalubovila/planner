import React, { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Repeat } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { FeedbackForm } from '@/components/common/feedback-form';
import { useAuth } from '@/contexts/auth-context';
import { useGrantFeedbackConsent, useMyFeedbackStatus, useUserProfile } from '@llb/api';
import type { MilestoneStage } from '@/utils/milestone-engine';
import { markMilestoneAsCelebrated } from '@/utils/milestone-engine';

interface StageCelebrationModalProps {
  stage: MilestoneStage | null;
  isOpen: boolean;
  onClose: () => void;
  /** Downloads the personalised progress report. Locked until the user has sent feedback. */
  onDownloadReport?: (stage: MilestoneStage) => void;
  /** Makes a share image for social media. Unlocked together with the report. */
  onShareImage?: (stage: MilestoneStage) => void;
  isReplay?: boolean;
}

// One deeper line per stage, shown in place of a generic icon
const DEEP_TEXT: Record<number, string> = {
  1: 'Anyone can start. You proved you can return, and returning is where discipline begins.',
  2: 'The hard part is behind you. Action no longer needs a mood; it carries you now.',
  3: 'Thirty days ago this was a goal. Today it is who you are.',
  4: 'Systems beat motivation. You stopped hoping for results and started building them.',
  5: 'Ninety days of proof. The version of you who quits is no longer the one in charge.',
  6: 'Most people plan a life. You have been quietly executing one for half a year.',
  7: 'A full year, one day at a time. This is not a streak anymore. It is your legacy.',
};

const reportKey = (userId: string | undefined, stageId: string) => `llb_report_unlocked_${userId ?? 'anon'}_${stageId}`;

export const StageCelebrationModal: React.FC<StageCelebrationModalProps> = ({
  stage,
  isOpen,
  onClose,
  onDownloadReport,
  onShareImage,
  isReplay = false,
}) => {
  const { user } = useAuth();
  const { profile } = useUserProfile(user);
  const { data: myFeedback, isLoading: feedbackLoading } = useMyFeedbackStatus(!!user?.id);
  const grantConsent = useGrantFeedbackConsent();
  const [feedbackSubmitted, setFeedbackSubmitted] = useState(false);
  const [consentDismissed, setConsentDismissed] = useState(false);
  const [consentGiven, setConsentGiven] = useState(false);

  // The report stays locked until feedback has been sent for this stage (remembered per user and stage)
  useEffect(() => {
    if (!isOpen || !stage) return;
    try {
      setFeedbackSubmitted(localStorage.getItem(reportKey(user?.id, stage.id)) === '1');
      setConsentDismissed(localStorage.getItem(`llb_consent_dismissed_${user?.id}`) === '1');
    } catch {
      setFeedbackSubmitted(false);
    }
  }, [isOpen, stage, user?.id]);

  // Someone who already sent feedback never has to do it again to get their report
  const unlocked = feedbackSubmitted || !!myFeedback?.hasFeedback;
  const askConsent = !!myFeedback?.canAskConsent && !consentDismissed && !consentGiven && !grantConsent.isPending;

  const handleFeedbackSent = () => {
    setFeedbackSubmitted(true);
    if (!stage) return;
    try {
      localStorage.setItem(reportKey(user?.id, stage.id), '1');
    } catch {
      /* the unlock still applies for this session */
    }
  };

  const canvasRef = useRef<HTMLCanvasElement | null>(null);

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

          {/* Stage Subtitle & Title */}
          <div className="space-y-1 mt-8 sm:mt-6">
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

          {/* The deeper line for this stage, larger than the supporting copy */}
          <p
            className="mt-5 text-base sm:text-lg font-semibold leading-snug max-w-md mx-auto text-white"
            style={{ textShadow: `0 0 28px ${stage.accentColor}55` }}
          >
            {DEEP_TEXT[stage.stageNumber] ?? stage.description}
          </p>
          <p className="text-xs text-muted-foreground mt-3 leading-relaxed max-w-md mx-auto">
            {stage.description}
          </p>

          {/* First time: a short review. Already reviewed: straight to the report, with one calm ask if they never agreed to share it. */}
          {!unlocked && !feedbackLoading && (
            <div className="mt-6 pt-5 border-t border-white/10 text-left bg-white/[0.02] rounded-2xl p-4 sm:p-5 border border-white/10 space-y-3">
              <p className="text-[10px] font-black uppercase tracking-wider text-muted-foreground">Your report is ready. How is Legacy Life Builder working for you?</p>
              <FeedbackForm
                compact
                defaultConsent
                defaultSubject={`Stage ${stage.stageNumber} Review: ${stage.title}`}
                onSubmitted={handleFeedbackSent}
              />
            </div>
          )}

          {unlocked && askConsent && (
            <div className="mt-6 text-left rounded-2xl border border-[#D2A226]/25 bg-[#D2A226]/[0.04] p-4 sm:p-5 space-y-3">
              <p className="text-sm font-bold text-white">Your story can push someone to start.</p>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Show your review on our landing page with your name, role and photo? You can ask us to remove it any time.
              </p>
              <div className="flex gap-2">
                <Button
                  onClick={async () => {
                    await grantConsent.mutateAsync({
                      name: profile?.fullName ?? '',
                      position: profile?.currentProfession ?? '',
                      avatarUrl: profile?.avatarUrl,
                    });
                    setConsentGiven(true);
                  }}
                  disabled={grantConsent.isPending}
                  className="h-9 rounded-xl px-4 text-xs font-bold bg-[#D2A226] text-black hover:bg-[#e9c468]"
                >
                  Share my review
                </Button>
                <Button
                  variant="ghost"
                  onClick={() => {
                    setConsentDismissed(true);
                    try { localStorage.setItem(`llb_consent_dismissed_${user?.id}`, '1'); } catch { /* per session then */ }
                  }}
                  className="h-9 rounded-xl px-4 text-xs text-muted-foreground"
                >
                  Keep it private
                </Button>
              </div>
            </div>
          )}

          {/* Personalised day-by-day report: locked until feedback is sent */}
          {onDownloadReport && (
            <div className="mt-5 space-y-2">
              <Button
                onClick={() => onDownloadReport(stage)}
                disabled={!unlocked}
                className={cn(
                  'w-full h-11 rounded-2xl font-black uppercase tracking-wider text-xs shadow-xl',
                  unlocked
                    ? 'llb-btn llb-btn-auto bg-[#D2A226] text-black hover:bg-[#e9c468]'
                    : 'bg-white/5 text-muted-foreground border border-white/10 disabled:opacity-100'
                )}
              >
                {unlocked ? 'Download Your Full Report (PDF)' : 'Full Report Locked'}
              </Button>
              {unlocked && onShareImage && (
                <Button
                  variant="outline"
                  onClick={() => onShareImage(stage)}
                  className="w-full h-11 rounded-2xl font-black uppercase tracking-wider text-xs border-[#D2A226]/40 text-[#e9c468] hover:bg-[#D2A226]/10"
                >
                  Share Image For Social Media
                </Button>
              )}
              {!unlocked && (
                <p className="text-[11px] text-muted-foreground text-center">Send your feedback above to unlock it.</p>
              )}
            </div>
          )}
        </motion.div>
      </div>
    </AnimatePresence>,
    document.body
  );
};
