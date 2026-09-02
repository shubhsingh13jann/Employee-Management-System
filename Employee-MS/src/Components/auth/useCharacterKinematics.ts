import { useState, useEffect } from "react";
import { UserRole, AuthStatus, ActiveField, RoleTheme } from "./auth.types";

export const roleThemes: Record<UserRole, RoleTheme> = {
  admin: {
    badgeTitle: "👑 HR ADMIN ACCESS",
    badgeDesc: "Executive Governance & Workforce Authorization",
    accent: "#8b5cf6",
    accentBg: "#ede9fe",
    border: "#c4b5fd"
  },
  manager: {
    badgeTitle: "👔 DEPARTMENT MANAGER",
    badgeDesc: "Team Operations, Approvals & KPI Oversight",
    accent: "#2563eb",
    accentBg: "#dbeafe",
    border: "#93c5fd"
  },
  supervisor: {
    badgeTitle: "👷 SHIFT SUPERVISOR",
    badgeDesc: "Field Execution, Task Routing & Direct Reports",
    accent: "#059669",
    accentBg: "#d1fae5",
    border: "#6ee7b7"
  },
  employee: {
    badgeTitle: "💼 ENTERPRISE EMPLOYEE",
    badgeDesc: "Self-Service Portal, Tasks & Attendance",
    accent: "#d97706",
    accentBg: "#fef3c7",
    border: "#fde68a"
  }
};

interface UseCharacterKinematicsParams {
  mousePos?: { x: number; y: number };
  activeField?: ActiveField;
  caretProgress?: number;
  showPassword?: boolean;
  selectedRole?: UserRole;
  authStatus?: AuthStatus;
}

export const useCharacterKinematics = ({
  mousePos = { x: 0, y: 0 },
  activeField = null,
  caretProgress = 0,
  showPassword = false,
  selectedRole = "admin",
  authStatus = "idle"
}: UseCharacterKinematicsParams) => {
  const [blink, setBlink] = useState(false);
  const [winMouse, setWinMouse] = useState({ x: 0, y: 0 });

  // 360° Global Window Mouse Tracking
  useEffect(() => {
    const handleMove = (e: MouseEvent) => {
      const x = (e.clientX / window.innerWidth - 0.5) * 2; // -1 to 1
      const y = (e.clientY / window.innerHeight - 0.5) * 2; // -1 to 1
      setWinMouse({ x, y });
    };
    window.addEventListener("mousemove", handleMove, { passive: true });
    return () => window.removeEventListener("mousemove", handleMove);
  }, []);

  // Periodic blinking cycle
  useEffect(() => {
    const interval = setInterval(() => {
      setBlink(true);
      setTimeout(() => setBlink(false), 160);
    }, 3600);
    return () => clearInterval(interval);
  }, []);

  const isPassword = activeField === "password";
  const isEmail = activeField === "email";
  const isSuccess = authStatus === "success";
  const isError = authStatus === "error";

  // Calculate Pupil Direction Vectors
  const getPupilOffset = (baseMultiplier = 1) => {
    if (isEmail) {
      // Email input is on the RIGHT panel (+X, +Y)
      const caretX = (7 + caretProgress * 7) * baseMultiplier;
      const caretY = 4.5 * baseMultiplier;
      return { x: caretX, y: caretY };
    }
    if (isPassword) {
      if (showPassword) {
        // Peek mode: ALL characters look down-right directly at password!
        return { x: 8 * baseMultiplier, y: 3.5 * baseMultiplier };
      }
      // Masked: eyes covered
      return { x: 0, y: 0 };
    }
    // 360° Global Cursor Tracking
    const mx = Math.max(-1, Math.min(1, winMouse.x || mousePos.x)) * 8 * baseMultiplier;
    const my = Math.max(-1, Math.min(1, winMouse.y || mousePos.y)) * 7 * baseMultiplier;
    return { x: mx, y: my };
  };

  const pOffset = getPupilOffset(1);
  const pOffsetSmall = getPupilOffset(0.8);
  const currentTheme = roleThemes[selectedRole] || roleThemes.admin;

  return {
    blink,
    pOffset,
    pOffsetSmall,
    isPassword,
    isEmail,
    isSuccess,
    isError,
    currentTheme
  };
};
