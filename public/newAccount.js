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

    const formData = new URLSearchParams();
    formData.append("firstName", firstName);
    formData.append("lastName", lastName);
    formData.append("username", username);
    formData.append("email", email);
    formData.append("password", password);
    formData.append("dob", dob);

    fetch("/newAccount", {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded"
      },
      body: formData.toString()
    })
      .then(response => response.text())
      .then(result => {
        if (result.includes("success")) {
          localStorage.setItem("loggedInUser", username);
          alert("Account created successfully! Redirecting...");
          window.location.href = "homePage.html";
        } else {
          alert(result); // Show error from server
        }
      })
      .catch(error => {
        console.error("Error:", error);
        alert("⚠️ Something went wrong.");
      });
  });
});