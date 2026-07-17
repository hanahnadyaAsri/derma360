import { auth } from "./firebase-config.js";
import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/12.15.0/firebase-auth.js";

const userName = document.getElementById("userName");
const logoutBtn = document.getElementById("logoutBtn");

// 1. Auth Check
onAuthStateChanged(auth, (user) => {
    if (!user) {
        window.location.href = "login.html";
        return;
    }
    if (userName) {
        userName.textContent = user.displayName || "Pengguna";
    }
});

// 2. Logout Functionality (Best Practice)
import { signOut } from "https://www.gstatic.com/firebasejs/12.15.0/firebase-auth.js";

if (logoutBtn) {
    logoutBtn.addEventListener("click", async () => {
        try {
            await signOut(auth);
            window.location.href = "login.html";
        } catch (error) {
            console.error("Gagal log keluar:", error);
        }
    });
}