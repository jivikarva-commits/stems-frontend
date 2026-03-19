import { motion, AnimatePresence } from "framer-motion";
import { RotateCcw, SkipForward } from "lucide-react";

/**
 * VideoEndOverlay - Reusable end-of-video overlay component
 *
 * Shows a smooth animated overlay with replay/next actions before video ends.
 * Blocks YouTube suggestions and provides custom CTAs.
 *
 * @param {boolean} show - Whether to show the overlay
 * @param {function} onReplay - Callback when "Replay" is clicked
 * @param {function} onNext - Callback when "Next Lecture" is clicked
 * @param {boolean} hasNext - Whether there is a next lecture available
 * @param {boolean} isMobile - Mobile responsive mode
 * @param {string} title - Optional custom title (default: "Lecture Completed ✅")
 */
export default function VideoEndOverlay({
  show,
  onReplay,
  onNext,
  hasNext = false,
  isMobile = false,
  title = "Lecture Completed ✅",
}) {
  return (
    <AnimatePresence>
      {show && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.3 }}
          className="absolute inset-0 z-[999] bg-black/50 backdrop-blur-md flex items-center justify-center flex-col gap-4"
        >
          <h3 className={`${isMobile ? "text-lg" : "text-2xl"} font-extrabold text-white text-center`}>
            {title}
          </h3>
          <div className={`flex ${isMobile ? "flex-col w-[90%]" : "flex-row"} items-center justify-center gap-3`}>
            <button
              onClick={onReplay}
              className="inline-flex items-center justify-center gap-2 rounded-xl border border-indigo-300/50 bg-indigo-500/20 px-5 py-3 text-sm font-bold text-indigo-100 transition hover:bg-indigo-500/35"
            >
              <RotateCcw size={16} />
              Replay
            </button>
            <button
              onClick={hasNext ? onNext : undefined}
              disabled={!hasNext}
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 px-5 py-3 text-sm font-bold text-white transition enabled:hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-55"
            >
              Next Lecture
              <SkipForward size={16} />
            </button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
