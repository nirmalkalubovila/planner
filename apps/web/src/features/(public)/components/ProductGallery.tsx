import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronLeft, ChevronRight } from 'lucide-react';

interface ProductGalleryProps {
  desktopImages: string[];
  /** Kept for the landing settings; the walkthrough shows the desktop screens only. */
  mobileImages?: string[];
}

const DEFAULT_DESKTOP = [
  "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?q=80&w=1600&auto=format&fit=crop",
  "https://images.unsplash.com/photo-1507238691740-187a5b1d37b8?q=80&w=1600&auto=format&fit=crop",
  "https://images.unsplash.com/photo-1531403009284-440f080d1e12?q=80&w=1600&auto=format&fit=crop",
];

/**
 * The product walkthrough: the real app screens at full width, one at a time. The screens are shown at their own
 * proportions with no frame or crop, so every detail is readable.
 */
export const ProductGallery: React.FC<ProductGalleryProps> = ({ desktopImages }) => {
  const images = desktopImages && desktopImages.length > 0 ? desktopImages : DEFAULT_DESKTOP;
  const [currentIndex, setCurrentIndex] = useState(0);

  const next = () => setCurrentIndex((i) => (i + 1) % images.length);
  const prev = () => setCurrentIndex((i) => (i - 1 + images.length) % images.length);

  return (
    <section id="gallery" className="py-12 sm:py-16 px-5 sm:px-8 bg-zinc-950 overflow-hidden select-none">
      <div className="w-full">
        <div className="mb-6">
          <span className="text-[10px] font-bold tracking-[0.25em] text-[#D2A226] uppercase">Product Walkthrough</span>
          <h2 className="mt-2 text-2xl sm:text-4xl font-extrabold text-white tracking-tight leading-[1.1]">
            Explore the interface.{" "}
            <span className="bg-gradient-to-r from-zinc-500 via-zinc-400 to-zinc-300 bg-clip-text text-transparent">Built for focus.</span>
          </h2>
          <p className="mt-2 text-xs text-zinc-500 tracking-wide">The actual app. No mockups.</p>
        </div>

        <div className="relative w-full overflow-hidden rounded-2xl border border-zinc-800/70 bg-black shadow-2xl">
          <AnimatePresence mode="wait">
            <motion.img
              key={images[currentIndex] + currentIndex}
              src={images[currentIndex]}
              alt={`Legacy Life Builder screen ${currentIndex + 1} of ${images.length}`}
              initial={{ opacity: 0, scale: 0.99 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.35, ease: "easeInOut" }}
              className="block h-auto w-full select-none pointer-events-none"
            />
          </AnimatePresence>

          {images.length > 1 && (
            <>
              <button
                onClick={prev}
                aria-label="Previous screen"
                className="absolute left-3 sm:left-5 top-1/2 -translate-y-1/2 z-10 flex h-10 w-10 sm:h-12 sm:w-12 items-center justify-center rounded-full border border-zinc-700/80 bg-black/60 text-white transition-all hover:scale-105 hover:bg-black/90 active:scale-95 cursor-pointer"
              >
                <ChevronLeft size={20} />
              </button>
              <button
                onClick={next}
                aria-label="Next screen"
                className="absolute right-3 sm:right-5 top-1/2 -translate-y-1/2 z-10 flex h-10 w-10 sm:h-12 sm:w-12 items-center justify-center rounded-full border border-zinc-700/80 bg-black/60 text-white transition-all hover:scale-105 hover:bg-black/90 active:scale-95 cursor-pointer"
              >
                <ChevronRight size={20} />
              </button>

              <div className="absolute bottom-4 left-1/2 z-10 flex -translate-x-1/2 gap-1.5">
                {images.map((_, i) => (
                  <button
                    key={i}
                    onClick={() => setCurrentIndex(i)}
                    aria-label={`Show screen ${i + 1}`}
                    className={`h-1.5 rounded-full transition-all duration-300 cursor-pointer ${
                      i === currentIndex ? "w-5 bg-[#D2A226]" : "w-1.5 bg-white/40 hover:bg-white/70"
                    }`}
                  />
                ))}
              </div>
            </>
          )}
        </div>
      </div>
    </section>
  );
};

export default ProductGallery;
