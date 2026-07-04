import { auth } from "./firebase-config.js";

import {
    sendPasswordResetEmail
} from "https://www.gstatic.com/firebasejs/12.15.0/firebase-auth.js";

const forgotPasswordForm = document.getElementById("forgotPasswordForm");
const message = document.getElementById("message");

forgotPasswordForm.addEventListener("submit", async (e) => {
    e.preventDefault();

    const email = document.getElementById("email").value.trim();

    try {
        await sendPasswordResetEmail(auth, email);

        message.textContent = "Pautan reset kata laluan telah dihantar ke e-mel anda.";
        message.style.color = "green";

    } catch (error) {
        message.textContent = "E-mel tidak sah atau akaun tidak dijumpai.";
        message.style.color = "red";
    }
});