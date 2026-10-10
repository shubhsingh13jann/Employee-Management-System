import React, { useState, useEffect } from "react";
import api from "../../api/axios";

const AdminProjects: React.FC = () => {
  const [loading, setLoading] = useState<boolean>(true);
  const [projects, setProjects] = useState<any[]>([]);

  useEffect(() => {
    const fetchProjects = async () => {
      try {
        setLoading(true);
        const res = await api.get("/api/admin/projects");
        if (res.data.status) {
          setProjects(res.data.projects);
        }
      } catch (err) {
        console.error("Failed to load enterprise projects", err);
      } finally {
        setLoading(false);
      }
    };
    fetchProjects();
  }, []);

  return (
    <div className="w-full min-h-screen p-3 sm:p-4.5 bg-slate-50/50">
      <div className="max-w-7xl mx-auto space-y-3">
        {/* Placeholder header */}
        <div className="p-4 rounded-xl bg-slate-900 text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-indigo-500/20 text-indigo-400 border border-indigo-500/30 flex items-center justify-center font-bold text-base">
              <i className="bi bi-kanban-fill"></i>
            </div>
            <div>
              <h2 className="text-base font-bold text-white mb-0">
                Enterprise Projects & Strategic Milestones
              </h2>
              <p className="text-xs text-slate-400 mb-0">
                Cross-department initiative management, deliverable tracking, and supervisor capacity
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminProjects;
