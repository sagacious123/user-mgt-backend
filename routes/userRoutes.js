const express = require("express");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");
const User = require("../models/user");
const Transaction = require("../models/transaction"); // Assuming you have a Transaction model

const router = express.Router();
const JWT_SECRET =
  "a3a3d2c17e862f280b00bfa0580106988300630a723d30cd29783d2be2bb492b";

// Login
router.post("/login", async (req, res) => {
  const { accountNumber, password, pin } = req.body;
  try {
    const user = await User.findOne({ accountNumber });
    if (!user) return res.status(404).json({ message: "User not found" });

    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid)
      return res.status(401).json({ message: "Invalid password." });

    if (pin !== user.pin)
      return res.status(401).json({ message: "Invalid PIN." });

    const token = jwt.sign({ id: user._id, role: user.role }, JWT_SECRET);

    res.status(200).json({
      token,
      accountNumber: user.accountNumber,
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
      accountNumber: user.accountNumber,
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

// Fetch transaction history
router.get("/:id/transactions", async (req, res) => {
  try {
    const transactions = await Transaction.find({ userId: req.params.id })
      .sort({ date: -1 }) // Most recent transactions first
      .exec();

    res.status(200).json(transactions);
  } catch (err) {
    res.status(500).json({
      message: "Error fetching transaction history",
      error: err.message,
    });
  }
});

// Submit a transaction
router.post("/:id/transactions", async (req, res) => {
  const token = req.headers.authorization;
  if (!token) return res.status(401).json({ message: "Unauthorized" });

  const {
    senderAccount,
    amount,
    beneficiaryAccount,
    beneficiaryName,
    beneficiaryBank,
    accountType,
    swiftIban,
    comment,
  } = req.body;

  try {
    // Verify JWT token
    const decoded = jwt.verify(token, JWT_SECRET);
    const user = await User.findById(decoded.id);

    if (!user) return res.status(404).json({ message: "User not found" });

    // // Check if the user has enough balance
    // if (user.balance < amount) {
    //   return res.status(400).json({ message: "Insufficient balance." });
    // }

    // Save the transaction
    const transaction = new Transaction({
      userId: user._id,
      senderAccount,
      amount,
      beneficiaryAccount,
      beneficiaryName,
      beneficiaryBank,
      accountType,
      swiftIban,
      comment,
      reference: `REF${Math.floor(Math.random() * 1000000)}`,
      date: new Date(),
    });

    await transaction.save();

    // Respond with success
    res.status(201).json({
      message: "Transaction submitted successfully.",
      transactionId: transaction._id,
    });
  } catch (err) {
    res
      .status(500)
      .json({ message: "Transaction submission failed.", error: err.message });
  }
});

module.exports = router;

// const express = require("express");
// const jwt = require("jsonwebtoken");
// const bcrypt = require("bcryptjs");
// const User = require("../models/user");
// const Transaction = require("../models/transaction"); // Assuming you have a Transaction model

// const router = express.Router();
// const JWT_SECRET =
//   "a3a3d2c17e862f280b00bfa0580106988300630a723d30cd29783d2be2bb492b";

// // Login
// router.post("/login", async (req, res) => {
//   const { email, password } = req.body;
//   try {
//     const user = await User.findOne({ email });
//     if (!user) return res.status(404).json({ message: "User not found" });

//     const isPasswordValid = await bcrypt.compare(password, user.password);
//     if (!isPasswordValid)
//       return res.status(401).json({ message: "Invalid credentials." });

//     const token = jwt.sign({ id: user._id, role: user.role }, JWT_SECRET);

//     res.status(200).json({
//       token,
//       name: user.name,
//       email: user.email,
//       role: user.role,
//       balance: user.balance,
//       id: user._id,
//     });
//   } catch (err) {
//     res.status(500).json({ error: err.message });
//   }
// });

// // Fetch current user details
// router.get("/:id", async (req, res) => {
//   try {
//     const user = await User.findById(req.params.id);
//     res.status(200).json({
//       name: user.name,
//       email: user.email,
//       role: user.role,
//       balance: user.balance,
//       id: user._id,
//     });
//   } catch (err) {
//     res
//       .status(500)
//       .json({ message: "Error fetching user details", error: err.message });
//   }
// });

// // Get account balance
// router.get("/balance", async (req, res) => {
//   const token = req.headers.authorization;
//   if (!token) return res.status(401).json({ message: "Unauthorized" });

//   try {
//     const decoded = jwt.verify(token, JWT_SECRET);
//     const user = await User.findById(decoded.id);
//     if (!user) return res.status(404).json({ message: "User not found" });

//     res.status(200).json({ balance: user.balance });
//   } catch (err) {
//     res.status(500).json({ error: err.message });
//   }
// });

// // Fetch transaction history
// router.get("/:id/transactions", async (req, res) => {
//   try {
//     const transactions = await Transaction.find({ userId: req.params.id })
//       .sort({ date: -1 }) // Most recent transactions first
//       .exec();

//     res.status(200).json(transactions);
//   } catch (err) {
//     res.status(500).json({
//       message: "Error fetching transaction history",
//       error: err.message,
//     });
//   }
// });

// // Submit a transaction
// router.post("/:id/transactions", async (req, res) => {
//   const token = req.headers.authorization;
//   if (!token) return res.status(401).json({ message: "Unauthorized" });

//   const {
//     senderAccount,
//     amount,
//     beneficiaryAccount,
//     beneficiaryName,
//     beneficiaryBank,
//     accountType,
//     swiftIban,
//     comment,
//   } = req.body;

//   try {
//     // Verify JWT token
//     const decoded = jwt.verify(token, JWT_SECRET);
//     const user = await User.findById(decoded.id);

//     if (!user) return res.status(404).json({ message: "User not found" });

//     // Check if the user has enough balance
//     if (user.balance < amount) {
//       return res.status(400).json({ message: "Insufficient balance." });
//     }

//     // Deduct the balance
//     // user.balance -= amount;
//     // await user.save();

//     // Save the transaction
//     const transaction = new Transaction({
//       userId: user._id,
//       senderAccount,
//       amount,
//       beneficiaryAccount,
//       beneficiaryName,
//       beneficiaryBank,
//       accountType,
//       swiftIban,
//       comment,
//       reference: `REF${Math.floor(Math.random() * 1000000)}`,
//       date: new Date(),
//     });

//     await transaction.save();

//     // Respond with success
//     res.status(201).json({
//       message: "Transaction submitted successfully.",
//       transactionId: transaction._id,
//     });
//   } catch (err) {
//     res
//       .status(500)
//       .json({ message: "Transaction submission failed.", error: err.message });
//   }
// });

// module.exports = router;
