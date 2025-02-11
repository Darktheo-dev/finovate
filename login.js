function handleLogin() {
  const username = document.getElementById("username").value;
  const password = document.getElementById("password").value;
  const errorMessage = document.getElementById("errorMessage");

  // Simulated login (Replace with real authentication logic)
  if (username === "admin" && password === "1234") {
    alert("Login successful!");
    window.location.href = "homepage.html"; // Redirect to dashboard
  } else {
    errorMessage.classList.remove("d-none"); // Show error message
  }
}
