const jwt = require("jsonwebtoken");
const config = require("config");
const mongoose = require("mongoose");
const secretConfig = process.env.JWT_SECRET;
module.exports = function (req, res, next) {
  // Get token from header
  const token = req.header("x-auth-token");
  // Check if not token
  if (!token) {
    return res
      .status(401)
      .json({ status: "failed", message: "No token, authorization denied..", data: [] });
  }

  // Verify token
  try {
    const decoded = jwt.verify(token, secretConfig);
    req.user = decoded;
   
    
    next();
  } catch (err) {
    res.status(401).json({ status: "failed", message: "Token is not valid", data: [] });
  }
};
