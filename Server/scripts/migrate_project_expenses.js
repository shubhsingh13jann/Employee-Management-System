import pool from "../config/db.js";

async function migrate() {
  try {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS project_expenses (
        id INT AUTO_INCREMENT PRIMARY KEY,
        project_id INT NOT NULL,
        title VARCHAR(255) NOT NULL,
        category ENUM('software', 'contractor', 'infra', 'hardware', 'travel', 'other') DEFAULT 'software',
        amount DECIMAL(12,2) NOT NULL DEFAULT 0.00,
        expense_date DATE NOT NULL,
        logged_by INT NULL,
        vendor_recipient VARCHAR(255) NULL,
        receipt_url VARCHAR(255) NULL,
        notes TEXT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE,
        FOREIGN KEY (logged_by) REFERENCES users(id) ON DELETE SET NULL
      )
    `);
    console.log("Successfully created or verified project_expenses table");

    const [existing] = await pool.query("SELECT COUNT(*) AS count FROM project_expenses");
    if (existing[0].count === 0) {
      console.log("Seeding initial enterprise expenses across active projects...");

      const [projects] = await pool.query("SELECT id, title, budget FROM projects");
      const [adminUser] = await pool.query("SELECT id FROM users WHERE role = 'admin' LIMIT 1");
      const adminId = adminUser[0]?.id || 1;

      for (const p of projects) {
        const budget = Number(p.budget) || 30000;

        // For project 1: High burn (92% - trigger critical burn warning HUD!)
        if (p.id === projects[0]?.id) {
          const exp1 = budget * 0.45;
          const exp2 = budget * 0.32;
          const exp3 = budget * 0.15;
          await pool.query(
            `INSERT INTO project_expenses (project_id, title, category, amount, expense_date, logged_by, vendor_recipient, notes)
             VALUES 
             (?, 'AWS Kubernetes & Multi-Region Cloud Infra', 'infra', ?, '2026-10-10', ?, 'Amazon Web Services', 'Production clusters & database replication instances'),
             (?, 'Specialist Security Architecture Contractor', 'contractor', ?, '2026-10-18', ?, 'Synack Cyber Labs', 'Penetration testing & zero-trust audit sprint'),
             (?, 'Enterprise Datadog & APM Observability Suite', 'software', ?, '2026-10-28', ?, 'Datadog Inc', 'Real-time telemetry and error monitoring license')`,
            [p.id, exp1, adminId, p.id, exp2, adminId, p.id, exp3, adminId]
          );
        } else if (p.id === projects[1]?.id) {
          // Moderate burn (~65%)
          const exp1 = budget * 0.35;
          const exp2 = budget * 0.30;
          await pool.query(
            `INSERT INTO project_expenses (project_id, title, category, amount, expense_date, logged_by, vendor_recipient, notes)
             VALUES 
             (?, 'External Fullstack Engineering Augmentation', 'contractor', ?, '2026-10-05', ?, 'Toptal Talent Network', 'Sprint 1 through 3 frontend UI implementation'),
             (?, 'Figma Enterprise Organization Licenses', 'software', ?, '2026-10-12', ?, 'Figma Inc', 'Annual seat allocation for product squads')`,
            [p.id, exp1, adminId, p.id, exp2, adminId]
          );
        } else {
          // Healthy early burn (~25-40%)
          const exp1 = Math.max(1200, Math.round(budget * 0.28));
          await pool.query(
            `INSERT INTO project_expenses (project_id, title, category, amount, expense_date, logged_by, vendor_recipient, notes)
             VALUES 
             (?, 'Development Tooling & Cloud Sandbox Environments', 'infra', ?, '2026-10-20', ?, 'Google Cloud Platform', 'Staging sandbox compute & Cloud Storage buckets')`,
            [p.id, exp1, adminId]
          );
        }
      }
      console.log("Finished seeding realistic sample project expenditures");
    }

    const [totalRows] = await pool.query("SELECT COUNT(*) AS count, SUM(amount) AS total FROM project_expenses");
    console.log(`Current project expenses count: ${totalRows[0].count}, Total spent: $${totalRows[0].total}`);
  } catch (err) {
    console.error("Migration error:", err);
  } finally {
    process.exit(0);
  }
}

migrate();
