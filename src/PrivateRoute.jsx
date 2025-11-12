import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import Cookies from "js-cookie";
import { jwtDecode } from "jwt-decode";

const PrivateRoute = ({ children }) => {
  const navigate = useNavigate();
  const [isValid, setIsValid] = useState(null); // null = checking, true/false = result

  useEffect(() => {
    const validateToken = () => {
      const token = Cookies.get("access_token"); // Updated to match Login

      if (!token) {
        navigate("/login", { replace: true });
        return;
      }

      try {
        const decoded = jwtDecode(token);
        const now = Date.now() / 1000;

        if (decoded.exp < now) {
          Cookies.remove("access_token"); // Updated to match
          localStorage.removeItem("dashboardCache");
          navigate("/login", { replace: true });
          return;
        }

        setIsValid(true);
      } catch (err) {
        Cookies.remove("access_token"); // Updated to match
        navigate("/login", { replace: true });
      }
    };

    validateToken();
  }, [navigate]);

  if (isValid === null) {
    return <div>Loading...</div>; // Or a spinner
  }

  return isValid ? children : null;
};

export default PrivateRoute;