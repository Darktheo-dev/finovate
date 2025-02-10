// Wait for the document to load
document.addEventListener("DOMContentLoaded", function () {
  const form = document.getElementById("Register");

  form.addEventListener("submit", function (event) {
    event.preventDefault(); // Prevent default form submission

    // Get input values
    const name = document.getElementById("Name").value;
    const dob = document.getElementById("Dob").value;
    const email = document.getElementById("Email").value;
    const username = document.getElementById("Username").value;
    const password = document.getElementById("Password").value;

    // Simple validation
    if (name && dob && email && username && password) {
      alert("Registration Successful!");
      window.location.href = "homepage.html"; // Redirect to homepage.html
    } else {
      alert("Please fill in all fields!");
    }
  });
});
