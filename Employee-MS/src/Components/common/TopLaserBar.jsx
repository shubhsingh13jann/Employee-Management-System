import React, { useEffect, useState } from "react";
import { useLocation } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";

const TopLaserBar = () => {
  const location = useLocation();
  const [animating, setAnimating] = useState(false);

  useEffect(() => {
    setAnimating(true);
    const timer = setTimeout(() => {
      setAnimating(false);
    }, 650);
    return () => clearTimeout(timer);
  }, [location.pathname]);

  return (
    <div
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        right: 0,
        height: "3.5px",
        zIndex: 99999,
        pointerEvents: "none",
        overflow: "hidden"
      }}
    >
      <AnimatePresence>
        {animating && (
          <motion.div
            key={location.pathname}
            initial={{ width: "0%", opacity: 1 }}
            animate={{ width: "100%", opacity: 1 }}
            exit={{ opacity: 0, transition: { duration: 0.25, ease: "easeOut" } }}
            transition={{
              duration: 0.48,
              ease: [0.16, 1, 0.3, 1]
            }}
            style={{
              height: "100%",
              background: "linear-gradient(90deg, #4f46e5 0%, #a855f7 35%, #ec4899 70%, #06b6d4 100%)",
              boxShadow: "0 0 14px 3px rgba(236, 72, 153, 0.8), 0 0 24px 6px rgba(99, 102, 241, 0.6)",
              position: "relative"
            }}
          >
            {/* Glowing White/Cyan Spark at leading laser tip */}
            <div
              style={{
                position: "absolute",
                right: 0,
                top: "-2px",
                width: "8px",
                height: "8px",
                borderRadius: "50%",
                background: "#ffffff",
                boxShadow: "0 0 10px 4px #06b6d4, 0 0 20px 8px #ffffff"
              }}
            />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default TopLaserBar;
