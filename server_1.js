// Kevin's Lucre - Basic Login + Registration (New Account)

const express = require("express");
const bodyParser = require("body-parser");
const sqlite3 = require("sqlite3").verbose();

const app = express();
const db = new sqlite3.Database("users.db");
const port = 3000;

// Middleware to handle form data and static files
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static("public")); // Serves your HTML/CSS/JS files

// Recreate users table with UNIQUE constraints if needed
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

// Route: Catch direct access to /index
app.get("/index", (req, res) => {
  res.send("📝 This is the login route. Please use the login form.");
});

// Route: Register new account
app.post("/newAccount", (req, res) => {
  const { firstName, lastName, username, email, password, dob } = req.body;

  console.log("📥 Received registration info:", req.body);

  db.run(
    `INSERT INTO users (firstName, lastName, username, email, password, dob)
     VALUES (?, ?, ?, ?, ?, ?)`,
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
        console.log("✅ New account created:", { username, email });
        res.send("✅ New account created successfully!");
      }
    }
  );
});

// Route: Login user
app.post("/index", (req, res) => {
  const { username, password } = req.body;

  console.log("🔐 Login attempt for:", username);

  db.get(
    `SELECT * FROM users WHERE username = ? AND password = ?`,
    [username, password],
    (err, row) => {
      if (err) {
        console.error("❌ Login error:", err.message);
        res.send("❌ An error occurred. Please try again.");
      } else if (row) {
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
