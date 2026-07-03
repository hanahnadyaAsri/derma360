import { auth, db } from "./firebase-config.js";

import {
    onAuthStateChanged,
    signOut
} from "https://www.gstatic.com/firebasejs/12.15.0/firebase-auth.js";

import {
    doc,
    getDoc
} from "https://www.gstatic.com/firebasejs/12.15.0/firebase-firestore.js";

const logoutBtn = document.getElementById("logoutBtn");
const userName = document.getElementById("userName");

onAuthStateChanged(auth, async (user) => {

    // User not logged in
    if (!user) {
        window.location.href = "login.html";
        return;
    }

    try {

        const userRef = doc(db, "users", user.uid);
        const userSnap = await getDoc(userRef);

        if (!userSnap.exists()) {
            await signOut(auth);
            window.location.href = "login.html";
            return;
        }

        const userData = userSnap.data();

        // Account disabled
        if (userData.accountStatus !== "Active") {
            alert("Your account has been disabled. Please contact the administrator.");
            await signOut(auth);
            window.location.href = "login.html";
            return;
        }

        // Display user's name
        if (userName) {
            userName.textContent = userData.name;
        }

        // Future use
        // Profile image
        /*
        const profileImage = document.getElementById("profileImage");

        if(profileImage && userData.profileImage){
            profileImage.src = userData.profileImage;
        }
        */

    } catch (error) {
        console.error(error);
        alert("Unable to load your account information.");

        await signOut(auth);
        window.location.href = "login.html";
    }

});

// Logout
if (logoutBtn) {

    logoutBtn.addEventListener("click", async () => {

        try {

            await signOut(auth);

            sessionStorage.clear();
            localStorage.clear();

            window.location.href = "index.html";

        } catch (error) {
            console.error(error);
            alert("Unable to logout.");
        }

    });

}