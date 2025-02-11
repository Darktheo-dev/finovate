document.addEventListener("DOMContentLoaded", function () {
  const form = document.querySelector("form");

  form.addEventListener("submit", function (event) {
    event.preventDefault();

    const firstName = document.getElementById("firstName").value.trim();
    const lastName = document.getElementById("lastName").value.trim();
    const username = document.getElementById("username").value.trim();
    const email = document.getElementById("email").value.trim();
    const password = document.getElementById("password").value.trim();
    const dob = document.getElementById("dob").value.trim();

    if (!firstName || !lastName || !username || !email || !password || !dob) {
      alert("Please fill in all fields!");
      return;
    }

    localStorage.setItem("loggedInUser", username);
    alert("Account created successfully! Redirecting...");
    window.location.href = "homePage.html";
  });
});
