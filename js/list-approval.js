import { auth, db } from "./firebase-config.js";

import {
    onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/12.15.0/firebase-auth.js";

import {
    collection,
    query,
    where,
    getDocs,
    doc,
    updateDoc,
    serverTimestamp
} from "https://www.gstatic.com/firebasejs/12.15.0/firebase-firestore.js";

const pendingCampaigns = document.getElementById("pendingCampaigns");

onAuthStateChanged(auth, (user) => {

    if (!user) {

        window.location.href = "login.html";
        return;

    }

    loadPending();

});

async function loadPending() {

    pendingCampaigns.innerHTML = "";

    const q = query(
        collection(db, "campaigns"),
        where("status_kempen", "==", "Perlu Disahkan")
    );

    const snapshot = await getDocs(q);

    snapshot.forEach((docSnap) => {

        const campaign = docSnap.data();
        const campaignId = docSnap.id;

        const card = document.createElement("div");

        card.className = "campaign-card";

        card.innerHTML = `

            <img src="${campaign.mediaUrl}" class="campaign-img">

            <h3>${campaign.campaignTitle}</h3>

            <p>${campaign.description}</p>

            <button onclick="approveCampaign('${campaignId}')">

                Lulus

            </button>

            <button class="secondary-btn"

                onclick="rejectCampaign('${campaignId}')">

                Tolak

            </button>

        `;

        pendingCampaigns.appendChild(card);

    });

}

window.approveCampaign = async (id) => {

    await updateDoc(doc(db, "campaigns", id), {

        status_kempen: "Aktif",
        startDate: serverTimestamp()

    });

    alert("Kempen diluluskan.");

    location.reload();

};

window.rejectCampaign = async (id) => {

    const reason = prompt("Sebab penolakan:");

    await updateDoc(doc(db, "campaigns", id), {

        status_kempen: "Ditolak",
        verificationRemarks: reason,
        updatedAt: serverTimestamp()

    });

    alert("Kempen ditolak.");

    location.reload();

};