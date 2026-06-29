import { db } from "./firebase-config.js";

import {
    collection,
    query,
    where,
    getDocs
} from "https://www.gstatic.com/firebasejs/12.15.0/firebase-firestore.js";

const campaignList = document.getElementById("campaignList");

async function loadActiveCampaigns() {
    campaignList.innerHTML = "<p>Loading campaigns...</p>";

    const q = query(
        collection(db, "campaigns"),
        where("status_kempen", "==", "Aktif")
    );

    const querySnapshot = await getDocs(q);

    campaignList.innerHTML = "";

    if (querySnapshot.empty) {
        campaignList.innerHTML = "<p>No active campaigns yet.</p>";
        return;
    }

    querySnapshot.forEach((docSnap) => {
        const campaign = docSnap.data();
        const campaignId = docSnap.id;

        const percentage = Math.min(
            (campaign.currentAmount / campaign.targetAmount) * 100,
            100
        );

        const card = document.createElement("div");
        card.className = "campaign-card";

        card.innerHTML = `
            <img src="${campaign.mediaUrl}" alt="Campaign Poster" class="campaign-img">

            <h3>${campaign.campaignTitle}</h3>
            <p><strong>Category:</strong> ${campaign.campaignCategory}</p>
            <p><strong>Beneficiary:</strong> ${campaign.beneficiaryName}</p>
            <p><strong>Location:</strong> ${campaign.location}</p>
            <p>${campaign.description}</p>

            <p><strong>Raised:</strong> RM ${campaign.currentAmount} / RM ${campaign.targetAmount}</p>

            <div class="progress-bar">
                <div class="progress-fill" style="width:${percentage}%"></div>
            </div>

            <button onclick="window.location.href='donation.html?campaignId=${campaignId}'">
                Donate Now
            </button>
        `;

        campaignList.appendChild(card);
    });
}

loadActiveCampaigns();