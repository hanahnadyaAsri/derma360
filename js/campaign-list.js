import { db } from "./firebase-config.js";

import {
    collection,
    query,
    where,
    getDocs
} from "https://www.gstatic.com/firebasejs/12.15.0/firebase-firestore.js";

const campaignList = document.getElementById("campaignList");

async function loadActiveCampaigns() {
    campaignList.innerHTML = "<p>Sedang memuatkan kempen...</p>";

    try {
        const q = query(
            collection(db, "campaigns"),
            where("status_kempen", "==", "Aktif")
        );

        const snapshot = await getDocs(q);

        campaignList.innerHTML = "";

        if (snapshot.empty) {
            campaignList.innerHTML = "<p>Tiada kempen aktif buat masa ini.</p>";
            return;
        }

        snapshot.forEach((docSnap) => {
            const campaign = docSnap.data();
            const campaignId = docSnap.id;

            const percentage = Math.min(
                (campaign.currentAmount / campaign.targetAmount) * 100,
                100
            );

            const card = document.createElement("div");
            card.className = "campaign-card";

            card.innerHTML = `
                <img src="${campaign.mediaUrl}" class="campaign-img" alt="Poster Kempen">

                <h3>${campaign.campaignTitle}</h3>

                <p><strong>Kategori:</strong> ${campaign.campaignCategory}</p>
                <p><strong>Penerima:</strong> ${campaign.beneficiaryName}</p>
                <p><strong>Lokasi:</strong> ${campaign.location}</p>
                <p>${campaign.description}</p>

                <p>
                    <strong>RM ${campaign.currentAmount}</strong>
                    daripada RM ${campaign.targetAmount}
                </p>

                <div class="progress-bar">
                    <div class="progress-fill" style="width:${percentage}%"></div>
                </div>

                <button onclick="window.location.href='donation.html?campaignId=${campaignId}'">
                    Sumbang Sekarang
                </button>
            `;

            campaignList.appendChild(card);
        });

    } catch (error) {
        campaignList.innerHTML = `<p style="color:red;">${error.message}</p>`;
    }
}

loadActiveCampaigns();