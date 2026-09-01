import jwt from "jsonwebtoken";

export const verifyToken = (req, res, next) => {
  let token = req.cookies?.token;

  if (!token && req.headers.authorization && req.headers.authorization.startsWith("Bearer ")) {
    token = req.headers.authorization.split(" ")[1];
  }

  if (!token) {
    return res.status(401).json({ status: false, error: "Access denied. Authentication required." });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || "ems_super_secret_jwt_key_2026_secure");
    req.user = decoded;
    next();
  } catch (err) {
    return res.status(401).json({ status: false, error: "Session expired or invalid token." });
  }
};

export const authorizeRoles = (...allowedRoles) => {
  return (req, res, next) => {
    if (!req.user || !allowedRoles.includes(req.user.role)) {
      return res.status(403).json({
        status: false,
        error: `Access forbidden: Insufficient permissions for role '${req.user?.role || "unknown"}'`
      });
    }
    next();
  };
};
