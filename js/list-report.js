import { db } from "./firebase-config.js";

import {
    collection,
    getDocs
} from "https://www.gstatic.com/firebasejs/12.15.0/firebase-firestore.js";

const totalDonation = document.getElementById("totalDonation");
const weeklyDonation = document.getElementById("weeklyDonation");
const monthlyDonation = document.getElementById("monthlyDonation");
const campaignReportList = document.getElementById("campaignReportList");

loadReports();

async function loadReports() {
    const donationSnapshot = await getDocs(collection(db, "donations"));
    const campaignSnapshot = await getDocs(collection(db, "campaigns"));

    let total = 0;
    let weekly = 0;
    let monthly = 0;

    const campaignTotals = {};

    const today = new Date();

    const weekAgo = new Date();
    weekAgo.setDate(today.getDate() - 7);

    const monthStart = new Date(today.getFullYear(), today.getMonth(), 1);

    donationSnapshot.forEach((docSnap) => {
        const donation = docSnap.data();

        const status = (donation.paymentStatus || "").toLowerCase();

        if (
            status !== "success" &&
            status !== "paid" &&
            status !== "paid demo"
        ) {
            return;
        }

        const amount = Number(donation.amount || 0);
        const campaignId = donation.campaignId;

        const date =
            donation.createdAt?.toDate?.() ||
            donation.donatedAt?.toDate?.();

        total += amount;

        if (date && date >= weekAgo) {
            weekly += amount;
        }

        if (date && date >= monthStart) {
            monthly += amount;
        }

        if (!campaignTotals[campaignId]) {
            campaignTotals[campaignId] = 0;
        }

        campaignTotals[campaignId] += amount;
    });

    totalDonation.textContent = `RM ${total.toFixed(2)}`;
    weeklyDonation.textContent = `RM ${weekly.toFixed(2)}`;
    monthlyDonation.textContent = `RM ${monthly.toFixed(2)}`;

    campaignReportList.innerHTML = "";

    campaignSnapshot.forEach((docSnap) => {
        const campaign = docSnap.data();
        const campaignId = docSnap.id;

        const collected = campaignTotals[campaignId] || 0;

        const card = document.createElement("div");
        card.className = "campaign-card";

        card.innerHTML = `
            <h3>${campaign.campaignTitle || "Tanpa Tajuk"}</h3>
            <p><strong>Jumlah Sumbangan:</strong> RM ${collected.toFixed(2)}</p>
            <p><strong>Sasaran Dana:</strong> RM ${Number(campaign.targetAmount || 0).toFixed(2)}</p>
            <p><strong>Status Kempen:</strong> ${campaign.status_kempen || "-"}</p>
        `;

        campaignReportList.appendChild(card);
    });
}