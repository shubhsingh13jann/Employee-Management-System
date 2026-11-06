import pool from "../config/db.js";

async function migrate() {
  try {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS project_members (
        id INT AUTO_INCREMENT PRIMARY KEY,
        project_id INT NOT NULL,
        user_id INT NOT NULL,
        role_tag VARCHAR(50) DEFAULT 'Contributor',
        allocation_percentage INT DEFAULT 100,
        assigned_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
        UNIQUE KEY unique_project_member (project_id, user_id)
      )
    `);
    console.log("Successfully created or verified project_members table");

    const [existing] = await pool.query("SELECT COUNT(*) AS count FROM project_members");
    if (existing[0].count === 0) {
      console.log("Seeding sample squad allocations...");

      // Get sample users
      const [users] = await pool.query("SELECT id, name, role, department_id FROM users LIMIT 10");
      const [projects] = await pool.query("SELECT id, title, department_id, lead_supervisor_id FROM projects");

      if (projects.length > 0 && users.length > 0) {
        for (const proj of projects) {
          // Add lead supervisor if exists
          if (proj.lead_supervisor_id) {
            await pool.query(
              `INSERT IGNORE INTO project_members (project_id, user_id, role_tag, allocation_percentage)
               VALUES (?, ?, 'Tech Lead', 50)`,
              [proj.id, proj.lead_supervisor_id]
            );
          }

          // Add 2-3 department engineers
          const deptUsers = users.filter((u) => u.department_id === proj.department_id && u.id !== proj.lead_supervisor_id);
          const roles = ["Frontend", "Backend", "QA", "SME"];
          for (let i = 0; i < Math.min(deptUsers.length, 3); i++) {
            await pool.query(
              `INSERT IGNORE INTO project_members (project_id, user_id, role_tag, allocation_percentage)
               VALUES (?, ?, ?, ?)`,
              [proj.id, deptUsers[i].id, roles[i % roles.length], 80]
            );
          }
        }
      }
      console.log("Sample squad members seeded successfully");
    }

    const [finalCount] = await pool.query("SELECT COUNT(*) AS count FROM project_members");
    console.log("Total project squad members:", finalCount[0].count);
    process.exit(0);
  } catch (err) {
    console.error("Migration error:", err);
    process.exit(1);
  }
}

migrate();
