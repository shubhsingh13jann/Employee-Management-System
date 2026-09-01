import pool from "../config/db.js";
import bcrypt from "bcrypt";

async function setupTables() {
  console.log("--- Aligning All Separate Tables ---");

  // 1. Admin table columns
  try { await pool.query("ALTER TABLE admin ADD COLUMN name VARCHAR(150) DEFAULT 'Shubh Singh'"); } catch {}
  try { await pool.query("ALTER TABLE admin ADD COLUMN password_hash VARCHAR(255)"); } catch {}

  // 2. Employee table columns
  try { await pool.query("ALTER TABLE employee ADD COLUMN password_hash VARCHAR(255)"); } catch {}
  try { await pool.query("ALTER TABLE employee ADD COLUMN department_id INT NULL"); } catch {}
  try { await pool.query("ALTER TABLE employee ADD COLUMN supervisor_id INT NULL"); } catch {}
  try { await pool.query("ALTER TABLE employee ADD COLUMN phone VARCHAR(20) DEFAULT ''"); } catch {}
  try { await pool.query("ALTER TABLE employee ADD COLUMN status ENUM('active', 'inactive') DEFAULT 'active'"); } catch {}

  // 3. Manager Table
  await pool.query(`
    CREATE TABLE IF NOT EXISTS manager (
      id INT AUTO_INCREMENT PRIMARY KEY,
      name VARCHAR(150) NOT NULL,
      email VARCHAR(150) NOT NULL UNIQUE,
      password VARCHAR(255) NOT NULL,
      password_hash VARCHAR(255) NOT NULL,
      department_id INT NULL,
      salary DECIMAL(12, 2) DEFAULT 0.00,
      phone VARCHAR(20) DEFAULT '',
      address VARCHAR(255) DEFAULT '',
      status ENUM('active', 'inactive') DEFAULT 'active',
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // 4. Supervisor Table
  await pool.query(`
    CREATE TABLE IF NOT EXISTS supervisor (
      id INT AUTO_INCREMENT PRIMARY KEY,
      name VARCHAR(150) NOT NULL,
      email VARCHAR(150) NOT NULL UNIQUE,
      password VARCHAR(255) NOT NULL,
      password_hash VARCHAR(255) NOT NULL,
      department_id INT NULL,
      manager_id INT NULL,
      salary DECIMAL(12, 2) DEFAULT 0.00,
      phone VARCHAR(20) DEFAULT '',
      address VARCHAR(255) DEFAULT '',
      status ENUM('active', 'inactive') DEFAULT 'active',
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // Passwords
  const salt = await bcrypt.genSalt(10);
  const adminHash = await bcrypt.hash("8859574934", salt);
  const managerHash = await bcrypt.hash("Manager@123", salt);
  const supervisorHash = await bcrypt.hash("Supervisor@123", salt);
  const employeeHash = await bcrypt.hash("Employee@123", salt);

  // Insert/Update Admin
  await pool.query(`
    INSERT INTO admin (name, email, password, password_hash)
    VALUES ('Shubh Singh', 'shubhsingh.13jan@gmail.com', '8859574934', ?)
    ON DUPLICATE KEY UPDATE name='Shubh Singh', password='8859574934', password_hash=VALUES(password_hash)
  `, [adminHash]);

  // Insert/Update Manager
  await pool.query(`
    INSERT INTO manager (name, email, password, password_hash, department_id, salary, phone, address)
    VALUES ('Sarah Jenkins', 'manager@company.com', 'Manager@123', ?, 1, 85000.00, '+1 555-0102', 'Building B, Floor 4')
    ON DUPLICATE KEY UPDATE name='Sarah Jenkins', password='Manager@123', password_hash=VALUES(password_hash)
  `, [managerHash]);

  // Insert/Update Supervisor
  await pool.query(`
    INSERT INTO supervisor (name, email, password, password_hash, department_id, manager_id, salary, phone, address)
    VALUES ('David Miller', 'supervisor@company.com', 'Supervisor@123', ?, 1, 1, 68000.00, '+1 555-0103', 'Building B, Floor 3')
    ON DUPLICATE KEY UPDATE name='David Miller', password='Supervisor@123', password_hash=VALUES(password_hash)
  `, [supervisorHash]);

  // Insert/Update Employee
  await pool.query(`
    INSERT INTO employee (name, email, password, password_hash, salary, address, category, department_id, supervisor_id)
    VALUES 
    ('Alex Turner', 'employee@company.com', 'Employee@123', ?, 52000.00, 'Building A, Floor 2', 'IT', 1, 1),
    ('Emma Watson', 'employee2@company.com', 'Employee@123', ?, 54000.00, 'Building A, Floor 2', 'IT', 1, 1)
    ON DUPLICATE KEY UPDATE password='Employee@123', password_hash=VALUES(password_hash)
  `, [employeeHash, employeeHash]);

  console.log("✓ All separate tables aligned and populated!");

  console.log("\n1. TABLE: admin (👑 HR Admin)");
  const [admins] = await pool.query("SELECT id, name, email FROM admin");
  console.table(admins);

  console.log("\n2. TABLE: manager (👔 Manager)");
  const [managers] = await pool.query("SELECT id, name, email, salary FROM manager");
  console.table(managers);

  console.log("\n3. TABLE: supervisor (👷 Supervisor)");
  const [supervisors] = await pool.query("SELECT id, name, email, salary FROM supervisor");
  console.table(supervisors);

  console.log("\n4. TABLE: employee (💼 Employee)");
  const [employees] = await pool.query("SELECT id, name, email, salary, supervisor_id FROM employee");
  console.table(employees);

  process.exit(0);
}

setupTables().catch(err => {
  console.error(err);
  process.exit(1);
});
