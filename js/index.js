import { auth, db } from "./firebase-config.js";

import {
    onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/12.15.0/firebase-auth.js";

import {
    collection,
    query,
    where,
    getDocs,
    limit
} from "https://www.gstatic.com/firebasejs/12.15.0/firebase-firestore.js";

const loginLink = document.getElementById("loginLink");
const registerLink = document.getElementById("registerLink");
const dashboardLink = document.getElementById("dashboardLink");
const createCampaignBtn = document.getElementById("createCampaignBtn");
const featuredCampaigns = document.getElementById("featuredCampaigns");

onAuthStateChanged(auth, (user) => {
    if (user) {
        loginLink.style.display = "none";
        registerLink.style.display = "none";
        dashboardLink.style.display = "inline-block";
        createCampaignBtn.href = "create-campaign.html";
    } else {
        loginLink.style.display = "inline-block";
        registerLink.style.display = "inline-block";
        dashboardLink.style.display = "none";
        createCampaignBtn.href = "login.html";
    }
});

async function loadFeaturedCampaigns() {
    const q = query(
        collection(db, "campaigns"),
        where("status_kempen", "==", "Aktif"),
        limit(3)
    );

    const snapshot = await getDocs(q);

    featuredCampaigns.innerHTML = "";

    if (snapshot.empty) {
        featuredCampaigns.innerHTML = "<p>No active campaigns yet.</p>";
        return;
    }

    snapshot.forEach((docSnap) => {
        const campaign = docSnap.data();
        const campaignId = docSnap.id;

        const percentage = Math.min(
            (campaign.currentAmount / campaign.targetAmount) * 100,
            100
        );

        featuredCampaigns.innerHTML += `
            <div class="campaign-card">
                <img src="${campaign.mediaUrl}" class="campaign-img" alt="Campaign poster">

                <h3>${campaign.campaignTitle}</h3>
                <p>${campaign.description.substring(0, 120)}...</p>

                <p><strong>RM ${campaign.currentAmount}</strong> raised of RM ${campaign.targetAmount}</p>

                <div class="progress-bar">
                    <div class="progress-fill" style="width:${percentage}%"></div>
                </div>

                <a href="donation.html?campaignId=${campaignId}">
                    <button>Sumbang Sekarang</button>
                </a>
            </div>
        `;
    });
}

loadFeaturedCampaigns();