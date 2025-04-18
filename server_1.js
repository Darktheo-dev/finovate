// Kevin's Lucre - Basic Login + Registration (New Account)

const express = require("express");
const bodyParser = require("body-parser");
const sqlite3 = require("sqlite3").verbose();

const app = express();
const db = new sqlite3.Database("users.db");
const port = 3000;

// Middleware to handle form data
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static("public")); // Serve HTML/CSS/JS from /public

// Create full users table if not exists
db.run(`
  CREATE TABLE IF NOT EXISTS users (
    firstName TEXT,
    lastName TEXT,
    username TEXT UNIQUE,
    email TEXT UNIQUE,
    password TEXT,
    dob TEXT
  )
`);

// Optional: route message if user tries to visit /index directly
app.get("/index", (req, res) => {
  res.send("📝 This is the login route. Please use the login form.");
});

// Register route – Save full user info
app.post("/newAccount", (req, res) => {
  const { firstName, lastName, username, email, password, dob } = req.body;

  db.run(
    "INSERT INTO users (firstName, lastName, username, email, password, dob) VALUES (?, ?, ?, ?, ?, ?)",
    [firstName, lastName, username, email, password, dob],
    function (err) {
      if (err) {
        console.error("❌ DB Insert Error:", err.message);

        if (err.message.includes("username")) {
          res.send("❌ That username is already taken.");
        } else if (err.message.includes("email")) {
          res.send("❌ That email is already registered.");
        } else {
          res.send("❌ An unexpected error occurred.");
        }
      } else {
        console.log("✅ New account created:", { username, email }); // ✅ Moved here!
        res.send("✅ New account created successfully!");
      }
    }
  );
});

// Login route – Check if user exists
app.post("/index", (req, res) => {
  const name = req.body.username;
  const pass = req.body.password;

  db.get(
    "SELECT * FROM users WHERE username = ? AND password = ?",
    [name, pass],
    function (err, row) {
      if (row) {
        res.send("🎉 Login successful!");
      } else {
        res.send("❌ Wrong username or password.");
      }
    }
  );
});

// Start the server
app.listen(port, () => {
  console.log("🚀 Lucre server running at http://localhost:" + port);
});
