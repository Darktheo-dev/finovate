document.addEventListener("DOMContentLoaded", function () {
  const username = localStorage.getItem("loggedInUser");

  if (username) {
    document.getElementById(
      "Homepage_greeting"
    ).innerText = `Welcome back, ${username}!`;
  }
});

document.addEventListener("DOMContentLoaded", function () {
  const username = localStorage.getItem("loggedInUser");

  if (username) {
    document.getElementById(
      "Homepage_greeting"
    ).innerText = `Welcome back, ${username}!`;
  }
});
