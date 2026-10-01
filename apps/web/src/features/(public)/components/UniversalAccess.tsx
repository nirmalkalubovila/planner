import BackgroundVideo from "./BackgroundVideo";

/** A quiet band: the product video behind the large transparent LEGACY mark. No text, no cards. */
export default function UniversalAccess() {
  return (
    <section
      aria-hidden
      className="relative flex min-h-[38vh] w-full items-center justify-center overflow-hidden bg-black select-none sm:min-h-[52vh]"
    >
      <BackgroundVideo className="absolute inset-0 z-0 h-full w-full object-cover opacity-40" />

      {/* Fade to black at the top and bottom so the band blends into the sections around it */}
      <div className="pointer-events-none absolute inset-0 z-0 bg-gradient-to-b from-black via-black/40 to-black" />

      <div className="pointer-events-none relative z-10 select-none font-mono text-[20vw] font-black leading-none tracking-[0.1em] text-white opacity-[0.07]">
        LEGACY
      </div>
    </section>
  );
}
