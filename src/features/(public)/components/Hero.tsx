import { Link } from "react-router-dom";

export default function Hero() {
  // CLOUDINARY VIDEO URLS - Swap these out for your uploaded clips later!
  const desktopVideoUrl = "https://res.cloudinary.com/demo/video/upload/q_auto,vc_h265/dog.mp4";
  const mobileVideoUrl = "https://res.cloudinary.com/demo/video/upload/q_auto,vc_h265/dog.mp4";

  return (
    <section className="relative min-h-screen flex flex-col justify-center px-4 pt-28 pb-20 bg-black overflow-hidden">
      {/* Dynamic Background Accents */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-[40%] -left-[20%] w-[80%] h-[80%] bg-zinc-900/40 rounded-full blur-[160px]" />
        <div className="absolute -bottom-[30%] -right-[10%] w-[60%] h-[60%] bg-zinc-900/30 rounded-full blur-[140px]" />
      </div>

      <div className="max-w-4xl mx-auto w-full relative z-10">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">

          {/* Headline and Copy (Left column on large screens) */}
          <div className="lg:col-span-7 flex flex-col justify-center text-left">


            {/* Headline */}
            <h1 className="text-4xl sm:text-6xl font-extrabold text-white tracking-tight leading-none mb-6">
              Stop planning.
              <br />
              <span className="bg-gradient-to-r from-zinc-400 via-zinc-200 to-white bg-clip-text text-transparent">
                Start building
              </span>
              <br />
              your legacy.
            </h1>

            {/* Sub-headline */}
            <p className="text-sm sm:text-base text-zinc-400 leading-relaxed mb-8 max-w-xl">
              Turn your 1-week to 10-year goals into a clear daily schedule with
              AI doing the heavy lifting in under 5 minutes. No more brain power
              lost on planning.
            </p>

            {/* CTA Buttons */}
            <div className="flex flex-col sm:flex-row gap-3 mb-8">
              <Link
                to="/login"
                className="inline-flex items-center justify-center bg-white text-black text-sm font-bold px-7 py-4 rounded-xl hover:bg-zinc-200 transition-all hover:scale-[1.02] active:scale-95 duration-200 shadow-xl shadow-white/5"
              >
                Start Building Free
              </Link>
              <a
                href="#how-it-works"
                className="inline-flex items-center justify-center border border-zinc-800 bg-zinc-950/30 text-zinc-300 text-sm font-semibold px-7 py-4 rounded-xl hover:bg-zinc-900 hover:border-zinc-700 transition-all hover:scale-[1.02] active:scale-95 duration-200"
              >
                See How It Works
              </a>
            </div>
          </div>

          {/* Interactive Demo Showcase (Right column on large screens) */}
          <div className="lg:col-span-5 w-full flex flex-col items-center justify-center">

            {/* 1. DESKTOP / TABLET VIDEO CONTAINER (Visible on MD and up) */}
            <div className="hidden md:block w-full max-w-md aspect-[16/10] bg-zinc-950/80 rounded-2xl border border-zinc-800/80 shadow-2xl p-2 relative group overflow-hidden">
              {/* Browser bar decoration */}
              <div className="flex items-center gap-1.5 pb-2 px-2 border-b border-zinc-900/60 mb-2">
                <div className="w-2.5 h-2.5 rounded-full bg-zinc-800" />
                <div className="w-2.5 h-2.5 rounded-full bg-zinc-800" />
                <div className="w-2.5 h-2.5 rounded-full bg-zinc-800" />
                <div className="ml-3 text-[10px] text-zinc-600 font-mono select-none">legacy-builder-desktop.mp4</div>
              </div>
              <div className="relative w-full h-[82%] rounded-lg overflow-hidden bg-black">
                <video
                  src={desktopVideoUrl}
                  autoPlay
                  loop
                  muted
                  playsInline
                  className="w-full h-full object-cover opacity-90 group-hover:opacity-100 transition-opacity duration-300"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent pointer-events-none" />
              </div>
            </div>

            {/* 2. MOBILE VIDEO CONTAINER (Phone Mockup - Visible on all screen sizes, smaller layout) */}
            <div className="w-60 aspect-[9/19] bg-zinc-950 rounded-[36px] border-[5px] border-zinc-800/90 shadow-2xl p-2.5 relative group overflow-hidden mt-6 lg:-mt-6 lg:ml-12 self-center">
              {/* iPhone style Notch/Dynamic Island */}
              <div className="absolute top-4 left-1/2 -translate-x-1/2 w-20 h-4 bg-zinc-800 rounded-full z-20 flex items-center justify-center">
                <div className="w-2 h-2 rounded-full bg-zinc-900 absolute right-4" />
              </div>

              <div className="relative w-full h-full rounded-[28px] overflow-hidden bg-black">
                <video
                  src={mobileVideoUrl}
                  autoPlay
                  loop
                  muted
                  playsInline
                  className="w-full h-full object-cover opacity-85 group-hover:opacity-100 transition-opacity duration-300"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/30 to-transparent pointer-events-none" />
              </div>
            </div>

          </div>

        </div>
      </div>
    </section>
  );
}
