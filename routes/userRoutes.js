const express = require("express");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcrypt");
const User = require("../models/user");

const router = express.Router();
const JWT_SECRET =
  "a3a3d2c17e862f280b00bfa0580106988300630a723d30cd29783d2be2bb492b";

// Login
router.post("/login", async (req, res) => {
  const { email, password } = req.body;
  try {
    const user = await User.findOne({ email });
    if (!user) return res.status(404).json({ message: "User not found" });

    console.log(user, password);
    const isPasswordValid = await bcrypt.compare(password, user.password);
    console.log(isPasswordValid);
    if (!isPasswordValid)
      return res.status(401).json({ message: "Invalid credentials." });

    const token = jwt.sign({ id: user._id, role: user.role }, JWT_SECRET, {
      expiresIn: "1h",
    });

    // const isPasswordValid = await bcrypt.compare(password, user.password);
    // if (!isPasswordValid)
    //   return res.status(401).json({ message: "Invalid credentials" });

    // const token = jwt.sign({ id: user._id }, JWT_SECRET, { expiresIn: "1h" });
    res.status(200).json({
      token,
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

// Fetch current user details
router.get("/:id", async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    res.status(200).json({
      name: user.name,
      email: user.email,
      role: user.role,
      balance: user.balance,
      id: user._id,
    });
  } catch (err) {
    res
      .status(500)
      .json({ message: "Error fetching user details", error: err.message });
  }
});

// Get account balance
router.get("/balance", async (req, res) => {
  const token = req.headers.authorization;
  if (!token) return res.status(401).json({ message: "Unauthorized" });

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    const user = await User.findById(decoded.id);
    if (!user) return res.status(404).json({ message: "User not found" });

    res.status(200).json({ balance: user.balance });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
//  //TCBncjlwaxZQvDbA
