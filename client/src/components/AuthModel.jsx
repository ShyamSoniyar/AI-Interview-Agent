import { useEffect, useRef } from "react";
import { FaTimes } from "react-icons/fa";
import { useSelector } from "react-redux";
import Auth from "../pages/Auth";

function AuthModel({ onClose }) {
  const { userData } = useSelector((state) => state.user);
  const closeButtonRef = useRef(null);

  useEffect(() => {
    if (userData) {
      onClose();
    }
  }, [userData, onClose]);

  // Escape to dismiss, and lock background scroll while open
  useEffect(() => {
    const onKeyDown = (e) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKeyDown);

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    closeButtonRef.current?.focus();

    return () => {
      document.removeEventListener("keydown", onKeyDown);
      document.body.style.overflow = previousOverflow;
    };
  }, [onClose]);

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Sign in"
      // Click the backdrop to dismiss, but not clicks inside the panel
      onClick={onClose}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm px-4"
    >
      <div
        className="relative w-full max-w-md"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          ref={closeButtonRef}
          onClick={onClose}
          aria-label="Close sign in"
          className="absolute top-8 right-5 z-10 text-gray-800 hover:text-black text-xl cursor-pointer"
        >
          <FaTimes size={18} />
        </button>
        <Auth isModel={true} />
      </div>
    </div>
  );
}

export default AuthModel;
