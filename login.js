document.addEventListener("DOMContentLoaded", function () {
  const loginButton = document.getElementById("loginButton");

  loginButton.addEventListener("click", function () {
    const username = document.getElementById("username").value;
    const password = document.getElementById("password").value;

    if (username === "" || password === "") {
      alert("Please enter both username and password.");
    } else {
      localStorage.setItem("loggedInUser", username);
      window.location.href = "homePage.html";
    }
  });
});
