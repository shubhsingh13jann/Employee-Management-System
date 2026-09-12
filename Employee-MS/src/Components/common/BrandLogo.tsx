import React from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";

export interface BrandLogoProps {
  /** "light" for light backgrounds (Landing navbar), "dark" for dark backgrounds (Login page, Sidebar, Footer) */
  theme?: "light" | "dark";
  /** Destination link (default: "/") */
  to?: string;
  /** Whether the logo is an active link (default: true) */
  clickable?: boolean;
  /** Subtitle tagline text (default: "Workforce Excellence") */
  subtitle?: string;
  /** Size preset: "normal" (38px cube, fs-5 title) or "sm" (30px cube, small title) */
  size?: "normal" | "sm";
  /** Optional custom CSS classes */
  className?: string;
  /** Optional click event handler */
  onClick?: (e: React.MouseEvent) => void;
}

export const BrandLogo: React.FC<BrandLogoProps> = ({
  theme = "light",
  to = "/",
  clickable = true,
  subtitle = "Workforce Excellence",
  size = "normal",
  className = "",
  onClick
}) => {
  const isSm = size === "sm";

  const content = (
    <div className={`brand-logo-root d-flex align-items-center gap-3 ${className}`}>
      {/* 3D Tilt Hover Icon Cube */}
      <motion.div
        whileHover={{ rotateY: 18, rotateX: 12, scale: 1.08 }}
        transition={{ type: "spring", stiffness: 420, damping: 22 }}
        className={`logo-cube ${isSm ? "logo-cube-sm" : ""} d-flex align-items-center justify-content-center`}
        style={{
          width: isSm ? "30px" : "38px",
          height: isSm ? "30px" : "38px",
          borderRadius: isSm ? "8px" : "10px",
          background: "linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%)",
          boxShadow: "0 8px 16px -4px rgba(79, 70, 229, 0.45)",
          flexShrink: 0,
          transformStyle: "preserve-3d"
        }}
      >
        <i className={`bi bi-box-fill text-white ${isSm ? "small" : "fs-5"}`}></i>
      </motion.div>

      {/* Brand Typography (Centered alignment so Workforce Excellence is centered with respect to Enterprise EMS) */}
      <div className="d-flex flex-column align-items-center text-center">
        <span
          className={`fw-bold tracking-tight leading-tight ${
            isSm ? "small" : "fs-5"
          } ${theme === "dark" ? "text-white" : "text-dark"}`}
          style={{ letterSpacing: "-0.02em" }}
        >
          Enterprise EMS
        </span>
        {subtitle && (
          <small
            className={theme === "dark" ? "text-white-50" : "text-muted"}
            style={{
              fontSize: isSm ? "10px" : "11px",
              letterSpacing: "0.5px",
              lineHeight: 1.2,
              marginTop: "2px",
              textAlign: "center"
            }}
          >
            {subtitle}
          </small>
        )}
      </div>
    </div>
  );

  if (clickable && to) {
    return (
      <Link
        to={to}
        onClick={onClick}
        className="text-decoration-none d-inline-flex align-items-center"
        style={{ color: "inherit" }}
      >
        {content}
      </Link>
    );
  }

  return content;
};

export default BrandLogo;

