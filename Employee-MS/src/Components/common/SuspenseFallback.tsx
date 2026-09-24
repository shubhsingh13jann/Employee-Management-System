import React from "react";

interface SuspenseFallbackProps {
  label?: string;
}

export const SuspenseFallback: React.FC<SuspenseFallbackProps> = ({
  label = "Loading portal module..."
}) => {
  return (
    <div
      className="w-full min-vh-50 flex flex-col items-center justify-center p-12"
      style={{ minHeight: "320px" }}
    >
      <div className="spinner-border text-blue-600 mb-6" role="status" style={{ width: "2.2rem", height: "2.2rem" }}>
        <span className="visually-hidden">Loading...</span>
      </div>
      <span className="text-gray-600 text-sm font-medium">{label}</span>
    </div>
  );
};

export default SuspenseFallback;
