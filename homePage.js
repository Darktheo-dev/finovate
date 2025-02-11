document.addEventListener("DOMContentLoaded", function () {
  var greet = document.getElementById("Homepage_greeting");

  if (greet) {
    var storedUsername = localStorage.getItem("username");

    if (storedUsername) {
      storedUsername = storedUsername.toUpperCase(); // Convert to uppercase
      greet.textContent = "Welcome back, " + storedUsername + "!"; // Update greeting
    }
  }
});
