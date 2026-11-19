# Custom Components Library

This directory contains standardized, reusable custom UI components designed to prevent duplicate code across different modules and admin tabs of the Employee Management System.

---

## 🖨️ Universal Print Studio (`Components/custom/print`)

The **Universal Print Studio** (`UniversalPrintStudio.tsx`) standardizes document printing, paper audits, and PDF export across all system tabs (Team Hierarchy, Projects & Milestones, and all future admin modules).

> **STRICT RULE & BOUNDARY**:
> The Universal Print Studio is strictly for administrative dossiers, reporting lines, work breakdown ledgers, and audit records. **It must NOT be used for Employee ID Badges** (Employee ID badge printing in User Management uses dedicated card templates).

### Features
1. **Fluid Pastel Wave Header**:
   - Executive header design with SVG pastel gradient sweeps.
   - Dynamic page size & orientation pills (`A4 • PORTRAIT`).
   - Quick dismiss circular close button.

2. **3-Step Left Configuration Sidebar**:
   - **Step 1 (Report Scope)**: Filtered View vs. Full Dataset cards with real-time record counts.
   - **Step 2 (Content Modules)**: Interactive toggle cards allowing users to include/exclude specific sections (e.g., Financials, Milestones, Squads, Tasks, Audit Ledger).
   - **Step 3 (Page Format)**:
     - Page Size dropdown (`A4`, `Letter`, `Legal`).
     - Orientation dropdown (`Portrait`, `Landscape`).
     - Margins dropdown (`Standard`, `Narrow`, `Wide`).
     - Header Style dropdown (`Default`, `Minimal`, `Executive`).

3. **Interactive Document Preview Workspace**:
   - **Live Preview Toolbar**:
     - Page navigation controls (`<` and `>` with active page cube).
     - Zoom scaling controls (`-`, zoom percentage, `+`, ranges from 50% to 150%).
     - Fit-to-width toggle (`bi bi-arrows-fullscreen`).
     - Quick download / print trigger button.
   - **Paper Canvas Simulation**:
     - Real-time CSS scaling and shadow rendering.
     - Dynamic padding matching selected margins (`Narrow`, `Standard`, `Wide`).

4. **Dynamic Print Stylesheet**:
   - Injected `@media print` rules strictly isolating `#universal-printable-dossier`.
   - Automatic `@page` size and margin calculations.
   - Complete hiding of UI chrome, sidebars, buttons, and preview bars (`no-print`).

---

### How to Use `UniversalPrintStudio` in Any Tab

```tsx
import React, { useState } from "react";
import {
  UniversalPrintStudio,
  PrintDossierHeader,
  PrintDossierFooter,
  PrintScopeOption,
  PrintSectionToggle,
} from "../custom/print";

export const MyModulePrintDossier: React.FC<{ isOpen: boolean; onClose: () => void; data: any }> = ({
  isOpen,
  onClose,
  data,
}) => {
  const [scope, setScope] = useState("filtered");
  const [activeSections, setActiveSections] = useState({
    summary: true,
    details: true,
  });

  const scopes: PrintScopeOption[] = [
    { id: "filtered", label: "Filtered Records", count: 12, icon: "bi bi-funnel" },
    { id: "all", label: "Full Registry", count: 45, icon: "bi bi-database" },
  ];

  const sections: PrintSectionToggle[] = [
    { id: "summary", label: "Executive Summary", icon: "bi bi-graph-up", defaultChecked: true },
    { id: "details", label: "Detailed Line Items", icon: "bi bi-list-check", defaultChecked: true },
  ];

  return (
    <UniversalPrintStudio
      isOpen={isOpen}
      onClose={onClose}
      title="Print Module Dossier"
      subtitle="Executive print layout formatted for paper records and PDF export"
      scopes={scopes}
      activeScope={scope}
      onScopeChange={setScope}
      sections={sections}
      activeSections={activeSections}
      onToggleSection={(id, val) => setActiveSections((prev) => ({ ...prev, [id]: val }))}
      renderContent={({ pageSize, orientation, headerStyle, currentDate, currentTime }) => (
        <div className="space-y-4">
          <PrintDossierHeader
            headerStyle={headerStyle}
            documentTitle="Module Executive Dossier"
            documentSubtitle="Official Corporate Audit Record"
            pageSize={pageSize}
            orientation={orientation}
            currentDate={currentDate}
            currentTime={currentTime}
          />

          {/* Module Content */}
          {activeSections.summary && <div>Executive Summary Table...</div>}
          {activeSections.details && <div>Detailed Table...</div>}

          <PrintDossierFooter
            documentDate={currentDate}
            complianceText="EMS Corporate Compliance • Section 4.11"
          />
        </div>
      )}
    />
  );
};
```
