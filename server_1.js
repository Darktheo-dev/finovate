// Kevin's Lucre - Login, Registration, and Stock API Proxy

const express = require("express");
const bodyParser = require("body-parser");
const sqlite3 = require("sqlite3").verbose();
const fetch = require("node-fetch"); // For Node < 18
const app = express();
const db = new sqlite3.Database("users.db");
const port = 3000;

// Replace with your real API key or use process.env.STOCK_API_KEY
const STOCK_API_KEY = "2009faef44064e509bef9096d28efc4e";

// Middleware
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json()); // ✅ for handling JSON requests
app.use(express.static("public"));

// Create tables
db.serialize(() => {
  // Drop and recreate users table
  db.run(`DROP TABLE IF EXISTS users`);
  db.run(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      firstName TEXT,
      lastName TEXT,
      username TEXT UNIQUE,
      email TEXT UNIQUE,
      password TEXT,
      dob TEXT
    )
  `);

  // ✅ Create subscriptions table if not exists
  db.run(`
    CREATE TABLE IF NOT EXISTS subscriptions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      email TEXT,
      name TEXT,
      price REAL
    )
  `);
});

// Route: Login page direct access
app.get("/index", (req, res) => {
  res.send("This is the login route. Please use the login form.");
});

// Route: Register new account
app.post("/newAccount", (req, res) => {
  const { firstName, lastName, username, email, password, dob } = req.body;

  db.run(
    `INSERT INTO users (firstName, lastName, username, email, password, dob)
     VALUES (?, ?, ?, ?, ?, ?)`,
    [firstName, lastName, username, email, password, dob],
    function (err) {
      if (err) {
        if (err.message.includes("username")) {
          res.send("That username is already taken.");
        } else if (err.message.includes("email")) {
          res.send("That email is already registered.");
        } else {
          res.send("An unexpected error occurred.");
        }
      } else {
        res.send("New account created successfully.");
      }
    }
  );
});

// Route: Login user
app.post("/index", (req, res) => {
  const { username, password } = req.body;

  db.get(
    `SELECT * FROM users WHERE username = ? AND password = ?`,
    [username, password],
    (err, row) => {
      if (err) {
        res.send("An error occurred. Please try again.");
      } else if (row) {
        res.send("Login successful.");
      } else {
        res.send("Wrong username or password.");
      }
    }
  );
});

// ✅ Route: Save a subscription
app.post("/save-subscription", express.json(), (req, res) => {
  const { email, name, price } = req.body;
  console.log("🔥 Received:", req.body);

  if (!email || !name || !price) {
    console.log("❌ Missing one or more fields.");
    return res.status(400).send("Missing data");
  }

  db.run(
    `INSERT INTO subscriptions (email, name, price) VALUES (?, ?, ?)`,
    [email, name, price],
    function (err) {
      if (err) {
        console.error("❌ DB Error:", err.message);
        return res.status(500).send("Failed to save subscription.");
      }
      console.log("✅ Subscription saved:", name);
      res.send("Subscription saved.");
    }
  );
});
// ✅ Route: Get subscriptions for an email
app.get("/get-subscriptions", (req, res) => {
  const { email } = req.query;
  console.log("Fetching subscriptions for:", email); // 🔍 debug line

  db.all(
    `SELECT name, price FROM subscriptions WHERE email = ?`,
    [email],
    (err, rows) => {
      if (err) return res.status(500).send("Failed to fetch subscriptions.");
      res.json(rows);
    }
  );
});

// ✅ Route: Delete a subscription
app.post("/delete-subscription", (req, res) => {
  const { email, name } = req.body;

  db.run(
    `DELETE FROM subscriptions WHERE email = ? AND name = ?`,
    [email, name],
    function (err) {
      if (err) return res.status(500).send("Error deleting subscription.");
      res.send("Subscription deleted.");
    }
  );
});

// Route: Proxy for stock API (hides API key)
app.get("/api/stock", async (req, res) => {
  const { symbol } = req.query;

  if (!symbol) {
    return res.status(400).json({ error: "Missing stock symbol" });
  }

  try {
    const apiUrl = `https://finnhub.io/api/v1/quote?symbol=${symbol}&token=${STOCK_API_KEY}`;
    const response = await fetch(apiUrl);
    const data = await response.json();
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch stock data" });
  }
});

// Start the server
app.listen(port, () => {
  console.log("Lucre server running at http://localhost:" + port);
});
