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

document.querySelectorAll(".toggle-password").forEach((button) => {
    button.addEventListener("click", () => {
        const input = document.getElementById(button.dataset.target);

        if (input.type === "password") {
            input.type = "text";
            button.textContent = "🙈";
        } else {
            input.type = "password";
            button.textContent = "👁️";
        }
    });
});

loginForm.addEventListener("submit", async (e) => {
    e.preventDefault();

    const email = document.getElementById("email").value.trim();
    const password = document.getElementById("password").value;

    message.textContent = "";

    try {
        const userCredential = await signInWithEmailAndPassword(auth, email, password);
        const user = userCredential.user;

        const userDoc = await getDoc(doc(db, "users", user.uid));

        if (!userDoc.exists()) {
            message.textContent = "User profile not found.";
            message.style.color = "red";
            return;
        }

        const userData = userDoc.data();

        if (userData.accountStatus !== "Active") {
            message.textContent = "Your account has been locked. Please contact admin.";
            message.style.color = "red";
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
                message.textContent = "Invalid email or password.";
                break;
            case "auth/user-not-found":
                message.textContent = "No account found with this email.";
                break;
            case "auth/wrong-password":
                message.textContent = "Incorrect password.";
                break;
            case "auth/invalid-email":
                message.textContent = "Invalid email address.";
                break;
            default:
                message.textContent = error.message;
        }

        message.style.color = "red";
    }
});