const express = require("express");
const { registerUser } = require("../controllers/user.controller");
const authRoutes = express.Router();

authRoutes.post("/register", registerUser);

module.exports = authRoutes;