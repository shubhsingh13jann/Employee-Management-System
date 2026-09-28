import pool from '../config/db.js';
import bcrypt from 'bcrypt';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export async function seedDatabase() {
  console.log('--- Initializing & Seeding Database ---');
  const schemaPath = path.join(__dirname, '../schema.sql');
  const sql = fs.readFileSync(schemaPath, 'utf8');

  // Split SQL commands by semicolon (ignoring empty lines)
  const statements = sql
    .split(';')
    .map(s => s.trim())
    .filter(s => s.length > 0);

  for (const statement of statements) {
    try {
      await pool.query(statement);
    } catch (err) {
      console.error('Error executing statement:', statement.substring(0, 50), err.message);
    }
  }
  console.log('✓ All database tables and security schema verified.');

  // Migration check: Add failed_login_attempts and last_failed_login to users if missing
  try {
    const [cols] = await pool.query("SHOW COLUMNS FROM users LIKE 'failed_login_attempts'");
    if (cols.length === 0) {
      await pool.query("ALTER TABLE users ADD COLUMN failed_login_attempts INT DEFAULT 0");
      console.log('✓ Migrated users table: added failed_login_attempts column');
    }
  } catch (err) {
    console.warn('Migration note (failed_login_attempts):', err.message);
  }

  try {
    const [cols] = await pool.query("SHOW COLUMNS FROM users LIKE 'last_failed_login'");
    if (cols.length === 0) {
      await pool.query("ALTER TABLE users ADD COLUMN last_failed_login TIMESTAMP NULL");
      console.log('✓ Migrated users table: added last_failed_login column');
    }
  } catch (err) {
    console.warn('Migration note (last_failed_login):', err.message);
  }

  try {
    const [cols] = await pool.query("SHOW COLUMNS FROM users LIKE 'lockout_until'");
    if (cols.length === 0) {
      await pool.query("ALTER TABLE users ADD COLUMN lockout_until TIMESTAMP NULL");
      console.log('✓ Migrated users table: added lockout_until column');
    }
  } catch (err) {
    console.warn('Migration note (lockout_until):', err.message);
  }

  // Migration checks for departments: code, head_id, parent_id
  try {
    const [cols] = await pool.query("SHOW COLUMNS FROM departments LIKE 'code'");
    if (cols.length === 0) {
      await pool.query("ALTER TABLE departments ADD COLUMN code VARCHAR(10) NULL AFTER name");
      console.log('✓ Migrated departments table: added code column');
    }
  } catch (err) {
    console.warn('Migration note (departments.code):', err.message);
  }

  try {
    const [cols] = await pool.query("SHOW COLUMNS FROM departments LIKE 'head_id'");
    if (cols.length === 0) {
      await pool.query("ALTER TABLE departments ADD COLUMN head_id INT NULL AFTER description");
      console.log('✓ Migrated departments table: added head_id column');
    }
  } catch (err) {
    console.warn('Migration note (departments.head_id):', err.message);
  }

  try {
    const [cols] = await pool.query("SHOW COLUMNS FROM departments LIKE 'parent_id'");
    if (cols.length === 0) {
      await pool.query("ALTER TABLE departments ADD COLUMN parent_id INT NULL AFTER head_id");
      console.log('✓ Migrated departments table: added parent_id column');
    }
  } catch (err) {
    console.warn('Migration note (departments.parent_id):', err.message);
  }

  // Backfill department codes and default HOD if missing
  try {
    await pool.query("UPDATE departments SET code = 'ENG' WHERE name = 'Engineering' AND (code IS NULL OR code = '')");
    await pool.query("UPDATE departments SET code = 'HR' WHERE name = 'Human Resources' AND (code IS NULL OR code = '')");
    await pool.query("UPDATE departments SET code = 'MKT' WHERE name = 'Marketing' AND (code IS NULL OR code = '')");
    await pool.query("UPDATE departments SET code = 'FIN' WHERE name = 'Finance' AND (code IS NULL OR code = '')");

    const [mgr] = await pool.query("SELECT id FROM users WHERE email = 'manager@company.com' LIMIT 1");
    if (mgr.length > 0) {
      await pool.query("UPDATE departments SET head_id = ? WHERE name = 'Engineering' AND head_id IS NULL", [mgr[0].id]);
    }
    console.log('✓ Verified department codes and default HOD mappings.');
  } catch (err) {
    console.warn('Migration note (departments backfill):', err.message);
  }

  // Migration check for department_transfers audit table
  try {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS department_transfers (
        id INT AUTO_INCREMENT PRIMARY KEY,
        user_id INT NOT NULL,
        source_department_id INT NULL,
        target_department_id INT NOT NULL,
        previous_supervisor_id INT NULL,
        new_supervisor_id INT NULL,
        transferred_by INT NULL,
        reason TEXT NULL,
        transferred_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        INDEX idx_transfer_user (user_id),
        INDEX idx_transfer_source (source_department_id),
        INDEX idx_transfer_target (target_department_id)
      )
    `);
    console.log('✓ Verified department_transfers audit logging schema.');
  } catch (err) {
    console.warn('Migration note (department_transfers):', err.message);
  }

  // Check if database is already seeded
  const [existing] = await pool.query("SELECT id FROM users LIMIT 1");
  if (existing.length > 0) {
    console.log('✓ Database already initialized and seeded. Skipping initial inserts.');
    return;
  }

  console.log('Inserting seed departments...');
  await pool.query(`
    INSERT INTO departments (name, code, description) VALUES
    ('Engineering', 'ENG', 'Software engineering, architecture, and IT operations'),
    ('Human Resources', 'HR', 'Talent acquisition, employee welfare, and operations'),
    ('Marketing', 'MKT', 'Digital marketing, sales outreach, and brand management'),
    ('Finance', 'FIN', 'Payroll, accounting, budgeting, and financial analysis')
    ON DUPLICATE KEY UPDATE code = VALUES(code), description = VALUES(description);
  `);

  const [engDept] = await pool.query("SELECT id FROM departments WHERE name = 'Engineering'");
  const engId = engDept[0]?.id || 1;

  console.log('Generating password hashes...');
  const salt = await bcrypt.genSalt(10);
  const adminPass = await bcrypt.hash('8859574934', salt);
  const managerPass = await bcrypt.hash('Manager@123', salt);
  const supervisorPass = await bcrypt.hash('Supervisor@123', salt);
  const employeePass = await bcrypt.hash('Employee@123', salt);

  console.log('Inserting 4-tier seed users...');
  // 1. HR Admin (Single Master)
  await pool.query(`
    INSERT INTO users (name, email, password_hash, role, salary, phone, address)
    VALUES ('Shubh Singh', 'shubhsingh.13jan@gmail.com', ?, 'admin', 95000.00, '+1 555-0100', 'Executive Suite 101')
  `, [adminPass]);

  // 2. Manager
  const [mgrRes] = await pool.query(`
    INSERT INTO users (name, email, password_hash, role, department_id, salary, phone, address)
    VALUES ('Sarah Jenkins', 'manager@company.com', ?, 'manager', ?, 85000.00, '+1 555-0102', 'Building B, Floor 4')
  `, [managerPass, engId]);
  const managerId = mgrRes.insertId;

  // Link Sarah Jenkins as default HOD for Engineering
  await pool.query("UPDATE departments SET head_id = ? WHERE id = ?", [managerId, engId]);

  // 3. Supervisor
  const [supRes] = await pool.query(`
    INSERT INTO users (name, email, password_hash, role, department_id, salary, phone, address)
    VALUES ('David Miller', 'supervisor@company.com', ?, 'supervisor', ?, 68000.00, '+1 555-0103', 'Building B, Floor 3')
  `, [supervisorPass, engId]);
  const supervisorId = supRes.insertId;

  // 4. Employee 1
  const [emp1Res] = await pool.query(`
    INSERT INTO users (name, email, password_hash, role, department_id, salary, phone, address)
    VALUES ('Alex Turner', 'employee@company.com', ?, 'employee', ?, 52000.00, '+1 555-0104', 'Building A, Floor 2')
  `, [employeePass, engId]);
  const emp1Id = emp1Res.insertId;

  // 5. Employee 2
  const [emp2Res] = await pool.query(`
    INSERT INTO users (name, email, password_hash, role, department_id, salary, phone, address)
    VALUES ('Emma Watson', 'employee2@company.com', ?, 'employee', ?, 54000.00, '+1 555-0105', 'Building A, Floor 2')
  `, [employeePass, engId]);
  const emp2Id = emp2Res.insertId;

  console.log('Mapping team hierarchy (Manager -> Supervisor -> Employees)...');
  await pool.query(`
    INSERT INTO team_hierarchy (manager_id, supervisor_id, employee_id) VALUES
    (?, ?, ?),
    (?, ?, ?)
  `, [managerId, supervisorId, emp1Id, managerId, supervisorId, emp2Id]);

  console.log('Creating demo project...');
  const [projRes] = await pool.query(`
    INSERT INTO projects (title, description, department_id, created_by, lead_supervisor_id, status, start_date, target_date)
    VALUES ('Core Platform Redesign 2026', 'Migrate legacy architecture to high-speed 4-tier micro-portal', ?, ?, ?, 'active', CURDATE(), DATE_ADD(CURDATE(), INTERVAL 30 DAY))
  `, [engId, managerId, supervisorId]);
  const projId = projRes.insertId;

  console.log('Creating demo tasks...');
  const [task1Res] = await pool.query(`
    INSERT INTO tasks (project_id, title, description, assigned_by, assigned_to, priority, status, due_date)
    VALUES (?, 'Implement JWT Auth & RBAC Middleware', 'Build token verification, cookie exchange, and role verification for all 4 roles.', ?, ?, 'high', 'in_progress', DATE_ADD(CURDATE(), INTERVAL 2 DAY))
  `, [projId, supervisorId, emp1Id]);
  const task1Id = task1Res.insertId;

  await pool.query(`
    INSERT INTO tasks (project_id, title, description, assigned_by, assigned_to, priority, status, due_date)
    VALUES (?, 'Design Responsive Dashboard UI Components', 'Create sleek card widgets, charts, and clean sidebar navigation.', ?, ?, 'medium', 'pending', DATE_ADD(CURDATE(), INTERVAL 4 DAY))
  `, [projId, supervisorId, emp2Id]);

  console.log('Creating task discussion comments...');
  await pool.query(`
    INSERT INTO task_comments (task_id, sender_id, message) VALUES
    (?, ?, 'Working on the JWT cookie verification. httpOnly and sameSite flags enabled.'),
    (?, ?, 'Awesome Alex! Make sure client handles 401 response and redirects to /login seamlessly.')
  `, [task1Id, emp1Id, task1Id, supervisorId]);

  console.log('Creating demo leave requests...');
  // Routine 2-day leave pending supervisor
  await pool.query(`
    INSERT INTO leave_requests (employee_id, supervisor_id, manager_id, leave_type, start_date, end_date, reason, status)
    VALUES (?, ?, ?, 'casual', DATE_ADD(CURDATE(), INTERVAL 5 DAY), DATE_ADD(CURDATE(), INTERVAL 6 DAY), 'Attending family wedding event.', 'pending_supervisor')
  `, [emp1Id, supervisorId, managerId]);

  // Extended 5-day leave escalated to manager
  await pool.query(`
    INSERT INTO leave_requests (employee_id, supervisor_id, manager_id, leave_type, start_date, end_date, reason, status, supervisor_notes)
    VALUES (?, ?, ?, 'paid', DATE_ADD(CURDATE(), INTERVAL 10 DAY), DATE_ADD(CURDATE(), INTERVAL 15 DAY), 'Annual family vacation trip.', 'pending_manager', 'Recommended by Supervisor David Miller. Sprint workload covered.')
  `, [emp2Id, supervisorId, managerId]);

  console.log('✓ Database seeding completed successfully!');
}

if (process.argv[1] && process.argv[1].endsWith('seed.js')) {
  seedDatabase()
    .then(() => process.exit(0))
    .catch(err => {
      console.error('Seeding failed:', err);
      process.exit(1);
    });
}
