import React, { useEffect } from "react";
import { useLocation } from "react-router-dom";
import { motion } from "framer-motion";

const PageTransition = ({ children }) => {
  const location = useLocation();

  useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: "instant" });
  }, [location.pathname]);

  return (
    <motion.div
      key={location.pathname}
      initial={{ opacity: 0, y: 65, scale: 0.96 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{
        opacity: 0,
        scale: 0.90,
        filter: "brightness(0.6) blur(3px)",
        transition: { duration: 0.32, ease: [0.16, 1, 0.3, 1] }
      }}
      transition={{
        duration: 0.44,
        ease: [0.16, 1, 0.3, 1]
      }}
      className="w-100 min-vh-100"
      style={{ willChange: "transform, opacity, filter" }}
    >
      {children}
    </motion.div>
  );
};

export default PageTransition;
