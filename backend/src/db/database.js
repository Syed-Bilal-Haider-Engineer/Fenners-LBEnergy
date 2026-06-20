const mongoose = require("mongoose");

const ensureDatabaseConnection = async (req, res, next) => {
  try {
    if (mongoose.connection.readyState === 1) {
      return next();
    }

    await mongoose.connect(process.env.MONGO_URL);
    console.log("MongoDB connected");

    next();
  } catch (error) {
    console.error("DB Error:", error);
    return res.status(500).json({ message: "Database connection failed" });
  }
};

module.exports = { ensureDatabaseConnection };