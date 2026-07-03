import { auth, db } from "./firebase-config.js";

import {
    onAuthStateChanged,
    signOut
} from "https://www.gstatic.com/firebasejs/12.15.0/firebase-auth.js";

import {
    collection,
    getDocs
} from "https://www.gstatic.com/firebasejs/12.15.0/firebase-firestore.js";

const userList = document.getElementById("userList");
const logoutBtn = document.getElementById("logoutBtn");

onAuthStateChanged(auth, async (user) => {
    if (!user) {
        window.location.href = "login.html";
        return;
    }

    loadUsers();
});

async function loadUsers() {

    userList.innerHTML = "<p>Loading users...</p>";

    const snapshot = await getDocs(collection(db, "users"));

    userList.innerHTML = "";

    snapshot.forEach((docSnap) => {

        const user = docSnap.data();

        const card = document.createElement("div");
        card.className = "campaign-card";

        card.innerHTML = `
            <h3>${user.name}</h3>

            <p><strong>Email:</strong> ${user.email}</p>

            <p><strong>Phone:</strong> ${user.phone || "-"}</p>

            <p><strong>Role:</strong> ${user.role || "User"}</p>

            <p><strong>Status:</strong> ${user.accountStatus}</p>
        `;

        userList.appendChild(card);

    });

}

logoutBtn.addEventListener("click", async () => {
    await signOut(auth);
    window.location.href = "index.html";
});