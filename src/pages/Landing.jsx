import { motion, useAnimation } from "framer-motion";
import { useEffect, useRef, useState, useMemo } from "react";
import { ArrowRight, User, Clock, Lightbulb } from "lucide-react";
import { jwtDecode } from "jwt-decode";
import Cookies from "js-cookie";
import { useNavigate } from "react-router-dom";

const Landing = () => {
  const controls = useAnimation();
  const navigate = useNavigate();
  const token = Cookies.get("access_token");
  const decoded = token ? jwtDecode(token) : null;
  const name = decoded ? decoded.user_id || "User" : "User";
  const titleRef = useRef(null);
  const [fontSize, setFontSize] = useState("clamp(2rem, 5vw, 5rem)");

  // Always generate message on each render
  const message = useMemo(() => {
    const now = new Date();
    const hours = now.getHours();
    const day = now.toLocaleString("en-US", { weekday: "long" });

    const timeGreetings = {
      morning: ["Good morning", "Rise and shine", "Morning vibes incoming"],
      afternoon: ["Good afternoon", "Keep the momentum", "Midday focus!"],
      evening: ["Good evening", "Evening reflections", "Twilight thoughts"],
    };

    const weekdayMessages = {
      Monday: ["Fresh start. Let’s uncover key insights."],
      Tuesday: ["Tuesday’s all about execution and insight."],
      Wednesday: ["Midweek clarity — optimize and conquer with data."],
      Thursday: ["Almost there — stay sharp, stay insightful."],
      Friday: ["Finish strong, you’re almost at the weekend with fresh insights!"],
      Saturday: ["Weekend mode: balance and brilliant discoveries."],
      Sunday: ["Recharge, reflect, and reimagine with insights."],
    };

    const timePeriod = hours < 12 ? "morning" : hours < 18 ? "afternoon" : "evening";
    const greeting = timeGreetings[timePeriod][Math.floor(Math.random() * 3)];
    const todayMsgs = weekdayMessages[day] || ["Discover your next big insight."];
    const randomMsg = todayMsgs[Math.floor(Math.random() * todayMsgs.length)];

    const combined = [
      `${greeting}, ${name}! ${randomMsg}`,
      `${greeting}, ${name}! Ready to generate powerful insights?`,
    ];

    return combined[Math.floor(Math.random() * combined.length)];
  }, [name]);

  useEffect(() => {
    controls.start("visible");
  }, [controls]);

  const containerVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 1.2, ease: "easeOut" },
    },
  };

  const buttonVariants = {
    hover: { scale: 1.05, boxShadow: "0 8px 24px rgba(59,130,246,0.35)" },
    tap: { scale: 0.97 },
  };

  return (
    <div className="min-h-screen w-screen flex flex-col items-center justify-center bg-gradient-to-br from-slate-100 via-white to-blue-50 relative overflow-hidden">
      {/* Soft blurred background glow */}
      <motion.div
        className="absolute inset-0 bg-[radial-gradient(circle_at_30%_40%,rgba(120,119,198,0.15),transparent_60%),radial-gradient(circle_at_80%_70%,rgba(255,180,240,0.12),transparent_70%)]"
        animate={{ opacity: [0.9, 1, 0.9] }}
        transition={{ duration: 15, repeat: Infinity, ease: "easeInOut" }}
      />

      {/* Floating glass cards */}
      <motion.div
        className="absolute top-6 left-6 flex items-center gap-2 text-sm text-gray-700 bg-white/60 backdrop-blur-md px-3 py-2 rounded-full border border-white/40 shadow-sm"
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
      >
        <User className="w-4 h-4 text-indigo-700" />
        <span>{name}</span>
      </motion.div>

      <motion.div
        className="absolute top-6 right-6 flex items-center gap-2 text-sm text-gray-700 bg-white/60 backdrop-blur-md px-3 py-2 rounded-full border border-white/40 shadow-sm"
        initial={{ opacity: 0, x: 20 }}
        animate={{ opacity: 1, x: 0 }}
      >
        <Clock className="w-4 h-4 text-indigo-700" />
        <span>
          {new Date().toLocaleTimeString("en-US", {
            hour: "numeric",
            minute: "2-digit",
          })}
        </span>
      </motion.div>

      {/* Main hero section */}
      <motion.div
        className="z-10 text-center px-4 md:px-10 max-w-4xl"
        variants={containerVariants}
        initial="hidden"
        animate="visible"
      >
        <motion.h1
          ref={titleRef}
          className="font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-blue-800 via-indigo-700 to-purple-700 text-5xl md:text-6xl leading-tight mb-8 tracking-tight animate-gradient-x"
          style={{
            backgroundSize: "200% auto",
            animation: "gradientMove 8s ease infinite",
          }}
        >
          {message}
        </motion.h1>

        <motion.p
          className="text-lg md:text-2xl text-gray-600 font-light leading-relaxed mb-12"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
        >
          Your personalized dashboard is ready — a calm space of clarity and insight, designed to help you think sharper and act smarter.
        </motion.p>

        {/* CTA Buttons */}
        <motion.div className="flex justify-center gap-5 flex-wrap">
          <motion.button
            className="relative bg-gradient-to-r from-blue-700 via-indigo-600 to-purple-600 text-white px-8 py-4 rounded-xl font-semibold text-lg shadow-lg hover:shadow-xl transition-all duration-300 group"
            variants={buttonVariants}
            whileHover="hover"
            whileTap="tap"
            onClick={() => navigate("/")}
          >
            <span className="relative z-10 flex items-center gap-2">
              Dive into Your Dashboard
              <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </span>
          </motion.button>

          <motion.button
            className="relative bg-gradient-to-r from-green-700 via-emerald-600 to-teal-600 text-white px-8 py-4 rounded-xl font-semibold text-lg shadow-lg hover:shadow-xl transition-all duration-300 group"
            variants={buttonVariants}
            whileHover="hover"
            whileTap="tap"
            onClick={() => navigate("/insights")}
          >
            <span className="relative z-10 flex items-center gap-2">
              Review Critical Insights
              <Lightbulb className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </span>
          </motion.button>
        </motion.div>
      </motion.div>

      {/* Gradient shimmer keyframes */}
      <style>{`
        @keyframes gradientMove {
          0% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
          100% { background-position: 0% 50%; }
        }
      `}</style>
    </div>
  );
};

export default Landing;
