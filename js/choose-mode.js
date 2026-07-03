import { auth } from "./firebase-config.js";

import {
    onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/12.15.0/firebase-auth.js";

const donorBtn = document.getElementById("donorBtn");
const applicantBtn = document.getElementById("applicantBtn");
const userName = document.getElementById("userName");

onAuthStateChanged(auth, (user) => {

    if (!user) {
        window.location.href = "login.html";
        return;
    }

    if (userName) {
        userName.textContent = user.displayName || "";
    }

});

donorBtn.addEventListener("click", () => {
    window.location.href = "donor-dashboard.html";
});

applicantBtn.addEventListener("click", () => {
    window.location.href = "applicant-dashboard.html";
});