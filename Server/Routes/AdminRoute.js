import express from "express";
import con from "../utils/db.js";
import jwt from "jsonwebtoken";

const router = express.Router();

// Middleware to check if the user is an admin

router.post("/adminlogin", (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) {
    return res.status(400).json({ LoginStatus: false, Error: "Email and password are required" });
  }
  const sql = "SELECT * FROM admin WHERE email = ? AND password = ?";
  con.query(sql, [email, password], (err, result) => {
    if (err) return res.status(500).json({ LoginStatus: false, Error: "Database error" });
    if (result.length > 0) {
      const email = result[0].email;
      const token = jwt.sign(
        { role: "admin", email: email },
        "jwt_secret_key",
        { expiresIn: "1d" }
      );
      res.cookie('token', token, { httpOnly: true, sameSite: 'lax', maxAge: 24 * 60 * 60 * 1000 })
       return res.json({ LoginStatus: true });  
     }else{
            return res.json({ LoginStatus: false, Error: "Wrong Email or password" });
        }
  });
});

const requireAdmin = (req, res, next) => {
  const token = req.cookies.token;
  if (!token) return res.status(401).json({ status: false, Error: "Authentication required" });

  try {
    req.admin = jwt.verify(token, "jwt_secret_key");
    next();
  } catch {
    return res.status(401).json({ status: false, Error: "Invalid or expired session" });
  }
};

router.get("/verify", requireAdmin, (req, res) => {
  res.json({ status: true, admin: req.admin.email });
});

router.post("/logout", (req, res) => {
  res.clearCookie('token', { httpOnly: true, sameSite: 'lax' });
  res.json({ status: true });
});

//Querry to get the employee data from the employee table
router.get("/category", requireAdmin, (req, res) => {
  const sql = "SELECT * FROM category";
  con.query(sql, (err, result) => {
    if (err) return res.status(500).json({ status: false, Error: "Database error" });
    return res.json({status: true , Result: result});
  });
});


// Insert Querry to to add the category to the category table
router.post("/add_category", requireAdmin, (req, res) => {
  const name = String(req.body.category || '').trim();
  if (!name) return res.status(400).json({ status: false, Error: "Category name is required" });
  const sql = "INSERT INTO category (`name`) VALUES (?)";
  con.query(sql, [name], (err, result) => {
    if (err) return res.status(500).json({ status: false, Error: "Database error" });
    return res.json({ status: true });
  });
});

router.get("/employee", requireAdmin, (req, res) => {
  con.query("SELECT id, name, email, salary, address, category, image FROM employee", (err, result) => {
    if (err) return res.status(500).json({ status: false, Error: "Database error" });
    res.json({ status: true, Result: result });
  });
});

router.post("/add_employee", requireAdmin, (req, res) => {
  const { name, email, password, salary, address, category, image = '' } = req.body;
  if (![name, email, password, salary, address, category].every(value => String(value || '').trim())) {
    return res.status(400).json({ status: false, Error: "All employee fields are required" });
  }

  const sql = "INSERT INTO employee (name, email, password, salary, address, category, image) VALUES (?, ?, ?, ?, ?, ?, ?)";
  con.query(sql, [name.trim(), email.trim(), password, salary, address.trim(), category.trim(), image], (err) => {
    if (err) return res.status(500).json({ status: false, Error: "Database error" });
    res.json({ status: true });
  });
});



export { router as adminRouter };
