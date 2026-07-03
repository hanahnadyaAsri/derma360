import { auth, db } from "./firebase-config.js";

import {
    onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/12.15.0/firebase-auth.js";

import {
    collection,
    getDocs
} from "https://www.gstatic.com/firebasejs/12.15.0/firebase-firestore.js";

const campaignList = document.getElementById("campaignList");

onAuthStateChanged(auth, (user) => {

    if (!user) {

        window.location.href = "login.html";
        return;

    }

    loadCampaigns();

});

async function loadCampaigns() {

    campaignList.innerHTML = "";

    const snapshot = await getDocs(collection(db, "campaigns"));

    snapshot.forEach((docSnap) => {

        const campaign = docSnap.data();

        const percent = Math.min(
            (campaign.currentAmount / campaign.targetAmount) * 100,
            100
        );

        const card = document.createElement("div");

        card.className = "campaign-card";

        card.innerHTML = `

            <img src="${campaign.mediaUrl}" class="campaign-img">

            <h3>${campaign.campaignTitle}</h3>

            <p><strong>Status:</strong> ${campaign.status_kempen}</p>

            <p>RM ${campaign.currentAmount} / RM ${campaign.targetAmount}</p>

            <div class="progress-bar">

                <div class="progress-fill"
                    style="width:${percent}%"></div>

            </div>

        `;

        campaignList.appendChild(card);

    });

}