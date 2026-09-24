import React, { useState, useEffect, useRef } from "react";
import { Link, useNavigate, Outlet } from "react-router-dom";
import { motion, useScroll, useTransform, useMotionValue, useSpring, AnimatePresence } from "framer-motion";
import InteractiveBackground from "../components/common/InteractiveBackground";
import BrandLogo from "../components/common/BrandLogo";

const LandingPage = () => {
  const navigate = useNavigate();

  // Handle Button-Originated Radial Reveal Navigation
  const handleAuthNavigate = (path: "/login" | "/signup", e: React.MouseEvent<HTMLElement>) => {
    e.preventDefault();
    const rect = e.currentTarget.getBoundingClientRect();
    const origin = {
      x: Math.round(rect.left + rect.width / 2),
      y: Math.round(rect.top + rect.height / 2),
    };
    navigate(path, { state: { revealOrigin: origin } });
  };

  // Reset scroll to top and ensure manual restoration so navbar is ALWAYS visible on refresh
  useEffect(() => {
    if ("scrollRestoration" in window.history) {
      window.history.scrollRestoration = "manual";
    }
    window.scrollTo(0, 0);
  }, []);

  // Navigation & Active Stack Section State
  const [activeNavSection, setActiveNavSection] = useState("overview-sec");

  // Navbar Deck Items
  const navItems = [
    { id: "overview-sec", label: "Overview", icon: "bi-layers-fill" },
    { id: "roles-sec", label: "Role Portals", icon: "bi-person-badge-fill" },
    { id: "calc-sec", label: "ROI Calculator", icon: "bi-calculator-fill" },
    { id: "features-sec", label: "Features", icon: "bi-grid-fill" },
    { id: "faq-sec", label: "FAQ & Access", icon: "bi-shield-check" }
  ];

  // High-performance cancellable RAF scroll reference & navigation lock
  const scrollAnimRef = useRef(null);
  const isNavigatingRef = useRef(false);
  const isSnappingRef = useRef(false);

  // Silky-smooth, lag-free animated scroll with quartic easing (works perfectly backwards & forwards)
  const smoothScrollTo = (targetY, duration = 650, isSnap = false) => {
    // 1. Cancel any active animation so scrolling back never fights or stutters
    if (scrollAnimRef.current) {
      cancelAnimationFrame(scrollAnimRef.current);
      scrollAnimRef.current = null;
    }

    if (isSnap) {
      isSnappingRef.current = true;
    } else {
      isNavigatingRef.current = true;
    }

    const startY = window.pageYOffset;
    const distance = targetY - startY;

    if (Math.abs(distance) < 2) {
      window.scrollTo(0, targetY);
      isNavigatingRef.current = false;
      isSnappingRef.current = false;
      return;
    }

    let startTime = null;

    // Luxurious quartic ease-in-out: zero lag, ultra-fluid glide, elegant deceleration
    const easeInOutQuart = (t) =>
      t < 0.5 ? 8 * t * t * t * t : 1 - Math.pow(-2 * t + 2, 4) / 2;

    const step = (currentTime) => {
      if (!startTime) startTime = currentTime;
      const elapsed = currentTime - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const eased = easeInOutQuart(progress);

      window.scrollTo(0, startY + distance * eased);

      if (progress < 1) {
        scrollAnimRef.current = requestAnimationFrame(step);
      } else {
        window.scrollTo(0, targetY);
        scrollAnimRef.current = null;
        // Release locks after motion settles
        setTimeout(() => {
          isNavigatingRef.current = false;
          isSnappingRef.current = false;
        }, 60);
      }
    };

    scrollAnimRef.current = requestAnimationFrame(step);
  };

  // Cinema-Grade Card Navigation: Zero-lag navbar highlight sync + quartic glide
  const goToCard = (targetIdx, duration = 640) => {
    const clampedIdx = Math.min(Math.max(0, targetIdx), navItems.length - 1);
    const travel = window.innerHeight - 74;
    const targetY = clampedIdx * travel;

    // 1. INSTANT NAVBAR HIGHLIGHT UPDATE: 0ms delay, Framer Motion spring pill glides on frame 0
    setActiveNavSection(navItems[clampedIdx].id);

    // 2. Buttery-smooth quartic scroll glide
    smoothScrollTo(targetY, duration, false);
  };

  // Nav toggle handler: clicks on navbar buttons
  const handleNavToggle = (id) => {
    const index = navItems.findIndex((item) => item.id === id);
    if (index !== -1) {
      goToCard(index, 680);
    }
  };

  // Ultra-Smooth Wheel & Keyboard Transition Engine:
  // Eliminates jerky step-scrolling and converts wheel rolls into cinema-fluid card transitions
  useEffect(() => {
    let lastWheelTime = 0;

    const onWheel = (e) => {
      // Ignore micro-scroll drift (e.g. tiny trackpad vibrations)
      if (Math.abs(e.deltaY) < 18) return;

      const now = Date.now();
      // Cooldown debounce (520ms) ensures one deliberate wheel flick = exactly one smooth card glide
      if (isNavigatingRef.current || isSnappingRef.current || now - lastWheelTime < 520) {
        e.preventDefault();
        return;
      }

      const travel = window.innerHeight - 74;
      const scrollPos = window.scrollY;
      const currentIdx = Math.round(scrollPos / travel);

      if (e.deltaY > 0) {
        // Rolling DOWN -> Glide to Next Card
        if (currentIdx < navItems.length - 1) {
          e.preventDefault();
          lastWheelTime = now;
          goToCard(currentIdx + 1, 640);
        }
      } else if (e.deltaY < 0) {
        // Rolling UP -> Glide to Previous Card
        if (currentIdx > 0) {
          e.preventDefault();
          lastWheelTime = now;
          goToCard(currentIdx - 1, 640);
        }
      }
    };

    const onKeyDown = (e) => {
      if (["ArrowDown", "PageDown"].includes(e.key)) {
        e.preventDefault();
        const travel = window.innerHeight - 74;
        const currentIdx = Math.round(window.scrollY / travel);
        if (currentIdx < navItems.length - 1) {
          goToCard(currentIdx + 1, 640);
        }
      } else if (["ArrowUp", "PageUp"].includes(e.key)) {
        e.preventDefault();
        const travel = window.innerHeight - 74;
        const currentIdx = Math.round(window.scrollY / travel);
        if (currentIdx > 0) {
          goToCard(currentIdx - 1, 640);
        }
      }
    };

    // Passive listener for scrollbar dragging
    const onScroll = () => {
      if (isNavigatingRef.current || isSnappingRef.current) return;
      const scrollPos = window.scrollY;
      const travel = window.innerHeight - 74;
      const currentIdx = Math.min(
        Math.max(0, Math.round(scrollPos / travel)),
        navItems.length - 1
      );
      setActiveNavSection((prev) => {
        const nextId = navItems[currentIdx].id;
        return prev !== nextId ? nextId : prev;
      });
    };

    window.addEventListener("wheel", onWheel, { passive: false });
    window.addEventListener("keydown", onKeyDown);
    window.addEventListener("scroll", onScroll, { passive: true });

    return () => {
      window.removeEventListener("wheel", onWheel);
      window.removeEventListener("keydown", onKeyDown);
      window.removeEventListener("scroll", onScroll);
      if (scrollAnimRef.current) {
        cancelAnimationFrame(scrollAnimRef.current);
      }
    };
  }, []);

  // Section element refs for tracking scroll progress
  const card2Ref = useRef(null);
  const card3Ref = useRef(null);
  const card4Ref = useRef(null);
  const card5Ref = useRef(null);

  // 1. As Card 2 moves from bottom of screen (100vh) up to 74px, Card 1 PUSHES BACK (scales down, dims) while STUCK at top: 74px
  const { scrollYProgress: card2Progress } = useScroll({
    target: card2Ref,
    offset: ["start end", "start 74px"]
  });
  const card1Scale = useTransform(card2Progress, [0, 1], [1, 0.90]);
  const card1Opacity = useTransform(card2Progress, [0, 0.4, 0.9, 1], [1, 0.95, 0.25, 0]);
  const card1Filter = useTransform(
    card2Progress,
    [0, 1],
    ["brightness(1)", "brightness(0.7)"]
  );
  const card1Radius = useTransform(card2Progress, [0, 0.2], ["0px", "28px"]);

  // 2. As Card 3 moves from bottom of screen up to 74px, Card 2 PUSHES BACK while STUCK at top: 74px
  const { scrollYProgress: card3Progress } = useScroll({
    target: card3Ref,
    offset: ["start end", "start 74px"]
  });
  const card2Scale = useTransform(card3Progress, [0, 1], [1, 0.90]);
  const card2Opacity = useTransform(card3Progress, [0, 0.4, 0.9, 1], [1, 0.95, 0.25, 0]);
  const card2Filter = useTransform(
    card3Progress,
    [0, 1],
    ["brightness(1)", "brightness(0.7)"]
  );

  // 3. As Card 4 moves from bottom of screen up to 74px, Card 3 PUSHES BACK while STUCK at top: 74px
  const { scrollYProgress: card4Progress } = useScroll({
    target: card4Ref,
    offset: ["start end", "start 74px"]
  });
  const card3Scale = useTransform(card4Progress, [0, 1], [1, 0.90]);
  const card3Opacity = useTransform(card4Progress, [0, 0.4, 0.9, 1], [1, 0.95, 0.25, 0]);
  const card3Filter = useTransform(
    card4Progress,
    [0, 1],
    ["brightness(1)", "brightness(0.7)"]
  );

  // 4. As Card 5 moves from bottom of screen up to 74px, Card 4 PUSHES BACK while STUCK at top: 74px
  const { scrollYProgress: card5Progress } = useScroll({
    target: card5Ref,
    offset: ["start end", "start 74px"]
  });
  const card4Scale = useTransform(card5Progress, [0, 1], [1, 0.90]);
  const card4Opacity = useTransform(card5Progress, [0, 0.4, 0.9, 1], [1, 0.95, 0.25, 0]);
  const card4Filter = useTransform(
    card5Progress,
    [0, 1],
    ["brightness(1)", "brightness(0.7)"]
  );

  // 360° Interactive 3D Mouse Parallax (Dynamic Magnetic Pull on Hover)
  const [isHoveredShowcase, setIsHoveredShowcase] = useState(false);
  const showcaseMouseX = useMotionValue(0);
  const showcaseMouseY = useMotionValue(0);

  // Smooth, magnetic 3D pull physics
  const tiltSpring = { damping: 22, stiffness: 220, mass: 0.4 };
  const pullRotateX = useSpring(useTransform(showcaseMouseY, [-0.5, 0.5], [8, -8]), tiltSpring);
  const pullRotateY = useSpring(useTransform(showcaseMouseX, [-0.5, 0.5], [-10, 10]), tiltSpring);

  const handleShowcaseMouseMove = (e) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = (e.clientX - rect.left) / rect.width - 0.5;
    const y = (e.clientY - rect.top) / rect.height - 0.5;
    showcaseMouseX.set(x);
    showcaseMouseY.set(y);
    if (!isHoveredShowcase) setIsHoveredShowcase(true);
  };

  const handleShowcaseMouseEnter = () => {
    setIsHoveredShowcase(true);
  };

  const handleShowcaseMouseLeave = () => {
    setIsHoveredShowcase(false);
    showcaseMouseX.set(0);
    showcaseMouseY.set(0);
  };

  // Hero Dynamic Word Cycler
  const words = ["Excellence.", "Efficiency.", "Productivity.", "Innovation."];
  const [wordIndex, setWordIndex] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setWordIndex((prev) => (prev + 1) % words.length);
    }, 2800);
    return () => clearInterval(timer);
  }, []);

  // Real-time Clock in Mock Dashboard
  const [currentTime, setCurrentTime] = useState("");
  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setCurrentTime(
        now.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" })
      );
    };
    updateTime();
    const clockTimer = setInterval(updateTime, 1000);
    return () => clearInterval(clockTimer);
  }, []);

  // Dynamic Greeting based on current hour
  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return "Good morning";
    if (hour < 17) return "Good afternoon";
    return "Good evening";
  };

  // Mock Dashboard Interactive States
  const [activeSidebarTab, setActiveSidebarTab] = useState("Dashboard");
  const [searchQuery, setSearchQuery] = useState("");
  const [notifOpen, setNotifOpen] = useState(false);
  const [unreadNotifs, setUnreadNotifs] = useState(3);
  const [selectedStat, setSelectedStat] = useState("employees");
  const [graphTimeframe, setGraphTimeframe] = useState("This Month");
  const [hoveredGraphPoint, setHoveredGraphPoint] = useState(null);
  const [hoveredDept, setHoveredDept] = useState(null);
  const [hoveredDonutSegment, setHoveredDonutSegment] = useState(null);
  const [hoveredApproval, setHoveredApproval] = useState(null);
  const [approvedItems, setApprovedItems] = useState({});

  // 4-Tier Role Showcase Tab State
  const [activeRoleTab, setActiveRoleTab] = useState("admin");

  // Interactive ROI Calculator State
  const [employeeCount, setEmployeeCount] = useState(85);

  // FAQ Accordion State
  const [openFaq, setOpenFaq] = useState(0);

  // Timeframe-specific Graph data sets
  const timeframeData = {
    Today: {
      points: [
        { index: 0, x: 20, y: 80, label: "09:00", count: 218, change: "+1.2%" },
        { index: 1, x: 100, y: 60, label: "12:00", count: 235, change: "+4.5%" },
        { index: 2, x: 190, y: 50, label: "14:00", count: 242, change: "+6.8%" },
        { index: 3, x: 285, y: 40, label: "16:00", count: 246, change: "+8.9%" },
        { index: 4, x: 375, y: 35, label: "18:00", count: 248, change: "+12.0%" }
      ],
      path: "M0,85 Q50,75 100,60 T190,50 T285,40 T375,35 L400,38 L400,120 L0,120 Z",
      line: "M0,85 Q50,75 100,60 T190,50 T285,40 T375,35 L400,38"
    },
    "This Week": {
      points: [
        { index: 0, x: 20, y: 90, label: "Mon", count: 230, change: "+2.1%" },
        { index: 1, x: 100, y: 75, label: "Tue", count: 236, change: "+3.9%" },
        { index: 2, x: 190, y: 65, label: "Wed", count: 240, change: "+5.4%" },
        { index: 3, x: 285, y: 55, label: "Thu", count: 244, change: "+8.2%" },
        { index: 4, x: 375, y: 45, label: "Fri", count: 248, change: "+12.0%" }
      ],
      path: "M0,95 Q50,85 100,75 T190,65 T285,55 T375,45 L400,50 L400,120 L0,120 Z",
      line: "M0,95 Q50,85 100,75 T190,65 T285,55 T375,45 L400,50"
    },
    "This Month": {
      points: [
        { index: 0, x: 20, y: 85, label: "May 1", count: 212, change: "+3.0%" },
        { index: 1, x: 100, y: 65, label: "May 8", count: 220, change: "+5.2%" },
        { index: 2, x: 190, y: 72, label: "May 15", count: 228, change: "+7.1%" },
        { index: 3, x: 285, y: 45, label: "May 22", count: 239, change: "+10.4%" },
        { index: 4, x: 375, y: 52, label: "May 29", count: 248, change: "+12.0%" }
      ],
      path: "M0,85 Q50,75 100,65 T190,72 T285,45 T375,52 L400,60 L400,120 L0,120 Z",
      line: "M0,85 Q50,75 100,65 T190,72 T285,45 T375,52 L400,60"
    },
    "This Year": {
      points: [
        { index: 0, x: 20, y: 100, label: "Q1", count: 180, change: "+15%" },
        { index: 1, x: 100, y: 80, label: "Q2", count: 205, change: "+22%" },
        { index: 2, x: 190, y: 65, label: "Q3", count: 226, change: "+29%" },
        { index: 3, x: 285, y: 50, label: "Q4", count: 248, change: "+38%" },
        { index: 4, x: 375, y: 40, label: "Est.", count: 270, change: "+45%" }
      ],
      path: "M0,105 Q50,95 100,80 T190,65 T285,50 T375,40 L400,45 L400,120 L0,120 Z",
      line: "M0,105 Q50,95 100,80 T190,65 T285,50 T375,40 L400,45"
    }
  };

  const activeCurve = timeframeData[graphTimeframe] || timeframeData["This Month"];
  const activePt = hoveredGraphPoint || activeCurve.points[activeCurve.points.length - 1];

  // Complete departments list
  const initialDepts = [
    { name: "Engineering", count: 86, color: "bg-primary", glow: "#3b82f6", pct: 38 },
    { name: "Marketing", count: 45, color: "bg-purple", glow: "#8b5cf6", pct: 20 },
    { name: "Sales", count: 38, color: "bg-info", glow: "#06b6d4", pct: 17 },
    { name: "Human Resources", count: 32, color: "bg-success", glow: "#10b981", pct: 14 },
    { name: "Finance", count: 28, color: "bg-warning", glow: "#f59e0b", pct: 11 }
  ];

  const filteredDepts = initialDepts.filter((d) =>
    d.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="bg-slate-50 text-slate-900 landing-container relative" style={{ overflowX: "clip" }}>
      {/* 1. FIXED TOP NAVBAR - ALWAYS VISIBLE, NEVER DISAPPEARS (zIndex: 9999) */}
      <nav
        className="navbar navbar-expand-lg py-2 px-6 px-lg-5 fixed-top bg-white bg-opacity-95 backdrop-blur border-b border-gray-200 border-light shadow-xs"
        style={{ height: "74px", zIndex: 9999 }}
      >
        <div className="w-full px-6 p-0 flex justify-between items-center">
          {/* Brand Logo with 3D Tilt Hover */}
          <BrandLogo theme="light" />

          {/* Interactive Stack Navigation Toggles with Spring Pill */}
          <div className="hidden lg:flex items-center gap-1 bg-slate-100 p-1 rounded-full border border-gray-200 shadow-2xs relative">
            {navItems.map((item) => (
              <button
                key={item.id}
                type="button"
                onClick={() => handleNavToggle(item.id)}
                style={{ isolation: "isolate" }}
                className={`nav-toggle-btn flex items-center gap-1.5 ${
                  activeNavSection === item.id ? "active text-white" : "text-slate-600 hover:text-slate-900"
                }`}
              >
                {activeNavSection === item.id && (
                  <motion.div
                    layoutId="activeNavIndicator"
                    className="nav-toggle-active-bg"
                    transition={{ type: "spring", stiffness: 450, damping: 32 }}
                  />
                )}
                <i className={`bi ${item.icon} text-xs`}></i>
                <span>{item.label}</span>
              </button>
            ))}
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-2">
            <motion.div whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.96 }}>
              <button
                type="button"
                onClick={(e) => handleAuthNavigate("/login", e)}
                className="px-4 py-2 rounded-lg text-sm font-semibold border border-slate-300 text-slate-700 hover:bg-slate-50 transition-colors flex items-center gap-2 shadow-xs cursor-pointer"
              >
                <i className="bi bi-person text-base"></i>
                <span>Login</span>
              </button>
            </motion.div>
            <motion.div whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.96 }}>
              <button
                type="button"
                onClick={(e) => handleAuthNavigate("/signup", e)}
                className="btn-gradient-primary px-5 py-2 rounded-lg text-sm font-semibold text-white shadow-sm flex items-center gap-2 transition-all cursor-pointer"
              >
                <i className="bi bi-person-plus-fill text-base"></i>
                <span>Sign Up</span>
              </button>
            </motion.div>
          </div>
        </div>
      </nav>

      {/* 2. THE SINGLE CARDS STACK CONTAINER */}
      <div
        className="cards-stack-container relative bg-slate-50"
        style={{ paddingTop: "74px", overflowX: "clip" }}
      >

        {/* ============================================================
            CARD 1: OVERVIEW & 3D DASHBOARD (STICKS AT TOP: 74PX, PUSHES BACK WHEN CARD 2 ENTERS)
            ============================================================ */}
        <motion.div
          id="overview-sec"
          style={{
            position: "sticky",
            top: "74px",
            height: "calc(100vh - 74px)",
            zIndex: 1,
            scale: card1Scale,
            opacity: card1Opacity,
            filter: card1Filter,
            borderRadius: card1Radius,
            transformOrigin: "top center",
            willChange: "transform, opacity"
          }}
          className="bg-white w-full flex flex-col justify-center items-center overflow-y-auto"
        >
          <div className="w-full h-full relative flex items-center justify-center px-6 px-lg-5 overflow-hidden hero-interactive-section">
            <InteractiveBackground />

            <div className="ambient-orb orb-1"></div>
            <div className="ambient-orb orb-2"></div>
            <div className="ambient-orb orb-3"></div>

            <div className="w-full px-6 p-0 relative z-1 my-auto">
              <div className="flex flex-wrap -mx-4 items-center g-4">
                {/* Hero Content */}
                <div className="w-full px-6 xl:w-5/12 px-6">
                  <div className="inline-flex items-center gap-2 px-6 py-1.5 rounded-full bg-purple-soft text-purple-deep mb-6 border border-gray-200 border-gray-200 border-purple-subtle shadow-2xs hover-scale transition-all cursor-pointer">
                    <span className="pulse-dot"></span>
                    <span className="text-sm font-semibold">Trusted by 1000+ Organizations Worldwide</span>
                  </div>

                  <h1 className="hero-heading font-extrabold text-gray-900 tracking-tight mb-2">
                    Manage People.<br />
                    Empower Teams.<br />
                    Drive{" "}
                    <AnimatePresence mode="wait">
                      <motion.span
                        key={words[wordIndex]}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        transition={{ duration: 0.28 }}
                        className="text-gradient inline-block"
                      >
                        {words[wordIndex]}
                      </motion.span>
                    </AnimatePresence>
                  </h1>

                  <p className="hero-subtext text-gray-600 mb-6 leading-relaxed" style={{ fontSize: "1rem" }}>
                    Enterprise EMS is the all-in-one workforce operating system built with dedicated roles for{" "}
                    <strong className="text-gray-900">HR Admins</strong>, <strong className="text-gray-900">Managers</strong>,{" "}
                    <strong className="text-gray-900">Supervisors</strong>, and <strong className="text-gray-900">Staff</strong>.
                  </p>

                  <div className="flex flex-wrap items-center gap-6 mb-6">
                    <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.96 }}>
                      <button
                        type="button"
                        onClick={(e) => handleAuthNavigate("/signup", e)}
                        className="px-6 py-2 rounded font-medium transition-colors cursor-pointer inline-block text-center btn-gradient-primary btn-lg px-6 py-2 rounded-lg font-bold inline-flex items-center gap-2 text-white shadow-md hero-btn"
                      >
                        <span>Get Started Free</span>
                        <i className="bi bi-arrow-right"></i>
                      </button>
                    </motion.div>
                    <motion.div whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}>
                      <button
                        type="button"
                        onClick={() => handleNavToggle("roles-sec")}
                        className="px-6 py-2 rounded font-medium transition-colors cursor-pointer inline-block text-center border border-gray-200 border-gray-500 text-gray-500 hover:bg-gray-50 btn-lg px-6 py-2 rounded-lg font-semibold inline-flex items-center gap-2 hero-btn-secondary hover-lift"
                      >
                        <span>Explore Next Layer</span>
                        <i className="bi bi-arrow-down text-base"></i>
                      </button>
                    </motion.div>
                  </div>

                  {/* 3 Value Pillars */}
                  <div className="flex flex-wrap -mx-4 g-2 pt-2 border-t border-gray-200 border-light">
                    {[
                      { title: "Enterprise Secure", desc: "Bank-level bcrypt & JWT security", icon: "bi-shield-check", color: "text-primary bg-purple-soft" },
                      { title: "Smart Automation", desc: "Two-tier approvals & task sync", icon: "bi-lightning-charge-fill", color: "text-success bg-success bg-opacity-10" },
                      { title: "People-Centric", desc: "Custom portals for every employee", icon: "bi-people-fill", color: "text-info bg-info bg-opacity-10" }
                    ].map((pillar) => (
                      <div key={pillar.title} className="w-1/3 px-6">
                        <motion.div
                          whileHover={{ y: -3, scale: 1.02 }}
                          className="flex align-items-start gap-1.5 p-1 rounded-lg hover-bg transition-all cursor-pointer"
                        >
                          <div className={`p-1.5 rounded-2 shadow-2xs ${pillar.color}`}>
                            <i className={`bi ${pillar.icon} fs-6`}></i>
                          </div>
                          <div>
                            <h6 className="font-bold mb-0 text-gray-900" style={{ fontSize: "11px" }}>{pillar.title}</h6>
                            <small className="text-gray-500 block" style={{ fontSize: "9px" }}>{pillar.desc}</small>
                          </div>
                        </motion.div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* COMPLETE, ADVANCED, FULLY-DETAILED 3D LIVING DASHBOARD SHOWCASE */}
                <div className="w-full px-6 xl:w-7/12 px-6" id="showcase">
                  <div className="showcase-3d-wrapper relative">
                    {/* Floating Interactive Tag - Positively Anchored on the Left */}
                    <div
                      style={{ position: "absolute", top: "-16px", left: "20px", right: "auto", zIndex: 30 }}
                      className="showcase-floating-tag bg-slate-900 text-white px-4 py-1.5 rounded-full shadow-lg inline-flex items-center gap-2 border border-white/20 backdrop-blur-md pointer-events-none"
                    >
                      <span className="pulse-dot"></span>
                      <small className="font-bold text-xs">Interactive 3D Preview • Dynamic 360° Tilt & Full Controls</small>
                    </div>

                    {/* THE 3D POP-OUT CARD (Omni-Float when idle + Dynamic 3D Pull on Hover + 100% Clickable) */}
                    <motion.div
                      onMouseMove={handleShowcaseMouseMove}
                      onMouseEnter={handleShowcaseMouseEnter}
                      onMouseLeave={handleShowcaseMouseLeave}
                      style={{
                        rotateX: isHoveredShowcase ? pullRotateX : 0,
                        rotateY: isHoveredShowcase ? pullRotateY : 0,
                        scale: isHoveredShowcase ? 1.025 : 1,
                        transformStyle: "preserve-3d",
                        transition: isHoveredShowcase
                          ? "scale 0.25s ease-out"
                          : "scale 0.4s ease-out, rotateX 0.4s ease-out, rotateY 0.4s ease-out"
                      }}
                      className={`showcase-dashboard-card rounded-4 shadow-2xl overflow-hidden border border-slate-200 bg-white position-relative ${
                        !isHoveredShowcase ? "omni-floating" : ""
                      }`}
                    >
                      <div className="flex flex-row" style={{ minHeight: "530px" }}>
                        {/* Full 10-Tab Mock Dark Sidebar */}
                        <div className="mock-sidebar p-6 flex flex-col justify-between text-white" style={{ width: "205px", background: "#0b1329" }}>
                          <div>
                            {/* Sidebar Brand */}
                            <div className="mb-6 px-1">
                              <BrandLogo theme="dark" size="sm" clickable={false} />
                            </div>

                            {/* Full 10 Interactive Sidebar Items */}
                            <ul className="nav nav-pills flex-col gap-1 list-unstyled p-0 m-0">
                              {[
                                { name: "Dashboard", icon: "bi-speedometer2" },
                                { name: "Departments", icon: "bi-building" },
                                { name: "User Directory", icon: "bi-people" },
                                { name: "Team Hierarchy", icon: "bi-diagram-3" },
                                { name: "Projects", icon: "bi-kanban" },
                                { name: "Reports & Analytics", icon: "bi-graph-up" },
                                { name: "Requests", icon: "bi-inbox" },
                                { name: "Payroll", icon: "bi-cash-stack" },
                                { name: "System Settings", icon: "bi-gear" },
                                { name: "Audit Logs", icon: "bi-shield-shaded" }
                              ].map((item) => (
                                <li key={item.name}>
                                  <button
                                    type="button"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      setActiveSidebarTab(item.name);
                                    }}
                                    className={`w-100 text-start d-flex align-items-center gap-2 px-2 py-1 rounded-2 text-white border-0 transition-all ${
                                      activeSidebarTab === item.name
                                        ? "bg-primary fw-bold shadow-xs scale-102"
                                        : "bg-transparent text-white-50 hover-light"
                                    }`}
                                    style={{ fontSize: "10.5px" }}
                                  >
                                    <i className={`bi ${item.icon}`}></i>
                                    <span>{item.name}</span>
                                  </button>
                                </li>
                              ))}
                            </ul>
                          </div>

                          {/* Sidebar Footer System Status */}
                          <div className="p-2 rounded mt-2" style={{ background: "rgba(255, 255, 255, 0.08)", border: "1px solid rgba(255, 255, 255, 0.12)" }}>
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-1.5">
                                <span className="pulse-dot-green"></span>
                                <small className="text-white font-semibold" style={{ fontSize: "9.5px" }}>System Status</small>
                              </div>
                              <span className="badge bg-green-600 bg-opacity-25 text-green-600 text-sm" style={{ fontSize: "8px" }}>Live</span>
                            </div>
                            <small className="text-white-50 block mt-0.5" style={{ fontSize: "8.5px" }}>
                              All 4 services operational • {currentTime}
                            </small>
                          </div>
                        </div>

                        {/* Mock Main Dashboard Body */}
                        <div className="mock-body flex-grow-1 p-6 bg-slate-50 overflow-hidden flex flex-col gap-2.5 relative">
                          {/* Interactive Topbar */}
                          <div className="flex justify-between items-center pb-2 border-b border-gray-200 border-light">
                            <div>
                              <h6 className="font-bold mb-0 text-gray-900 flex items-center gap-1.5" style={{ fontSize: "12.5px" }}>
                                {getGreeting()}, Shubh Singh! 👋
                              </h6>
                              <small className="text-gray-500" style={{ fontSize: "10px" }}>
                                Viewing active module: <span className="text-blue-600 font-semibold">{activeSidebarTab}</span>
                              </small>
                            </div>

                            <div className="flex items-center gap-2 relative">
                              {/* Live Search Input */}
                              <div className="hidden md:flex items-center gap-1 bg-white px-2 py-1 rounded-full border border-gray-200 border-gray-200 shadow-2xs">
                                <i className="bi bi-search text-gray-500 text-sm"></i>
                                <input
                                  type="text"
                                  placeholder="Search departments..."
                                  className="border-0 bg-transparent text-sm outline-none"
                                  style={{ width: "135px", fontSize: "10px" }}
                                  value={searchQuery}
                                  onChange={(e) => setSearchQuery(e.target.value)}
                                />
                                {searchQuery ? (
                                  <i className="bi bi-x-circle text-gray-500 cursor-pointer text-sm" onClick={() => setSearchQuery("")}></i>
                                ) : (
                                  <kbd className="bg-gray-50 text-gray-500 border border-gray-200 border-gray-200 px-1 rounded text-sm" style={{ fontSize: "8.5px" }}>⌘K</kbd>
                                )}
                              </div>

                              {/* Interactive Notification Bell */}
                              <div
                                className="relative p-1.5 bg-white rounded-full border border-gray-200 border-gray-200 shadow-2xs cursor-pointer hover-scale transition-all"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setNotifOpen(!notifOpen);
                                }}
                              >
                                <i className="bi bi-bell text-gray-600 text-sm"></i>
                                {unreadNotifs > 0 && (
                                  <span className="absolute top-0 left-full -translate-x-1/2 -translate-y-1/2 badge rounded-full bg-red-600" style={{ fontSize: "7px" }}>
                                    {unreadNotifs}
                                  </span>
                                )}

                                {/* Notification Popup Dropdown */}
                                {notifOpen && (
                                  <div
                                    className="absolute top-100 right-0 mt-2 bg-white rounded-lg shadow-xl border border-gray-200 border-gray-200 border-light p-2.5 text-left animate-fade-in"
                                    style={{ width: "220px", zIndex: 100 }}
                                    onClick={(e) => e.stopPropagation()}
                                  >
                                    <div className="flex justify-between items-center mb-1 pb-1 border-b border-gray-200">
                                      <strong className="text-gray-900 text-sm">Notifications</strong>
                                      <small
                                        className="text-blue-600 cursor-pointer hover-underline"
                                        style={{ fontSize: "9px" }}
                                        onClick={() => setUnreadNotifs(0)}
                                      >
                                        Mark all read
                                      </small>
                                    </div>
                                    <div className="flex flex-col gap-1">
                                      <div className="p-1 rounded bg-gray-50 text-sm">
                                        <small className="font-bold block text-gray-900" style={{ fontSize: "9.5px" }}>Leave request from Alex</small>
                                        <small className="text-gray-500" style={{ fontSize: "8px" }}>Casual leave • 2 days</small>
                                      </div>
                                      <div className="p-1 rounded bg-gray-50 text-sm">
                                        <small className="font-bold block text-gray-900" style={{ fontSize: "9.5px" }}>May Payroll Generated</small>
                                        <small className="text-gray-500" style={{ fontSize: "8px" }}>$1.24M processed</small>
                                      </div>
                                    </div>
                                  </div>
                                )}
                              </div>

                              {/* User Profile Pill */}
                              <div className="flex items-center gap-1.5 bg-white p-1 rounded-full border border-gray-200 border-gray-200 shadow-2xs hover-lift transition-all">
                                <div className="bg-blue-600 text-white rounded-full font-bold flex items-center justify-center" style={{ width: "22px", height: "22px", fontSize: "9px" }}>
                                  S
                                </div>
                                <div className="pe-1 text-left">
                                  <small className="font-bold text-gray-900 block leading-none" style={{ fontSize: "9.5px" }}>Shubh Singh</small>
                                  <small className="text-green-600 leading-none font-semibold" style={{ fontSize: "7.5px" }}>Online 🟢</small>
                                </div>
                              </div>
                            </div>
                          </div>

                          {/* 4 Interactive Stat Cards with Colored Badges */}
                          <div className="flex flex-wrap -mx-4 g-2">
                            {[
                              { id: "employees", label: "Total Employees", val: "248", change: "↑ 12% last mo", icon: "bi-people", color: "purple" },
                              { id: "departments", label: "Departments", val: "18", change: "↑ 2 new", icon: "bi-building", color: "blue" },
                              { id: "projects", label: "Active Projects", val: "32", change: "↑ 8 active", icon: "bi-kanban", color: "green" },
                              { id: "payroll", label: "Total Payroll", val: "$1.24M", change: "↑ 8.5% mo", icon: "bi-cash-stack", color: "orange" }
                            ].map((stat) => (
                              <div key={stat.id} className="col-3">
                                <div
                                  onClick={() => setSelectedStat(stat.id)}
                                  className={`card border-0 p-1.5 rounded-3 bg-white transition-all stat-card-interactive ${
                                    selectedStat === stat.id ? "stat-card-active shadow-md" : "shadow-xs"
                                  }`}
                                >
                                  <div className="flex justify-between align-items-start">
                                    <div>
                                      <small className="text-gray-500 font-semibold" style={{ fontSize: "9px" }}>{stat.label}</small>
                                      <h6 className={`fw-bold mb-0 text-dark transition-all ${selectedStat === stat.id ? "text-primary scale-105" : ""}`} style={{ fontSize: "13px" }}>
                                        {stat.val}
                                      </h6>
                                      <small className="text-green-600 font-bold block" style={{ fontSize: "8px" }}>{stat.change}</small>
                                    </div>
                                    <div className={`p-1 rounded-circle transition-all stat-icon-badge ${stat.color} ${selectedStat === stat.id ? "rotate-12 scale-110" : ""}`}>
                                      <i className={`bi ${stat.icon}`} style={{ fontSize: "11px" }}></i>
                                    </div>
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>

                          {/* Middle Row: Full Area Chart + Pending Approvals */}
                          <div className="flex flex-wrap -mx-4 g-2">
                            {/* Workforce Overview Chart Card */}
                            <div className="col-8">
                              <div className="bg-white rounded-lg border border-gray-200 border-gray-200 shadow-sm flex flex-col border-0 shadow-xs p-2 rounded-lg bg-white h-full transition-all chart-container-card chart-card-glow">
                                <div className="flex justify-between items-center mb-1">
                                  <div className="flex items-center gap-1.5">
                                    <h6 className="font-bold mb-0 text-gray-900" style={{ fontSize: "11px" }}>Workforce Overview</h6>
                                    <span className="badge bg-purple-soft text-blue-600 animate-fade-in" style={{ fontSize: "8px" }}>
                                      ● {activePt.label}: {activePt.count} Staff ({activePt.change})
                                    </span>
                                  </div>

                                  {/* Timeframe Filter Buttons */}
                                  <div className="flex gap-1 bg-gray-50 p-0.5 rounded border border-gray-200 border-gray-200">
                                    {["Today", "This Week", "This Month", "This Year"].map((tf) => (
                                      <button
                                        key={tf}
                                        type="button"
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          setGraphTimeframe(tf);
                                          setHoveredGraphPoint(null);
                                        }}
                                        className={`btn btn-xs py-0 px-1 border-0 rounded ${
                                          graphTimeframe === tf ? "bg-white fw-bold text-primary shadow-xs" : "text-muted"
                                        }`}
                                        style={{ fontSize: "8px" }}
                                      >
                                        {tf}
                                      </button>
                                    ))}
                                  </div>
                                </div>

                                {/* Interactive SVG Area Chart with Crosshair Laser & Pulse Ring */}
                                <div className="relative w-full my-0.5 cursor-crosshair" style={{ height: "100px" }}>
                                  {hoveredGraphPoint && (
                                    <div
                                      className="absolute bg-gray-900 text-white px-2 py-0.5 rounded shadow-lg pointer-events-none transition-all"
                                      style={{
                                        left: `${(hoveredGraphPoint.x / 400) * 100}%`,
                                        top: `${(hoveredGraphPoint.y / 120) * 100 - 30}%`,
                                        transform: "translate(-50%, -100%)",
                                        fontSize: "9px",
                                        whiteSpace: "nowrap",
                                        zIndex: 5
                                      }}
                                    >
                                      <span className="font-bold">{hoveredGraphPoint.count} Active</span>
                                      <small className="text-green-600 ml-1">({hoveredGraphPoint.change})</small>
                                    </div>
                                  )}

                                  <svg viewBox="0 0 400 120" className="w-full h-full overflow-visible">
                                    <defs>
                                      <linearGradient id="superChartGrad" x1="0%" y1="0%" x2="0%" y2="100%">
                                        <stop offset="0%" stopColor="#6366f1" stopOpacity="0.45" />
                                        <stop offset="100%" stopColor="#6366f1" stopOpacity="0.0" />
                                      </linearGradient>
                                    </defs>

                                    <line x1="0" y1="30" x2="400" y2="30" stroke="#f1f5f9" strokeWidth="1" />
                                    <line x1="0" y1="60" x2="400" y2="60" stroke="#f1f5f9" strokeWidth="1" />
                                    <line x1="0" y1="90" x2="400" y2="90" stroke="#f1f5f9" strokeWidth="1" />

                                    <path d={activeCurve.path} fill="url(#superChartGrad)" />
                                    <path
                                      d={activeCurve.line}
                                      fill="none"
                                      stroke="#6366f1"
                                      strokeWidth="2.8"
                                      strokeLinecap="round"
                                      className="chart-wave-glow"
                                    />

                                    <line
                                      x1={activePt.x}
                                      y1={activePt.y}
                                      x2={activePt.x}
                                      y2="120"
                                      stroke="#818cf8"
                                      strokeWidth="1.5"
                                      strokeDasharray="3 3"
                                    />

                                    {activeCurve.points.map((pt) => (
                                      <g key={pt.index} onMouseEnter={() => setHoveredGraphPoint(pt)}>
                                        <circle cx={pt.x} cy={pt.y} r="14" fill="transparent" className="cursor-pointer" />
                                        <circle
                                          cx={pt.x}
                                          cy={pt.y}
                                          r={activePt.index === pt.index ? "5.5" : "3"}
                                          fill={activePt.index === pt.index ? "#ffffff" : "#6366f1"}
                                          stroke="#6366f1"
                                          strokeWidth={activePt.index === pt.index ? "2.5" : "1.5"}
                                        />
                                        {activePt.index === pt.index && (
                                          <circle cx={pt.x} cy={pt.y} r="10" fill="#6366f1" opacity="0.25" className="pulse-ring" />
                                        )}
                                      </g>
                                    ))}
                                  </svg>
                                </div>

                                {/* 4 Mini metrics at bottom of chart */}
                                <div className="flex flex-wrap -mx-4 g-1 pt-1.5 border-t border-gray-200 border-light">
                                  {[
                                    { title: "New Hires", val: "15", badge: "↑ 28%", badgeColor: "text-success" },
                                    { title: "Attrition", val: "2.4%", badge: "↓ 0.8%", badgeColor: "text-danger" },
                                    { title: "Avg. Tenure", val: "2.8 Yrs", badge: "↑ 0.6", badgeColor: "text-primary" },
                                    { title: "Satisfaction", val: "4.6/5", badge: "★ 0.3", badgeColor: "text-success" }
                                  ].map((m) => (
                                    <div key={m.title} className="col-3">
                                      <div className="p-0.5 bg-gray-50 rounded text-center transition-all hover-lift cursor-pointer">
                                        <small className="text-gray-500 block" style={{ fontSize: "7.5px" }}>{m.title}</small>
                                        <strong className="text-gray-900 block" style={{ fontSize: "9.5px" }}>
                                          {m.val} <span className={m.badgeColor} style={{ fontSize: "7.5px" }}>{m.badge}</span>
                                        </strong>
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            </div>

                            {/* Pending Approvals Card with Instant Action */}
                            <div className="w-1/3 px-6">
                              <div className="bg-white rounded-lg border border-gray-200 border-gray-200 shadow-sm flex flex-col border-0 shadow-xs p-2 rounded-lg bg-white h-full">
                                <div className="flex justify-between items-center mb-1.5">
                                  <h6 className="font-bold mb-0 text-gray-900" style={{ fontSize: "11px" }}>Pending Approvals</h6>
                                  <span className="badge bg-red-600 bg-opacity-10 text-red-600 text-sm" style={{ fontSize: "7.5px" }}>Action</span>
                                </div>

                                <div className="flex flex-col gap-1">
                                  {[
                                    { id: 1, title: "Leave Requests", count: "3 pending", icon: "bi-calendar-check", color: "text-danger bg-danger" },
                                    { id: 2, title: "Dept Changes", count: "1 pending", icon: "bi-diagram-3", color: "text-info bg-info" },
                                    { id: 3, title: "Team Assign", count: "1 pending", icon: "bi-person-badge", color: "text-primary bg-primary" },
                                    { id: 4, title: "Salary Approvals", count: "2 pending", icon: "bi-cash", color: "text-warning bg-warning" }
                                  ].map((item) => (
                                    <div
                                      key={item.id}
                                      className={`d-flex justify-content-between align-items-center p-1 rounded transition-all cursor-pointer ${
                                        hoveredApproval === item.id ? "bg-light shadow-2xs translate-x-2" : "bg-light border border-light"
                                      }`}
                                      onMouseEnter={() => setHoveredApproval(item.id)}
                                      onMouseLeave={() => setHoveredApproval(null)}
                                    >
                                      <div className="flex items-center gap-1">
                                        <div className={`p-1 rounded ${item.color} bg-opacity-10 transition-all ${hoveredApproval === item.id ? "scale-110" : ""}`}>
                                          <i className={`bi ${item.icon}`} style={{ fontSize: "9px" }}></i>
                                        </div>
                                        <div>
                                          <span className="font-bold text-gray-900 block leading-none" style={{ fontSize: "9px" }}>{item.title}</span>
                                          <small className="text-gray-500" style={{ fontSize: "7.5px" }}>
                                            {approvedItems[item.id] ? <span className="text-green-600 font-bold">✓ Done</span> : item.count}
                                          </small>
                                        </div>
                                      </div>

                                      {hoveredApproval === item.id && !approvedItems[item.id] ? (
                                        <button
                                          type="button"
                                          onClick={(e) => {
                                            e.stopPropagation();
                                            setApprovedItems({ ...approvedItems, [item.id]: true });
                                          }}
                                          className="px-6 py-2 rounded font-medium transition-colors cursor-pointer inline-block text-center btn-xs bg-blue-600 text-white hover:bg-blue-700 py-0 px-1 rounded text-sm"
                                          style={{ fontSize: "7.5px" }}
                                        >
                                          Approve
                                        </button>
                                      ) : (
                                        <i className="bi bi-chevron-right text-gray-500" style={{ fontSize: "8px" }}></i>
                                      )}
                                    </div>
                                  ))}
                                </div>
                              </div>
                            </div>
                          </div>

                          {/* Bottom Row: Top Departments Progress Bars & Segmented Donut Chart */}
                          <div className="bg-white rounded-lg border border-gray-200 border-gray-200 shadow-sm flex flex-col border-0 shadow-xs p-2 rounded-lg bg-white">
                            <div className="flex justify-between items-center mb-1.5">
                              <div className="flex items-center gap-1.5">
                                <h6 className="font-bold mb-0 text-gray-900" style={{ fontSize: "11px" }}>Top Departments</h6>
                                {hoveredDept && (
                                  <span className="badge bg-blue-600 bg-opacity-10 text-blue-600 animate-fade-in" style={{ fontSize: "8px" }}>
                                    {hoveredDept.name}: {hoveredDept.count} ({hoveredDept.pct}%)
                                  </span>
                                )}
                              </div>
                              <span className="text-blue-600 text-sm font-semibold cursor-pointer hover-underline" style={{ fontSize: "9px" }}>View All 18</span>
                            </div>

                            <div className="flex flex-wrap -mx-4 items-center">
                              {/* PROGRESS BARS WITH VIBRANT SHIMMER */}
                              <div className="col-8">
                                <div className="flex flex-col gap-1">
                                  {filteredDepts.map((d) => (
                                    <div
                                      key={d.name}
                                      className={`d-flex align-items-center gap-2 p-0.5 rounded transition-all cursor-pointer ${
                                        hoveredDept?.name === d.name ? "bg-slate-100 shadow-2xs" : ""
                                      }`}
                                      onMouseEnter={() => setHoveredDept(d)}
                                      onMouseLeave={() => setHoveredDept(null)}
                                    >
                                      <small className={`text-truncate transition-all ${hoveredDept?.name === d.name ? "fw-bold text-dark" : "text-muted"}`} style={{ width: "90px", fontSize: "9px" }}>
                                        {d.name}
                                      </small>
                                      <div className="progress flex-grow-1 relative overflow-hidden" style={{ height: hoveredDept?.name === d.name ? "7px" : "5px", transition: "height 0.25s ease" }}>
                                        <div
                                          className={`progress-bar ${d.color} ${hoveredDept?.name === d.name ? "progress-bar-glow progress-bar-striped progress-bar-animated" : ""}`}
                                          style={{
                                            width: `${(d.count / 86) * 100}%`,
                                            boxShadow: hoveredDept?.name === d.name ? `0 0 10px ${d.glow}` : "none",
                                            transition: "width 0.4s ease, box-shadow 0.25s ease"
                                          }}
                                        ></div>
                                      </div>
                                      <small className={`fw-bold transition-all ${hoveredDept?.name === d.name ? "text-primary scale-110" : "text-dark"}`} style={{ width: "20px", fontSize: "9px" }}>
                                        {d.count}
                                      </small>
                                    </div>
                                  ))}
                                </div>
                              </div>

                              {/* SEGMENTED INTERACTIVE DONUT CHART */}
                              <div className="w-1/3 px-6 text-center">
                                <div
                                  className="relative inline-block transition-all cursor-pointer donut-interactive-wrapper"
                                  onMouseEnter={() => setHoveredDonutSegment("Total")}
                                  onMouseLeave={() => setHoveredDonutSegment(null)}
                                >
                                  <svg width="70" height="70" viewBox="0 0 36 36" className="circular-chart">
                                    <path
                                      className="circle-bg"
                                      d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                                      fill="none"
                                      stroke="#e2e8f0"
                                      strokeWidth="3.8"
                                    />
                                    <path
                                      className="circle"
                                      strokeDasharray="38, 100"
                                      d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                                      fill="none"
                                      stroke="#4f46e5"
                                      strokeWidth="3.8"
                                    />
                                    <path
                                      className="circle"
                                      strokeDasharray="20, 100"
                                      strokeDashoffset="-38"
                                      d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                                      fill="none"
                                      stroke="#a855f7"
                                      strokeWidth="3.8"
                                    />
                                    <path
                                      className="circle"
                                      strokeDasharray="17, 100"
                                      strokeDashoffset="-58"
                                      d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                                      fill="none"
                                      stroke="#06b6d4"
                                      strokeWidth="3.8"
                                    />
                                  </svg>

                                  <div className="absolute top-50 start-50 -translate-x-1/2 -translate-y-1/2 text-center pointer-events-none">
                                    <span className="font-bold text-gray-900 block leading-none" style={{ fontSize: "11px" }}>
                                      229
                                    </span>
                                    <small className="text-gray-500 leading-none block" style={{ fontSize: "7.5px" }}>
                                      {hoveredDonutSegment || "Total"}
                                    </small>
                                  </div>
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </motion.div>

        {/* ============================================================
            CARD 2: 4-TIER ROLE PORTALS (STICKS AT TOP: 74PX, PUSHES BACK WHEN CARD 3 ENTERS)
            ============================================================ */}
        <motion.div
          ref={card2Ref}
          id="roles-sec"
          style={{
            position: "sticky",
            top: "74px",
            height: "calc(100vh - 74px)",
            zIndex: 2,
            scale: card2Scale,
            opacity: card2Opacity,
            filter: card2Filter,
            transformOrigin: "top center",
            willChange: "transform, opacity",
            borderTopLeftRadius: "32px",
            borderTopRightRadius: "32px",
            boxShadow: "0 -15px 35px -5px rgba(15, 23, 42, 0.07), 0 -4px 12px -2px rgba(15, 23, 42, 0.04)",
            borderTop: "1px solid rgba(226, 232, 240, 0.95)"
          }}
          className="bg-white w-full flex flex-col justify-center items-center overflow-y-auto"
        >
          <div className="w-full h-full flex flex-col justify-center items-center px-6 px-lg-5 my-auto">
            <div className="w-full px-6 p-0 max-w-5xl">
              <div className="text-center mx-auto mb-6">
                <span className="badge bg-purple-soft text-purple-deep px-6 py-1 rounded-full text-uppercase font-bold mb-2 tracking-wider" style={{ fontSize: "11px" }}>
                  4-TIER WORKFORCE ARCHITECTURE
                </span>
                <h2 className="font-extrabold text-gray-900 tracking-tight mb-1">Dedicated Dashboards for Every Corporate Tier</h2>
                <p className="text-gray-600 text-sm mb-2">Click between roles to preview specialized toolsets, scopes, and workflows.</p>

                {/* Interactive Role Tabs with Spring Indicator */}
                <div className="inline-flex p-1.5 bg-gray-50 rounded-full border border-gray-200 border-gray-200 shadow-2xs gap-1 relative">
                  {[
                    { id: "admin", label: "👑 HR Administrator" },
                    { id: "manager", label: "👔 Department Manager" },
                    { id: "supervisor", label: "👷 Operational Supervisor" },
                    { id: "employee", label: "💼 Staff Employee" }
                  ].map((r) => (
                    <button
                      key={r.id}
                      type="button"
                      onClick={() => setActiveRoleTab(r.id)}
                      className={`btn btn-sm rounded-pill px-3 py-1.5 fw-semibold position-relative z-1 transition-all ${
                        activeRoleTab === r.id ? "text-white" : "text-muted hover-text-dark"
                      }`}
                      style={{ fontSize: "12px", border: "none" }}
                    >
                      {activeRoleTab === r.id && (
                        <motion.div
                          layoutId="activeRoleDeckIndicator"
                          className="absolute top-0 left-0 w-full h-full rounded-full shadow-sm"
                          style={{ background: "linear-gradient(135deg, #4f46e5 0%, #6366f1 100%)", zIndex: -1 }}
                          transition={{ type: "spring", stiffness: 450, damping: 32 }}
                        />
                      )}
                      <span>{r.label}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Role Preview Card */}
              <AnimatePresence mode="wait">
                <motion.div
                  key={activeRoleTab}
                  initial={{ opacity: 0, y: 16, scale: 0.985 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: -12, scale: 0.985 }}
                  transition={{ duration: 0.32, ease: [0.16, 1, 0.3, 1] }}
                  className="max-w-4xl mx-auto bg-slate-50 border border-gray-200 border-gray-200 rounded-xl p-6 p-lg-5 shadow-xs"
                >
                  {activeRoleTab === "admin" && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
                      <div>
                        <span className="inline-block px-3 py-1 rounded-full text-xs font-bold bg-blue-600 text-white mb-2">Master Administrator</span>
                        <h3 className="text-xl font-bold text-gray-900 mb-2">Executive Command & Global Control</h3>
                        <p className="text-gray-600 text-sm leading-relaxed mb-4">
                          Full user management, department lifecycle control, real-time hierarchy mapping, and immutable audit logs.
                        </p>
                        <ul className="flex flex-col gap-2 text-sm mb-4 list-none p-0">
                          <li className="flex items-center gap-2"><i className="bi bi-check-circle-fill text-green-600"></i> Comprehensive User & Department CRUD</li>
                          <li className="flex items-center gap-2"><i className="bi bi-check-circle-fill text-green-600"></i> Visual reporting hierarchy tree</li>
                          <li className="flex items-center gap-2"><i className="bi bi-check-circle-fill text-green-600"></i> Security logs with IP & timestamp tracking</li>
                        </ul>
                        <button
                          type="button"
                          onClick={(e) => handleAuthNavigate("/login", e)}
                          className="bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold px-5 py-2.5 rounded-lg shadow-sm transition-colors cursor-pointer inline-flex items-center gap-2"
                        >
                          Explore HR Admin Portal →
                        </button>
                      </div>
                      <div>
                        <div className="p-6 bg-white rounded-xl shadow-sm border border-slate-200 text-left">
                          <div className="flex justify-between items-center mb-4">
                            <strong className="text-gray-900 text-sm">HR Control Panel</strong>
                            <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-green-100 text-green-700">Active Admin</span>
                          </div>
                          <div className="p-3 bg-slate-50 rounded-lg mb-2 text-sm flex justify-between items-center">
                            <span className="text-slate-600">Total Staff</span>
                            <strong className="text-blue-600 font-bold">248 Active</strong>
                          </div>
                          <div className="p-3 bg-slate-50 rounded-lg text-sm flex justify-between items-center">
                            <span className="text-slate-600">Pending Approvals</span>
                            <strong className="text-amber-500 font-bold">7 Requests</strong>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {activeRoleTab === "manager" && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
                      <div>
                        <span className="inline-block px-3 py-1 rounded-full text-xs font-bold bg-cyan-600 text-white mb-2">Department Manager</span>
                        <h3 className="text-xl font-bold text-gray-900 mb-2">Department Strategy & Delegation</h3>
                        <p className="text-gray-600 text-sm leading-relaxed mb-4">
                          Delegate projects to team supervisors, track progress milestones, and provide final sign-off on department leave requests.
                        </p>
                        <ul className="flex flex-col gap-2 text-sm mb-4 list-none p-0">
                          <li className="flex items-center gap-2"><i className="bi bi-check-circle-fill text-cyan-600"></i> Project deadline monitoring</li>
                          <li className="flex items-center gap-2"><i className="bi bi-check-circle-fill text-cyan-600"></i> Supervisor delegation & reviews</li>
                          <li className="flex items-center gap-2"><i className="bi bi-check-circle-fill text-cyan-600"></i> Secondary leave approvals</li>
                        </ul>
                        <button
                          type="button"
                          onClick={(e) => handleAuthNavigate("/login", e)}
                          className="bg-cyan-600 hover:bg-cyan-700 text-white text-sm font-semibold px-5 py-2.5 rounded-lg shadow-sm transition-colors cursor-pointer inline-flex items-center gap-2"
                        >
                          Explore Manager Portal →
                        </button>
                      </div>
                      <div>
                        <div className="p-6 bg-white rounded-xl shadow-sm border border-slate-200 text-left">
                          <div className="flex justify-between items-center mb-4">
                            <strong className="text-gray-900 text-sm">Engineering Projects</strong>
                            <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-cyan-100 text-cyan-700">Active</span>
                          </div>
                          <div className="p-3 bg-slate-50 rounded-lg mb-2 text-sm flex justify-between items-center">
                            <span className="text-slate-600">Cloud Migration</span>
                            <span className="text-xs font-semibold px-2 py-0.5 rounded bg-green-100 text-green-700">85% Complete</span>
                          </div>
                          <div className="p-3 bg-slate-50 rounded-lg text-sm flex justify-between items-center">
                            <span className="text-slate-600">Mobile App v2</span>
                            <span className="text-xs font-semibold px-2 py-0.5 rounded bg-blue-100 text-blue-700">40% In Progress</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {activeRoleTab === "supervisor" && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
                      <div>
                        <span className="inline-block px-3 py-1 rounded-full text-xs font-bold bg-green-600 text-white mb-2">Team Supervisor</span>
                        <h3 className="text-xl font-bold text-gray-900 mb-2">Daily Team Operations & Guidance</h3>
                        <p className="text-gray-600 text-sm leading-relaxed mb-4">
                          Assign daily tasks, review submitted deliverables, and conduct first-line screening for team time-off requests.
                        </p>
                        <ul className="flex flex-col gap-2 text-sm mb-4 list-none p-0">
                          <li className="flex items-center gap-2"><i className="bi bi-check-circle-fill text-green-600"></i> Direct task allocation & priorities</li>
                          <li className="flex items-center gap-2"><i className="bi bi-check-circle-fill text-green-600"></i> Real-time deliverables inspection</li>
                          <li className="flex items-center gap-2"><i className="bi bi-check-circle-fill text-green-600"></i> First-level leave approval gate</li>
                        </ul>
                        <button
                          type="button"
                          onClick={(e) => handleAuthNavigate("/login", e)}
                          className="bg-green-600 hover:bg-green-700 text-white text-sm font-semibold px-5 py-2.5 rounded-lg shadow-sm transition-colors cursor-pointer inline-flex items-center gap-2"
                        >
                          Explore Supervisor Portal →
                        </button>
                      </div>
                      <div>
                        <div className="p-6 bg-white rounded-xl shadow-sm border border-slate-200 text-left">
                          <div className="flex justify-between items-center mb-4">
                            <strong className="text-gray-900 text-sm">Team Task Board</strong>
                            <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-green-100 text-green-700">6 Members</span>
                          </div>
                          <div className="p-3 bg-slate-50 rounded-lg mb-2 text-sm flex justify-between items-center">
                            <span className="text-slate-600">API Schema Design</span>
                            <span className="text-green-600 font-bold text-xs">✓ Ready</span>
                          </div>
                          <div className="p-3 bg-slate-50 rounded-lg text-sm flex justify-between items-center">
                            <span className="text-slate-600">Database Indexing</span>
                            <span className="text-blue-600 font-bold text-xs">⏳ In Progress</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {activeRoleTab === "employee" && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
                      <div>
                        <span className="inline-block px-3 py-1 rounded-full text-xs font-bold bg-slate-600 text-white mb-2">Staff Employee</span>
                        <h3 className="text-xl font-bold text-gray-900 mb-2">Personal Tasks, Leaves & Profile</h3>
                        <p className="text-gray-600 text-sm leading-relaxed mb-4">
                          Track assigned deliverables, update completion statuses, submit leave requests with live tracking, and view salary slips.
                        </p>
                        <ul className="flex flex-col gap-2 text-sm mb-4 list-none p-0">
                          <li className="flex items-center gap-2"><i className="bi bi-check-circle-fill text-blue-600"></i> Personal task board with deadlines</li>
                          <li className="flex items-center gap-2"><i className="bi bi-check-circle-fill text-blue-600"></i> 1-click leave submission & status tracker</li>
                          <li className="flex items-center gap-2"><i className="bi bi-check-circle-fill text-blue-600"></i> Digital profile & compensation slips</li>
                        </ul>
                        <button
                          type="button"
                          onClick={(e) => handleAuthNavigate("/login", e)}
                          className="bg-slate-700 hover:bg-slate-800 text-white text-sm font-semibold px-5 py-2.5 rounded-lg shadow-sm transition-colors cursor-pointer inline-flex items-center gap-2"
                        >
                          Explore Employee Portal →
                        </button>
                      </div>
                      <div>
                        <div className="p-6 bg-white rounded-xl shadow-sm border border-slate-200 text-left">
                          <div className="flex justify-between items-center mb-4">
                            <strong className="text-gray-900 text-sm">My Work & Leaves</strong>
                            <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-blue-100 text-blue-700">Active</span>
                          </div>
                          <div className="p-3 bg-slate-50 rounded-lg mb-2 text-sm flex justify-between items-center">
                            <span className="text-slate-600">Annual Leave Balance</span>
                            <strong className="text-blue-600 font-bold">14 Days Left</strong>
                          </div>
                          <div className="p-3 bg-slate-50 rounded-lg text-sm flex justify-between items-center">
                            <span className="text-slate-600">Assigned Tasks</span>
                            <strong className="text-green-600 font-bold">3 In Progress</strong>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </motion.div>
              </AnimatePresence>
            </div>
          </div>
        </motion.div>

        {/* ============================================================
            CARD 3: ROI CALCULATOR (STICKS AT TOP: 74PX, PUSHES BACK WHEN CARD 4 ENTERS)
            ============================================================ */}
        <motion.div
          ref={card3Ref}
          id="calc-sec"
          style={{
            position: "sticky",
            top: "74px",
            height: "calc(100vh - 74px)",
            zIndex: 3,
            scale: card3Scale,
            opacity: card3Opacity,
            filter: card3Filter,
            transformOrigin: "top center",
            willChange: "transform, opacity",
            borderTopLeftRadius: "32px",
            borderTopRightRadius: "32px",
            boxShadow: "0 -15px 35px -5px rgba(15, 23, 42, 0.07), 0 -4px 12px -2px rgba(15, 23, 42, 0.04)",
            borderTop: "1px solid rgba(226, 232, 240, 0.95)"
          }}
          className="bg-slate-50 w-full flex flex-col justify-center items-center overflow-y-auto"
        >
          <div className="w-full h-full flex flex-col justify-center items-center px-6 px-lg-5 my-auto">
            <div className="w-full px-6 p-0 max-w-4xl">
              <div className="text-center mx-auto mb-6">
                <span className="badge bg-green-600 bg-opacity-10 text-green-600 px-6 py-1 rounded-full text-uppercase font-bold mb-2 tracking-wider" style={{ fontSize: "11px" }}>
                  INTERACTIVE ROI CALCULATOR
                </span>
                <h2 className="font-extrabold text-gray-900 tracking-tight mb-1">Quantify Your Operational Capital Savings</h2>
                <p className="text-gray-600 text-sm">Drag the headcount slider to calculate automated workforce hours and budget reduction.</p>
              </div>

              <div className="bg-white border border-gray-200 border-gray-200 rounded-xl p-6 p-lg-5 shadow-sm">
                <div className="mb-6">
                  <div className="flex justify-between items-center mb-2">
                    <label className="font-bold text-gray-900 text-base">Current Headcount</label>
                    <span className="badge bg-blue-600 text-base px-6 py-1.5 rounded-full">{employeeCount} Employees</span>
                  </div>
                  <input
                    type="range"
                    min="10"
                    max="500"
                    step="5"
                    value={employeeCount}
                    onChange={(e) => setEmployeeCount(Number(e.target.value))}
                    className="form-range calc-slider w-full"
                  />
                  <div className="flex justify-between text-gray-500 text-sm mt-1">
                    <span>10 staff</span>
                    <span>250 staff</span>
                    <span>500+ staff</span>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-center">
                  <motion.div whileHover={{ scale: 1.03 }} className="p-4 rounded-xl bg-slate-50 border border-slate-200 hover-lift transition-all">
                    <h3 className="text-2xl font-black text-indigo-600 mb-1">{Math.round(employeeCount * 1.8)} hrs</h3>
                    <small className="text-slate-500 font-semibold block text-xs">Admin Time Saved / Mo</small>
                  </motion.div>
                  <motion.div whileHover={{ scale: 1.03 }} className="p-4 rounded-xl bg-slate-50 border border-slate-200 hover-lift transition-all">
                    <h3 className="text-2xl font-black text-emerald-600 mb-1">${(employeeCount * 360).toLocaleString()}</h3>
                    <small className="text-slate-500 font-semibold block text-xs">Annual Cost Reduction</small>
                  </motion.div>
                  <motion.div whileHover={{ scale: 1.03 }} className="p-4 rounded-xl bg-slate-50 border border-slate-200 hover-lift transition-all">
                    <h3 className="text-2xl font-black text-amber-500 mb-1">3.8x</h3>
                    <small className="text-slate-500 font-semibold block text-xs">Faster Approvals</small>
                  </motion.div>
                </div>
              </div>
            </div>
          </div>
        </motion.div>

        {/* ============================================================
            CARD 4: FEATURE MATRIX (STICKS AT TOP: 74PX, PUSHES BACK WHEN CARD 5 ENTERS)
            ============================================================ */}
        <motion.div
          ref={card4Ref}
          id="features-sec"
          style={{
            position: "sticky",
            top: "74px",
            height: "calc(100vh - 74px)",
            zIndex: 4,
            scale: card4Scale,
            opacity: card4Opacity,
            filter: card4Filter,
            transformOrigin: "top center",
            willChange: "transform, opacity",
            borderTopLeftRadius: "32px",
            borderTopRightRadius: "32px",
            boxShadow: "0 -15px 35px -5px rgba(15, 23, 42, 0.07), 0 -4px 12px -2px rgba(15, 23, 42, 0.04)",
            borderTop: "1px solid rgba(226, 232, 240, 0.95)"
          }}
          className="bg-white w-full flex flex-col justify-center items-center overflow-y-auto"
        >
          <div className="w-full h-full flex flex-col justify-center items-center px-6 px-lg-5 my-auto">
            <div className="w-full px-6 p-0 max-w-6xl">
              <div className="text-center mx-auto mb-6">
                <span className="badge bg-purple-soft text-purple-deep px-6 py-1 rounded-full text-uppercase font-bold mb-2 tracking-wider" style={{ fontSize: "11px" }}>
                  ENTERPRISE PLATFORM
                </span>
                <h2 className="font-extrabold text-gray-900 tracking-tight mb-1">Everything You Need to Scale Operations</h2>
                <p className="text-gray-600 text-sm">Six core architectural pillars built to streamline operations.</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {[
                  { id: 1, title: "Employee Directory", desc: "Complete employee lifecycle management with salary records and profile management.", icon: "bi-people-fill", bg: "bg-purple-100 text-indigo-600" },
                  { id: 2, title: "Department Hierarchies", desc: "Organize units, define direct reports, and eliminate organizational bottlenecks.", icon: "bi-building", bg: "bg-blue-100 text-blue-600" },
                  { id: 3, title: "Team Collaboration", desc: "Assign deliverables, monitor task comments, and track project deadlines.", icon: "bi-diagram-3-fill", bg: "bg-emerald-100 text-emerald-600" },
                  { id: 4, title: "Analytics & Reports", desc: "Real-time metrics, employee growth indicators, and automated executive digests.", icon: "bi-graph-up-arrow", bg: "bg-amber-100 text-amber-600" },
                  { id: 5, title: "Multi-Step Approvals", desc: "Two-step supervisor-to-manager routing for leave requests and department transfers.", icon: "bi-inbox-fill", bg: "bg-rose-100 text-rose-600" },
                  { id: 6, title: "Payroll & Compensation", desc: "Automated calculations, tax compliance checks, and secure role-based access.", icon: "bi-cash-coin", bg: "bg-cyan-100 text-cyan-600" }
                ].map((card) => (
                  <div key={card.id} className="h-full">
                    <div className="bg-white rounded-xl border border-slate-200 p-4 h-full flex flex-col justify-between hover:border-indigo-300 hover:shadow-md transition-all cursor-pointer">
                      <div>
                        <div className={`w-10 h-10 rounded-lg flex items-center justify-center mb-3 ${card.bg}`}>
                          <i className={`bi ${card.icon} text-lg`}></i>
                        </div>
                        <h5 className="font-bold text-gray-900 mb-1 text-sm">{card.title}</h5>
                        <p className="text-gray-500 text-xs leading-relaxed mb-3">{card.desc}</p>
                      </div>
                      <span className="text-indigo-600 text-xs font-semibold inline-flex items-center gap-1 hover:underline">
                        <span>Learn more</span>
                        <i className="bi bi-arrow-right text-xs"></i>
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </motion.div>

        {/* ============================================================
            CARD 5: FAQ & CONVERSION CTA BANNER (FINAL DECK CARD, STICKS AT TOP: 74PX, PERMANENT 100% VISIBILITY)
            ============================================================ */}
        <motion.div
          ref={card5Ref}
          id="faq-sec"
          style={{
            position: "sticky",
            top: "74px",
            height: "calc(100vh - 74px)",
            zIndex: 5,
            borderTopLeftRadius: "32px",
            borderTopRightRadius: "32px",
            boxShadow: "0 -15px 35px -5px rgba(15, 23, 42, 0.07), 0 -4px 12px -2px rgba(15, 23, 42, 0.04)",
            borderTop: "1px solid rgba(226, 232, 240, 0.95)"
          }}
          className="bg-slate-50 w-full flex flex-col justify-center items-center overflow-y-auto"
        >
          <div className="w-full h-full flex flex-col justify-center items-center px-6 px-lg-5 my-auto">
            <div className="w-full px-6 p-0 max-w-4xl">
              <div className="text-center mx-auto mb-6">
                <span className="badge bg-info bg-opacity-10 text-info px-6 py-1 rounded-full text-uppercase font-bold mb-2 tracking-wider" style={{ fontSize: "11px" }}>
                  COMMON QUESTIONS
                </span>
                <h2 className="font-extrabold text-gray-900 tracking-tight mb-1">Frequently Asked Questions</h2>
                <p className="text-gray-600 text-sm">Answers to common organizational questions.</p>
              </div>

              <div className="flex flex-col gap-2 mb-6">
                {[
                  { q: "Can employees self-register, or must HR onboard them?", a: "Both! Employees, Supervisors, Managers, and Admins can register anytime through the dedicated /signup page. Alternatively, the HR Administrator can onboard new users directly from the User Directory." },
                  { q: "How does the two-step leave approval workflow operate?", a: "When an employee submits a leave request, it is first routed to their direct Supervisor. Once approved by the Supervisor, it escalates to the Department Manager for final sign-off." },
                  { q: "Are passwords and user credentials secure?", a: "Yes. All passwords are encrypted with bcrypt salt hashing. Authentication tokens are issued with JWT and stored securely via HTTP-only cookies and protected headers." },
                  { q: "Can we manage separate departments and supervisors?", a: "Absolutely. The system features dedicated manager and supervisor tables, allowing departments to scale independently with custom reporting lines." }
                ].map((item, idx) => (
                  <div key={item.q} className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-xs">
                    <button
                      type="button"
                      className="w-full text-left p-4 flex justify-between items-center font-bold text-gray-900 border-0 bg-transparent cursor-pointer"
                      onClick={() => setOpenFaq(openFaq === idx ? -1 : idx)}
                    >
                      <span className="text-sm">{item.q}</span>
                      <i className={`bi ${openFaq === idx ? "bi-chevron-up" : "bi-chevron-down"} text-slate-400 text-xs`}></i>
                    </button>
                    <AnimatePresence>
                      {openFaq === idx && (
                        <motion.div
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: "auto" }}
                          exit={{ opacity: 0, height: 0 }}
                          transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
                          className="px-4 pb-4 pt-0 text-slate-600 text-xs leading-relaxed border-t border-slate-100 overflow-hidden"
                        >
                          {item.a}
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                ))}
              </div>

              {/* High-Conversion CTA Banner */}
              <div
                className="p-8 rounded-2xl text-center text-white relative overflow-hidden shadow-xl"
                style={{ background: "linear-gradient(135deg, #312e81 0%, #4f46e5 50%, #7c3aed 100%)" }}
              >
                <div className="ambient-orb orb-1" style={{ top: "-30%", left: "20%", opacity: 0.3 }}></div>
                <div className="relative z-1 max-w-xl mx-auto">
                  <h3 className="text-2xl font-black mb-2 tracking-tight text-white">Ready to Elevate Your Organization?</h3>
                  <p className="text-indigo-100 mb-6 leading-relaxed text-xs">
                    Join thousands of productive teams. Get up and running in minutes with role-based access for your whole organization.
                  </p>
                  <div className="flex flex-wrap justify-center gap-3">
                    <motion.div whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.96 }}>
                      <button
                        type="button"
                        onClick={(e) => handleAuthNavigate("/signup", e)}
                        className="bg-white hover:bg-slate-100 text-indigo-700 font-bold px-6 py-2.5 rounded-xl shadow-md transition-all cursor-pointer text-sm inline-block"
                      >
                        Create Your Free Account →
                      </button>
                    </motion.div>
                    <motion.div whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.96 }}>
                      <button
                        type="button"
                        onClick={(e) => handleAuthNavigate("/login", e)}
                        className="border border-white/60 hover:bg-white/10 text-white font-semibold px-6 py-2.5 rounded-xl transition-all cursor-pointer text-sm inline-block"
                      >
                        Sign In to Portal
                      </button>
                    </motion.div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
      {/* Auth Portal Overlay mounted directly on top of the live Landing Page */}
      <Outlet />
    </div>
  );
};

export default LandingPage;
