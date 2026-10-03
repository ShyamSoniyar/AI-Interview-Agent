import { motion } from "motion/react";
import { useNavigate } from "react-router-dom";
import { BsRobot } from "react-icons/bs";

function NotFound() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-linear-to-br from-gray-50 to-emerald-50 flex items-center justify-center px-6">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="bg-white border border-gray-200 rounded-3xl shadow-lg p-10 text-center max-w-md w-full"
      >
        <div className="bg-black text-white w-12 h-12 rounded-2xl flex items-center justify-center mx-auto mb-6">
          <BsRobot size={22} />
        </div>
        <h1 className="text-5xl font-bold text-emerald-600 mb-3">404</h1>
        <p className="text-gray-800 font-semibold mb-2">Page not found</p>
        <p className="text-gray-500 text-sm mb-8">
          That page doesn&apos;t exist or may have been moved.
        </p>
        <button
          onClick={() => navigate("/")}
          className="w-full bg-black text-white py-3 rounded-xl font-semibold hover:opacity-90 transition cursor-pointer"
        >
          Back to Home
        </button>
      </motion.div>
    </div>
  );
}

export default NotFound;
