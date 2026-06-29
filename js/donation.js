import { auth, db } from "./firebase-config.js";

import {
    onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/12.15.0/firebase-auth.js";

import {
    doc,
    getDoc,
    addDoc,
    collection,
    updateDoc,
    increment,
    serverTimestamp
} from "https://www.gstatic.com/firebasejs/12.15.0/firebase-firestore.js";

const campaignInfo = document.getElementById("campaignInfo");
const donationForm = document.getElementById("donationForm");
const message = document.getElementById("message");

const params = new URLSearchParams(window.location.search);
const campaignId = params.get("campaignId");

let currentUser = null;
let campaignData = null;

onAuthStateChanged(auth, async (user) => {
    if (!user) {
        window.location.href = "login.html";
        return;
    }

    currentUser = user;

    if (!campaignId) {
        message.textContent = "Campaign not found.";
        message.style.color = "red";
        return;
    }

    await loadCampaign();
});

async function loadCampaign() {
    const campaignSnap = await getDoc(doc(db, "campaigns", campaignId));

    if (!campaignSnap.exists()) {
        campaignInfo.innerHTML = "<p>Campaign not found.</p>";
        return;
    }

    campaignData = campaignSnap.data();

    campaignInfo.innerHTML = `
        <img src="${campaignData.mediaUrl}" class="campaign-img" alt="Campaign Poster">
        <h3>${campaignData.campaignTitle}</h3>
        <p><strong>Category:</strong> ${campaignData.campaignCategory}</p>
        <p><strong>Target:</strong> RM ${campaignData.targetAmount}</p>
        <p><strong>Raised:</strong> RM ${campaignData.currentAmount}</p>
    `;
}

function generateReceiptNumber() {
    const date = new Date();
    const dateText = date.toISOString().slice(0, 10).replaceAll("-", "");
    const randomNo = Math.floor(100000 + Math.random() * 900000);

    return `DERMA-${dateText}-${randomNo}`;
}

donationForm.addEventListener("submit", async (e) => {
    e.preventDefault();

    const donorName = document.getElementById("donorName").value.trim();
    const amount = Number(document.getElementById("amount").value);
    const paymentMethod = document.getElementById("paymentMethod").value;

    if (amount <= 0) {
        message.textContent = "Please enter a valid amount.";
        message.style.color = "red";
        return;
    }

    try {
        message.textContent = "Processing donation...";
        message.style.color = "blue";

        const transactionReference = "DEMO-" + Date.now();

        const donationRef = await addDoc(collection(db, "donations"), {
            campaignId: campaignId,
            donorId: currentUser.uid,
            donorName: donorName,
            amount: amount,
            paymentMethod: paymentMethod,
            paymentStatus: "Paid",
            transactionReference: transactionReference,
            createdAt: serverTimestamp()
        });

        await updateDoc(doc(db, "campaigns", campaignId), {
            currentAmount: increment(amount),
            dana_terkumpul: increment(amount),
            updatedAt: serverTimestamp()
        });

        const receiptRef = await addDoc(collection(db, "receipts"), {
            donationId: donationRef.id,
            campaignId: campaignId,
            donorId: currentUser.uid,
            receiptNumber: generateReceiptNumber(),
            amount: amount,
            paymentMethod: paymentMethod,
            paymentStatus: "Paid",
            transactionReference: transactionReference,
            receiptUrl: "",
            generatedAt: serverTimestamp()
        });

        message.textContent = "Donation successful. Redirecting to receipt...";
        message.style.color = "green";

        setTimeout(() => {
            window.location.href = `receipt.html?receiptId=${receiptRef.id}`;
        }, 1000);

    } catch (error) {
        message.textContent = error.message;
        message.style.color = "red";
    }
});