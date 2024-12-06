const express = require("express");
const jwt = require("jsonwebtoken");
const User = require("../models/user");
const bcrypt = require("bcrypt");

const router = express.Router();
const JWT_SECRET =
  "a3a3d2c17e862f280b00bfa0580106988300630a723d30cd29783d2be2bb492b";

// Middleware to verify admin
const verifyAdmin = async (req, res, next) => {
  const token = req.headers.authorization;
  if (!token) return res.status(401).json({ message: "Unauthorized" });

  try {
    const decoded = jwt.verify(token.split(" ")[1], JWT_SECRET);
    const user = await User.findById(decoded.id);
    if (user.role !== "admin")
      return res.status(403).json({ message: "Access denied" });
    next();
  } catch (err) {
    console.log(err);

    res.status(401).json({ message: "Invalid token" });
  }
};

// Admin Login
router.post("/login", async (req, res) => {
  //   const crypto = require("crypto");

  //   // Generate a random string (256-bit)
  //   const secret = crypto.randomBytes(32).toString("hex");
  //   console.log(secret);

  const { email, password } = req.body;

  try {
    const user = await User.findOne({ email, role: "admin" });
    console.log("Admin not found with email:", email, user);
    if (!user) return res.status(404).json({ message: "Admin not found." });

    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid)
      return res.status(401).json({ message: "Invalid credentials." });

    const token = jwt.sign({ id: user._id, role: user.role }, JWT_SECRET, {
      expiresIn: "1h",
    });

    res.status(200).json({
      token,
      name: user.name,
      email: user.email,
      role: user.role,
      balance: user.balance,
      id: user._id,
    });
  } catch (error) {
    res
      .status(500)
      .json({ message: "Error logging in.", error: error.message });
  }
});

// Create a user
router.post("/create-user", async (req, res) => {
  try {
    // const p = "12345678";

    //   async function hashPassword(p) {
    //     try {
    //       // Hash the password with a salt rounds of 10
    //       const hashedPassword = await bcrypt.hash(p, 10);
    //       console.log("Hashed Password:", hashedPassword);
    //     } catch (err) {
    //       console.error("Error hashing password:", err);
    //     }
    //   }

    //   hashPassword(p);
    const { name, email, role, password } = req.body;
    const newUser = new User({ name, email, role, password });
    await newUser.save();
    res.status(201).json({ message: "User created successfully" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get list of all users
router.get("/users", verifyAdmin, async (req, res) => {
  try {
    const users = await User.find();
    res.status(200).json(users);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Update user balance
router.put("/update-balance", verifyAdmin, async (req, res) => {
  const { userId, balance } = req.body;
  try {
    const user = await User.findByIdAndUpdate(
      { _id: userId },
      { balance },
      { new: true }
    );
    if (!user) return res.status(404).json({ message: "User not found" });
    res.status(200).json({
      name: user.name,
      email: user.email,
      role: user.role,
      balance: user.balance,
      id: user._id,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;