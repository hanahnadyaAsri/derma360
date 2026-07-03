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

    await loadUser();
    await loadCampaign();
});

async function loadUser() {
    const userSnap = await getDoc(doc(db, "users", currentUser.uid));

    if (userSnap.exists()) {
        document.getElementById("donorName").value = userSnap.data().name || "";
    }
}

async function loadCampaign() {
    if (!campaignId) {
        campaignInfo.innerHTML = "<p>Kempen tidak dijumpai.</p>";
        return;
    }

    const campaignSnap = await getDoc(doc(db, "campaigns", campaignId));

    if (!campaignSnap.exists()) {
        campaignInfo.innerHTML = "<p>Kempen tidak dijumpai.</p>";
        return;
    }

    campaignData = campaignSnap.data();

    campaignInfo.innerHTML = `
        <img src="${campaignData.mediaUrl}" class="campaign-img" alt="Poster Kempen">

        <h2>${campaignData.campaignTitle}</h2>

        <p>${campaignData.description}</p>

        <p><strong>Penerima:</strong> ${campaignData.beneficiaryName}</p>

        <p><strong>Lokasi:</strong> ${campaignData.location}</p>

        <p><strong>Dana Terkumpul:</strong> RM ${campaignData.currentAmount || 0}</p>

        <p><strong>Sasaran Dana:</strong> RM ${campaignData.targetAmount}</p>
    `;
}

function generateReceiptNumber() {
    const today = new Date();
    const dateText = today.toISOString().slice(0, 10).replaceAll("-", "");
    const randomNumber = Math.floor(100000 + Math.random() * 900000);

    return `DERMA-${dateText}-${randomNumber}`;
}

donationForm.addEventListener("submit", async (e) => {
    e.preventDefault();

    if (!currentUser || !campaignData) {
        message.textContent = "Maklumat sumbangan tidak lengkap.";
        message.style.color = "red";
        return;
    }

    const donorName = document.getElementById("donorName").value.trim();
    const amount = Number(document.getElementById("amount").value);
    const paymentMethod = document.getElementById("paymentMethod").value;

    if (amount <= 0) {
        message.textContent = "Jumlah sumbangan tidak sah.";
        message.style.color = "red";
        return;
    }

    try {
        message.textContent = "Sedang memproses sumbangan...";
        message.style.color = "blue";

        const transactionReference = "DEMO-" + Date.now();

        const donationRef = await addDoc(collection(db, "donations"), {
            donorId: currentUser.uid,
            donorName,
            campaignId,
            campaignTitle: campaignData.campaignTitle,
            amount,
            paymentMethod,
            paymentStatus: "Paid Demo",
            transactionReference,
            createdAt: serverTimestamp()
        });

        await updateDoc(doc(db, "campaigns", campaignId), {
            currentAmount: increment(amount),
            dana_terkumpul: increment(amount),
            updatedAt: serverTimestamp()
        });

        const receiptRef = await addDoc(collection(db, "receipts"), {
            donationId: donationRef.id,
            campaignId,
            donorId: currentUser.uid,
            receiptNumber: generateReceiptNumber(),
            amount,
            paymentMethod,
            paymentStatus: "Paid Demo",
            transactionReference,
            receiptUrl: "",
            generatedAt: serverTimestamp()
        });

        window.location.href = `success.html?receiptId=${receiptRef.id}`;

    } catch (error) {
        console.error(error);
        message.textContent = error.message;
        message.style.color = "red";
    }
});