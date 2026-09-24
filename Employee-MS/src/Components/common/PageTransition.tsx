import React, { useEffect } from "react";
import { useLocation } from "react-router-dom";
import { motion } from "framer-motion";

const PageTransition = ({ children, transitionKey }) => {
  const location = useLocation();

  // Scroll to top on route change
  useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: "instant" });
  }, [location.pathname]);

  const isAuthRoute =
    location.pathname === "/" ||
    location.pathname === "/login" ||
    location.pathname === "/signup" ||
    location.pathname === "/adminlogin";

  if (isAuthRoute) {
    return <div className="w-full min-h-screen">{children}</div>;
  }

  // Fallback to location.pathname if no transitionKey is provided
  const activeKey = transitionKey || location.pathname;

  return (
    <motion.div
      key={activeKey}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{
        duration: 0.3,
        ease: "easeInOut"
      }}
      className="w-full min-h-screen"
    >
      {children}
    </motion.div>
  );
};

export default PageTransition;
