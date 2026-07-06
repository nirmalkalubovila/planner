import { Mail, Linkedin, Instagram, ExternalLink, Code } from 'lucide-react';

export default function CreatorProfile() {

  return (
    <section id="creator-profile" className="bg-black py-12 px-5 sm:px-8 border-t border-zinc-900/40">
      {/* Section Header */}
      <div className="mb-10">
        <span className="text-[10px] font-bold tracking-[0.25em] text-zinc-500 uppercase">
          The Creator
        </span>
        <h2 className="mt-2 text-2xl sm:text-3xl font-extrabold text-white tracking-tight leading-none">
          Designed & Maintained <span className="text-zinc-500">by Nirmal Kalubovila</span>
        </h2>
      </div>

      {/* Main Grid Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-[320px_1fr] gap-10">
        
        {/* Left Column: Avatar & Socials */}
        <div className="flex flex-col items-center lg:items-start text-center lg:text-left space-y-6 lg:border-r lg:border-zinc-900/60 lg:pr-10">
          {/* Avatar with glow effect */}
          <div className="relative group">
            <div className="absolute -inset-0.5 bg-gradient-to-r from-zinc-800 to-zinc-700 rounded-2xl blur opacity-20 group-hover:opacity-40 transition duration-300"></div>
            <img 
              src="/Nirmal%20Kalubovila.jpeg" 
              alt="Nirmal Kalubovila" 
              className="relative w-40 h-40 rounded-2xl object-cover border border-zinc-800 shadow-xl shadow-black/40"
            />
          </div>

          <div className="space-y-2">
            <h3 className="text-xl font-bold tracking-tight text-white">Nirmal Kalubovila</h3>
            <p className="text-xs text-zinc-400 leading-relaxed font-medium">
              3rd year IT undergraduate, University of Moratuwa | Intern Full Stack Developer at Prologics IT Solutions | Content Creator
            </p>
          </div>

          {/* Social Links Grid */}
          <div className="w-full space-y-2.5 pt-2">
            <a 
              href="mailto:nirmalpriyankara.web@gmail.com"
              className="flex items-center gap-3 px-3.5 py-2.5 rounded-xl bg-zinc-900/20 hover:bg-zinc-900/50 border border-zinc-900/60 transition-colors text-xs text-zinc-400 hover:text-white font-medium group"
            >
              <Mail size={14} className="text-zinc-500 group-hover:text-white transition-colors" />
              <span className="truncate">nirmalpriyankara.web@gmail.com</span>
            </a>
            <a 
              href="https://www.linkedin.com/in/nirmal-kalubovila"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-3 px-3.5 py-2.5 rounded-xl bg-zinc-900/20 hover:bg-zinc-900/50 border border-zinc-900/60 transition-colors text-xs text-zinc-400 hover:text-white font-medium group"
            >
              <Linkedin size={14} className="text-zinc-500 group-hover:text-white transition-colors" />
              <span>LinkedIn Profile</span>
              <ExternalLink size={10} className="ml-auto opacity-30 group-hover:opacity-100 transition-opacity" />
            </a>
            <a 
              href="https://www.instagram.com/the_nirrmal"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-3 px-3.5 py-2.5 rounded-xl bg-zinc-900/20 hover:bg-zinc-900/50 border border-zinc-900/60 transition-colors text-xs text-zinc-400 hover:text-white font-medium group"
            >
              <Instagram size={14} className="text-zinc-500 group-hover:text-white transition-colors" />
              <span>Instagram</span>
              <ExternalLink size={10} className="ml-auto opacity-30 group-hover:opacity-100 transition-opacity" />
            </a>
          </div>
        </div>

        {/* Right Column: Mission, TikTok Highlight, and Embedded Video */}
        <div className="grid grid-cols-1 xl:grid-cols-[1fr_350px] gap-8">
          
          {/* Text Content Area */}
          <div className="flex flex-col h-full gap-6">
            {/* Story Card */}
            <div className="p-6 rounded-2xl bg-zinc-950/40 border border-zinc-900/80 space-y-4">
              <div className="flex items-center gap-2.5 text-xs font-bold text-white uppercase tracking-wider">
                <Code size={14} className="text-zinc-400" />
                Why I Built Legacy Life Builder
              </div>
              <p className="text-sm text-zinc-400 leading-relaxed font-medium">
                I built this to make our personal system 100% executable without doing so much planning. Because personally, I spend so much time planning rather than executing. I think most people have this same weakness, so I built this to remove it and make it more executable. Here, it mainly follows the personal system building template we discussed on my TikTok page. So join with me and let's build a legacy.
              </p>
            </div>

            {/* TikTok Featured Call-To-Action */}
            <div className="relative overflow-hidden rounded-2xl border border-indigo-500/20 bg-gradient-to-br from-indigo-950/20 via-zinc-950 to-zinc-900/20 p-6 sm:p-8 group flex-1 flex flex-col justify-between">
              <div className="absolute top-0 right-0 -mt-4 -mr-4 w-28 h-28 bg-indigo-500/5 rounded-full blur-xl group-hover:bg-indigo-500/10 transition-colors"></div>
              
              <div className="space-y-4 relative z-10 h-full flex flex-col justify-between">
                <div className="space-y-4">
                  <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-[10px] font-bold text-indigo-400 uppercase tracking-widest">
                    TikTok Tutorial & Community
                  </div>
                  
                  <h4 className="text-base sm:text-lg font-bold text-white leading-snug">
                    Follow me on TikTok to know how to build a legacy and exactly how to use this.
                  </h4>
                </div>
                
                <a 
                  href="https://tiktok.com/@nirmal_kalubovila"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2.5 px-6 py-3 rounded-xl bg-white hover:bg-zinc-200 text-black font-bold text-xs uppercase tracking-wider transition-all hover:scale-[1.01] active:scale-95 shadow-xl w-fit mt-4"
                >
                  <svg className="h-4 w-4 fill-current" viewBox="0 0 24 24" aria-hidden="true">
                    <path d="M12.525.02c1.31-.02 2.61-.01 3.91-.02.08 1.53.63 3.02 1.59 4.23.85.97 2 1.69 3.29 2.05v3.9c-1.39-.08-2.74-.63-3.83-1.5-.24-.18-.46-.38-.67-.58v5.52c0 3.26-1.87 6.17-4.8 7.37-2.6 1.07-5.63.76-7.97-.84-2.13-1.46-3.29-3.99-3.02-6.52.27-2.58 2-4.82 4.49-5.63 1.34-.44 2.8-.39 4.1.1v4c-.87-.36-1.85-.38-2.73-.04-1.28.48-2.12 1.8-2.03 3.17.1 1.48 1.33 2.7 2.82 2.69 1.49-.01 2.66-1.21 2.66-2.7V.02h.18z"/>
                  </svg>
                  Join Me on TikTok
                </a>
              </div>
            </div>
          </div>

          {/* TikTok Embed Video Area (using native iframe player for maximum reliability in React) */}
          <div className="flex justify-center w-full max-w-[350px] mx-auto xl:mx-0 bg-zinc-950 p-2.5 rounded-2xl border border-zinc-900 overflow-hidden h-full">
            <iframe 
              src="https://www.tiktok.com/embed/v2/7658674916375432469" 
              className="w-full h-[580px] rounded-2xl border-0 shadow-lg"
              allowFullScreen 
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
              title="TikTok Video Player"
            />
          </div>

        </div>
      </div>
    </section>
  );
}
