import pool from "../config/db.js";

async function migrate() {
  try {
    await pool.query(`
      ALTER TABLE projects 
      MODIFY COLUMN status ENUM('planning','active','on_hold','completed','archived') DEFAULT 'planning'
    `);
    console.log("Successfully updated projects status ENUM");

    const [priCols] = await pool.query("SHOW COLUMNS FROM projects LIKE 'priority'");
    if (priCols.length === 0) {
      await pool.query(`
        ALTER TABLE projects 
        ADD COLUMN priority ENUM('low','medium','high','critical') DEFAULT 'medium'
      `);
      console.log("Added priority column to projects");
    }

    const [budgetCols] = await pool.query("SHOW COLUMNS FROM projects LIKE 'budget'");
    if (budgetCols.length === 0) {
      await pool.query(`
        ALTER TABLE projects 
        ADD COLUMN budget DECIMAL(12,2) DEFAULT 0.00
      `);
      console.log("Added budget column to projects");
    }

    // Seed a couple of varied initiatives across departments so the admin view looks vibrant
    const [existing] = await pool.query("SELECT COUNT(*) as count FROM projects");
    if (existing[0].count < 4) {
      await pool.query(`
        INSERT INTO projects (title, description, department_id, created_by, lead_supervisor_id, status, priority, budget, start_date, target_date)
        VALUES 
          ('Automated Payroll & Tax Reconciliation', 'Compliance and automated tax computation module for financial year 2026.', 3, 1, 3, 'planning', 'high', 45000.00, '2026-10-15', '2026-12-20'),
          ('Global Employer Brand & Talent Acquisition', 'Cross-channel recruitment campaigns and careers portal overhaul.', 4, 1, 21, 'active', 'medium', 28000.00, '2026-09-15', '2026-11-30'),
          ('Cloud Infrastructure Security Hardening', 'Zero-trust network architecture and multi-region backup synchronization.', 1, 1, 19, 'active', 'critical', 65000.00, '2026-08-01', '2026-10-25')
      `);
      console.log("Seeded sample enterprise projects");
    }

    const [all] = await pool.query(`
      SELECT p.*, d.name as department_name, s.name as supervisor_name 
      FROM projects p
      LEFT JOIN departments d ON p.department_id = d.id
      LEFT JOIN users s ON p.lead_supervisor_id = s.id
    `);
    console.log("Total active projects:", all.length);
  } catch (err) {
    console.error("Migration error:", err);
  } finally {
    process.exit(0);
  }
}

migrate();
