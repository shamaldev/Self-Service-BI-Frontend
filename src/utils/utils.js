import Cookies from "js-cookie";
import { jwtDecode } from "jwt-decode";
export const normalizeData = (data) => {
  if (!Array.isArray(data)) return [];

  return data.map((row) => {
    if (typeof row !== "object" || row == null) return {};

    const obj = {};
    for (const key in row) {
      let val = row[key];

      if (val == null) {
        obj[key] = 0;
      } else if (typeof val === "string") {
        const trimmed = val.trim();
        // Match both short (YYYY-MM-DD) and full ISO (YYYY-MM-DDTHH:mm:ss.sssZ) formats
        const isDateLike = /^\d{4}-\d{2}-\d{2}(T\d{2}:\d{2}:\d{2}(\.\d+)?Z)?$/.test(trimmed);

        const num = parseFloat(trimmed);

        if (!isNaN(num) && !isDateLike) {
          obj[key] = num;
        } else {
          obj[key] = trimmed;
        }
      } else {
        obj[key] = val;
      }
    }

    return obj;
  });
};

export const formatDate = (val) => {
  if (typeof val !== "string") return val;

  const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

  // Handle "YYYY-MM" format
  const matchYM = val.match(/^(\d{4})-(\d{2})$/);
  if (matchYM) {
    const monthNum = parseInt(matchYM[2], 10);
    return months[monthNum - 1] || val;
  }

  // Handle "YYYY-MM-DD HH:mm:ss+offset" or ISO-like formats
  const matchFull = val.match(/^(\d{4})-(\d{2})-\d{2}/);
  if (matchFull) {
    const monthNum = parseInt(matchFull[2], 10);
    return months[monthNum - 1] || val;
  }

  return val;
};




export const formatNumber = (val, isCurrency = false) => {
  if (val == null) return "-";
  let num = typeof val === "string" ? parseFloat(val.replace(/,/g, "")) : val;
  if (isNaN(num)) return val;
  const absNum = Math.abs(num);
  const sign = isCurrency ? "₹" : "";
  if (absNum >= 1e9) return `${sign}${(num / 1e9).toFixed(1)}B`;
  if (absNum >= 1e6) return `${sign}${(num / 1e6).toFixed(1)}M`;
  if (absNum >= 1e3) return `${sign}${(num / 1e3).toFixed(1)}K`;
  return `${sign}${num.toLocaleString("en-US", {
    maximumFractionDigits: Number.isInteger(num) ? 0 : 2,
  })}`;
};

export const getRoleFromToken = () => {
  const token = Cookies.get("access_token");
  if (!token) return "CFO";
  try {
    const decoded = jwtDecode(token);
    // console.log("Decoded token:", decoded);
    
    return decoded.role
  } catch (error) {
    console.error("Token decode error:", error);
    return "CFO";
  }
};