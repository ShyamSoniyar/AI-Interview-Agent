import { useEffect } from "react";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { ServerUrl } from "../config";
import { FaArrowLeft } from "react-icons/fa";
import toast from "react-hot-toast";

export default function InterviewHistory() {
  const [interviews, setInterviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const navigate = useNavigate();

  // isCancelled lets the effect drop results after unmount
  const fetchInterviews = async (isCancelled = () => false) => {
    try {
      const result = await axios.get(
        ServerUrl + "/api/interview/get-interview",
        {
          withCredentials: true,
        },
      );
      if (isCancelled()) return;
      // Guard the shape — a non-array would crash .map below
      setInterviews(Array.isArray(result.data) ? result.data : []);
    } catch (err) {
      if (isCancelled()) return;
      console.log(err);
      setError(true);
      toast.error("Could not load your interview history.");
    } finally {
      if (!isCancelled()) setLoading(false);
    }
  };

  const handleRetry = () => {
    setLoading(true);
    setError(false);
    fetchInterviews();
  };

  useEffect(() => {
    let cancelled = false;
    // Safe: every setState in fetchInterviews runs after an await, never synchronously
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchInterviews(() => cancelled);
    return () => {
      cancelled = true;
    };
  }, []);
  return (
    <div className="min-h-screen bg-linear-to-r from-gray-50 to-emerald-50 py-10">
      <div className="w-[90vw] lg:w-[70vw] max-w-[90%] mx-auto">
        <div className="mb-10 w-full flex items-start gap-4 flex-wrap">
          <button
            aria-label="Back to home"
            onClick={() => navigate("/")}
            className="mt-1 p-3 rounded-full bg-white shadow hover:shadow-md transition hover:cursor-pointer"
          >
            <FaArrowLeft className="text-gray-600" />
          </button>

          <div>
            <h1 className="text-3xl font-bold text-gray-800 flex-nowrap">
              Interview History
            </h1>
            <p className="text-gray-500 mt-2">
              Track your past interviews and performance reports
            </p>
          </div>
        </div>
        {loading ? (
          <div className="grid gap-6">
            {[0, 1, 2].map((i) => (
              <div
                key={i}
                className="bg-white p-6 rounded-2xl shadow-md border border-gray-100 animate-pulse"
              >
                <div className="flex justify-between gap-4">
                  <div className="space-y-3 flex-1">
                    <div className="h-5 bg-gray-200 rounded w-1/3" />
                    <div className="h-4 bg-gray-100 rounded w-1/4" />
                    <div className="h-3 bg-gray-100 rounded w-20" />
                  </div>
                  <div className="h-8 bg-gray-100 rounded w-24 self-center" />
                </div>
              </div>
            ))}
          </div>
        ) : error ? (
          <div className="bg-white p-10 rounded-2xl shadow text-center">
            <p className="text-gray-700 font-medium mb-1">
              Couldn&apos;t load your history
            </p>
            <p className="text-gray-500 text-sm mb-6">
              Check your connection and try again.
            </p>
            <button
              onClick={handleRetry}
              className="bg-black text-white px-6 py-2.5 rounded-xl text-sm font-semibold hover:opacity-90 transition cursor-pointer"
            >
              Retry
            </button>
          </div>
        ) : interviews.length === 0 ? (
          <div className="bg-white p-10 rounded-2xl shadow text-center">
            <p className="text-gray-500 mb-6">
              No interviews found. Start your first interview now
            </p>
            <button
              onClick={() => navigate("/interview")}
              className="bg-emerald-600 text-white px-6 py-2.5 rounded-xl text-sm font-semibold hover:opacity-90 transition cursor-pointer"
            >
              Start an Interview
            </button>
          </div>
        ) : (
          <div className="grid gap-6">
            {interviews.map((item, index) => (
              <div
                key={index}
                role="button"
                tabIndex={0}
                onClick={() => navigate(`/report/${item._id}`)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    e.preventDefault();
                    navigate(`/report/${item._id}`);
                  }
                }}
                className="bg-white p-6 rounded-2xl shadow-md hover:shadow-xl transition-all duration-300 cursor-pointer border border-gray-100 focus:outline-none focus:ring-2 focus:ring-emerald-500"
              >
                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                    <div>
                        <h3 className="text-lg font-semibold text-gray-800">
                            {item.role}
                        </h3>
                        <p className="text-gray-500 text-sm mt-1">
                            {item.experience} - {item.mode}
                        </p>
                        <p className="text-xs text-gray-400 mt-2">
                            {new Date(item.createdAt).toLocaleDateString()}
                        </p>
                    </div>
                    <div className="flex items-center gap-6">
                        {/* Score */}
                        <div className="text-right">
                            <p className="text-xl font-bold text-emerald-600">
                                {item.finalScore || 0}/10
                            </p>
                            <p className="text-xs text-gray-400">
                                Overall Score
                            </p>
                        </div>
                        {/* STATUS BADGE */}
                        <span className={`px-4 py-1 rounded-full text-xs font-medium ${item.status === "completed" ? "bg-emerald-100 text-emerald-600" : "bg-yellow-100 text-yellow-700"}`}>
                            {item.status}
                        </span>
                    </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
