import React from 'react';
import { 
  Mail, Linkedin, Instagram, MessageSquare, ExternalLink, Info, Code 
} from 'lucide-react';
import { useLatestUpdate } from '@/hooks/use-latest-update';

export const AppUpdaterSimulator: React.FC = () => {
  const { data: latestUpdate } = useLatestUpdate();
  const rawVersion = latestUpdate?.version || '1.1.3';
  const currentVersion = rawVersion.toLowerCase().startsWith('v') ? rawVersion : `v${rawVersion}`;

  return (
    <div className="w-full space-y-6 animate-in fade-in duration-200">
      {/* Outer Card */}
      <div className="rounded-2xl border border-border bg-card overflow-hidden w-full">
        {/* Header */}
        <div className="px-5 py-4 border-b border-border bg-muted/30">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-center">
              <Info size={16} className="text-primary" />
            </div>
            <div>
              <h3 className="text-xs font-bold uppercase tracking-widest text-foreground">Info</h3>
              <p className="text-[10px] text-muted-foreground mt-0.5">
                About the planner, creator details, and vision.
              </p>
            </div>
          </div>
        </div>

        {/* Content Area */}
        <div className="p-6 grid grid-cols-1 md:grid-cols-[300px_1fr] gap-8">
          
          {/* Left Column: Profile Card */}
          <div className="flex flex-col items-center text-center space-y-4 md:border-r md:border-border md:pr-8 md:items-start md:text-left">
            {/* Avatar with beautiful gradient border */}
            <div className="relative group">
              <div className="absolute -inset-0.5 bg-gradient-to-r from-primary to-indigo-500 rounded-2xl blur opacity-30 group-hover:opacity-50 transition duration-300"></div>
              <img 
                src="/Nirmal%20Kalubovila.jpeg" 
                alt="Nirmal Kalubovila" 
                className="relative w-36 h-36 rounded-2xl object-cover border border-border shadow-lg"
              />
            </div>

            <div className="space-y-1">
              <h4 className="text-lg font-black tracking-wide text-foreground">Nirmal Kalubovila</h4>
              <p className="text-xs font-semibold text-muted-foreground leading-relaxed">
                3rd year IT undergraduate, University of Moratuwa | Intern Full Stack Developer at Prologics IT Solutions | Content Creator
              </p>
            </div>

            {/* Social Links List */}
            <div className="w-full space-y-2 pt-2">
              <a 
                href="mailto:nirmalpriyankara.web@gmail.com"
                className="flex items-center gap-3 px-3 py-2 rounded-xl bg-muted/20 hover:bg-muted/40 border border-border/60 transition-colors text-xs text-muted-foreground hover:text-foreground font-medium group"
              >
                <Mail size={14} className="text-primary group-hover:scale-110 transition-transform" />
                <span className="truncate">nirmalpriyankara.web@gmail.com</span>
              </a>
              <a 
                href="https://www.linkedin.com/in/nirmal-kalubovila"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-3 px-3 py-2 rounded-xl bg-muted/20 hover:bg-muted/40 border border-border/60 transition-colors text-xs text-muted-foreground hover:text-foreground font-medium group"
              >
                <Linkedin size={14} className="text-primary group-hover:scale-110 transition-transform" />
                <span>LinkedIn Profile</span>
                <ExternalLink size={10} className="ml-auto opacity-40 group-hover:opacity-100 transition-opacity" />
              </a>
              <a 
                href="https://www.instagram.com/the_nirrmal"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-3 px-3 py-2 rounded-xl bg-muted/20 hover:bg-muted/40 border border-border/60 transition-colors text-xs text-muted-foreground hover:text-foreground font-medium group"
              >
                <Instagram size={14} className="text-primary group-hover:scale-110 transition-transform" />
                <span>Instagram</span>
                <ExternalLink size={10} className="ml-auto opacity-40 group-hover:opacity-100 transition-opacity" />
              </a>
              <a 
                href="https://wa.me/qr/4GTB5HLNOGY7N1"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-3 px-3 py-2 rounded-xl bg-muted/20 hover:bg-muted/40 border border-border/60 transition-colors text-xs text-muted-foreground hover:text-foreground font-medium group"
              >
                <MessageSquare size={14} className="text-primary group-hover:scale-110 transition-transform" />
                <span>WhatsApp Contact</span>
                <ExternalLink size={10} className="ml-auto opacity-40 group-hover:opacity-100 transition-opacity" />
              </a>
            </div>

            {/* Version Badge at the bottom of the card */}
            <div className="w-full pt-4 border-t border-border flex items-center justify-between text-[10px] text-muted-foreground">
              <span>App Version</span>
              <span className="font-bold font-mono bg-muted px-2 py-0.5 rounded border border-border text-foreground">
                {currentVersion}
              </span>
            </div>
          </div>

          {/* Right Column: Mission and Tiktok Highlight */}
          <div className="space-y-6">
            
            {/* The Mission Card */}
            <div className="p-5 rounded-2xl bg-muted/10 border border-border/60 space-y-3">
              <div className="flex items-center gap-2 text-xs font-bold text-foreground uppercase tracking-wider">
                <Code size={14} className="text-primary" />
                Why I Built Legacy Life Builder
              </div>
              <p className="text-xs text-muted-foreground leading-relaxed font-medium">
                I built this to make our personal system 100% executable without doing so much planning. Because personally, I spend so much time planning rather than executing. I think most people have this same weakness, so I built this to remove it and make it more executable. Here, it mainly follows the personal system building template we discussed on my TikTok page. So join with me and let's build a legacy.
              </p>
            </div>

            {/* TikTok CTA - Heavily Highlighted */}
            <div className="relative overflow-hidden rounded-2xl border border-indigo-500/30 bg-gradient-to-br from-indigo-950/20 via-background to-primary/5 p-6 group">
              <div className="absolute top-0 right-0 -mt-4 -mr-4 w-24 h-24 bg-primary/10 rounded-full blur-xl group-hover:bg-primary/20 transition-colors"></div>
              
              <div className="space-y-4">
                <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-[10px] font-bold text-indigo-400 uppercase tracking-widest">
                  TikTok Tutorial & Community
                </div>
                
                <h4 className="text-sm font-bold text-foreground leading-snug">
                  Follow me on TikTok to know how to build a legacy and exactly how to use this.
                </h4>
                
                <a 
                  href="https://tiktok.com/@nirmal_kalubovila"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2.5 px-5 py-3 rounded-xl bg-foreground hover:bg-foreground/90 text-background font-bold text-xs uppercase tracking-wider transition-all hover:scale-[1.02] active:scale-95 shadow-lg shadow-black/10"
                >
                  <svg className="h-3.5 w-3.5 fill-current" viewBox="0 0 24 24" aria-hidden="true">
                    <path d="M12.525.02c1.31-.02 2.61-.01 3.91-.02.08 1.53.63 3.02 1.59 4.23.85.97 2 1.69 3.29 2.05v3.9c-1.39-.08-2.74-.63-3.83-1.5-.24-.18-.46-.38-.67-.58v5.52c0 3.26-1.87 6.17-4.8 7.37-2.6 1.07-5.63.76-7.97-.84-2.13-1.46-3.29-3.99-3.02-6.52.27-2.58 2-4.82 4.49-5.63 1.34-.44 2.8-.39 4.1.1v4c-.87-.36-1.85-.38-2.73-.04-1.28.48-2.12 1.8-2.03 3.17.1 1.48 1.33 2.7 2.82 2.69 1.49-.01 2.66-1.21 2.66-2.7V.02h.18z"/>
                  </svg>
                  Join Me on TikTok
                </a>
              </div>
            </div>

          </div>
        </div>
      </div>
    </div>
  );
};
