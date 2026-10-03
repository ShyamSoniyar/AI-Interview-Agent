import { Route, Routes } from "react-router-dom";
import Home from "./pages/Home";
import Auth from "./pages/Auth";
import { useEffect } from "react";
import axios from "axios";
import { useDispatch } from "react-redux";
import { setUserData } from "./redux/userSlice";
import InterviewPage from "./pages/InterviewPage";
import InterviewHistory from "./pages/InterviewHistory";
import Pricing from "./pages/Pricing";
import InterviewReport from "./pages/InterviewReport";
import AnnouncementStrip from "./components/AnnouncementStrip";
import { ServerUrl } from "./config";
import ProtectedRoute from "./components/ProtectedRoute";
import NotFound from "./pages/NotFound";
import toast, { Toaster } from "react-hot-toast";

function App() {
  const dispatch = useDispatch();

  useEffect(() => {
    const getUser = async () => {
      try {
        const result = await axios.get(ServerUrl + "/api/user/current-user", {
          withCredentials: true,
        });
        dispatch(setUserData(result.data?.user || null));
      } catch (error) {
        // 401 just means "not signed in" — anything else is a real problem worth surfacing
        if (error.response?.status !== 401) {
          toast.error("Could not reach the server. Some features may not work.");
        }
        dispatch(setUserData(null));
      }
    };

    getUser();
  }, [dispatch]);

  return (
    <>
      <Toaster
        position="top-center"
        toastOptions={{
          style: {
            borderRadius: "12px",
            background: "#fff",
            color: "#1f2937",
            border: "1px solid #e5e7eb",
            boxShadow: "0 10px 25px -5px rgb(0 0 0 / 0.1)",
          },
          success: { iconTheme: { primary: "#059669", secondary: "#fff" } },
          error: { duration: 5000, iconTheme: { primary: "#dc2626", secondary: "#fff" } },
        }}
      />
      <AnnouncementStrip />
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/auth" element={<Auth />} />
        <Route path="/pricing" element={<Pricing />} />
        <Route
          path="/interview"
          element={
            <ProtectedRoute>
              <InterviewPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/history"
          element={
            <ProtectedRoute>
              <InterviewHistory />
            </ProtectedRoute>
          }
        />
        <Route
          path="/report/:_id"
          element={
            <ProtectedRoute>
              <InterviewReport />
            </ProtectedRoute>
          }
        />
        <Route path="*" element={<NotFound />} />
      </Routes>
    </>
  );
}

export default App;
