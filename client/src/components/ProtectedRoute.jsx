import { useSelector } from "react-redux";
import { Navigate, useLocation } from "react-router-dom";
import Loader from "./Loader";

function ProtectedRoute({ children }) {
  const { userData, authLoading } = useSelector((state) => state.user);
  const location = useLocation();

  // Wait for the session check — userData is null on first render even when signed in
  if (authLoading) {
    return <Loader message="Loading" subMessage="Checking your session." />;
  }

  if (!userData) {
    // Remember where they were headed so we can send them back after sign-in
    return <Navigate to="/auth" replace state={{ from: location.pathname }} />;
  }

  return children;
}

export default ProtectedRoute;
