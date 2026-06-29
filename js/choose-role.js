import { auth, db } from "./firebase-config.js";

import {
    onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/12.15.0/firebase-auth.js";

import {
    doc,
    updateDoc,
    serverTimestamp
} from "https://www.gstatic.com/firebasejs/12.15.0/firebase-firestore.js";

const applicantBtn = document.getElementById("applicantBtn");
const donorBtn = document.getElementById("donorBtn");
const message = document.getElementById("message");

let currentUser = null;

onAuthStateChanged(auth, (user) => {
    if (!user) {
        window.location.href = "login.html";
        return;
    }

    currentUser = user;
});

async function updateRole(role) {
    if (!currentUser) {
        message.textContent = "User not found. Please login again.";
        message.style.color = "red";
        return;
    }

    try {
        await updateDoc(doc(db, "users", currentUser.uid), {
            role: role,
            selectedRole: true,
            updatedAt: serverTimestamp()
        });

        if (role === "Applicant") {
            window.location.href = "applicant-dashboard.html";
        } else if (role === "Donor") {
            window.location.href = "donor-dashboard.html";
        }

    } catch (error) {
        message.textContent = error.message;
        message.style.color = "red";
    }
}

applicantBtn.addEventListener("click", () => {
    updateRole("Applicant");
});

donorBtn.addEventListener("click", () => {
    updateRole("Donor");
});