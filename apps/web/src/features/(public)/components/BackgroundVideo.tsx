import { useEffect, useRef, useState } from "react";
import { Volume2, VolumeX } from "lucide-react";

// Local, web-optimised files in /public/videos: 720p, with the index at the front so playback starts at once.
export const HERO_VIDEO = {
  desktop: { src: "/videos/hero-desktop.mp4", poster: "/videos/hero-desktop-poster.jpg" },
  mobile: { src: "/videos/hero-mobile.mp4", poster: "/videos/hero-mobile-poster.jpg" },
};

/** True below the md breakpoint, so a phone only ever downloads the portrait file. */
export function useIsMobile() {
  const [isMobile, setIsMobile] = useState(false);
  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 768);
    check();
    window.addEventListener("resize", check);
    return () => window.removeEventListener("resize", check);
  }, []);
  return isMobile;
}

interface BackgroundVideoProps {
  className?: string;
  /** Sound is on by default, with a speaker button to mute. */
  withSound?: boolean;
}

/**
 * A looping background video. Without `withSound` it is silent. With it, sound is the default:
 *  1. it first tries to start with sound;
 *  2. browsers refuse that until the visitor interacts, so it starts muted and turns the sound on at the first
 *     click, tap or key press anywhere on the page;
 *  3. the speaker button mutes or unmutes at any time, and a visitor's own mute is respected from then on;
 *  4. it goes quiet while the video is out of view or the tab is hidden, and comes back when it returns.
 */
export default function BackgroundVideo({ className, withSound = false }: BackgroundVideoProps) {
  const isMobile = useIsMobile();
  const ref = useRef<HTMLVideoElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const [soundOn, setSoundOn] = useState(false);
  const userMuted = useRef(false); // the visitor chose silence
  const activated = useRef(false); // the visitor has interacted, so sound is allowed
  const source = isMobile ? HERO_VIDEO.mobile : HERO_VIDEO.desktop;

  const setAudible = async (on: boolean) => {
    const el = ref.current;
    if (!el) return false;
    el.muted = !on;
    if (on) {
      try {
        await el.play();
        el.volume = 1;
      } catch {
        el.muted = true;
        setSoundOn(false);
        return false;
      }
    }
    setSoundOn(on);
    return true;
  };

  // Start: with sound if the browser allows it, otherwise muted
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    el.muted = true;
    el.defaultMuted = true;
    setSoundOn(false);
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    (async () => {
      if (withSound && !userMuted.current && (await setAudible(true))) return;
      el.muted = true;
      el.play().catch(() => {
        /* blocked: the poster stays visible */
      });
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [source.src, withSound]);

  // The first interaction anywhere unlocks the sound
  useEffect(() => {
    if (!withSound) return;
    const unlock = async (e: Event) => {
      if (buttonRef.current?.contains(e.target as Node)) return; // the button decides for itself
      if (userMuted.current || !ref.current?.muted) {
        remove();
        return;
      }
      // Only stop listening once the sound really started; a refused attempt waits for the next interaction
      if (await setAudible(true)) {
        activated.current = true;
        remove();
      }
    };
    const events: (keyof DocumentEventMap)[] = ["pointerdown", "keydown", "touchend"];
    const remove = () => events.forEach((t) => document.removeEventListener(t, unlock));
    events.forEach((t) => document.addEventListener(t, unlock));
    return remove;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [withSound, source.src]);

  // Quiet while out of view or in a background tab, back when it returns
  useEffect(() => {
    const el = ref.current;
    if (!el || !withSound) return;
    const quiet = () => {
      el.muted = true;
      setSoundOn(false);
    };
    const resume = () => {
      if (activated.current && !userMuted.current) void setAudible(true);
    };
    const observer = new IntersectionObserver(([entry]) => (entry.isIntersecting ? resume() : quiet()), { threshold: 0.2 });
    observer.observe(el);
    const onVisibility = () => (document.hidden ? quiet() : resume());
    document.addEventListener("visibilitychange", onVisibility);
    return () => {
      observer.disconnect();
      document.removeEventListener("visibilitychange", onVisibility);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [withSound, source.src]);

  const toggle = async () => {
    activated.current = true;
    if (soundOn) {
      userMuted.current = true;
      await setAudible(false);
    } else {
      userMuted.current = false;
      await setAudible(true);
    }
  };

  return (
    <>
      <video
        key={source.src}
        ref={ref}
        autoPlay
        loop
        muted
        playsInline
        preload="auto"
        poster={source.poster}
        aria-hidden
        className={className}
      >
        <source src={source.src} type="video/mp4" />
      </video>

      {withSound && (
        <button
          ref={buttonRef}
          type="button"
          onClick={toggle}
          aria-label={soundOn ? "Mute video" : "Turn video sound on"}
          aria-pressed={soundOn}
          className="absolute top-24 right-3 sm:top-28 sm:right-7 z-20 flex h-11 w-11 items-center justify-center text-white/55 drop-shadow-[0_1px_2px_rgba(0,0,0,0.6)] transition-colors hover:text-white/90 focus-visible:outline-none focus-visible:text-white/90 cursor-pointer"
        >
          {soundOn ? <Volume2 size={16} strokeWidth={1.75} /> : <VolumeX size={16} strokeWidth={1.75} />}
        </button>
      )}
    </>
  );
}
