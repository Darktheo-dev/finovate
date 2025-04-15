document.addEventListener("DOMContentLoaded", function () {
  const loginButton = document.getElementById("loginButton");
  const alertBox = document.getElementById("loginAlert");

  function showAlert(message) {
    alertBox.textContent = message;
    alertBox.style.display = "block";
  }

  loginButton.addEventListener("click", function (e) {
    e.preventDefault();

    const username = document.getElementById("username").value.trim();
    const password = document.getElementById("password").value.trim();

    if (username === "" || password === "") {
      showAlert("⚠️ Please enter both username and password.");
      return;
    }

    fetch("/index", {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: `username=${encodeURIComponent(
        username
      )}&password=${encodeURIComponent(password)}`,
    })
      .then((response) => response.text())
      .then((result) => {
        if (result.includes("Login successful")) {
          localStorage.setItem("loggedInUser", username);
          window.location.href = "homePage.html";
        } else {
          showAlert("❌ Wrong username or password.");
        }
      })
      .catch((error) => {
        console.error("Error:", error);
        showAlert("⚠️ Server error. Please try again.");
      });
  });
});
