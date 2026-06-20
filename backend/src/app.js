const express = require("express");
const cookieParser = require("cookie-parser");
const helmet = require("helmet");
const cors = require("cors");
const dotenv = require("dotenv");


const { ensureDatabaseConnection } = require("./db/database");
const authRoutes = require("./routes/auth.route");

dotenv.config();

const app = express();

const BASE_URL = process.env.BASE_URL || "/api";
const PORT = process.env.PORT || 5000;

const allowedOrigins = new Set(
  [process.env.FRONTEND_ORIGIN].filter(Boolean)
);

// Middleware
app.use(cookieParser());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(helmet());

// CORS config
const corsOptions = {
  origin: function (origin, callback) {
    if (!origin) return callback(null, true);

    if (allowedOrigins.has(origin)) {
      return callback(null, true);
    }

    return callback(new Error("Not allowed by CORS: " + origin));
  },
  credentials: true,
};

app.use(cors(corsOptions));

// Manual CORS headers (optional extra safety)
app.use((req, res, next) => {
  const origin = req.headers.origin;

  if (origin && allowedOrigins.has(origin)) {
    res.header("Access-Control-Allow-Origin", origin);
    res.header("Access-Control-Allow-Credentials", "true");
    res.header(
      "Access-Control-Allow-Methods",
      "GET, POST, PUT, DELETE, OPTIONS, PATCH"
    );
    res.header(
      "Access-Control-Allow-Headers",
      "Content-Type, Authorization, Accept, Origin, X-Requested-With"
    );
    res.header("Vary", "Origin");
  }

  next();
});

// Health check
app.get("/health", (req, res) => {
  res.status(200).json({
    status: "healthy",
    uptime: process.uptime(),
    timestamp: Date.now(),
    environment: process.env.NODE_ENV || "development",
  });
});

// Routes
app.use(`${BASE_URL}/auth`, ensureDatabaseConnection, authRoutes);

module.exports = app;