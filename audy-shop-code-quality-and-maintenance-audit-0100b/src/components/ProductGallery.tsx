import { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Play, Pause, Volume2, VolumeX } from "lucide-react";
import type { ProductMedia } from "@/lib/types";
import { cn } from "@/lib/utils";

interface ProductGalleryProps {
  media: ProductMedia[];
  productName: string;
}

export const ProductGallery = ({ media, productName }: ProductGalleryProps) => {
  const [active, setActive] = useState(0);
  const [playing, setPlaying] = useState(false);
  const [muted, setMuted] = useState(true);
  const videoRef = useRef<HTMLVideoElement | null>(null);

  const sorted = [...media].sort((a, b) => a.sort_order - b.sort_order);
  const current = sorted[active];

  useEffect(() => {
    setPlaying(false);
    if (videoRef.current) videoRef.current.pause();
  }, [active]);

  if (sorted.length === 0) {
    return (
      <div className="aspect-square bg-muted rounded-2xl flex items-center justify-center text-xs text-muted-foreground">
        Aucun média
      </div>
    );
  }

  const togglePlay = () => {
    if (!videoRef.current) return;
    if (playing) {
      videoRef.current.pause();
      setPlaying(false);
    } else {
      void videoRef.current.play();
      setPlaying(true);
    }
  };

  return (
    <div>
      <div className="aspect-square bg-muted rounded-2xl overflow-hidden mb-3 relative group">
        <AnimatePresence mode="wait">
          <motion.div
            key={current.id}
            initial={{ opacity: 0, scale: 1.02 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
            className="w-full h-full"
          >
            {current.media_type === "image" ? (
              <img
                src={current.url}
                alt={productName}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full relative">
                <video
                  ref={videoRef}
                  src={current.url}
                  poster={current.poster_url ?? undefined}
                  className="w-full h-full object-cover"
                  playsInline
                  muted={muted}
                  loop
                  onEnded={() => setPlaying(false)}
                />
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                  <AnimatePresence>
                    {!playing && (
                      <motion.button
                        type="button"
                        onClick={togglePlay}
                        initial={{ opacity: 0, scale: 0.8 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.8 }}
                        className="pointer-events-auto bg-background/90 backdrop-blur-md rounded-full w-14 h-14 flex items-center justify-center hover:scale-105 transition-transform"
                        aria-label="Lire la vidéo"
                      >
                        <Play className="w-5 h-5" fill="currentColor" />
                      </motion.button>
                    )}
                  </AnimatePresence>
                </div>
                {playing && (
                  <button
                    type="button"
                    onClick={togglePlay}
                    className="absolute inset-0 cursor-pointer"
                    aria-label="Pause"
                  />
                )}
                <div className="absolute bottom-3 right-3 flex gap-1.5 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity">
                  {playing && (
                    <button
                      type="button"
                      onClick={togglePlay}
                      className="bg-background/80 backdrop-blur-md rounded-full p-2.5 hover:bg-background"
                      aria-label="Pause"
                    >
                      <Pause className="w-3.5 h-3.5" />
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() => setMuted((m) => !m)}
                    className="bg-background/80 backdrop-blur-md rounded-full p-2.5 hover:bg-background"
                    aria-label={muted ? "Activer le son" : "Couper le son"}
                  >
                    {muted ? (
                      <VolumeX className="w-3.5 h-3.5" />
                    ) : (
                      <Volume2 className="w-3.5 h-3.5" />
                    )}
                  </button>
                </div>
              </div>
            )}
          </motion.div>
        </AnimatePresence>
      </div>

      {sorted.length > 1 && (
        <div className="flex gap-2 overflow-x-auto -mx-4 px-4 sm:mx-0 sm:px-0 sm:grid sm:grid-cols-5 scrollbar-hide pb-1">
          {sorted.map((m, i) => (
            <motion.button
              key={m.id}
              type="button"
              onClick={() => setActive(i)}
              whileTap={{ scale: 0.94 }}
              className={cn(
                "shrink-0 w-16 h-16 sm:w-auto sm:h-auto sm:aspect-square overflow-hidden rounded-xl relative bg-muted transition-all duration-200 ease-smooth",
                i === active
                  ? "ring-2 ring-foreground ring-offset-2 ring-offset-background"
                  : "opacity-70 hover:opacity-100",
              )}
            >
              {m.media_type === "image" ? (
                <img src={m.url} alt="" className="w-full h-full object-cover" />
              ) : (
                <>
                  {m.poster_url ? (
                    <img
                      src={m.poster_url}
                      alt=""
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <video
                      src={m.url}
                      className="w-full h-full object-cover"
                      muted
                      playsInline
                      preload="metadata"
                    />
                  )}
                  <div className="absolute inset-0 flex items-center justify-center bg-foreground/20">
                    <Play className="w-3 h-3 text-background" fill="currentColor" />
                  </div>
                </>
              )}
            </motion.button>
          ))}
        </div>
      )}
    </div>
  );
};
