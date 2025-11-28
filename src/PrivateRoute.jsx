import { useEffect, useState, useRef } from "react"; // Add useRef
import { useNavigate } from "react-router-dom";
import Cookies from "js-cookie";
import { jwtDecode } from "jwt-decode";

const PrivateRoute = ({ children }) => {
  const navigate = useNavigate();
  const [isValid, setIsValid] = useState(null); // null = checking, true/false = result
  const intervalRef = useRef(null); // Track interval for cleanup

  const validateToken = () => {
    const token = Cookies.get("access_token");
    if (!token) {
      // Cleanup before logout
      Cookies.remove("access_token");
      localStorage.removeItem("dashboardCache");
      navigate("/login", { replace: true });
      return false;
    }
    try {
      const decoded = jwtDecode(token);
      const now = Date.now() / 1000;
      if (decoded.exp < now) {
        // Cleanup before logout
        Cookies.remove("access_token");
        localStorage.removeItem("dashboardCache");
        localStorage.removeItem("provactiveCache");
        navigate("/login", { replace: true });
        return false;
      }
      setIsValid(true);
      return true;
    } catch (err) {
      // Cleanup before logout
      Cookies.remove("access_token");
      localStorage.removeItem("dashboardCache");
      localStorage.removeItem("provactiveCache");
      navigate("/login", { replace: true });
      return false;
    }
  };

  useEffect(() => {
    // Initial check
    if (!validateToken()) {
      setIsValid(false);
      return;
    }

    // Periodic revalidation every 2 minutes (adjust as needed; e.g., 120000 ms)
    intervalRef.current = setInterval(() => {
      if (!validateToken()) {
        setIsValid(false);
      }
    }, 120000);

    // Optional: Recheck on window focus (e.g., tab switch)
    const handleFocus = () => {
      validateToken(); // Silent recheck; won't navigate if still valid
    };
    window.addEventListener("focus", handleFocus);

    // Cleanup
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
      window.removeEventListener("focus", handleFocus);
    };
  }, [navigate]);

  if (isValid === null) {
    return <div>Loading...</div>; // Or a spinner
  }

  return isValid ? children : null;
};

export default PrivateRoute;
