import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";

import { authRouter } from "./routes/authRoutes.js";
import { adminRouter } from "./routes/adminRoutes.js";
import { managerRouter } from "./routes/managerRoutes.js";
import { supervisorRouter } from "./routes/supervisorRoutes.js";
import { employeeRouter } from "./routes/employeeRoutes.js";
import { taskRouter } from "./routes/taskRoutes.js";
import { seedDatabase } from "./utils/seed.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.join(__dirname, ".env") });

const app = express();
const PORT = process.env.PORT || 3000;
const CLIENT_URL = process.env.CLIENT_URL || "http://localhost:5173";

// Middleware
app.use(cors({
  origin: [CLIENT_URL, "http://localhost:5173", "http://127.0.0.1:5173"],
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
  credentials: true
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

// Static folder for uploaded files
app.use("/public", express.static(path.join(__dirname, "public")));

// API Routes
app.use("/api/auth", authRouter);
app.use("/auth", authRouter); // Backwards compatibility
app.use("/api/admin", adminRouter);
app.use("/api/manager", managerRouter);
app.use("/api/supervisor", supervisorRouter);
app.use("/api/employee", employeeRouter);
app.use("/api/tasks", taskRouter);

// Health Check
app.get("/api/health", (req, res) => {
  res.json({ status: true, message: "Enterprise EMS Backend Service Online", timestamp: new Date() });
});

// Global Error Handler
app.use((err, req, res, next) => {
  console.error("Unhandled Error:", err);
  res.status(500).json({ status: false, error: err.message || "Internal server error" });
});

// Auto-seed and start server
seedDatabase()
  .then(() => {
    app.listen(PORT, () => {
      console.log(`====================================================`);
      console.log(`  🏢 Enterprise EMS API Server running on port ${PORT}`);
      console.log(`  🌐 Client CORS Origin: ${CLIENT_URL}`);
      console.log(`  ⚡ Ready for 4-Tier Authenticated Requests`);
      console.log(`====================================================`);
    });
  })
  .catch(err => {
    console.error("Fatal startup error in database seeding:", err);
    process.exit(1);
  });
