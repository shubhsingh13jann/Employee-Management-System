import React, { useMemo, useState } from "react";

interface WorkforceAnalyticsSidebarProps {
  allUsers: any[];
  departments: any[];
}

export const WorkforceAnalyticsSidebar: React.FC<WorkforceAnalyticsSidebarProps> = ({
  allUsers,
  departments,
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
  // Radius = 44, Circumference = 2 * PI * 44 = ~276.46
  const radius = 44;
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
        barColor: "bg-sky-500",
        dotColor: "bg-sky-500",
      },
      {
        label: "Managers",
        count: counts.manager,
        pct: totalUsers > 0 ? Math.round((counts.manager / totalUsers) * 100) : 0,
        barColor: "bg-indigo-600",
        dotColor: "bg-indigo-600",
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
      { bar: "bg-rose-500", dot: "bg-rose-500" },
      { bar: "bg-sky-500", dot: "bg-sky-500" },
      { bar: "bg-indigo-500", dot: "bg-indigo-500" },
    ];

    const list = departments.map((dept, index) => {
      const count = allUsers.filter((u) => u.department_id === dept.id).length;
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
    const unassignedCount = allUsers.filter((u) => !u.department_id).length;
    if (unassignedCount > 0) {
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
  }, [allUsers, departments, totalUsers]);

  return (
    <div className="space-y-5">
      {/* Card 1: Workforce Overview Donut Chart */}
      <div className="p-5 rounded-2xl bg-white border border-slate-200/80 shadow-2xs transition-all hover:shadow-xs">
        <div className="flex items-center justify-between gap-2 mb-4">
          <div className="flex items-center gap-2">
            <i className="bi bi-pie-chart text-indigo-600 text-sm"></i>
            <h6 className="font-bold text-slate-900 text-xs sm:text-[13px] mb-0 tracking-tight">
              Workforce Overview
            </h6>
          </div>
          <select
            value={timeframe}
            onChange={(e) => setTimeframe(e.target.value)}
            className="text-[11px] font-semibold text-slate-600 bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1 outline-none cursor-pointer hover:border-slate-300 transition-colors"
          >
            <option>This Month</option>
            <option>This Quarter</option>
            <option>This Year</option>
          </select>
        </div>

        <div className="flex items-center justify-center gap-6 py-2">
          {/* Circular Donut Chart */}
          <div className="relative w-32 h-32 flex items-center justify-center shrink-0">
            <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
              {/* Background Ring */}
              <circle
                cx="50"
                cy="50"
                r={radius}
                className="stroke-slate-100"
                strokeWidth="11"
                fill="none"
              />
              {/* Active Segment */}
              <circle
                cx="50"
                cy="50"
                r={radius}
                className="stroke-emerald-500 transition-all duration-700 ease-out"
                strokeWidth="11"
                strokeDasharray={`${activeStroke} ${circumference}`}
                strokeDashoffset="0"
                fill="none"
                strokeLinecap="round"
              />
              {/* Inactive Segment */}
              {inactiveUsers > 0 && (
                <circle
                  cx="50"
                  cy="50"
                  r={radius}
                  className="stroke-slate-400 transition-all duration-700 ease-out"
                  strokeWidth="11"
                  strokeDasharray={`${inactiveStroke} ${circumference}`}
                  strokeDashoffset={-activeStroke}
                  fill="none"
                  strokeLinecap="round"
                />
              )}
              {/* On Leave Segment */}
              {onLeaveUsers > 0 && (
                <circle
                  cx="50"
                  cy="50"
                  r={radius}
                  className="stroke-amber-400 transition-all duration-700 ease-out"
                  strokeWidth="11"
                  strokeDasharray={`${onLeaveStroke} ${circumference}`}
                  strokeDashoffset={-(activeStroke + inactiveStroke)}
                  fill="none"
                  strokeLinecap="round"
                />
              )}
            </svg>

            {/* Centered Total Headcount */}
            <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
              <span className="text-2xl font-black text-slate-900 tracking-tight leading-none">
                {totalUsers}
              </span>
              <span className="text-[10px] font-semibold text-slate-400 mt-1 uppercase tracking-wider">
                Total Staff
              </span>
            </div>
          </div>

          {/* Legend Items */}
          <div className="space-y-2.5 min-w-[120px]">
            <div className="flex items-center justify-between gap-3 text-xs">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 shrink-0"></span>
                <span className="font-medium text-slate-600">Active</span>
              </div>
              <div className="flex items-center gap-1.5 font-bold text-slate-800">
                <span>{activeUsers}</span>
                <span className="text-[10px] font-semibold text-slate-400">({activePct}%)</span>
              </div>
            </div>

            <div className="flex items-center justify-between gap-3 text-xs">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-slate-400 shrink-0"></span>
                <span className="font-medium text-slate-600">Inactive</span>
              </div>
              <div className="flex items-center gap-1.5 font-bold text-slate-800">
                <span>{inactiveUsers}</span>
                <span className="text-[10px] font-semibold text-slate-400">({inactivePct}%)</span>
              </div>
            </div>

            <div className="flex items-center justify-between gap-3 text-xs">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-amber-400 shrink-0"></span>
                <span className="font-medium text-slate-600">On Leave</span>
              </div>
              <div className="flex items-center gap-1.5 font-bold text-slate-800">
                <span>{onLeaveUsers}</span>
                <span className="text-[10px] font-semibold text-slate-400">({onLeavePct}%)</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Card 2: Role Distribution */}
      <div className="p-5 rounded-2xl bg-white border border-slate-200/80 shadow-2xs transition-all hover:shadow-xs">
        <div className="flex items-center justify-between gap-2 mb-3.5">
          <h6 className="font-bold text-slate-900 text-xs sm:text-[13px] mb-0 tracking-tight flex items-center gap-2">
            <i className="bi bi-person-badge text-indigo-600 text-sm"></i>
            <span>Role Distribution</span>
          </h6>
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
            {roleDistribution.length} Tiers
          </span>
        </div>

        <div className="space-y-3">
          {roleDistribution.map((role) => (
            <div key={role.label} className="space-y-1">
              <div className="flex items-center justify-between text-xs font-semibold">
                <div className="flex items-center gap-1.5">
                  <span className={`w-2 h-2 rounded-full ${role.dotColor}`}></span>
                  <span className="text-slate-700">{role.label}</span>
                </div>
                <div className="flex items-center gap-2 font-mono text-[11px]">
                  <span className="font-bold text-slate-800">{role.count}</span>
                  <span className="text-slate-400 text-[10px]">{role.pct}%</span>
                </div>
              </div>
              <div className="w-full h-1.5 rounded-full bg-slate-100 overflow-hidden">
                <div
                  className={`h-full rounded-full ${role.barColor} transition-all duration-500 ease-out`}
                  style={{ width: `${Math.max(role.pct, 3)}%` }}
                ></div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Card 3: Department Distribution */}
      <div className="p-5 rounded-2xl bg-white border border-slate-200/80 shadow-2xs transition-all hover:shadow-xs">
        <div className="flex items-center justify-between gap-2 mb-3.5">
          <h6 className="font-bold text-slate-900 text-xs sm:text-[13px] mb-0 tracking-tight flex items-center gap-2">
            <i className="bi bi-diagram-3 text-indigo-600 text-sm"></i>
            <span>Department Distribution</span>
          </h6>
          <select
            value={selectedDeptFilter}
            onChange={(e) => setSelectedDeptFilter(e.target.value)}
            className="text-[11px] font-semibold text-slate-600 bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1 outline-none cursor-pointer hover:border-slate-300 transition-colors"
          >
            <option value="all">All Departments</option>
            {departments.map((d) => (
              <option key={d.id} value={d.id}>
                {d.name}
              </option>
            ))}
          </select>
        </div>

        <div className="space-y-3">
          {departmentDistribution.slice(0, 5).map((dept) => (
            <div key={dept.name} className="space-y-1">
              <div className="flex items-center justify-between text-xs font-semibold">
                <div className="flex items-center gap-1.5 truncate max-w-[160px]">
                  <span className={`w-2 h-2 rounded-full ${dept.dot} shrink-0`}></span>
                  <span className="text-slate-700 truncate">{dept.name}</span>
                </div>
                <div className="flex items-center gap-2 font-mono text-[11px] shrink-0">
                  <span className="font-bold text-slate-800">{dept.count}</span>
                  <span className="text-slate-400 text-[10px]">{dept.pct}%</span>
                </div>
              </div>
              <div className="w-full h-1.5 rounded-full bg-slate-100 overflow-hidden">
                <div
                  className={`h-full rounded-full ${dept.bar} transition-all duration-500 ease-out`}
                  style={{ width: `${Math.max(dept.pct, 3)}%` }}
                ></div>
              </div>
            </div>
          ))}

          {departmentDistribution.length > 5 && (
            <div className="pt-1 text-center">
              <span className="text-[11px] font-semibold text-indigo-600 cursor-pointer hover:text-indigo-700">
                + {departmentDistribution.length - 5} more departments
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Card 4: Recent Activity Feed */}
      <div className="p-5 rounded-2xl bg-white border border-slate-200/80 shadow-2xs transition-all hover:shadow-xs">
        <div className="flex items-center justify-between gap-2 mb-3.5">
          <h6 className="font-bold text-slate-900 text-xs sm:text-[13px] mb-0 tracking-tight flex items-center gap-2">
            <i className="bi bi-clock-history text-indigo-600 text-sm"></i>
            <span>Recent Activity</span>
          </h6>
          <span className="text-[11px] font-semibold text-indigo-600 hover:text-indigo-700 cursor-pointer">
            View All
          </span>
        </div>

        <div className="space-y-3.5">
          {/* Item 1 */}
          <div className="flex items-start gap-3">
            <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-600 border border-emerald-100 flex items-center justify-center shrink-0 shadow-2xs">
              <i className="bi bi-person-plus text-xs font-bold"></i>
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex items-center justify-between gap-2">
                <p className="text-xs font-bold text-slate-800 mb-0">New user onboarded</p>
                <span className="text-[10px] text-slate-400 font-mono">2h ago</span>
              </div>
              <p className="text-[11px] text-slate-500 mb-0 truncate">
                Personnel profile registered to directory
              </p>
            </div>
          </div>

          {/* Item 2 */}
          <div className="flex items-start gap-3">
            <div className="w-8 h-8 rounded-xl bg-purple-50 text-purple-600 border border-purple-100 flex items-center justify-center shrink-0 shadow-2xs">
              <i className="bi bi-arrow-repeat text-xs font-bold"></i>
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex items-center justify-between gap-2">
                <p className="text-xs font-bold text-slate-800 mb-0">Role updated</p>
                <span className="text-[10px] text-slate-400 font-mono">1d ago</span>
              </div>
              <p className="text-[11px] text-slate-500 mb-0 truncate">
                Reporting line hierarchy reassigned
              </p>
            </div>
          </div>

          {/* Item 3 */}
          <div className="flex items-start gap-3">
            <div className="w-8 h-8 rounded-xl bg-blue-50 text-blue-600 border border-blue-100 flex items-center justify-center shrink-0 shadow-2xs">
              <i className="bi bi-building text-xs font-bold"></i>
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex items-center justify-between gap-2">
                <p className="text-xs font-bold text-slate-800 mb-0">Department assigned</p>
                <span className="text-[10px] text-slate-400 font-mono">3d ago</span>
              </div>
              <p className="text-[11px] text-slate-500 mb-0 truncate">
                Staff member linked to organizational unit
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
