import { motion } from "motion/react";

function Loader({ message = "Loading...", subMessage }) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.2 }}
      className="fixed inset-0 z-50 flex items-center justify-center bg-white/70 backdrop-blur-sm px-4"
    >
      <motion.div
        initial={{ scale: 0.95, y: 12, opacity: 0 }}
        animate={{ scale: 1, y: 0, opacity: 1 }}
        exit={{ scale: 0.95, y: 12, opacity: 0 }}
        transition={{ duration: 0.25, ease: "easeOut" }}
        className="bg-white border border-gray-200 rounded-3xl shadow-2xl px-10 py-8 flex flex-col items-center gap-5 max-w-sm w-full"
      >
        {/* ring spinner */}
        <div className="relative w-14 h-14">
          <div className="absolute inset-0 rounded-full border-4 border-emerald-100" />
          <div className="absolute inset-0 rounded-full border-4 border-transparent border-t-emerald-600 border-r-teal-500 animate-spin" />
        </div>

        <div className="text-center">
          <p className="font-semibold text-gray-800">{message}</p>
          {subMessage && (
            <p className="text-sm text-gray-500 mt-1 leading-relaxed">
              {subMessage}
            </p>
          )}
        </div>

        {/* pulsing dots */}
        <div className="flex gap-1.5">
          {[0, 1, 2].map((i) => (
            <motion.span
              key={i}
              animate={{ opacity: [0.25, 1, 0.25] }}
              transition={{ duration: 1.2, repeat: Infinity, delay: i * 0.2 }}
              className="w-2 h-2 rounded-full bg-emerald-500"
            />
          ))}
        </div>
      </motion.div>
    </motion.div>
  );
}

export default Loader;
