import React, { useEffect, useState } from "react";
import api from "../../api/axios";

const EmployeeProfile = () => {
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        setLoading(true);
        const res = await api.get("/api/employee/profile");
        if (res.data.status) {
          setProfile(res.data.profile);
        }
      } catch (err) {
        setError(err.response?.data?.error || "Failed to load profile");
      } finally {
        setLoading(false);
      }
    };
    fetchProfile();
  }, []);

  if (loading) {
    return (
      <div className="text-center py-12">
        <div className="spinner-border text-blue-600" role="status"></div>
        <p className="mt-2 text-gray-500">Loading employee profile...</p>
      </div>
    );
  }

  return (
    <div className="w-full px-6 p-0">
      {error && <div className="px-6 py-4 rounded relative bg-red-100 border border-gray-200 border-red-400 text-red-700">{error}</div>}

      <div className="flex flex-wrap -mx-4 justify-center">
        <div className="w-full px-6 col-lg-8">
          {/* Corporate Profile Card */}
          <div className="bg-white rounded-lg border border-gray-200 border-gray-200 shadow-sm flex flex-col shadow-sm border-0 rounded-xl overflow-hidden bg-white">
            {/* Header Banner */}
            <div className="p-6 text-white" style={{ background: "linear-gradient(135deg, #1e3a8a 0%, #2563eb 100%)" }}>
              <div className="flex flex-col flex-sm-row items-center gap-6">
                <div
                  className="bg-white text-blue-600 rounded-full font-bold flex items-center justify-center shadow overflow-hidden"
                  style={{ width: "80px", height: "80px", fontSize: "32px" }}
                >
                  {profile?.image_url ? (
                    <img
                      src={profile.image_url.startsWith("http") ? profile.image_url : `http://localhost:3000${profile.image_url}`}
                      alt={profile?.name}
                      style={{ width: "100%", height: "100%", objectFit: "cover" }}
                    />
                  ) : (
                    profile?.name?.charAt(0) || "E"
                  )}
                </div>
                <div className="text-center text-sm-start">
                  <h4 className="font-bold mb-0">{profile?.name}</h4>
                  <p className="text-white-50 mb-1">{profile?.email}</p>
                  <span className="badge bg-gray-50 text-blue-600 px-6 py-1 font-bold text-uppercase">
                    💼 {profile?.role}
                  </span>
                </div>
              </div>
            </div>

            {/* Profile Details Grid */}
            <div className="p-6 flex-1 p-6">
              <h6 className="text-gray-500 font-bold text-uppercase mb-6 text-sm tracking-wider">Organizational Details</h6>
              <div className="flex flex-wrap -mx-4 g-3 mb-6">
                <div className="w-full px-6 col-sm-6">
                  <div className="p-6 bg-gray-50 rounded-lg border border-gray-200 border-gray-200">
                    <span className="text-gray-500 text-sm block">Department</span>
                    <strong className="text-gray-900 text-base">{profile?.department_name || "General Engineering"}</strong>
                  </div>
                </div>
                <div className="w-full px-6 col-sm-6">
                  <div className="p-6 bg-gray-50 rounded-lg border border-gray-200 border-gray-200">
                    <span className="text-gray-500 text-sm block">Reporting Supervisor (Team Lead)</span>
                    <strong className="text-gray-900 text-base">
                      <i className="bi bi-person-badge text-green-600 mr-1"></i>
                      {profile?.supervisor_name || "Assigned by HR"}
                    </strong>
                  </div>
                </div>
                <div className="w-full px-6 col-sm-6">
                  <div className="p-6 bg-gray-50 rounded-lg border border-gray-200 border-gray-200">
                    <span className="text-gray-500 text-sm block">Department Manager</span>
                    <strong className="text-gray-900 text-base">
                      <i className="bi bi-person-gear text-blue-600 mr-1"></i>
                      {profile?.manager_name || "Assigned by HR"}
                    </strong>
                  </div>
                </div>
                <div className="w-full px-6 col-sm-6">
                  <div className="p-6 bg-gray-50 rounded-lg border border-gray-200 border-gray-200">
                    <span className="text-gray-500 text-sm block">Annual Base Salary</span>
                    <strong className="text-green-600 text-base">${Number(profile?.salary || 0).toLocaleString()} / year</strong>
                  </div>
                </div>
              </div>

              <h6 className="text-gray-500 font-bold text-uppercase mb-6 text-sm tracking-wider">Contact & Location</h6>
              <div className="flex flex-wrap -mx-4 g-3">
                <div className="w-full px-6 col-sm-6">
                  <div className="p-6 bg-gray-50 rounded-lg border border-gray-200 border-gray-200">
                    <span className="text-gray-500 text-sm block">Phone Number</span>
                    <strong className="text-gray-900">{profile?.phone || "+1 555-0104"}</strong>
                  </div>
                </div>
                <div className="w-full px-6 col-sm-6">
                  <div className="p-6 bg-gray-50 rounded-lg border border-gray-200 border-gray-200">
                    <span className="text-gray-500 text-sm block">Office Location / Address</span>
                    <strong className="text-gray-900">{profile?.address || "Building A, Floor 2"}</strong>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EmployeeProfile;
