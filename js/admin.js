import { auth, db } from "./firebase-config.js";

import {
    onAuthStateChanged,
    signOut
} from "https://www.gstatic.com/firebasejs/12.15.0/firebase-auth.js";

import {
    collection,
    query,
    where,
    getDocs,
    doc,
    getDoc,
    updateDoc,
    serverTimestamp
} from "https://www.gstatic.com/firebasejs/12.15.0/firebase-firestore.js";

const pendingCampaigns = document.getElementById("pendingCampaigns");
const logoutBtn = document.getElementById("logoutBtn");

onAuthStateChanged(auth, async (user) => {
    if (!user) {
        window.location.href = "login.html";
        return;
    }

    const userDoc = await getDoc(doc(db, "users", user.uid));

    if (!userDoc.exists() || userDoc.data().role !== "Admin") {
        alert("Access denied. Admin only.");
        window.location.href = "login.html";
        return;
    }

    loadPendingCampaigns();
});

async function loadPendingCampaigns() {
    pendingCampaigns.innerHTML = "<p>Loading pending campaigns...</p>";

    const q = query(
        collection(db, "campaigns"),
        where("status_kempen", "==", "Perlu Disahkan")
    );

    const querySnapshot = await getDocs(q);

    pendingCampaigns.innerHTML = "";

    if (querySnapshot.empty) {
        pendingCampaigns.innerHTML = "<p>No pending campaigns.</p>";
        return;
    }

    querySnapshot.forEach((docSnap) => {
        const campaign = docSnap.data();
        const campaignId = docSnap.id;

        const card = document.createElement("div");
        card.className = "campaign-card";

        card.innerHTML = `
            <img src="${campaign.mediaUrl}" alt="Campaign Media" class="campaign-img">

            <h3>${campaign.campaignTitle}</h3>
            <p><strong>Category:</strong> ${campaign.campaignCategory}</p>
            <p><strong>Target:</strong> RM ${campaign.targetAmount}</p>
            <p><strong>Beneficiary:</strong> ${campaign.beneficiaryName}</p>
            <p><strong>Location:</strong> ${campaign.location}</p>
            <p>${campaign.description}</p>

            <button class="approveBtn" data-id="${campaignId}">Approve</button>
            <button class="rejectBtn" data-id="${campaignId}">Reject</button>
        `;

        pendingCampaigns.appendChild(card);
    });

    document.querySelectorAll(".approveBtn").forEach((button) => {
        button.addEventListener("click", () => approveCampaign(button.dataset.id));
    });

    document.querySelectorAll(".rejectBtn").forEach((button) => {
        button.addEventListener("click", () => rejectCampaign(button.dataset.id));
    });
}

async function approveCampaign(campaignId) {
    await updateDoc(doc(db, "campaigns", campaignId), {
        campaignStatus: "Active",
        status_kempen: "Aktif",
        startDate: serverTimestamp(),
        updatedAt: serverTimestamp(),
        verificationRemarks: "Campaign approved by admin."
    });

    alert("Campaign approved.");
    loadPendingCampaigns();
}

async function rejectCampaign(campaignId) {
    const reason = prompt("Reason for rejection:");

    await updateDoc(doc(db, "campaigns", campaignId), {
        campaignStatus: "Rejected",
        status_kempen: "Ditolak",
        updatedAt: serverTimestamp(),
        verificationRemarks: reason || "Campaign rejected by admin."
    });

    alert("Campaign rejected.");
    loadPendingCampaigns();
}

logoutBtn.addEventListener("click", async () => {
    await signOut(auth);
    window.location.href = "login.html";
});