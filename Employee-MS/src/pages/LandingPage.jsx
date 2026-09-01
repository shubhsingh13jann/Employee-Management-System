import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import InteractiveBackground from "../components/common/InteractiveBackground";

const LandingPage = () => {
  const navigate = useNavigate();
  const [hoveredCard, setHoveredCard] = useState(null);
  const [activeTab, setActiveTab] = useState("Dashboard");

  // Interactive Mock Dashboard States
  const [graphTimeframe, setGraphTimeframe] = useState("This Month");
  const [activeGraphPoint, setActiveGraphPoint] = useState({ index: 4, date: "May 29", count: 248, change: "+12%" });
  const [isGraphHovered, setIsGraphHovered] = useState(false);
  const [hoveredDept, setHoveredDept] = useState(null);
  const [isCircleHovered, setIsCircleHovered] = useState(false);
  const [hoveredStat, setHoveredStat] = useState(null);
  const [hoveredApproval, setHoveredApproval] = useState(null);

  // Graph Data points along curve
  const graphPoints = [
    { index: 0, x: 20, y: 85, date: "May 1", count: 212, change: "+3%" },
    { index: 1, x: 100, y: 65, date: "May 8", count: 220, change: "+5%" },
    { index: 2, x: 190, y: 72, date: "May 15", count: 228, change: "+7%" },
    { index: 3, x: 285, y: 45, date: "May 22", count: 239, change: "+10%" },
    { index: 4, x: 375, y: 52, date: "May 29", count: 248, change: "+12%" }
  ];

  const currentPoint = activeGraphPoint;

  return (
    <div className="min-vh-100 bg-white text-dark overflow-x-hidden landing-container">
      {/* 1. TOP NAVIGATION BAR */}
      <nav className="navbar navbar-expand-lg py-3 px-4 px-lg-5 sticky-top bg-white bg-opacity-95 backdrop-blur border-bottom border-light shadow-xs z-3">
        <div className="container-fluid p-0 d-flex justify-content-between align-items-center">
          {/* Logo */}
          <Link to="/" className="navbar-brand d-flex align-items-center gap-2 text-decoration-none">
            <div className="logo-cube d-flex align-items-center justify-content-center">
              <i className="bi bi-box-fill text-white fs-5"></i>
            </div>
            <div>
              <span className="fw-bold fs-5 text-dark tracking-tight d-block leading-tight">Enterprise EMS</span>
              <small className="text-muted" style={{ fontSize: "11px", letterSpacing: "0.5px" }}>Workforce Excellence</small>
            </div>
          </Link>

          {/* Nav Menu */}
          <div className="d-none d-lg-flex align-items-center gap-4">
            <a className="nav-link text-secondary fw-semibold d-flex align-items-center gap-1 cursor-pointer" href="#features">
              Features <i className="bi bi-chevron-down small"></i>
            </a>
            <a className="nav-link text-secondary fw-semibold d-flex align-items-center gap-1 cursor-pointer" href="#solutions">
              Solutions <i className="bi bi-chevron-down small"></i>
            </a>
            <a className="nav-link text-secondary fw-semibold d-flex align-items-center gap-1 cursor-pointer" href="#resources">
              Resources <i className="bi bi-chevron-down small"></i>
            </a>
            <a className="nav-link text-secondary fw-semibold" href="#pricing">Pricing</a>
            <a className="nav-link text-secondary fw-semibold" href="#about">About Us</a>
          </div>

          {/* Action Buttons */}
          <div className="d-flex align-items-center gap-2">
            <Link to="/login" className="btn btn-outline-secondary px-3.5 py-2 rounded-3 fw-semibold d-flex align-items-center gap-2 shadow-xs">
              <i className="bi bi-person"></i>
              <span>Login</span>
            </Link>
            <Link to="/signup" className="btn btn-gradient-primary px-4 py-2 rounded-3 fw-semibold d-flex align-items-center gap-2 shadow-sm text-white">
              <i className="bi bi-person-plus-fill"></i>
              <span>Sign Up</span>
            </Link>
          </div>
        </div>
      </nav>

      {/* 2. HERO SECTION */}
      <section className="position-relative pt-4 pb-5 px-3 px-lg-5 overflow-hidden hero-interactive-section">
        {/* Interactive Dynamic Particle Constellation Network */}
        <InteractiveBackground />

        {/* Animated Floating Gradient Light Orbs */}
        <div className="ambient-orb orb-1"></div>
        <div className="ambient-orb orb-2"></div>
        <div className="ambient-orb orb-3"></div>

        <div className="container-fluid p-0 position-relative z-1">
          <div className="row align-items-center g-5">
            {/* Left Content Column */}
            <div className="col-12 col-xl-5">
              {/* Trust Badge */}
              <div className="d-inline-flex align-items-center gap-2 px-3 py-1.5 rounded-pill bg-purple-soft text-purple-deep mb-4 border border-purple-subtle shadow-2xs animate-fade-in">
                <i className="bi bi-patch-check-fill fs-6 text-primary"></i>
                <span className="small fw-semibold">Trusted by 1000+ Organizations Worldwide</span>
              </div>

              {/* Headline */}
              <h1 className="hero-heading fw-extrabold text-dark tracking-tight mb-4 animate-slide-up">
                Manage People.<br />
                Empower Teams.<br />
                Drive <span className="text-gradient">Excellence.</span>
              </h1>

              {/* Subtitle */}
              <p className="hero-subtext text-secondary mb-4 leading-relaxed" style={{ fontSize: "1.1rem" }}>
                Enterprise EMS is a next-generation workforce management platform designed to streamline operations,
                improve collaboration, and drive organizational success.
              </p>

              {/* CTAs */}
              <div className="d-flex flex-wrap align-items-center gap-3 mb-5">
                <Link to="/signup" className="btn btn-gradient-primary btn-lg px-4 py-2.5 rounded-3 fw-bold d-inline-flex align-items-center gap-2 text-white shadow-md hero-btn">
                  <span>Get Started</span>
                  <i className="bi bi-arrow-right"></i>
                </Link>
                <a href="#features" className="btn btn-outline-secondary btn-lg px-4 py-2.5 rounded-3 fw-semibold d-inline-flex align-items-center gap-2 hero-btn-secondary">
                  <span>Explore Features</span>
                  <i className="bi bi-play-circle fs-5"></i>
                </a>
              </div>

              {/* 3 Value Pillars */}
              <div className="row g-3 pt-3 border-top border-light">
                <div className="col-4">
                  <div className="d-flex align-items-start gap-2">
                    <div className="p-2 bg-purple-soft text-primary rounded-3 shadow-2xs">
                      <i className="bi bi-shield-check fs-5"></i>
                    </div>
                    <div>
                      <h6 className="fw-bold mb-0 text-dark small">Enterprise Secure</h6>
                      <small className="text-muted d-block" style={{ fontSize: "11px" }}>Bank-level security for your data</small>
                    </div>
                  </div>
                </div>

                <div className="col-4">
                  <div className="d-flex align-items-start gap-2">
                    <div className="p-2 bg-primary bg-opacity-10 text-primary rounded-3 shadow-2xs">
                      <i className="bi bi-lightning-charge-fill fs-5"></i>
                    </div>
                    <div>
                      <h6 className="fw-bold mb-0 text-dark small">Smart Automation</h6>
                      <small className="text-muted d-block" style={{ fontSize: "11px" }}>Automate workflows and save time</small>
                    </div>
                  </div>
                </div>

                <div className="col-4">
                  <div className="d-flex align-items-start gap-2">
                    <div className="p-2 bg-info bg-opacity-10 text-info rounded-3 shadow-2xs">
                      <i className="bi bi-people-fill fs-5"></i>
                    </div>
                    <div>
                      <h6 className="fw-bold mb-0 text-dark small">People-Centric</h6>
                      <small className="text-muted d-block" style={{ fontSize: "11px" }}>Empower your teams to do their best</small>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Right Column: 3D Pop-Out Interactive Dashboard Showcase */}
            <div className="col-12 col-xl-7">
              <div className="showcase-3d-wrapper position-relative">
                {/* Floating Interactive Badge */}
                <div className="showcase-floating-tag badge bg-dark text-white px-3 py-1.5 rounded-pill shadow-lg d-inline-flex align-items-center gap-1.5">
                  <span className="pulse-dot"></span>
                  <small className="fw-bold">Interactive Live Preview (Hover graphs & bars!)</small>
                </div>

                {/* THE 3D POP-OUT CARD */}
                <div className="showcase-dashboard-card rounded-4 shadow-2xl overflow-hidden border border-slate-200 bg-white">
                  <div className="d-flex flex-row" style={{ minHeight: "560px" }}>
                    {/* Mock Dark Sidebar */}
                    <div className="mock-sidebar p-3 d-flex flex-column justify-content-between text-white" style={{ width: "210px", background: "#0b1329" }}>
                      <div>
                        {/* Sidebar Brand */}
                        <div className="d-flex align-items-center gap-2 mb-4 px-2">
                          <div className="logo-cube-sm d-flex align-items-center justify-content-center">
                            <i className="bi bi-box-fill text-white fs-6"></i>
                          </div>
                          <div>
                            <span className="fw-bold text-white small d-block">Enterprise EMS</span>
                            <small className="text-white-50" style={{ fontSize: "9px" }}>Workforce Excellence</small>
                          </div>
                        </div>

                        {/* Sidebar Nav Items */}
                        <ul className="nav nav-pills flex-column gap-1 list-unstyled p-0 m-0">
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
                                onClick={(e) => { e.stopPropagation(); setActiveTab(item.name); }}
                                className={`w-100 text-start d-flex align-items-center gap-2 px-2.5 py-1.5 rounded-2 text-white border-0 transition-all ${
                                  activeTab === item.name ? "bg-primary fw-bold shadow-xs scale-102" : "bg-transparent text-white-50 hover-light"
                                }`}
                                style={{ fontSize: "11px", transition: "all 0.2s ease" }}
                              >
                                <i className={`bi ${item.icon}`}></i>
                                <span>{item.name}</span>
                              </button>
                            </li>
                          ))}
                        </ul>
                      </div>

                      {/* Sidebar Footer System Status */}
                      <div className="p-2 rounded mt-3" style={{ background: "rgba(255, 255, 255, 0.08)", border: "1px solid rgba(255, 255, 255, 0.12)" }}>
                        <div className="d-flex align-items-center justify-content-between">
                          <div className="d-flex align-items-center gap-1.5">
                            <span className="badge bg-success p-1 rounded-circle pulse-dot-green"></span>
                            <small className="text-white fw-semibold" style={{ fontSize: "10px" }}>System Status</small>
                          </div>
                          <i className="bi bi-chevron-right text-white-50 small"></i>
                        </div>
                        <small className="text-white-50 d-block" style={{ fontSize: "9px" }}>All systems operational</small>
                      </div>
                    </div>

                    {/* Mock Main Dashboard Body */}
                    <div className="mock-body flex-grow-1 p-3 bg-slate-50 overflow-hidden d-flex flex-column gap-3">
                      {/* Mock Topbar */}
                      <div className="d-flex justify-content-between align-items-center pb-2 border-bottom border-light">
                        <div>
                          <h6 className="fw-bold mb-0 text-dark d-flex align-items-center gap-1.5">
                            Good morning, Shubh Singh! 👋
                          </h6>
                          <small className="text-muted" style={{ fontSize: "11px" }}>Here's what's happening in your organization today.</small>
                        </div>
                        <div className="d-flex align-items-center gap-2">
                          <div className="d-none d-md-flex align-items-center gap-1.5 bg-white px-2.5 py-1 rounded-pill border shadow-2xs hover-border-primary transition-all">
                            <i className="bi bi-search text-muted small"></i>
                            <input type="text" placeholder="Search employees, departments..." className="border-0 bg-transparent small outline-none" style={{ width: "160px", fontSize: "11px" }} readOnly />
                            <kbd className="bg-light text-muted border px-1 rounded small" style={{ fontSize: "9px" }}>⌘K</kbd>
                          </div>
                          <div className="position-relative p-1.5 bg-white rounded-circle border shadow-2xs hover-scale transition-all cursor-pointer">
                            <i className="bi bi-bell text-secondary"></i>
                            <span className="position-absolute top-0 start-100 translate-middle badge rounded-pill bg-danger" style={{ fontSize: "8px" }}>1</span>
                          </div>
                          <div className="d-flex align-items-center gap-1.5 bg-white p-1 rounded-pill border shadow-2xs hover-lift transition-all">
                            <div className="bg-primary text-white rounded-circle fw-bold d-flex align-items-center justify-content-center" style={{ width: "24px", height: "24px", fontSize: "10px" }}>
                              S
                            </div>
                            <div className="pe-2 text-start">
                              <small className="fw-bold text-dark d-block leading-none" style={{ fontSize: "10px" }}>Shubh Singh</small>
                              <small className="text-muted leading-none" style={{ fontSize: "8px" }}>HR Super Admin</small>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* 4 Stat Cards Row with Active Hover Animations */}
                      <div className="row g-2">
                        {[
                          { id: 1, label: "Total Employees", val: "248", change: "↑ 12% from last month", isUp: true, icon: "bi-people", color: "purple" },
                          { id: 2, label: "Departments", val: "18", change: "↑ 2 new this month", isUp: true, icon: "bi-building", color: "blue" },
                          { id: 3, label: "Active Projects", val: "32", change: "↑ 8 in progress", isUp: true, icon: "bi-kanban", color: "green" },
                          { id: 4, label: "Total Payroll", val: "$1.24M", change: "↑ 8.5% from last month", isUp: true, icon: "bi-cash-stack", color: "orange" }
                        ].map((stat) => (
                          <div key={stat.id} className="col-3">
                            <div
                              className={`card border-0 p-2 rounded-3 bg-white transition-all stat-card-interactive ${
                                hoveredStat === stat.id ? "stat-card-active shadow-md" : "shadow-xs"
                              }`}
                              onMouseEnter={() => setHoveredStat(stat.id)}
                              onMouseLeave={() => setHoveredStat(null)}
                            >
                              <div className="d-flex justify-content-between align-items-start">
                                <div>
                                  <small className="text-muted fw-semibold" style={{ fontSize: "10px" }}>{stat.label}</small>
                                  <h5 className={`fw-bold mb-0 text-dark transition-all ${hoveredStat === stat.id ? "text-primary scale-105" : ""}`}>
                                    {stat.val}
                                  </h5>
                                  <small className="text-success fw-bold d-block" style={{ fontSize: "9px" }}>{stat.change}</small>
                                </div>
                                <div className={`p-1.5 rounded-circle transition-all stat-icon-badge ${stat.color} ${hoveredStat === stat.id ? "rotate-12 scale-110" : ""}`}>
                                  <i className={`bi ${stat.icon}`} style={{ fontSize: "12px" }}></i>
                                </div>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>

                      {/* Middle Row: Interactive Area Chart + Approvals */}
                      <div className="row g-2">
                        {/* Workforce Overview Chart Card */}
                        <div className="col-8">
                          <div
                            className={`card border-0 shadow-xs p-2.5 rounded-3 bg-white h-100 transition-all chart-container-card ${
                              isGraphHovered ? "chart-card-glow" : ""
                            }`}
                            onMouseEnter={() => setIsGraphHovered(true)}
                            onMouseLeave={() => setIsGraphHovered(false)}
                          >
                            <div className="d-flex justify-content-between align-items-center mb-1">
                              <div className="d-flex align-items-center gap-2">
                                <h6 className="fw-bold mb-0 text-dark" style={{ fontSize: "12px" }}>Workforce Overview</h6>
                                {isGraphHovered && (
                                  <span className="badge bg-purple-soft text-primary animate-fade-in" style={{ fontSize: "9px" }}>
                                    ● {currentPoint.date}: {currentPoint.count} Staff ({currentPoint.change})
                                  </span>
                                )}
                              </div>
                              <div className="dropdown">
                                <button
                                  className="btn btn-sm btn-light border py-0 px-2 fw-semibold text-dark dropdown-toggle"
                                  style={{ fontSize: "9px" }}
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    const next = graphTimeframe === "This Month" ? "This Quarter" : graphTimeframe === "This Quarter" ? "This Year" : "This Month";
                                    setGraphTimeframe(next);
                                  }}
                                >
                                  {graphTimeframe}
                                </button>
                              </div>
                            </div>

                            {/* Simulated Interactive Area Chart SVG with Hover Nodes & Guides */}
                            <div className="position-relative w-100 my-1 cursor-crosshair" style={{ height: "115px" }}>
                              {/* Hover Floating Tooltip */}
                              {isGraphHovered && (
                                <div
                                  className="position-absolute bg-dark text-white px-2 py-1 rounded shadow-lg pointer-events-none transition-all"
                                  style={{
                                    left: `${(currentPoint.x / 400) * 100}%`,
                                    top: `${(currentPoint.y / 120) * 100 - 32}%`,
                                    transform: "translate(-50%, -100%)",
                                    fontSize: "10px",
                                    whiteSpace: "nowrap",
                                    zIndex: 5
                                  }}
                                >
                                  <span className="fw-bold">{currentPoint.count} Employees</span>
                                  <small className="text-success ms-1">({currentPoint.change})</small>
                                </div>
                              )}

                              <svg viewBox="0 0 400 120" className="w-100 h-100 overflow-visible">
                                <defs>
                                  <linearGradient id="chartGrad" x1="0%" y1="0%" x2="0%" y2="100%">
                                    <stop offset="0%" stopColor="#6366f1" stopOpacity={isGraphHovered ? "0.48" : "0.32"} />
                                    <stop offset="100%" stopColor="#6366f1" stopOpacity="0.0" />
                                  </linearGradient>
                                </defs>

                                {/* Grid lines */}
                                <line x1="0" y1="30" x2="400" y2="30" stroke="#f1f5f9" strokeWidth="1" />
                                <line x1="0" y1="60" x2="400" y2="60" stroke="#f1f5f9" strokeWidth="1" />
                                <line x1="0" y1="90" x2="400" y2="90" stroke="#f1f5f9" strokeWidth="1" />

                                {/* Area Fill with pulse animation */}
                                <path
                                  d="M0,85 Q50,75 100,65 T190,72 T285,45 T375,52 L400,60 L400,120 L0,120 Z"
                                  fill="url(#chartGrad)"
                                  className="chart-area-path"
                                />

                                {/* Animated Glowing Wave Line */}
                                <path
                                  d="M0,85 Q50,75 100,65 T190,72 T285,45 T375,52 L400,60"
                                  fill="none"
                                  stroke="#6366f1"
                                  strokeWidth={isGraphHovered ? "3.2" : "2.5"}
                                  strokeLinecap="round"
                                  className={`transition-all ${isGraphHovered ? "chart-wave-glow" : ""}`}
                                />

                                {/* Vertical dashed hover guide line */}
                                {isGraphHovered && (
                                  <line
                                    x1={currentPoint.x}
                                    y1={currentPoint.y}
                                    x2={currentPoint.x}
                                    y2="120"
                                    stroke="#818cf8"
                                    strokeWidth="1.5"
                                    strokeDasharray="3 3"
                                  />
                                )}

                                {/* Interactive Hover Nodes along Wave */}
                                {graphPoints.map((pt) => (
                                  <g key={pt.index} onMouseEnter={() => setActiveGraphPoint(pt)}>
                                    {/* Invisible larger hover hit area */}
                                    <circle cx={pt.x} cy={pt.y} r="16" fill="transparent" className="cursor-pointer" />
                                    {/* Visible node circle */}
                                    <circle
                                      cx={pt.x}
                                      cy={pt.y}
                                      r={currentPoint.index === pt.index ? "6" : "3.5"}
                                      fill={currentPoint.index === pt.index ? "#ffffff" : "#6366f1"}
                                      stroke="#6366f1"
                                      strokeWidth={currentPoint.index === pt.index ? "3" : "1.5"}
                                      className="transition-all"
                                    />
                                    {currentPoint.index === pt.index && (
                                      <circle cx={pt.x} cy={pt.y} r="12" fill="#6366f1" opacity="0.25" className="pulse-ring" />
                                    )}
                                  </g>
                                ))}
                              </svg>
                            </div>

                            {/* 4 Mini metrics at bottom of chart with hover feedback */}
                            <div className="row g-1 pt-2 border-top border-light">
                              {[
                                { title: "New Hires", val: "15", badge: "↑ 28%", badgeColor: "text-success" },
                                { title: "Attrition Rate", val: "2.4%", badge: "↓ -0.8%", badgeColor: "text-danger" },
                                { title: "Avg. Tenure", val: "2.8 Yrs", badge: "↑ 0.6", badgeColor: "text-primary" },
                                { title: "Satisfaction", val: "4.6/5", badge: "★ 0.3", badgeColor: "text-success" }
                              ].map((m, idx) => (
                                <div key={m.title} className="col-3">
                                  <div
                                    className="p-1 bg-light rounded text-center transition-all hover-lift hover-bg cursor-pointer"
                                    onMouseEnter={() => {
                                      if (graphPoints[idx]) setActiveGraphPoint(graphPoints[idx]);
                                    }}
                                  >
                                    <small className="text-muted d-block" style={{ fontSize: "8px" }}>{m.title}</small>
                                    <strong className="text-dark d-block" style={{ fontSize: "10px" }}>
                                      {m.val} <span className={m.badgeColor} style={{ fontSize: "8px" }}>{m.badge}</span>
                                    </strong>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        </div>

                        {/* Pending Approvals Card with interactive list hover */}
                        <div className="col-4">
                          <div className="card border-0 shadow-xs p-2.5 rounded-3 bg-white h-100">
                            <h6 className="fw-bold mb-2 text-dark" style={{ fontSize: "12px" }}>
                              Pending Approvals <i className="bi bi-info-circle text-muted small"></i>
                            </h6>
                            <div className="d-flex flex-column gap-1.5">
                              {[
                                { id: 1, title: "Leave Requests", count: "3 pending requests", icon: "bi-calendar-check", color: "text-danger bg-danger" },
                                { id: 2, title: "Department Changes", count: "1 pending request", icon: "bi-diagram-3", color: "text-info bg-info" },
                                { id: 3, title: "Team Assignments", count: "1 pending request", icon: "bi-person-badge", color: "text-primary bg-primary" },
                                { id: 4, title: "Salary Approvals", count: "2 pending requests", icon: "bi-cash", color: "text-warning bg-warning" }
                              ].map((item) => (
                                <div
                                  key={item.id}
                                  className={`d-flex justify-content-between align-items-center p-1.5 rounded transition-all cursor-pointer ${
                                    hoveredApproval === item.id ? "bg-light shadow-2xs translate-x-2" : "bg-light border border-light"
                                  }`}
                                  onMouseEnter={() => setHoveredApproval(item.id)}
                                  onMouseLeave={() => setHoveredApproval(null)}
                                >
                                  <div className="d-flex align-items-center gap-1.5">
                                    <div className={`p-1 rounded ${item.color} bg-opacity-10 transition-all ${hoveredApproval === item.id ? "scale-110" : ""}`}>
                                      <i className={`bi ${item.icon}`} style={{ fontSize: "10px" }}></i>
                                    </div>
                                    <div>
                                      <span className="fw-bold text-dark d-block leading-none" style={{ fontSize: "10px" }}>{item.title}</span>
                                      <small className="text-muted" style={{ fontSize: "8px" }}>{item.count}</small>
                                    </div>
                                  </div>
                                  <i className={`bi bi-chevron-right text-muted transition-all ${hoveredApproval === item.id ? "text-primary translate-x-1" : ""}`} style={{ fontSize: "9px" }}></i>
                                </div>
                              ))}
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Bottom Row: Top Departments Progress Bars & Circle Donut with FULL HOVER ANIMATIONS */}
                      <div className="card border-0 shadow-xs p-2.5 rounded-3 bg-white">
                        <div className="d-flex justify-content-between align-items-center mb-2">
                          <div className="d-flex align-items-center gap-2">
                            <h6 className="fw-bold mb-0 text-dark" style={{ fontSize: "12px" }}>Top Departments</h6>
                            {hoveredDept && (
                              <span className="badge bg-primary bg-opacity-10 text-primary animate-fade-in" style={{ fontSize: "9px" }}>
                                {hoveredDept.name}: {hoveredDept.count} Employees ({Math.round((hoveredDept.count / 229) * 100)}%)
                              </span>
                            )}
                          </div>
                          <span className="text-primary small fw-semibold cursor-pointer hover-underline" style={{ fontSize: "10px" }}>View All</span>
                        </div>

                        <div className="row align-items-center">
                          {/* PROGRESS BARS WITH VIBRANT HOVER ANIMATION */}
                          <div className="col-8">
                            <div className="d-flex flex-column gap-1.5">
                              {[
                                { name: "Engineering", count: 86, color: "bg-primary", glow: "#3b82f6", pct: 38 },
                                { name: "Marketing", count: 45, color: "bg-purple", glow: "#8b5cf6", pct: 20 },
                                { name: "Sales", count: 38, color: "bg-info", glow: "#06b6d4", pct: 17 },
                                { name: "Human Resources", count: 32, color: "bg-success", glow: "#10b981", pct: 14 },
                                { name: "Finance", count: 28, color: "bg-warning", glow: "#f59e0b", pct: 11 }
                              ].map((d) => (
                                <div
                                  key={d.name}
                                  className={`d-flex align-items-center gap-2 p-1 rounded transition-all cursor-pointer ${
                                    hoveredDept?.name === d.name ? "bg-slate-100 shadow-2xs" : ""
                                  }`}
                                  onMouseEnter={() => setHoveredDept(d)}
                                  onMouseLeave={() => setHoveredDept(null)}
                                >
                                  <small className={`text-truncate transition-all ${hoveredDept?.name === d.name ? "fw-bold text-dark" : "text-muted"}`} style={{ width: "95px", fontSize: "10px" }}>
                                    {d.name}
                                  </small>
                                  {/* THE ANIMATED EXPANDING BAR */}
                                  <div className="progress flex-grow-1 position-relative overflow-hidden" style={{ height: hoveredDept?.name === d.name ? "8px" : "6px", transition: "height 0.25s ease" }}>
                                    <div
                                      className={`progress-bar ${d.color} ${hoveredDept?.name === d.name ? "progress-bar-glow progress-bar-striped progress-bar-animated" : ""}`}
                                      style={{
                                        width: `${(d.count / 86) * 100}%`,
                                        boxShadow: hoveredDept?.name === d.name ? `0 0 10px ${d.glow}` : "none",
                                        transition: "width 0.4s ease, box-shadow 0.25s ease"
                                      }}
                                    ></div>
                                  </div>
                                  <small className={`fw-bold transition-all ${hoveredDept?.name === d.name ? "text-primary scale-110" : "text-dark"}`} style={{ width: "22px", fontSize: "10px" }}>
                                    {d.count}
                                  </small>
                                </div>
                              ))}
                            </div>
                          </div>

                          {/* THE CIRCLE / DONUT CHART WITH HOVER PULSE & ROTATION */}
                          <div className="col-4 text-center">
                            <div
                              className={`position-relative d-inline-block transition-all cursor-pointer donut-interactive-wrapper ${
                                isCircleHovered ? "donut-hovered scale-110" : ""
                              }`}
                              onMouseEnter={() => setIsCircleHovered(true)}
                              onMouseLeave={() => setIsCircleHovered(false)}
                            >
                              <svg width="72" height="72" viewBox="0 0 36 36" className="circular-chart">
                                <path
                                  className="circle-bg"
                                  d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                                  fill="none"
                                  stroke="#e2e8f0"
                                  strokeWidth="3.8"
                                />
                                <path
                                  className={`circle ${isCircleHovered ? "circle-animated-dash" : ""}`}
                                  strokeDasharray={isCircleHovered ? "88, 100" : "80, 100"}
                                  d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                                  fill="none"
                                  stroke={isCircleHovered ? "#4f46e5" : "#6366f1"}
                                  strokeWidth={isCircleHovered ? "4.6" : "3.8"}
                                  strokeLinecap="round"
                                  style={{
                                    filter: isCircleHovered ? "drop-shadow(0 0 6px rgba(79, 70, 229, 0.6))" : "none",
                                    transition: "all 0.4s ease"
                                  }}
                                />
                              </svg>

                              {/* Center Number with Pulse Animation */}
                              <div className="position-absolute top-50 start-50 translate-middle text-center pointer-events-none">
                                <span className={`fw-bold text-dark d-block leading-none transition-all ${isCircleHovered ? "text-primary scale-115" : ""}`} style={{ fontSize: "12px" }}>
                                  229
                                </span>
                                <small className="text-muted leading-none d-block" style={{ fontSize: "8px" }}>
                                  {isCircleHovered ? "Total" : "Total"}
                                </small>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 3. POWERFUL FEATURES SECTION */}
      <section id="features" className="py-5 px-3 px-lg-5 bg-slate-50 border-top border-light">
        <div className="container-fluid p-0">
          <div className="text-center max-w-2xl mx-auto mb-5">
            <span className="badge bg-purple-soft text-purple-deep px-3 py-1 rounded-pill text-uppercase fw-bold mb-2 tracking-wider" style={{ fontSize: "11px" }}>
              POWERFUL FEATURES
            </span>
            <h2 className="fw-extrabold text-dark tracking-tight mb-2">Everything You Need to Manage Your Workforce</h2>
            <p className="text-secondary">Comprehensive tools designed to streamline every aspect of your workforce management</p>
          </div>

          <div className="row g-4">
            {[
              {
                id: 1,
                title: "Employee Management",
                desc: "Complete employee lifecycle management from onboarding to offboarding.",
                icon: "bi-people-fill",
                bg: "bg-purple-soft text-primary"
              },
              {
                id: 2,
                title: "Department Management",
                desc: "Organize departments, define hierarchies, and manage team structures.",
                icon: "bi-building",
                bg: "bg-primary bg-opacity-10 text-primary"
              },
              {
                id: 3,
                title: "Team Hierarchy",
                desc: "Visualize reporting structures and streamline team assignments.",
                icon: "bi-diagram-3-fill",
                bg: "bg-success bg-opacity-10 text-success"
              },
              {
                id: 4,
                title: "Analytics & Reports",
                desc: "Data-driven insights and comprehensive reports for better decisions.",
                icon: "bi-graph-up-arrow",
                bg: "bg-warning bg-opacity-10 text-warning"
              },
              {
                id: 5,
                title: "Request Management",
                desc: "Streamline approvals for leaves, changes, and other requests.",
                icon: "bi-inbox-fill",
                bg: "bg-danger bg-opacity-10 text-danger"
              },
              {
                id: 6,
                title: "Payroll Management",
                desc: "Automated payroll processing with accurate calculations and compliance.",
                icon: "bi-cash-coin",
                bg: "bg-info bg-opacity-10 text-info"
              }
            ].map((card) => (
              <div key={card.id} className="col-12 col-md-6 col-lg-4">
                <div
                  className={`card border-0 rounded-4 p-4 h-100 bg-white transition-all feature-card ${
                    hoveredCard === card.id ? "feature-card-hover" : "shadow-xs"
                  }`}
                  onMouseEnter={() => setHoveredCard(card.id)}
                  onMouseLeave={() => setHoveredCard(null)}
                >
                  <div className={`p-3 rounded-3 d-inline-flex align-items-center justify-content-center mb-3 ${card.bg}`} style={{ width: "52px", height: "52px" }}>
                    <i className={`bi ${card.icon} fs-4`}></i>
                  </div>
                  <h5 className="fw-bold text-dark mb-2">{card.title}</h5>
                  <p className="text-secondary small leading-relaxed mb-0">{card.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 4. FOOTER */}
      <footer className="bg-dark text-white py-4 px-3 px-lg-5 text-center">
        <div className="container-fluid p-0 d-flex flex-column flex-sm-row justify-content-between align-items-center gap-2">
          <small className="text-white-50">© 2026 Enterprise EMS Inc. All rights reserved.</small>
          <div className="d-flex align-items-center gap-3">
            <Link to="/login" className="text-white-50 text-decoration-none small hover-white">HR Portal</Link>
            <Link to="/login" className="text-white-50 text-decoration-none small hover-white">Manager Portal</Link>
            <Link to="/login" className="text-white-50 text-decoration-none small hover-white">Supervisor Portal</Link>
            <Link to="/login" className="text-white-50 text-decoration-none small hover-white">Employee Portal</Link>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;
