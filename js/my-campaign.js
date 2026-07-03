import { auth, db } from "./firebase-config.js";

import {
    onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/12.15.0/firebase-auth.js";

import {
    collection,
    query,
    where,
    getDocs
} from "https://www.gstatic.com/firebasejs/12.15.0/firebase-firestore.js";

const myCampaignList = document.getElementById("myCampaignList");

onAuthStateChanged(auth, async (user) => {
    if (!user) {
        window.location.href = "login.html";
        return;
    }

    await loadMyCampaigns(user.uid);
});

async function loadMyCampaigns(uid) {
    myCampaignList.innerHTML = "<p>Sedang memuatkan kempen anda...</p>";

    try {
        const q = query(
            collection(db, "campaigns"),
            where("applicantId", "==", uid)
        );

        const snapshot = await getDocs(q);

        myCampaignList.innerHTML = "";

        if (snapshot.empty) {
            myCampaignList.innerHTML = `
                <p>Anda belum mencipta sebarang kempen.</p>
                <a href="create-campaign.html">
                    <button>Cipta Kempen Baharu</button>
                </a>
            `;
            return;
        }

        snapshot.forEach((docSnap) => {
            const campaign = docSnap.data();
            const campaignId = docSnap.id;

            const percentage = Math.min(
                (campaign.currentAmount / campaign.targetAmount) * 100,
                100
            );

            const statusLabel = getStatusLabel(campaign.status_kempen);

            const card = document.createElement("div");
            card.className = "campaign-card";

            card.innerHTML = `
                <img src="${campaign.mediaUrl}" class="campaign-img" alt="Poster Kempen">

                <h3>${campaign.campaignTitle}</h3>

                <p><strong>Kategori:</strong> ${campaign.campaignCategory}</p>
                <p><strong>Status:</strong> ${statusLabel}</p>
                <p><strong>Sasaran:</strong> RM ${campaign.targetAmount}</p>
                <p><strong>Dana Terkumpul:</strong> RM ${campaign.currentAmount}</p>

                <div class="progress-bar">
                    <div class="progress-fill" style="width:${percentage}%"></div>
                </div>

                <p><strong>Catatan Pentadbir:</strong> ${campaign.verificationRemarks || "-"}</p>

                <button onclick="window.location.href='edit-campaign.html?campaignId=${campaignId}'">
                    Kemas Kini Kempen
                </button>
            `;

            myCampaignList.appendChild(card);
        });

    } catch (error) {
        myCampaignList.innerHTML = `<p style="color:red;">${error.message}</p>`;
    }
}

function getStatusLabel(status) {
    if (status === "Perlu Disahkan") return "Menunggu Pengesahan";
    if (status === "Aktif") return "Aktif";
    if (status === "Ditolak") return "Ditolak";
    if (status === "Tamat") return "Tamat";
    return status || "-";
}