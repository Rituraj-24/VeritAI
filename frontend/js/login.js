const API_BASE = "http://127.0.0.1:5001";

let loginInFlight = false;

function showMessage(text, type) {
  const msg = document.getElementById("msg");
  msg.textContent = text;
  msg.className = `msg ${type}`;
}

function setLoading(on) {
  const btn = document.getElementById("btn");
  const spinner = document.getElementById("spinner");
  const btnText = document.getElementById("btn-text");
  const overlay = document.getElementById("loadingOverlay");

  btn.disabled = on;
  spinner.style.display = on ? "block" : "none";
  btnText.textContent = on ? "Signing in..." : "Sign in ->";
  overlay.classList.toggle("active", on);
}

async function handleLogin() {
  if (loginInFlight) {
    return;
  }

  const email = document.getElementById("email").value.trim();
  const password = document.getElementById("password").value;

  if (!email || !password) {
    showMessage("Please enter your email and password.", "error");
    return;
  }

  loginInFlight = true;
  setLoading(true);
  showMessage("Signing in...", "info");

  try {
    const res = await fetch(`${API_BASE}/api/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password })
    });

    const data = await res.json();

    if (!res.ok) {
      showMessage(data.error || "Login failed. Check your credentials.", "error");
      setLoading(false);
      return;
    }

    const user = {
      id: data.user?.id || data.user?.user_id || email,
      firstname: data.user?.firstname || data.user?.first_name || "User",
      lastname: data.user?.lastname || data.user?.last_name || "",
      email: data.user?.email || email
    };

    localStorage.setItem("veritai_token", data.token || "");
    localStorage.setItem("veritai_user", JSON.stringify(user));
    sessionStorage.setItem("veritai_token", data.token || "");
    sessionStorage.setItem("veritai_user", JSON.stringify(user));

    window.location.href = "dashboard.html";
    return;
  } catch (error) {
    showMessage("Cannot connect to backend.", "error");
    setLoading(false);
  } finally {
    loginInFlight = false;
  }
}

window.handleLogin = handleLogin;

function redirectIfAuthenticated() {
  const token = localStorage.getItem("veritai_token") || sessionStorage.getItem("veritai_token");
  const rawUser = localStorage.getItem("veritai_user") || sessionStorage.getItem("veritai_user");

  if (!token || !rawUser) {
    return;
  }

  try {
    const user = JSON.parse(rawUser);
    if (user && user.email) {
      window.location.href = "dashboard.html";
    }
  } catch (error) {}
}

window.addEventListener("error", function (event) {
  if (event.filename && event.filename.includes("content-script")) {
    return;
  }

  showMessage(event.message || "Page error occurred.", "error");
  setLoading(false);
});

document.addEventListener("DOMContentLoaded", function () {
  redirectIfAuthenticated();

  const form = document.getElementById("loginForm");

  form.addEventListener("submit", function (event) {
    event.preventDefault();
    handleLogin();
  });
});
