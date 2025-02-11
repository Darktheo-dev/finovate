document.addEventListener("DOMContentLoaded", function () {
  const form = document.getElementById("Register");

  form.addEventListener("submit", function (event) {
    event.preventDefault();

    const name = document.getElementById("Name").value.trim();
    const dob = document.getElementById("Dob").value.trim();
    const email = document.getElementById("Email").value.trim();
    const username = document.getElementById("Username").value.trim();
    const password = document.getElementById("Password").value.trim();

    const alertContainer = document.createElement("div");
    alertContainer.className = "alert mt-3";
    form.appendChild(alertContainer);

    if (!name || !dob || !email || !username || !password) {
      alertContainer.classList.add("alert-danger");
      alertContainer.textContent = "Please fill in all fields!";
      return;
    }

    alertContainer.classList.add("alert-success");
    alertContainer.textContent = "Registration Successful! Redirecting...";

    setTimeout(() => {
      window.location.href = "homepage.html";
    }, 1500);
  });
});
