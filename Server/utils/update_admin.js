import pool from "../config/db.js";
import bcrypt from "bcrypt";

async function updateAdmin() {
  const salt = await bcrypt.genSalt(10);
  const hash = await bcrypt.hash("8859574934", salt);

  // 1. Update or replace Admin in users table
  await pool.query(
    "UPDATE users SET name = 'Shubh Singh', email = 'shubhsingh.13jan@gmail.com', password_hash = ? WHERE role = 'admin'",
    [hash]
  );

  // Remove any redundant admin accounts if any exist
  await pool.query(
    "DELETE FROM users WHERE role = 'admin' AND email != 'shubhsingh.13jan@gmail.com'"
  );

  // 2. Ensure only 1 Manager exists
  const [managers] = await pool.query("SELECT id FROM users WHERE role = 'manager'");
  if (managers.length > 1) {
    const keepId = managers[0].id;
    await pool.query("DELETE FROM users WHERE role = 'manager' AND id != ?", [keepId]);
  }

  // 3. Update legacy admin table too
  await pool.query(
    "INSERT INTO admin (email, password) VALUES ('shubhsingh.13jan@gmail.com', '8859574934') ON DUPLICATE KEY UPDATE email = 'shubhsingh.13jan@gmail.com', password = '8859574934'"
  );

  console.log("✓ Successfully updated Admin credentials!");
  const [users] = await pool.query("SELECT id, name, email, role FROM users");
  console.table(users);
  process.exit(0);
}

updateAdmin().catch((err) => {
  console.error("Failed to update:", err);
  process.exit(1);
});
