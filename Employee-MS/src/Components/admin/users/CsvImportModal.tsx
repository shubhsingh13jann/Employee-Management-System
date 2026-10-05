import React, { useState, useRef } from "react";
import api from "../../../api/axios";

interface CsvImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  departments: Array<{ id: number; name: string }>;
}

interface ParsedEmployeeRow {
  id: number;
  name: string;
  email: string;
  role: string;
  department_name: string;
  department_id: number | null;
  salary: number;
  phone: string;
  address: string;
  isValid: boolean;
  errors: string[];
}

export const CsvImportModal: React.FC<CsvImportModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  departments
}) => {
  const [file, setFile] = useState<File | null>(null);
  const [parsedRows, setParsedRows] = useState<ParsedEmployeeRow[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState({ current: 0, total: 0 });
  const [importResult, setImportResult] = useState<{ success: number; failed: number } | null>(null);
  const [errorMsg, setErrorMsg] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  const validRowCount = parsedRows.filter((r) => r.isValid).length;
  const invalidRowCount = parsedRows.filter((r) => !r.isValid).length;

  const handleDownloadTemplate = () => {
    const csvContent =
      "name,email,role,department,salary,phone,address\n" +
      '"Alex Mercer","alex.mercer@company.com","employee","Engineering","85000","+1-555-0101","San Francisco, CA"\n' +
      '"Samantha Reed","samantha.reed@company.com","supervisor","Marketing","92000","+1-555-0102","New York, NY"\n' +
      '"Liam Vance","liam.vance@company.com","employee","Human Resources","78000","+1-555-0103","Austin, TX"';

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", "workforce_import_template.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const parseCsvText = (text: string) => {
    const lines = text
      .split(/\r?\n/)
      .map((l) => l.trim())
      .filter((l) => l.length > 0);

    if (lines.length < 2) {
      setErrorMsg("The uploaded CSV is empty or only contains headers.");
      setParsedRows([]);
      return;
    }

    const headerLine = lines[0];
    const headers = parseCsvLine(headerLine).map((h) => h.toLowerCase().trim());

    const nameIdx = headers.indexOf("name");
    const emailIdx = headers.indexOf("email");
    const roleIdx = headers.indexOf("role");
    const deptIdx = headers.indexOf("department");
    const salaryIdx = headers.indexOf("salary");
    const phoneIdx = headers.indexOf("phone");
    const addressIdx = headers.indexOf("address");

    if (nameIdx === -1 || emailIdx === -1) {
      setErrorMsg("Required columns 'name' and 'email' were not found in the CSV header.");
      setParsedRows([]);
      return;
    }

    const rows: ParsedEmployeeRow[] = [];

    for (let i = 1; i < lines.length; i++) {
      const cols = parseCsvLine(lines[i]);
      if (cols.length === 0 || cols.every((c) => c === "")) continue;

      const name = (cols[nameIdx] || "").trim();
      const email = (cols[emailIdx] || "").trim().toLowerCase();
      const rawRole = roleIdx !== -1 ? (cols[roleIdx] || "").trim().toLowerCase() : "employee";
      const deptName = deptIdx !== -1 ? (cols[deptIdx] || "").trim() : "";
      const rawSalary = salaryIdx !== -1 ? (cols[salaryIdx] || "").replace(/[^0-9.]/g, "") : "0";
      const phone = phoneIdx !== -1 ? (cols[phoneIdx] || "").trim() : "";
      const address = addressIdx !== -1 ? (cols[addressIdx] || "").trim() : "";

      const errors: string[] = [];
      if (!name) errors.push("Name is required");

      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!email) {
        errors.push("Email is required");
      } else if (!emailRegex.test(email)) {
        errors.push("Invalid email format");
      }

      const validRoles = ["admin", "manager", "supervisor", "employee"];
      const role = validRoles.includes(rawRole) ? rawRole : "employee";
      if (rawRole && !validRoles.includes(rawRole)) {
        errors.push(`Role '${rawRole}' invalid (must be: admin, manager, supervisor, or employee)`);
      }

      let matchedDeptId: number | null = null;
      if (deptName) {
        const found = departments.find(
          (d) => d.name.toLowerCase() === deptName.toLowerCase() || String(d.id) === deptName
        );
        if (found) {
          matchedDeptId = found.id;
        } else {
          errors.push(`Department '${deptName}' not found`);
        }
      }

      const salary = parseFloat(rawSalary) || 0;

      rows.push({
        id: i,
        name,
        email,
        role,
        department_name: deptName || "Unassigned",
        department_id: matchedDeptId,
        salary,
        phone,
        address,
        isValid: errors.length === 0,
        errors
      });
    }

    setParsedRows(rows);
    setErrorMsg("");
  };

  const parseCsvLine = (line: string): string[] => {
    const result: string[] = [];
    let insideQuote = false;
    let entry = "";

    for (let i = 0; i < line.length; i++) {
      const char = line[i];
      if (char === '"') {
        if (insideQuote && line[i + 1] === '"') {
          entry += '"';
          i++;
        } else {
          insideQuote = !insideQuote;
        }
      } else if (char === "," && !insideQuote) {
        result.push(entry);
        entry = "";
      } else {
        entry += char;
      }
    }
    result.push(entry);
    return result;
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      processSelectedFile(selectedFile);
    }
  };

  const processSelectedFile = (selectedFile: File) => {
    if (!selectedFile.name.endsWith(".csv")) {
      setErrorMsg("Please upload a valid .csv file.");
      return;
    }
    setFile(selectedFile);
    setImportResult(null);
    setErrorMsg("");

    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result as string;
      parseCsvText(text);
    };
    reader.onerror = () => {
      setErrorMsg("Failed to read the file. Please try again.");
    };
    reader.readAsText(selectedFile);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      processSelectedFile(e.dataTransfer.files[0]);
    }
  };

  const handleImport = async () => {
    const validRows = parsedRows.filter((r) => r.isValid);
    if (validRows.length === 0) return;

    setIsProcessing(true);
    setProgress({ current: 0, total: validRows.length });

    let successCount = 0;
    let failCount = 0;

    for (let i = 0; i < validRows.length; i++) {
      const row = validRows[i];
      try {
        await api.post("/api/admin/users", {
          name: row.name,
          email: row.email,
          password: "password123", // Default enterprise initial password
          role: row.role,
          department_id: row.department_id,
          salary: row.salary,
          phone: row.phone,
          address: row.address,
          status: "active"
        });
        successCount++;
      } catch (err) {
        console.error("Row import error for:", row.email, err);
        failCount++;
      }
      setProgress({ current: i + 1, total: validRows.length });
    }

    setIsProcessing(false);
    setImportResult({ success: successCount, failed: failCount });
    if (successCount > 0) {
      onSuccess();
    }
  };

  const handleReset = () => {
    setFile(null);
    setParsedRows([]);
    setImportResult(null);
    setErrorMsg("");
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  return (
    <div className="fixed inset-0 z-[1200] flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-in fade-in duration-150">
      <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl max-w-2xl w-full max-h-[90vh] flex flex-col overflow-hidden text-slate-800 animate-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between bg-gradient-to-r from-slate-50 to-indigo-50/30">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600 shadow-2xs shrink-0">
              <i className="bi bi-file-earmark-spreadsheet-fill text-lg"></i>
            </div>
            <div>
              <h3 className="font-bold text-slate-900 text-base leading-tight">Bulk CSV Workforce Onboarding</h3>
              <p className="text-xs text-slate-500 mt-0.5">Upload a CSV file to onboard multiple employees simultaneously</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 flex items-center justify-center transition-colors cursor-pointer"
          >
            <i className="bi bi-x-lg text-xs"></i>
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-5 overflow-y-auto space-y-4 flex-1 custom-scrollbar">
          {/* Action Bar: Download Sample Template */}
          <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50 border border-slate-200/80 text-xs">
            <div className="flex items-center gap-2 text-slate-600">
              <i className="bi bi-info-circle text-indigo-500 text-sm"></i>
              <span>Need the expected schema? Download our ready-to-use CSV template.</span>
            </div>
            <button
              type="button"
              onClick={handleDownloadTemplate}
              className="px-2.5 py-1.5 rounded-lg text-xs font-semibold text-indigo-600 bg-white hover:bg-indigo-50 border border-indigo-200 shadow-2xs transition-all flex items-center gap-1.5 cursor-pointer shrink-0"
            >
              <i className="bi bi-download"></i>
              <span>Download Template</span>
            </button>
          </div>

          {/* Drag & Drop Zone */}
          {!file && (
            <div
              onDragOver={(e) => {
                e.preventDefault();
                setIsDragging(true);
              }}
              onDragLeave={() => setIsDragging(false)}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
              className={`border-2 border-dashed rounded-2xl p-8 text-center cursor-pointer transition-all ${
                isDragging
                  ? "border-indigo-500 bg-indigo-50/50"
                  : "border-slate-200 hover:border-indigo-300 hover:bg-slate-50/50"
              }`}
            >
              <input
                ref={fileInputRef}
                type="file"
                accept=".csv"
                onChange={handleFileChange}
                className="hidden"
              />
              <div className="w-12 h-12 mx-auto rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center text-2xl mb-3 shadow-2xs">
                <i className="bi bi-cloud-arrow-up"></i>
              </div>
              <p className="text-sm font-semibold text-slate-800 mb-1">
                Drag and drop your <span className="text-indigo-600 font-bold">.csv</span> file here
              </p>
              <p className="text-xs text-slate-400">or click to browse from your computer</p>
              <div className="mt-3 flex items-center justify-center gap-2 text-[11px] text-slate-400">
                <span className="inline-flex items-center gap-1">
                  <i className="bi bi-check2 text-emerald-500 font-bold"></i> UTF-8 CSV
                </span>
                <span>•</span>
                <span className="inline-flex items-center gap-1">
                  <i className="bi bi-check2 text-emerald-500 font-bold"></i> Auto-validates rows
                </span>
                <span>•</span>
                <span className="inline-flex items-center gap-1">
                  <i className="bi bi-check2 text-emerald-500 font-bold"></i> Max 500 rows
                </span>
              </div>
            </div>
          )}

          {/* Error Message */}
          {errorMsg && (
            <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2">
              <i className="bi bi-exclamation-triangle-fill text-rose-500"></i>
              <span>{errorMsg}</span>
            </div>
          )}

          {/* Selected File & Preview Section */}
          {file && (
            <div className="space-y-3">
              {/* File Info Bar */}
              <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50 border border-slate-200">
                <div className="flex items-center gap-2.5 truncate">
                  <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center text-sm shrink-0 border border-emerald-200">
                    <i className="bi bi-filetype-csv"></i>
                  </div>
                  <div className="truncate">
                    <p className="text-xs font-bold text-slate-900 truncate">{file.name}</p>
                    <p className="text-[10px] text-slate-400">
                      {(file.size / 1024).toFixed(1)} KB • {parsedRows.length} rows parsed
                    </p>
                  </div>
                </div>
                {!isProcessing && !importResult && (
                  <button
                    type="button"
                    onClick={handleReset}
                    className="text-xs text-slate-500 hover:text-rose-600 px-2 py-1 rounded hover:bg-slate-100 transition-colors cursor-pointer"
                  >
                    Change File
                  </button>
                )}
              </div>

              {/* Status Badges */}
              <div className="flex items-center gap-2">
                <span className="px-2.5 py-1 rounded-lg text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200 flex items-center gap-1.5">
                  <i className="bi bi-check-circle-fill text-emerald-500"></i>
                  {validRowCount} Ready to Import
                </span>
                {invalidRowCount > 0 && (
                  <span className="px-2.5 py-1 rounded-lg text-xs font-semibold bg-rose-50 text-rose-700 border border-rose-200 flex items-center gap-1.5">
                    <i className="bi bi-exclamation-circle-fill text-rose-500"></i>
                    {invalidRowCount} Invalid (will be skipped)
                  </span>
                )}
              </div>

              {/* Live Preview Table */}
              <div className="border border-slate-200 rounded-xl overflow-hidden shadow-2xs max-h-56 overflow-y-auto custom-scrollbar">
                <table className="w-full text-left text-xs border-collapse">
                  <thead className="bg-slate-50 sticky top-0 text-[11px] font-semibold text-slate-600 border-b border-slate-200">
                    <tr>
                      <th className="px-3 py-2 w-8">#</th>
                      <th className="px-3 py-2">Name</th>
                      <th className="px-3 py-2">Email</th>
                      <th className="px-3 py-2">Role</th>
                      <th className="px-3 py-2">Department</th>
                      <th className="px-3 py-2 text-right">Salary</th>
                      <th className="px-3 py-2 text-center">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {parsedRows.map((r, idx) => (
                      <tr
                        key={r.id}
                        className={r.isValid ? "hover:bg-slate-50" : "bg-rose-50/40 hover:bg-rose-50/70"}
                      >
                        <td className="px-3 py-1.5 text-slate-400 text-[10px]">{idx + 1}</td>
                        <td className="px-3 py-1.5 font-medium text-slate-800">{r.name || "—"}</td>
                        <td className="px-3 py-1.5 text-slate-600 truncate max-w-[140px]">{r.email}</td>
                        <td className="px-3 py-1.5 capitalize text-slate-600">{r.role}</td>
                        <td className="px-3 py-1.5 text-slate-600">{r.department_name}</td>
                        <td className="px-3 py-1.5 text-right font-medium text-slate-700">
                          ${r.salary.toLocaleString()}
                        </td>
                        <td className="px-3 py-1.5 text-center">
                          {r.isValid ? (
                            <span className="inline-flex items-center text-[10px] text-emerald-600 font-semibold gap-1">
                              <i className="bi bi-check2"></i> Valid
                            </span>
                          ) : (
                            <span
                              className="inline-flex items-center text-[10px] text-rose-600 font-semibold gap-1 cursor-help"
                              title={r.errors.join("; ")}
                            >
                              <i className="bi bi-exclamation-triangle-fill"></i> Error
                            </span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Import Progress Bar */}
              {isProcessing && (
                <div className="space-y-1.5 p-3 rounded-xl bg-indigo-50/50 border border-indigo-100">
                  <div className="flex items-center justify-between text-xs text-indigo-900 font-semibold">
                    <span>Importing workforce accounts...</span>
                    <span>
                      {progress.current} / {progress.total}
                    </span>
                  </div>
                  <div className="w-full h-2 rounded-full bg-indigo-100 overflow-hidden">
                    <div
                      className="h-full bg-indigo-600 rounded-full transition-all duration-200"
                      style={{ width: `${(progress.current / progress.total) * 100}%` }}
                    ></div>
                  </div>
                </div>
              )}

              {/* Import Result Notification */}
              {importResult && (
                <div
                  className={`p-3.5 rounded-xl border flex items-center justify-between ${
                    importResult.failed === 0
                      ? "bg-emerald-50 border-emerald-200 text-emerald-900"
                      : "bg-amber-50 border-amber-200 text-amber-900"
                  }`}
                >
                  <div className="flex items-center gap-2 text-xs font-medium">
                    <i
                      className={`bi ${
                        importResult.failed === 0 ? "bi-check-circle-fill text-emerald-600" : "bi-exclamation-circle-fill text-amber-600"
                      } text-base`}
                    ></i>
                    <span>
                      Successfully onboarded <strong>{importResult.success}</strong> personnel accounts.
                      {importResult.failed > 0 && ` (${importResult.failed} failed)`}
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={onClose}
                    className="px-3 py-1 rounded-lg text-xs font-semibold bg-white border border-slate-200 shadow-2xs hover:bg-slate-50 transition-colors cursor-pointer text-slate-800"
                  >
                    Done
                  </button>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-5 py-3 border-t border-slate-100 flex items-center justify-end gap-2.5 bg-slate-50/60">
          <button
            type="button"
            onClick={onClose}
            disabled={isProcessing}
            className="px-3.5 py-1.5 rounded-xl text-xs font-semibold text-slate-600 hover:text-slate-800 hover:bg-slate-100 transition-colors cursor-pointer disabled:opacity-50"
          >
            Cancel
          </button>
          {file && !importResult && (
            <button
              type="button"
              onClick={handleImport}
              disabled={isProcessing || validRowCount === 0}
              className="px-4 py-1.5 rounded-xl text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-500 shadow-md shadow-indigo-600/30 transition-all flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
            >
              {isProcessing ? (
                <>
                  <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  <span>Importing...</span>
                </>
              ) : (
                <>
                  <i className="bi bi-cloud-arrow-up-fill"></i>
                  <span>Import {validRowCount} Members</span>
                </>
              )}
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
