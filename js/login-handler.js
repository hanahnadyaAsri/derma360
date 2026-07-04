import { auth, db } from "./firebase-config.js";

import {
    signInWithEmailAndPassword
} from "https://www.gstatic.com/firebasejs/12.15.0/firebase-auth.js";

import {
    doc,
    getDoc
} from "https://www.gstatic.com/firebasejs/12.15.0/firebase-firestore.js";

const loginForm = document.getElementById("loginForm");
const message = document.getElementById("message");

function setMessage(text, color = "") {
    if (!message) return;

    message.textContent = text;
    message.style.color = color;
}

document.querySelectorAll(".toggle-password").forEach((button) => {
    button.addEventListener("click", () => {
        const input = document.getElementById(button.dataset.target);

        if (!input) return;

        if (input.type === "password") {
            input.type = "text";
            button.textContent = "🙈";
        } else {
            input.type = "password";
            button.textContent = "👁️";
        }
    });
});

if (!loginForm) {
    console.warn("Login form not found on this page.");
} else {
    loginForm.addEventListener("submit", async (e) => {
        e.preventDefault();

        const emailField = document.getElementById("email");
        const passwordField = document.getElementById("password");

        if (!emailField || !passwordField) {
            setMessage("Form fields are missing.", "red");
            return;
        }

        const email = emailField.value.trim();
        const password = passwordField.value;

        setMessage("");

    try {
        const userCredential = await signInWithEmailAndPassword(auth, email, password);
        const user = userCredential.user;

        const userDoc = await getDoc(doc(db, "users", user.uid));

        if (!userDoc.exists()) {
            setMessage("User profile not found.", "red");
            return;
        }

        const userData = userDoc.data();

        if (userData.accountStatus !== "Active") {
            setMessage("Your account has been locked. Please contact admin.", "red");
            return;
        }

        if (userData.role === "Admin") {
            window.location.href = "admin-dashboard.html";
        } else {
            window.location.href = "choose-mode.html";
        }

    } catch (error) {
        switch (error.code) {
            case "auth/invalid-credential":
                setMessage("Invalid email or password.", "red");
                break;
            case "auth/user-not-found":
                setMessage("No account found with this email.", "red");
                break;
            case "auth/wrong-password":
                setMessage("Incorrect password.", "red");
                break;
            case "auth/invalid-email":
                setMessage("Invalid email address.", "red");
                break;
            default:
                setMessage(error.message, "red");
        }
    }
    });
}