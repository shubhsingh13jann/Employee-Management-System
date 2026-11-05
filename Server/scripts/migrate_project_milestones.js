import pool from "../config/db.js";

async function migrate() {
  try {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS project_milestones (
        id INT AUTO_INCREMENT PRIMARY KEY,
        project_id INT NOT NULL,
        title VARCHAR(255) NOT NULL,
        description TEXT NULL,
        due_date DATE NULL,
        owner_id INT NULL,
        status ENUM('pending', 'in_progress', 'completed') DEFAULT 'pending',
        order_index INT DEFAULT 0,
        deliverables JSON NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE,
        FOREIGN KEY (owner_id) REFERENCES users(id) ON DELETE SET NULL
      )
    `);
    console.log("Successfully created or verified project_milestones table");

    const [existing] = await pool.query("SELECT COUNT(*) AS count FROM project_milestones");
    if (existing[0].count === 0) {
      console.log("Seeding sample deliverable milestones...");

      // Milestones for PRJ 6 (Jarvis 2.0)
      const jarvisMilestones = [
        {
          project_id: 6,
          title: "Phase 1: Speech Recognition & NLP Core",
          description: "Low-latency streaming voice processing and Gemini API agent integration.",
          due_date: "2026-11-25",
          owner_id: 19,
          status: "in_progress",
          order_index: 1,
          deliverables: JSON.stringify([
            { id: "del-101", title: "Whisper & Gemini Live API integration", completed: true },
            { id: "del-102", title: "Low-latency WebSocket audio stream", completed: true },
            { id: "del-103", title: "Local intent router & voice fallback", completed: false },
          ]),
        },
        {
          project_id: 6,
          title: "Phase 2: Tool Execution & OS Integration",
          description: "Autonomous task execution runtime with secure permissions.",
          due_date: "2026-12-30",
          owner_id: 19,
          status: "pending",
          order_index: 2,
          deliverables: JSON.stringify([
            { id: "del-104", title: "Windows PowerShell daemon executor", completed: false },
            { id: "del-105", title: "Security sandbox & permission prompts", completed: false },
          ]),
        },
        {
          project_id: 6,
          title: "Phase 3: Production Release & Telemetry",
          description: "Enterprise deployment, audit telemetry, and load testing.",
          due_date: "2027-02-10",
          owner_id: 19,
          status: "pending",
          order_index: 3,
          deliverables: JSON.stringify([
            { id: "del-106", title: "Multi-tenant telemetry dashboards", completed: false },
            { id: "del-107", title: "Executive demo & deployment signoff", completed: false },
          ]),
        },
      ];

      // Milestones for PRJ 3 (Automated Payroll)
      const payrollMilestones = [
        {
          project_id: 3,
          title: "Phase 1: Tax Law Matrix & Deduction Engine",
          description: "Regulatory compliance algorithms for multi-state deduction models.",
          due_date: "2026-11-10",
          owner_id: 3,
          status: "completed",
          order_index: 1,
          deliverables: JSON.stringify([
            { id: "del-201", title: "FY2026 income slab calculations", completed: true },
            { id: "del-202", title: "Provident fund & health exemption formulas", completed: true },
          ]),
        },
        {
          project_id: 3,
          title: "Phase 2: Bank Direct-Debit Integrations",
          description: "Automated disbursement gateways with multi-bank reconciliation.",
          due_date: "2026-12-05",
          owner_id: 3,
          status: "in_progress",
          order_index: 2,
          deliverables: JSON.stringify([
            { id: "del-203", title: "ACH / NEFT batch generator", completed: true },
            { id: "del-204", title: "2FA payment authorization gateway", completed: false },
          ]),
        },
        {
          project_id: 3,
          title: "Phase 3: Digital Payslip Distribution",
          description: "Encrypted payslip PDF compilation and notification system.",
          due_date: "2026-12-20",
          owner_id: 3,
          status: "pending",
          order_index: 3,
          deliverables: JSON.stringify([
            { id: "del-205", title: "Digital signature verification", completed: false },
            { id: "del-206", title: "Instant email distribution pipeline", completed: false },
          ]),
        },
      ];

      // Milestones for PRJ 2 (Employee MS Upgradation)
      const emsMilestones = [
        {
          project_id: 2,
          title: "Phase 1: Database Normalization & Sharding",
          description: "Refactor legacy schemas into micro-relational tables.",
          due_date: "2026-11-08",
          owner_id: 19,
          status: "completed",
          order_index: 1,
          deliverables: JSON.stringify([
            { id: "del-301", title: "Audit logging trigger migration", completed: true },
            { id: "del-302", title: "Role hierarchy index optimization", completed: true },
          ]),
        },
        {
          project_id: 2,
          title: "Phase 2: Interactive Sub-Milestones & Capacity",
          description: "Deliver interactive deliverable checklists and supervisor analytics.",
          due_date: "2026-11-11",
          owner_id: 19,
          status: "in_progress",
          order_index: 2,
          deliverables: JSON.stringify([
            { id: "del-303", title: "Nested milestone checklist drawer", completed: true },
            { id: "del-304", title: "Real-time deliverable completion rollup", completed: false },
          ]),
        },
      ];

      for (const m of [...jarvisMilestones, ...payrollMilestones, ...emsMilestones]) {
        await pool.query(
          `INSERT INTO project_milestones (project_id, title, description, due_date, owner_id, status, order_index, deliverables)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
          [m.project_id, m.title, m.description, m.due_date, m.owner_id, m.status, m.order_index, m.deliverables]
        );
      }
      console.log("Seeded sample project milestones with checklists");
    }

    const [total] = await pool.query("SELECT COUNT(*) AS total FROM project_milestones");
    console.log("Total project milestones in database:", total[0].total);
  } catch (err) {
    console.error("Migration error:", err);
  } finally {
    process.exit(0);
  }
}

migrate();
