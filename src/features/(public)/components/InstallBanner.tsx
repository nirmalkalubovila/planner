import { useInstallPrompt } from "../hooks/useInstallPrompt";

export default function InstallBanner() {
  const { isInstallable, isInstalled, triggerInstall, browser } =
    useInstallPrompt();

  if (isInstalled) return null;

  return (
    <section className="py-6 px-5 sm:px-8 bg-black">
      <div className="w-full">
        <span className="text-[10px] font-bold tracking-[0.25em] text-zinc-500 uppercase">
          Use as a Native App
        </span>

        <h2 className="mt-2 text-2xl sm:text-3xl font-extrabold text-white tracking-tight leading-none mb-2">
          Install on your phone.
          {" "}
          <span className="text-zinc-500">No App Store needed.</span>
        </h2>

        <p className="text-xs text-zinc-400 leading-relaxed mb-4 max-w-lg">
          Legacy Life Builder works as a Progressive Web App (PWA). Install it
          directly from your browser — it feels exactly like a native app with
          offline support, home screen icon, and full-screen experience.
        </p>

        {/* Install instructions by browser */}
        {browser === "safari" && (
          <div className="mb-4 bg-zinc-950/60 border border-zinc-900 rounded-xl p-4">
            <p className="text-xs font-bold text-white mb-2">
              Install on iPhone / iPad (Safari)
            </p>
            <ol className="space-y-1.5">
              {[
                'Tap the Share button at the bottom of Safari',
                'Scroll down and tap "Add to Home Screen"',
                'Tap "Add" in the top right corner',
                "Done — open it from your home screen",
              ].map((step, i) => (
                <li key={i} className="flex gap-3 text-xs text-zinc-400">
                  <span className="text-zinc-600 font-mono font-bold">{i + 1}.</span>
                  {step}
                </li>
              ))}
            </ol>
          </div>
        )}

        {browser === "chrome" && (
          <div className="mb-4 bg-zinc-950/60 border border-zinc-900 rounded-xl p-4">
            <p className="text-xs font-bold text-white mb-2">
              Install on Android / Desktop (Chrome)
            </p>
            <ol className="space-y-1.5">
              {[
                'Tap the three-dot menu in the top right of Chrome',
                'Tap "Add to Home screen" or "Install app"',
                "Confirm by tapping Install",
                "Find it on your home screen like any app",
              ].map((step, i) => (
                <li key={i} className="flex gap-3 text-xs text-zinc-400">
                  <span className="text-zinc-600 font-mono font-bold">{i + 1}.</span>
                  {step}
                </li>
              ))}
            </ol>
          </div>
        )}

        {/* One-click install button */}
        {isInstallable && (
          <button
            onClick={triggerInstall}
            className="inline-flex items-center justify-center bg-white text-black text-xs font-bold px-5 py-3 rounded-xl hover:bg-zinc-200 transition-all hover:scale-[1.02] active:scale-95 duration-200 shadow-xl shadow-white/5 mb-4"
          >
            Install App Now
          </button>
        )}

        {/* Why install — packed 6-col grid */}
        <div className="mt-3 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2">
          {[
            { title: "Works offline", desc: "No internet needed for daily use" },
            { title: "Home screen", desc: "One tap to open from your apps" },
            { title: "Full screen", desc: "No browser bars, just the full app" },
            { title: "Fast", desc: "Loads instantly every single time" },
            { title: "No App Store", desc: "Direct install, no approvals needed" },
            { title: "Always updated", desc: "Auto-updates like a standard site" },
          ].map((item) => (
            <div
              key={item.title}
              className="bg-zinc-950/40 hover:bg-zinc-900/30 border border-zinc-900/60 rounded-xl p-3 transition-all duration-200"
            >
              <p className="text-[11px] font-bold text-white">{item.title}</p>
              <p className="text-[10px] text-zinc-500 mt-0.5">{item.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
