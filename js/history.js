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
    getDoc
} from "https://www.gstatic.com/firebasejs/12.15.0/firebase-firestore.js";

const tbody = document.querySelector("#historyTable tbody");
const message = document.getElementById("message");

onAuthStateChanged(auth, async (user) => {

    if (!user) {
        window.location.href = "login.html";
        return;
    }

    loadHistory(user.uid);

});

async function loadHistory(uid) {

    tbody.innerHTML = "";

    const q = query(
        collection(db, "donations"),
        where("donorId", "==", uid)
    );

    const snapshot = await getDocs(q);

    if (snapshot.empty) {

        message.textContent = "No donation history.";

        return;
    }

    snapshot.forEach(async (documentData) => {

        const donation = documentData.data();

        let campaignTitle = "Unknown";

        const campaignDoc = await getDoc(doc(db, "campaigns", donation.campaignId));

        if (campaignDoc.exists()) {

            campaignTitle = campaignDoc.data().campaignTitle;

        }

        tbody.innerHTML += `
        <tr>

        <td>${campaignTitle}</td>

        <td>RM ${donation.amount}</td>

        <td>${donation.paymentMethod}</td>

        <td>${donation.paymentStatus}</td>

        <td>${donation.createdAt?.toDate().toLocaleDateString() ?? "-"}</td>

        <td>

        <a href="receipt.html?donationId=${documentData.id}">
        View
        </a>

        </td>

        </tr>
        `;

    });

}