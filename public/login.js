document.addEventListener("DOMContentLoaded", function () {
  const loginButton = document.getElementById("loginButton");

  loginButton.addEventListener("click", function (e) {
    e.preventDefault(); // Prevent page from reloading

    const username = document.getElementById("username").value.trim();
    const password = document.getElementById("password").value.trim();

    if (username === "" || password === "") {
      alert("⚠️ Please enter both username and password.");
      return;
    }

    // Send credentials to backend for verification
    fetch("/index", {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: `username=${encodeURIComponent(username)}&password=${encodeURIComponent(password)}`
    })
      .then((response) => response.text())
      .then((result) => {
        if (result.includes("Login successful")) {
          localStorage.setItem("loggedInUser", username);
          window.location.href = "homePage.html"; // ✅ Only redirect on success
        } else {
          alert("❌ Wrong username or password.");
        }
      })
      .catch((error) => {
        console.error("Error:", error);
        alert("⚠️ Server error. Please try again.");
      });
  });
});