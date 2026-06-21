const express = require("express");
const { getFaults, getTimeline } = require("../controllers/fault.controller");

const faultRoutes = express.Router();

faultRoutes.get("/", getFaults);
faultRoutes.get("/timeline", getTimeline);

module.exports = faultRoutes;
