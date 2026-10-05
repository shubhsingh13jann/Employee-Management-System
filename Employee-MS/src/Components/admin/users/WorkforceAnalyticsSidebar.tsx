import React, { useMemo, useState } from "react";

interface WorkforceAnalyticsSidebarProps {
  allUsers: any[];
  departments: any[];
  onClose?: () => void;
}

export const WorkforceAnalyticsSidebar: React.FC<WorkforceAnalyticsSidebarProps> = ({
  allUsers,
  departments,
  onClose,
}) => {
  const [timeframe, setTimeframe] = useState("This Month");
  const [selectedDeptFilter, setSelectedDeptFilter] = useState("all");

  // Calculations for Workforce Overview Donut Chart
  const totalUsers = allUsers.length;
  const activeUsers = allUsers.filter((u) => u.status === "active").length;
  const inactiveUsers = allUsers.filter((u) => u.status === "inactive").length;
  const onLeaveUsers = allUsers.filter((u) => u.status === "leave" || u.status === "on_leave").length;

  const activePct = totalUsers > 0 ? Math.round((activeUsers / totalUsers) * 100) : 0;
  const inactivePct = totalUsers > 0 ? Math.round((inactiveUsers / totalUsers) * 100) : 0;
  const onLeavePct = totalUsers > 0 ? Math.round((onLeaveUsers / totalUsers) * 100) : 0;

  // SVG Donut calculation
  // Radius = 40, Circumference = 2 * PI * 40 = ~251.33
  const radius = 40;
  const circumference = 2 * Math.PI * radius;
  const activeStroke = (activePct / 100) * circumference;
  const inactiveStroke = (inactivePct / 100) * circumference;
  const onLeaveStroke = (onLeavePct / 100) * circumference;

  // Role Distribution
  const roleDistribution = useMemo(() => {
    const counts = {
      employee: allUsers.filter((u) => u.role === "employee").length,
      manager: allUsers.filter((u) => u.role === "manager").length,
      hod: allUsers.filter((u) => u.is_hod).length,
      supervisor: allUsers.filter((u) => u.role === "supervisor").length,
      admin: allUsers.filter((u) => u.role === "admin").length,
    };

    return [
      {
        label: "Employees",
        count: counts.employee,
        pct: totalUsers > 0 ? Math.round((counts.employee / totalUsers) * 100) : 0,
        barColor: "bg-blue-500",
        dotColor: "bg-blue-500",
      },
      {
        label: "Managers",
        count: counts.manager,
        pct: totalUsers > 0 ? Math.round((counts.manager / totalUsers) * 100) : 0,
        barColor: "bg-purple-500",
        dotColor: "bg-purple-500",
      },
      {
        label: "Dept Heads",
        count: counts.hod,
        pct: totalUsers > 0 ? Math.round((counts.hod / totalUsers) * 100) : 0,
        barColor: "bg-amber-500",
        dotColor: "bg-amber-500",
      },
      {
        label: "Supervisors",
        count: counts.supervisor,
        pct: totalUsers > 0 ? Math.round((counts.supervisor / totalUsers) * 100) : 0,
        barColor: "bg-emerald-500",
        dotColor: "bg-emerald-500",
      },
      {
        label: "Admins",
        count: counts.admin,
        pct: totalUsers > 0 ? Math.round((counts.admin / totalUsers) * 100) : 0,
        barColor: "bg-rose-500",
        dotColor: "bg-rose-500",
      },
    ];
  }, [allUsers, totalUsers]);

  // Department Distribution
  const departmentDistribution = useMemo(() => {
    const colors = [
      { bar: "bg-purple-500", dot: "bg-purple-500" },
      { bar: "bg-amber-500", dot: "bg-amber-500" },
      { bar: "bg-emerald-500", dot: "bg-emerald-500" },
      { bar: "bg-pink-400", dot: "bg-pink-400" },
      { bar: "bg-cyan-400", dot: "bg-cyan-400" },
      { bar: "bg-indigo-400", dot: "bg-indigo-400" },
    ];

    let filteredUsers = allUsers;
    if (selectedDeptFilter !== "all") {
      filteredUsers = allUsers.filter((u) => String(u.department_id) === String(selectedDeptFilter));
    }

    const list = departments.map((dept, index) => {
      const count = filteredUsers.filter((u) => u.department_id === dept.id).length;
      const pct = totalUsers > 0 ? Math.round((count / totalUsers) * 100) : 0;
      const colorScheme = colors[index % colors.length];
      return {
        id: dept.id,
        name: dept.name,
        count,
        pct,
        ...colorScheme,
      };
    });

    // Check for unassigned
    const unassignedCount = filteredUsers.filter((u) => !u.department_id).length;
    if (unassignedCount > 0 && selectedDeptFilter === "all") {
      list.push({
        id: -1,
        name: "Unassigned",
        count: unassignedCount,
        pct: totalUsers > 0 ? Math.round((unassignedCount / totalUsers) * 100) : 0,
        bar: "bg-slate-400",
        dot: "bg-slate-400",
      });
    }

    return list.sort((a, b) => b.count - a.count);
  }, [allUsers, departments, totalUsers, selectedDeptFilter]);

  const topDepartments = departmentDistribution.slice(0, 5);
  const overflowDepartments = departmentDistribution.slice(5);
  const overflowCount = overflowDepartments.reduce((acc, d) => acc + d.count, 0);
  const overflowPct = overflowDepartments.reduce((acc, d) => acc + d.pct, 0);

  return (
    <div className="space-y-3">
      {/* Card 1: Workforce Overview Donut Chart */}
      <div className="p-3.5 sm:p-4 rounded-xl bg-white border border-slate-200/80 shadow-2xs overflow-hidden">
        <div className="flex items-center justify-between gap-2 mb-2.5">
          <div className="flex items-center gap-1.5 min-w-0">
            <i className="bi bi-pie-chart text-blue-600 text-xs shrink-0"></i>
            <h6 className="font-bold text-slate-900 text-xs sm:text-[13px] mb-0 tracking-tight whitespace-nowrap">
              Workforce Overview
            </h6>
          </div>
          <div className="flex items-center gap-1.5 shrink-0">
            <select
              value={timeframe}
              onChange={(e) => setTimeframe(e.target.value)}
              className="text-[11px] font-semibold text-slate-600 bg-slate-50 border border-slate-200 rounded-lg px-2 py-0.5 outline-none cursor-pointer hover:border-slate-300 transition-colors"
            >
              <option>This Month</option>
              <option>This Quarter</option>
              <option>This Year</option>
            </select>
            {onClose && (
              <button
                type="button"
                onClick={onClose}
                className="w-6 h-6 rounded-md text-slate-400 hover:text-slate-700 hover:bg-slate-100 flex items-center justify-center transition-colors cursor-pointer text-xs"
                title="Collapse Sidebar"
              >
                ✕
              </button>
            )}
          </div>
        </div>

        <div className="flex items-center gap-3.5 sm:gap-4 py-1">
          {/* Circular Donut Chart Matching Legend Colors */}
          <div className="relative w-26 h-26 sm:w-28 sm:h-28 flex items-center justify-center shrink-0">
            <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
              <defs>
                <linearGradient id="activeWheelGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#10b981" />
                  <stop offset="100%" stopColor="#059669" />
                </linearGradient>
              </defs>

              {/* Background Ring */}
              <circle
                cx="50"
                cy="50"
                r={radius}
                className="stroke-slate-100"
                strokeWidth="10"
                fill="none"
              />

              {/* Active Segment (Emerald Green matching Active dot) */}
              <circle
                cx="50"
                cy="50"
                r={radius}
                stroke="url(#activeWheelGradient)"
                strokeWidth="10"
                strokeDasharray={`${activeStroke} ${circumference}`}
                strokeDashoffset="0"
                fill="none"
                strokeLinecap="round"
                className="transition-all duration-700 ease-out"
              />

              {/* Inactive Segment (Slate matching Inactive dot) */}
              {inactiveUsers > 0 && (
                <circle
                  cx="50"
                  cy="50"
                  r={radius}
                  className="stroke-slate-400 transition-all duration-700 ease-out"
                  strokeWidth="10"
                  strokeDasharray={`${inactiveStroke} ${circumference}`}
                  strokeDashoffset={-activeStroke}
                  fill="none"
                  strokeLinecap="round"
                />
              )}

              {/* On Leave Segment (Amber matching On Leave dot) */}
              {onLeaveUsers > 0 && (
                <circle
                  cx="50"
                  cy="50"
                  r={radius}
                  className="stroke-amber-500 transition-all duration-700 ease-out"
                  strokeWidth="10"
                  strokeDasharray={`${onLeaveStroke} ${circumference}`}
                  strokeDashoffset={-(activeStroke + inactiveStroke)}
                  fill="none"
                  strokeLinecap="round"
                />
              )}
            </svg>

            {/* Centered Total Headcount */}
            <div className="absolute inset-0 flex flex-col items-center justify-center text-center pointer-events-none">
              <span className="text-2xl font-bold text-slate-900 tracking-tight leading-none">
                {totalUsers}
              </span>
              <span className="text-[10px] font-medium text-slate-400 mt-1">
                Total Workforce
              </span>
            </div>
          </div>

          {/* Legend Items with clean aligned columns */}
          <div className="flex-1 space-y-2 min-w-0">
            <div className="flex items-center justify-between text-xs">
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-[2px] bg-emerald-500 shrink-0"></span>
                <span className="font-medium text-slate-700">Active</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="font-bold text-slate-900 text-xs">{activeUsers}</span>
                <span className="text-[11px] text-slate-400 font-normal w-7 text-right">{activePct}%</span>
              </div>
            </div>

            <div className="flex items-center justify-between text-xs">
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-[2px] bg-slate-400 shrink-0"></span>
                <span className="font-medium text-slate-700">Inactive</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="font-bold text-slate-900 text-xs">{inactiveUsers}</span>
                <span className="text-[11px] text-slate-400 font-normal w-7 text-right">{inactivePct}%</span>
              </div>
            </div>

            <div className="flex items-center justify-between text-xs">
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-[2px] bg-amber-500 shrink-0"></span>
                <span className="font-medium text-slate-700">On Leave</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="font-bold text-slate-900 text-xs">{onLeaveUsers}</span>
                <span className="text-[11px] text-slate-400 font-normal w-7 text-right">{onLeavePct}%</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Card 2: Role Distribution (Compact Single-Row Horizontal Bars) */}
      <div className="p-3.5 sm:p-4 rounded-xl bg-white border border-slate-200/80 shadow-2xs overflow-hidden">
        <div className="flex items-center justify-between gap-2 mb-2.5">
          <h6 className="font-bold text-slate-900 text-xs sm:text-[13px] mb-0 tracking-tight">
            Role Distribution
          </h6>
        </div>

        <div className="space-y-2">
          {roleDistribution.map((role) => (
            <div key={role.label} className="flex items-center justify-between text-xs">
              {/* Left Label */}
              <div className="flex items-center gap-1.5 w-22 sm:w-24 shrink-0">
                <span className={`w-2.5 h-2.5 rounded-[2px] ${role.dotColor} shrink-0`}></span>
                <span className="font-medium text-slate-700 text-xs truncate">{role.label}</span>
              </div>

              {/* Center Bar */}
              <div className="flex-1 h-2 rounded-full bg-slate-100 mx-2.5 overflow-hidden">
                <div
                  className={`h-full rounded-full ${role.barColor} transition-all duration-500 ease-out`}
                  style={{ width: `${Math.max(role.pct, 3)}%` }}
                ></div>
              </div>

              {/* Right Count and % */}
              <div className="flex items-center justify-end gap-1.5 w-14 shrink-0 text-right font-mono">
                <span className="font-bold text-slate-800 text-xs">{role.count}</span>
                <span className="text-[11px] text-slate-400 font-normal w-7 text-right">{role.pct}%</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Card 3: Department Distribution (Compact Single-Row Horizontal Bars) */}
      <div className="p-3.5 sm:p-4 rounded-xl bg-white border border-slate-200/80 shadow-2xs overflow-hidden">
        <div className="flex items-center justify-between gap-2 mb-2.5">
          <h6 className="font-bold text-slate-900 text-xs sm:text-[13px] mb-0 tracking-tight whitespace-nowrap">
            Department Distribution
          </h6>
          <select
            value={selectedDeptFilter}
            onChange={(e) => setSelectedDeptFilter(e.target.value)}
            className="text-[11px] font-semibold text-slate-600 bg-slate-50 border border-slate-200 rounded-lg px-2 py-0.5 outline-none cursor-pointer hover:border-slate-300 transition-colors max-w-[130px] truncate"
          >
            <option value="all">All Departments</option>
            {departments.map((d) => (
              <option key={d.id} value={d.id}>
                {d.name}
              </option>
            ))}
          </select>
        </div>

        <div className="space-y-2">
          {topDepartments.map((dept) => (
            <div key={dept.name} className="flex items-center justify-between text-xs">
              {/* Left Dept Label */}
              <div className="flex items-center gap-1.5 w-24 sm:w-26 shrink-0 truncate">
                <span className={`w-2.5 h-2.5 rounded-[2px] ${dept.dot} shrink-0`}></span>
                <span className="font-medium text-slate-700 text-xs truncate">{dept.name}</span>
              </div>

              {/* Center Bar */}
              <div className="flex-1 h-2 rounded-full bg-slate-100 mx-2.5 overflow-hidden">
                <div
                  className={`h-full rounded-full ${dept.bar} transition-all duration-500 ease-out`}
                  style={{ width: `${Math.max(dept.pct, 3)}%` }}
                ></div>
              </div>

              {/* Right Count and % */}
              <div className="flex items-center justify-end gap-1.5 w-14 shrink-0 text-right font-mono">
                <span className="font-bold text-slate-800 text-xs">{dept.count}</span>
                <span className="text-[11px] text-slate-400 font-normal w-7 text-right">{dept.pct}%</span>
              </div>
            </div>
          ))}

          {/* Overflow Row (+ X more) */}
          {overflowDepartments.length > 0 && selectedDeptFilter === "all" && (
            <div className="flex items-center justify-between text-xs pt-0.5">
              <div className="flex items-center gap-1.5 w-24 sm:w-26 shrink-0">
                <span className="font-medium text-indigo-600 text-xs truncate">
                  + {overflowDepartments.length} more
                </span>
              </div>

              <div className="flex-1 h-2 rounded-full bg-slate-100 mx-2.5 overflow-hidden">
                <div
                  className="h-full rounded-full bg-indigo-300 transition-all duration-500 ease-out"
                  style={{ width: `${Math.max(overflowPct, 3)}%` }}
                ></div>
              </div>

              <div className="flex items-center justify-end gap-1.5 w-14 shrink-0 text-right font-mono">
                <span className="font-bold text-slate-800 text-xs">{overflowCount}</span>
                <span className="text-[11px] text-slate-400 font-normal w-7 text-right">{overflowPct}%</span>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Card 4: Recent Activity Feed (Compact & Pixel-Perfect) */}
      <div className="p-3.5 sm:p-4 rounded-xl bg-white border border-slate-200/80 shadow-2xs overflow-hidden">
        <div className="flex items-center justify-between gap-2 mb-2.5">
          <h6 className="font-bold text-slate-900 text-xs sm:text-[13px] mb-0 tracking-tight">
            Recent Activity
          </h6>
          <span className="text-xs font-semibold text-blue-600 hover:text-blue-700 cursor-pointer">
            View All
          </span>
        </div>

        <div className="space-y-2.5">
          {/* Activity Item 1 */}
          <div className="flex items-center gap-2.5">
            <div className="w-7.5 h-7.5 rounded-lg bg-emerald-50 text-emerald-600 border border-emerald-100/60 flex items-center justify-center shrink-0 shadow-2xs text-xs">
              <i className="bi bi-person-fill"></i>
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex items-baseline justify-between gap-1.5">
                <p className="text-xs font-bold text-slate-900 mb-0 truncate">New user added</p>
                <span className="text-[10px] text-slate-400 shrink-0 font-normal">2h ago</span>
              </div>
              <p className="text-[11px] text-slate-500 mb-0 truncate">
                Emily Davis joined Marketing
              </p>
            </div>
          </div>

          {/* Activity Item 2 */}
          <div className="flex items-center gap-2.5">
            <div className="w-7.5 h-7.5 rounded-lg bg-purple-50 text-purple-600 border border-purple-100/60 flex items-center justify-center shrink-0 shadow-2xs text-xs">
              <i className="bi bi-briefcase-fill"></i>
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex items-baseline justify-between gap-1.5">
                <p className="text-xs font-bold text-slate-900 mb-0 truncate">Role updated</p>
                <span className="text-[10px] text-slate-400 shrink-0 font-normal">1d ago</span>
              </div>
              <p className="text-[11px] text-slate-500 mb-0 truncate">
                Lisa Anderson → Supervisor
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
