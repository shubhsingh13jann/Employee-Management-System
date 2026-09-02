import React from "react";

interface SuspenseFallbackProps {
  label?: string;
}

export const SuspenseFallback: React.FC<SuspenseFallbackProps> = ({
  label = "Loading portal module..."
}) => {
  return (
    <div
      className="w-100 min-vh-50 d-flex flex-column align-items-center justify-content-center p-5"
      style={{ minHeight: "320px" }}
    >
      <div className="spinner-border text-primary mb-3" role="status" style={{ width: "2.2rem", height: "2.2rem" }}>
        <span className="visually-hidden">Loading...</span>
      </div>
      <span className="text-secondary small fw-medium">{label}</span>
    </div>
  );
};

export default SuspenseFallback;
