/* outputs an error if the user dies not provide a username or password. also goes to a new window if the user clicks on create a new account*/

document.addEventListener("DOMContentLoaded", function () {
  var loginButton = document.getElementById("loginButton");
  loginButton.addEventListener("click", function () {
    var username = document.getElementById("username").value;
    var password = document.getElementById("password").value;
    if (username.trim() === "" || password.trim() === "") {
      alert("Please enter credentials");
    } else {
      window.location.href = "HomePage.html";
    }
  });

  var create_new_account = document.getElementById("New_account");
  create_new_account.addEventListener("click", function (event) {
    event.preventDefault();
    window.location.href = "newAccount.html";
  });
});
