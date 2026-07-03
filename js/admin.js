import { auth, db } from "./firebase-config.js";

import {
    onAuthStateChanged,
    signOut
} from "https://www.gstatic.com/firebasejs/12.15.0/firebase-auth.js";

import {
    collection,
    getDocs,
    query,
    where
} from "https://www.gstatic.com/firebasejs/12.15.0/firebase-firestore.js";

const totalUsers = document.getElementById("totalUsers");
const totalCampaigns = document.getElementById("totalCampaigns");
const pendingCampaigns = document.getElementById("pendingCampaigns");
const totalDonation = document.getElementById("totalDonation");

const logoutBtn = document.getElementById("logoutBtn");

onAuthStateChanged(auth, async (user) => {

    if (!user) {

        window.location.href = "login.html";
        return;

    }

    await loadDashboard();

});

async function loadDashboard() {

    // Users

    const usersSnapshot = await getDocs(collection(db, "users"));

    totalUsers.textContent = usersSnapshot.size;

    // Campaigns

    const campaignsSnapshot = await getDocs(collection(db, "campaigns"));

    totalCampaigns.textContent = campaignsSnapshot.size;

    // Pending Campaigns

    const pendingQuery = query(
        collection(db, "campaigns"),
        where("status_kempen", "==", "Perlu Disahkan")
    );

    const pendingSnapshot = await getDocs(pendingQuery);

    pendingCampaigns.textContent = pendingSnapshot.size;

    // Donations

    const donationSnapshot = await getDocs(collection(db, "donations"));

    let total = 0;

    donationSnapshot.forEach((doc) => {

        total += Number(doc.data().amount || 0);

    });

    totalDonation.textContent =

        "RM " + total.toLocaleString("en-MY", {

            minimumFractionDigits: 2

        });

}

logoutBtn.addEventListener("click", async () => {

    await signOut(auth);

    window.location.href = "index.html";

});