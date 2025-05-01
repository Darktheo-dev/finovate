// Kevin's Lucre - Login, Registration, and Stock API Proxy

const express = require("express");
const bodyParser = require("body-parser");
const sqlite3 = require("sqlite3").verbose();
const fetch = require("node-fetch"); // For Node < 18
// require("dotenv").config(); // Uncomment to use .env for secrets

const app = express();
const db = new sqlite3.Database("users.db");
const port = 3000;

// Replace this with your real API key or use process.env.STOCK_API_KEY
const STOCK_API_KEY = "2009faef44064e509bef9096d28efc4e";

// Middleware
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static("public"));

// Create or recreate users table
db.serialize(() => {
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

// Route: Logout
app.post("/logout", (req, res) => {
  res.redirect("/index.html");
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
