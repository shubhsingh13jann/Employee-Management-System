import pool from "../config/db.js";
import bcrypt from "bcrypt";

async function checkEmployee() {
  console.log("--- Checking users table for employees ---");
  const [users] = await pool.query("SELECT id, name, email, role, password_hash, status FROM users WHERE role = 'employee'");
  console.table(users.map(u => ({ id: u.id, name: u.name, email: u.email, role: u.role, status: u.status, hash: u.password_hash ? u.password_hash.substring(0, 15) : "NONE" })));

  for (const u of users) {
    const match = await bcrypt.compare("Employee@123", u.password_hash);
    console.log("Check user:", u.email, "Password 'Employee@123' match:", match);
  }

  console.log("\n--- Checking employee table ---");
  const [empTable] = await pool.query("SELECT id, name, email, password, password_hash FROM employee");
  console.table(empTable.map(e => ({ id: e.id, name: e.name, email: e.email, plaintext: e.password, hash: e.password_hash ? e.password_hash.substring(0, 15) : "NONE" })));

  process.exit(0);
}
checkEmployee().catch(err => {
  console.error(err);
  process.exit(1);
});
