document.addEventListener("DOMContentLoaded", function () {
  var loginButton = document.getElementById("loginButton");
  var createNewAccount = document.getElementById("New_account");

  if (loginButton) {
    loginButton.addEventListener("click", function () {
      var username = document.getElementById("username").value;
      var password = document.getElementById("password").value;

      if (username.trim() === "" || password.trim() === "") {
        alert("Please enter credentials");
      } else {
        localStorage.setItem("username", username); // Store username
        window.location.href = "HomePage.html"; // Redirect to home page
      }
    });
  }

  if (createNewAccount) {
    createNewAccount.addEventListener("click", function (event) {
      event.preventDefault();
      window.location.href = "newAccount.html";
    });
  }
});
