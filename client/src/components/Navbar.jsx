import { useDispatch, useSelector } from "react-redux";
import { motion } from "motion/react";
import { BsClockHistory, BsCoin, BsRobot } from "react-icons/bs";
import { FaUserAstronaut } from "react-icons/fa";
import { HiOutlineLogout } from "react-icons/hi";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { BILLING_ENABLED, ServerUrl } from "../config";
import { setUserData } from "../redux/userSlice";
import AuthModel from "./AuthModel";
import toast from "react-hot-toast";

function Navbar() {
  const { userData } = useSelector((state) => state.user);
  const [showCreditPopup, setShowCreditPopup] = useState(false);
  const [showUserPopup, setShowUserPopup] = useState(false);
  const [showAuth, setShowAuth] = useState(false);
  const navigate = useNavigate();
  const dispatch = useDispatch();

  const handleLogout = async () => {
    try {
      await axios.get(ServerUrl + "/api/auth/logout", {
        withCredentials: true,
      });
      dispatch(setUserData(null));
      setShowUserPopup(false);
      setShowCreditPopup(false);
      navigate("/auth");
      toast.success("Signed out");
    } catch (error) {
      console.log(error);
      toast.error("Could not sign out. Please try again.");
    }
  };

  return (
    <div className="bg-[#f3f3f3] flex justify-center px-4 pt-6">
      <motion.div
        initial={{ opacity: 0, y: -40 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="w-full max-w-6xl bg-white rounded-3xl shadow-sm border border-gray-200 px-8 py-4 flex justify-between items-center relative"
      >
        <div className="flex items-center gap-3 cursor-pointer">
          <div className="bg-black text-white p-2 rounded-lg">
            <BsRobot size={18} />
          </div>
          <h1 className="font-semibold hidden md:block text-lg">
            InterviewIQ.AI
          </h1>
        </div>
        <div className="flex items-center gap-6 relative">
          <div className="relative">
            <button
              onClick={() => {
                if (!userData) {
                  setShowAuth(true);
                  return;
                }
                setShowCreditPopup(!showCreditPopup);
                setShowUserPopup(false);
              }}
              className="flex items-center gap-2 bg-gray-100 px-4 py-2 rounded-full text-md hover:bg-gray-200 transition"
            >
              <BsCoin size={20} />
              {BILLING_ENABLED ? userData?.credits : "Unlimited"}
            </button>
            {showCreditPopup && (
              <motion.div
                initial={{ opacity: 0, y: -40 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3 }}
                className="absolute -right-14 mt-3 w-64 shadow-xl bg-white border border-gray-200 rounded-xl p-4 z-50"
              >
                {BILLING_ENABLED ? (
                  <>
                    <p className="text-gray-600 text-sm mb-4">
                      Need more credits to continue interviews?
                    </p>
                    <button
                      onClick={() => navigate("/pricing")}
                      className="w-full bg-black text-white py-2 rounded-lg text-sm"
                    >
                      Buy More Credits
                    </button>
                  </>
                ) : (
                  <>
                    <span className="inline-block bg-emerald-100 text-emerald-700 text-xs font-medium px-2.5 py-1 rounded-full mb-3">
                      Coming Soon
                    </span>
                    <p className="text-gray-600 text-sm mb-4">
                      Billing isn&apos;t live yet — enjoy{" "}
                      <span className="font-semibold text-gray-900">
                        unlimited credits
                      </span>{" "}
                      on the house while we get it ready.
                    </p>
                    <button
                      onClick={() => {
                        setShowCreditPopup(false);
                        navigate("/pricing");
                      }}
                      className="w-full bg-gray-100 text-gray-700 hover:bg-gray-200 py-2 rounded-lg text-sm transition cursor-pointer"
                    >
                      View Upcoming Plans
                    </button>
                  </>
                )}
              </motion.div>
            )}
          </div>
          <div className="relative">
            <button
              onClick={() => {
                if (!userData) {
                  setShowAuth(true);
                  return;
                }
                setShowUserPopup(!showUserPopup);
                setShowCreditPopup(false);
              }}
              className="w-9 h-9 bg-black text-white rounded-full flex items-center justify-center font-semibold"
            >
              {userData ? (
                userData?.name?.slice(0, 1).toUpperCase() || "U"
              ) : (
                <FaUserAstronaut size={16} />
              )}
            </button>
            {showUserPopup && (
              <motion.div
                initial={{ opacity: 0, scale: 0.95, y: -8 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                transition={{ duration: 0.18, ease: "easeOut" }}
                className="absolute right-0 mt-3 w-64 origin-top-right bg-white border border-gray-200 rounded-2xl shadow-xl shadow-gray-300/40 overflow-hidden z-50"
              >
                {/* profile header */}
                <div className="flex items-center gap-3 px-4 py-4 bg-linear-to-br from-emerald-50 to-white border-b border-gray-100">
                  <div className="w-10 h-10 shrink-0 rounded-full bg-black text-white flex items-center justify-center font-semibold">
                    {userData?.name?.slice(0, 1).toUpperCase()}
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-gray-900 truncate">
                      {userData?.name}
                    </p>
                    {userData?.email && (
                      <p className="text-xs text-gray-500 truncate">
                        {userData.email}
                      </p>
                    )}
                  </div>
                </div>

                {/* credits */}
                <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
                  <span className="flex items-center gap-2 text-sm text-gray-600">
                    <BsCoin size={15} className="text-emerald-600" />
                    Credits
                  </span>
                  <span className="text-sm font-semibold text-gray-900">
                    {userData?.credits}
                  </span>
                </div>

                {/* menu */}
                <div className="p-2">
                  <button
                    onClick={() => {
                      setShowUserPopup(false);
                      navigate("/history");
                    }}
                    className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-gray-700 hover:bg-gray-100 hover:text-black transition cursor-pointer"
                  >
                    <BsClockHistory size={15} className="text-gray-400" />
                    Interview History
                  </button>

                  <button
                    onClick={handleLogout}
                    className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-red-600 hover:bg-red-50 transition cursor-pointer"
                  >
                    <HiOutlineLogout size={16} />
                    Logout
                  </button>
                </div>
              </motion.div>
            )}
          </div>
        </div>
      </motion.div>
      {showAuth && <AuthModel onClose={() => setShowAuth(false)} />}
    </div>
  );
}

export default Navbar;
