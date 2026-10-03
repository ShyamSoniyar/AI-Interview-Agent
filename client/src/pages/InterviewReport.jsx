import { useEffect } from "react";
import { useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import axios from "axios";
import { ServerUrl } from "../config";
import Step3Report from "../components/Step3Report";
import Loader from "../components/Loader";
import toast from "react-hot-toast";

function InterviewReport() {
  const { _id } = useParams();
  const navigate = useNavigate();
  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // isCancelled lets the effect drop results after unmount / id change
  const fetchReport = async (isCancelled = () => false) => {
    try {
      const result = await axios.get(
        `${ServerUrl}/api/interview/report/${_id}`,
        {
          withCredentials: true,
        },
      );
      if (isCancelled()) return;
      setReport(result.data);
    } catch (err) {
      if (isCancelled()) return;
      console.log(err);
      const status = err.response?.status;
      setError(
        status === 404
          ? "This report doesn't exist, or it isn't yours to view."
          : "Could not load this report.",
      );
      toast.error("Could not load this report.");
    } finally {
      if (!isCancelled()) setLoading(false);
    }
  };

  const handleRetry = () => {
    setLoading(true);
    setError(null);
    fetchReport();
  };

  useEffect(() => {
    let cancelled = false;
    // Safe: every setState in fetchReport runs after an await, never synchronously
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchReport(() => cancelled);
    return () => {
      cancelled = true;
    };
  }, [_id]);

  if (loading) {
    return (
      <Loader message="Loading report" subMessage="Fetching your results." />
    );
  }

  if (error || !report) {
    return (
      <div className="min-h-screen bg-linear-to-br from-gray-50 to-emerald-50 flex items-center justify-center px-6">
        <div className="bg-white border border-gray-200 rounded-3xl shadow-lg p-10 text-center max-w-md w-full">
          <p className="text-gray-800 font-semibold mb-2">Report unavailable</p>
          <p className="text-gray-500 text-sm mb-8">
            {error || "No report data was returned."}
          </p>
          <div className="flex gap-3">
            <button
              onClick={handleRetry}
              className="flex-1 bg-black text-white py-2.5 rounded-xl text-sm font-semibold hover:opacity-90 transition cursor-pointer"
            >
              Retry
            </button>
            <button
              onClick={() => navigate("/history")}
              className="flex-1 bg-gray-100 text-gray-700 py-2.5 rounded-xl text-sm font-semibold hover:bg-gray-200 transition cursor-pointer"
            >
              Back to History
            </button>
          </div>
        </div>
      </div>
    );
  }

  return <Step3Report report={report} />;
}

export default InterviewReport;
