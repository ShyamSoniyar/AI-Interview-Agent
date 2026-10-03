import { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { HiSparkles } from "react-icons/hi";
import { FaTimes } from "react-icons/fa";
import { BILLING_ENABLED } from "../config";

const DISMISS_KEY = "announcement:free-credits-dismissed";

function AnnouncementStrip() {
  const [dismissed, setDismissed] = useState(
    () => localStorage.getItem(DISMISS_KEY) === "true",
  );

  // Nothing to announce once billing goes live
  if (BILLING_ENABLED) return null;

  const handleDismiss = () => {
    localStorage.setItem(DISMISS_KEY, "true");
    setDismissed(true);
  };

  return (
    <AnimatePresence>
      {!dismissed && (
        <motion.div
          initial={{ height: 0, opacity: 0 }}
          animate={{ height: "auto", opacity: 1 }}
          exit={{ height: 0, opacity: 0 }}
          transition={{ duration: 0.25, ease: "easeOut" }}
          className="overflow-hidden bg-linear-to-r from-emerald-600 to-teal-500 text-white"
        >
          <div className="max-w-6xl mx-auto px-4 py-2.5 flex items-center justify-center gap-3 relative">
            <HiSparkles size={16} className="shrink-0 hidden sm:block" />
            <p className="text-xs sm:text-sm text-center pr-8">
              <span className="font-semibold">Free for a limited time</span>
              <span className="hidden sm:inline">
                {" "}
                — enjoy unlimited interview credits while billing is on the way.
              </span>
              <span className="sm:hidden"> — unlimited credits, on us.</span>
            </p>
            <button
              onClick={handleDismiss}
              aria-label="Dismiss announcement"
              className="absolute right-4 p-1 rounded-full hover:bg-white/20 transition cursor-pointer"
            >
              <FaTimes size={12} />
            </button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

export default AnnouncementStrip;
