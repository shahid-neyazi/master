const jwt = require("jsonwebtoken");

const SECRET = process.env.JWT_SECRET || "serveup-development-secret";

function requireAuth(req, res, next) {
  const header = req.headers.authorization || "";
  const token = header.startsWith("Bearer ") ? header.slice(7) : null;

  if (!token) return res.status(401).json({ error: "Authentication required" });

  try {
    req.user = jwt.verify(token, SECRET);
    next();
  } catch {
    return res.status(401).json({ error: "Invalid or expired token" });
  }
}

function optionalAuth(req, res, next) {
  const header = req.headers.authorization || "";
  const token = header.startsWith("Bearer ") ? header.slice(7) : null;

  if (!token) return next();

  try {
    req.user = jwt.verify(token, SECRET);
  } catch {
    return res.status(401).json({ error: "Invalid or expired token" });
  }
  next();
}

module.exports = { requireAuth, optionalAuth, SECRET };