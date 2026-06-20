const User = require("../models/user.model");

const registerUser = async (req, res) => {
  try {
    console.log("user data =>", req.body);

    const { name, email, password, role } = req.body;

    const existingUser = await User.findOne({ email });

    if (existingUser) {
      return res.status(400).json({
        message: "User already exists",
      });
    }

    const user = await User.create({
      name,
      email,
      password,
      role,
    });

    console.log("created user =>", user);

    return res.status(201).json({
      message: "User registered successfully",
      user,
    });
  } catch (error) {
    console.error("Register error:", error);

    return res.status(500).json({
      message: error.message,
    });
  }
};

module.exports = { registerUser };