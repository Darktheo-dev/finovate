document.addEventListener("DOMContentLoaded", function () {
  var greet = document.getElementById("Homepage_greeting");

  if (greet) {
    var storedUsername = localStorage.getItem("username"); // Get stored username
    var storedUsername = storedUsername.toUpperCase();

    if (storedUsername) {
      greet.textContent = "Welcome back," + " " + storedUsername + "!"; // Update greeting
    }
  }
});
