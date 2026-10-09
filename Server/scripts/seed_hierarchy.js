import pool from "../config/db.js";

async function seed() {
  try {
    await pool.query(`
      INSERT INTO team_hierarchy (employee_id, supervisor_id, manager_id, assigned_at)
      VALUES
        (4, 3, 2, NOW()),
        (20, 19, 23, NOW()),
        (15, 21, 2, NOW())
      ON DUPLICATE KEY UPDATE supervisor_id=VALUES(supervisor_id), manager_id=VALUES(manager_id)
    `);
    const [rows] = await pool.query("SELECT * FROM team_hierarchy");
    console.log("Successfully seeded team_hierarchy:", rows.length, "rows");

    const [hierarchy] = await pool.query(`
      SELECT th.id, th.assigned_at,
             emp.id AS employee_id, emp.name AS employee_name, emp.email AS employee_email, emp.image_url AS employee_image, emp.role AS employee_role,
             sup.id AS supervisor_id, sup.name AS supervisor_name, sup.email AS supervisor_email, sup.image_url AS supervisor_image,
             mgr.id AS manager_id, mgr.name AS manager_name, mgr.email AS manager_email, mgr.image_url AS manager_image,
             d.name AS department_name, d.id AS department_id
      FROM team_hierarchy th
      JOIN users emp ON th.employee_id = emp.id
      JOIN users sup ON th.supervisor_id = sup.id
      JOIN users mgr ON th.manager_id = mgr.id
      LEFT JOIN departments d ON emp.department_id = d.id
      ORDER BY th.assigned_at DESC
    `);
    console.log("Hierarchy query returns:", hierarchy.length, "mapped records:");
    hierarchy.forEach(h => {
      console.log(` - Employee: ${h.employee_name} -> Sup: ${h.supervisor_name} -> Mgr: ${h.manager_name} (Dept: ${h.department_name})`);
    });
  } catch (err) {
    console.error("Seeding error:", err);
  } finally {
    process.exit(0);
  }
}

seed();
