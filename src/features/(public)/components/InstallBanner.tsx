import { useInstallPrompt } from "../hooks/useInstallPrompt";
import { Shield, Smartphone, Chrome, ExternalLink, Play, Zap, CheckCircle2 } from 'lucide-react';

export default function InstallBanner() {
  const { isInstallable, isInstalled, triggerInstall } =
    useInstallPrompt();

  if (isInstalled) return null;

  return (
    <section className="py-12 px-5 sm:px-8 bg-black border-t border-zinc-900 select-none">
      <div className="w-full space-y-12">
        
        {/* Header Block */}
        <div className="text-center md:text-left space-y-3">
          <span className="text-[10px] font-bold tracking-[0.25em] text-zinc-500 uppercase">
            Flexible Access Standard
          </span>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight leading-none">
            Two Ways to Build Your Legacy
          </h2>
          <p className="text-sm text-zinc-400 max-w-3xl leading-relaxed">
            You don’t need to download bulky files or risk your phone’s security to use the Legacy Life Builder. 
            Choose the experience that fits you best:
          </p>
        </div>

        {/* Options Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Option 1 */}
          <div className="bg-zinc-950/40 border border-zinc-900 rounded-2xl p-6 space-y-4 hover:border-zinc-800 transition-all duration-300">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-zinc-500">Option 1</span>
              <span className="text-[10px] font-bold bg-zinc-900 border border-zinc-800 text-zinc-300 px-2 py-0.5 rounded-full">No Install</span>
            </div>
            <h3 className="text-lg font-bold text-white">Use Instantly in Your Browser</h3>
            <p className="text-xs text-zinc-400 leading-relaxed">
              Just open the link and start executing. It works exactly like a premium website on any smartphone, 
              tablet, or laptop. No downloads, no storage space taken, and zero setup required.
            </p>
            <div className="pt-2">
              <span className="inline-flex items-center gap-1.5 text-xs text-zinc-400 font-medium bg-zinc-900/60 px-3 py-1.5 rounded-xl border border-zinc-900">
                <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" />
                Browser Ready
              </span>
            </div>
          </div>

          {/* Option 2 */}
          <div className="bg-zinc-950/40 border border-zinc-900 rounded-2xl p-6 space-y-4 hover:border-zinc-800 transition-all duration-300 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/5 rounded-full blur-3xl pointer-events-none" />
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-emerald-500">Option 2</span>
              <span className="text-[10px] font-bold bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 px-2 py-0.5 rounded-full">Highly Recommended</span>
            </div>
            <h3 className="text-lg font-bold text-white">Get the Full-Screen App Experience</h3>
            <p className="text-xs text-zinc-400 leading-relaxed">
              If you want a distraction-free environment without browser bars, you can save it directly to your phone's 
              home screen. It functions as a Progressive Web App (PWA)—the modern standard used by tech giants like 
              Twitter/X, Pinterest, and Starbucks.
            </p>
            
            <div className="pt-2 flex flex-wrap gap-2 items-center">
              {isInstallable && (
                <button
                  onClick={triggerInstall}
                  className="inline-flex items-center justify-center bg-white text-black text-xs font-bold px-4 py-2.5 rounded-xl hover:bg-zinc-200 transition-all hover:scale-[1.02] active:scale-95 duration-200 cursor-pointer"
                >
                  Install App Now
                </button>
              )}
              <span className="inline-flex items-center gap-1.5 text-xs text-zinc-400 font-medium bg-zinc-900/60 px-3 py-1.5 rounded-xl border border-zinc-900">
                <Zap className="h-3.5 w-3.5 text-amber-500" />
                Offline Ready
              </span>
            </div>
          </div>
        </div>

        {/* Security & Safety Block */}
        <div className="bg-zinc-950/60 border border-zinc-900 rounded-2xl p-6 sm:p-8 space-y-6 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-500/5 rounded-full blur-3xl pointer-events-none" />
          
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Shield className="h-5 w-5 text-emerald-400" />
              <h3 className="text-lg sm:text-xl font-extrabold text-white tracking-tight">
                100% Secure, Private, & App Store Safe
              </h3>
            </div>
            <p className="text-xs text-zinc-400 max-w-3xl leading-relaxed">
              It is completely natural to be cautious about adding software outside of the standard App Stores. 
              Here is exactly why the Legacy Life Builder is safer than standard native apps:
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 pt-2">
            {/* Guarantees */}
            {[
              {
                title: "Zero Dangerous APK Files",
                desc: "You are never downloading or installing an unverified background setup file (.apk or .ipa). You are simply placing a secure shortcut link on your screen."
              },
              {
                title: "Browser Sandbox Protection",
                desc: "Because the app runs through your secure web browser (Safari or Chrome), it is strictly blocked by your phone's operating system from accessing your photos, contacts, location, or background storage."
              },
              {
                title: "Bank-Level Encryption",
                desc: "The platform operates exclusively over a secure, verified HTTPS connection, meaning your data is encrypted and invisible to outsiders."
              },
              {
                title: "100% Private Data",
                desc: "Your daily schedules, legacy visions, and performance matrices are yours alone. We do not sell your personal data or track your behavior outside the app."
              }
            ].map((g, idx) => (
              <div key={idx} className="bg-zinc-900/40 border border-zinc-900 rounded-xl p-4 space-y-2 hover:border-zinc-800/80 transition duration-200">
                <p className="text-xs font-bold text-white">{g.title}</p>
                <p className="text-[11px] text-zinc-500 leading-relaxed">{g.desc}</p>
              </div>
            ))}
          </div>
        </div>

        {/* How to Add Block */}
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-zinc-900 pb-4">
            <h3 className="text-lg sm:text-xl font-bold text-white tracking-tight">
              How to Add to Your Screen <span className="text-zinc-500 font-normal">(In under 10 seconds)</span>
            </h3>
            <a
              href="https://www.youtube.com/watch?v=dQw4w9WgXcQ" /* Placeholder link that user can replace */
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-zinc-900 border border-zinc-800 text-zinc-400 hover:text-white hover:bg-zinc-800 text-xs font-medium transition cursor-pointer"
            >
              <Play className="h-3.5 w-3.5 fill-current" />
              <span>Watch Video Tutorial</span>
              <ExternalLink className="h-3.5 w-3.5" />
            </a>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* iOS */}
            <div className="bg-zinc-950/40 border border-zinc-900 rounded-2xl p-6 space-y-4">
              <div className="flex items-center gap-2">
                <Smartphone className="h-5 w-5 text-zinc-400" />
                <h4 className="text-xs font-bold text-white uppercase tracking-wider">For iPhone / iPad (Safari)</h4>
              </div>
              <ol className="space-y-3">
                {[
                  "Tap the Share icon at the bottom of Safari.",
                  'Scroll down and tap "Add to Home Screen."',
                  'Tap "Add" in the top right corner.',
                  "Done — open it directly alongside your regular apps."
                ].map((step, idx) => (
                  <li key={idx} className="flex gap-3 text-xs text-zinc-400 leading-relaxed">
                    <span className="text-zinc-600 font-mono font-bold">{idx + 1}.</span>
                    <span>{step}</span>
                  </li>
                ))}
              </ol>
            </div>

            {/* Android */}
            <div className="bg-zinc-950/40 border border-zinc-900 rounded-2xl p-6 space-y-4">
              <div className="flex items-center gap-2">
                <Chrome className="h-5 w-5 text-zinc-400" />
                <h4 className="text-xs font-bold text-white uppercase tracking-wider">For Android (Chrome / Brave)</h4>
              </div>
              <ol className="space-y-3">
                {[
                  "Tap the Three Dots (Menu) in the top right corner.",
                  'Tap "Install app" or "Add to home screen."',
                  "Confirm the prompt.",
                  "Done — a clean icon will appear instantly without touching the Play Store."
                ].map((step, idx) => (
                  <li key={idx} className="flex gap-3 text-xs text-zinc-400 leading-relaxed">
                    <span className="text-zinc-600 font-mono font-bold">{idx + 1}.</span>
                    <span>{step}</span>
                  </li>
                ))}
              </ol>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
