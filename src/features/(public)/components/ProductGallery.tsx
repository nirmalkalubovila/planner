import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronLeft, ChevronRight, Monitor, Smartphone } from 'lucide-react';

interface ProductGalleryProps {
  desktopImages: string[];
  mobileImages: string[];
}

const DEFAULT_DESKTOP = [
  "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?q=80&w=1200&auto=format&fit=crop", // Elegant UI layout
  "https://images.unsplash.com/photo-1507238691740-187a5b1d37b8?q=80&w=1200&auto=format&fit=crop", // Design elements
  "https://images.unsplash.com/photo-1531403009284-440f080d1e12?q=80&w=1200&auto=format&fit=crop"  // Dashboard mockup
];

const DEFAULT_MOBILE = [
  "https://images.unsplash.com/photo-1555774698-0b77e0d5fac6?q=80&w=600&auto=format&fit=crop", // Mobile phone interface mockup
  "https://images.unsplash.com/photo-1512941937669-90a1b58e7e9c?q=80&w=600&auto=format&fit=crop"  // Mobile screen preview
];

export const ProductGallery: React.FC<ProductGalleryProps> = ({ desktopImages, mobileImages }) => {
  const [viewMode, setViewMode] = useState<'desktop' | 'mobile'>('desktop');
  const [currentIndex, setCurrentIndex] = useState(0);

  const images = viewMode === 'desktop' 
    ? (desktopImages && desktopImages.length > 0 ? desktopImages : DEFAULT_DESKTOP)
    : (mobileImages && mobileImages.length > 0 ? mobileImages : DEFAULT_MOBILE);

  const handleNext = () => {
    setCurrentIndex((prev) => (prev + 1) % images.length);
  };

  const handlePrev = () => {
    setCurrentIndex((prev) => (prev - 1 + images.length) % images.length);
  };

  return (
    <section id="gallery" className="py-6 px-5 sm:px-8 bg-zinc-950 overflow-hidden select-none">
      <div className="w-full">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-4 gap-3">
          <div>
            <span className="text-[10px] font-bold tracking-[0.25em] text-zinc-500 uppercase">
              Product Walkthrough
            </span>
            <h2 className="mt-2 text-2xl sm:text-3xl font-extrabold text-white tracking-tight leading-[1.1]">
              Explore the interface.
              {" "}
              <span className="bg-gradient-to-r from-zinc-500 via-zinc-400 to-zinc-300 bg-clip-text text-transparent">
                Designed for absolute focus.
              </span>
            </h2>
          </div>

          {/* Toggle buttons */}
          <div className="flex bg-zinc-900/80 p-1 rounded-xl border border-zinc-800/80 w-fit self-start md:self-auto shadow-inner">
            <button
              onClick={() => { setViewMode('desktop'); setCurrentIndex(0); }}
              className={`flex items-center gap-2 px-4.5 py-2.5 rounded-lg text-xs font-bold transition-all duration-300 cursor-pointer ${
                viewMode === 'desktop'
                  ? 'bg-white text-black shadow-md'
                  : 'text-zinc-400 hover:text-white'
              }`}
            >
              <Monitor size={14} />
              Desktop View
            </button>
            <button
              onClick={() => { setViewMode('mobile'); setCurrentIndex(0); }}
              className={`flex items-center gap-2 px-4.5 py-2.5 rounded-lg text-xs font-bold transition-all duration-300 cursor-pointer ${
                viewMode === 'mobile'
                  ? 'bg-white text-black shadow-md'
                  : 'text-zinc-400 hover:text-white'
              }`}
            >
              <Smartphone size={14} />
              Mobile View
            </button>
          </div>
        </div>

        {/* Gallery Showcase */}
        <div className="relative flex justify-center items-center w-full">
          {/* Main Frame */}
          <div 
            className={`relative w-full bg-zinc-900/10 border border-zinc-900/60 rounded-3xl overflow-hidden backdrop-blur-sm shadow-2xl transition-all duration-500 flex flex-col justify-end ${
              viewMode === 'mobile' ? 'max-w-[375px] aspect-[375/667] p-0' : 'max-w-[1100px] aspect-[16/10] p-4 sm:p-5'
            }`}
          >
            {/* Device mock header */}
            {viewMode === 'desktop' ? (
              <div className="flex items-center gap-1.5 pb-4 px-2 border-b border-zinc-900/60 mb-4 w-full">
                <div className="w-2.5 h-2.5 rounded-full bg-zinc-800" />
                <div className="w-2.5 h-2.5 rounded-full bg-zinc-800" />
                <div className="w-2.5 h-2.5 rounded-full bg-zinc-800" />
                <div className="ml-3 text-[10px] text-zinc-600 font-mono select-none">
                  app.legacylifebuilder.xyz/today
                </div>
              </div>
            ) : (
              <div className="absolute top-3 left-1/2 -translate-x-1/2 w-32 h-4.5 bg-black rounded-full z-20 flex items-center justify-center">
                <div className="w-12 h-1 bg-zinc-900 rounded-full" />
              </div>
            )}

            {/* Image Slider */}
            <div className={`relative w-full h-full overflow-hidden bg-black/50 flex-1 ${viewMode === 'mobile' ? 'rounded-none' : 'rounded-2xl'}`}>
              <AnimatePresence mode="wait">
                <motion.img
                  key={images[currentIndex] + currentIndex}
                  src={images[currentIndex]}
                  alt={`${viewMode} interface preview ${currentIndex + 1}`}
                  initial={{ opacity: 0, scale: 0.98 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 1.02 }}
                  transition={{ duration: 0.35, ease: "easeInOut" }}
                  className="w-full h-full object-cover select-none pointer-events-none"
                />
              </AnimatePresence>

              {/* Slider overlay gradients */}
              <div className="absolute inset-0 bg-gradient-to-t from-black/30 via-transparent to-transparent pointer-events-none" />

              {/* Controls */}
              {images.length > 1 && (
                <>
                  <button
                    onClick={handlePrev}
                    className="absolute left-4 top-1/2 -translate-y-1/2 h-10 w-10 rounded-full bg-black/60 hover:bg-black/90 border border-zinc-800/80 text-white flex items-center justify-center transition-all hover:scale-105 active:scale-95 cursor-pointer z-10"
                  >
                    <ChevronLeft size={18} />
                  </button>
                  <button
                    onClick={handleNext}
                    className="absolute right-4 top-1/2 -translate-y-1/2 h-10 w-10 rounded-full bg-black/60 hover:bg-black/90 border border-zinc-800/80 text-white flex items-center justify-center transition-all hover:scale-105 active:scale-95 cursor-pointer z-10"
                  >
                    <ChevronRight size={18} />
                  </button>
                </>
              )}

              {/* Dot Indicators */}
              <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-1.5 z-10">
                {images.map((_, i) => (
                  <button
                    key={i}
                    onClick={() => setCurrentIndex(i)}
                    className={`h-1.5 rounded-full transition-all duration-300 cursor-pointer ${
                      i === currentIndex ? 'w-5 bg-white' : 'w-1.5 bg-white/35 hover:bg-white/60'
                    }`}
                  />
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default ProductGallery;
