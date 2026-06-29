import { auth, db } from "./firebase-config.js";

import {
    onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/12.15.0/firebase-auth.js";

import {
    doc,
    getDoc
} from "https://www.gstatic.com/firebasejs/12.15.0/firebase-firestore.js";

const receiptBox = document.getElementById("receiptBox");
const printBtn = document.getElementById("printBtn");

const params = new URLSearchParams(window.location.search);
const receiptId = params.get("receiptId");

onAuthStateChanged(auth, async (user) => {
    if (!user) {
        window.location.href = "login.html";
        return;
    }

    if (!receiptId) {
        receiptBox.innerHTML = "<p>Receipt not found.</p>";
        return;
    }

    await loadReceipt();
});

async function loadReceipt() {
    const receiptSnap = await getDoc(doc(db, "receipts", receiptId));

    if (!receiptSnap.exists()) {
        receiptBox.innerHTML = "<p>Receipt record not found.</p>";
        return;
    }

    const receipt = receiptSnap.data();

    let campaignTitle = "Unknown Campaign";
    let donorName = "Unknown Donor";

    const campaignSnap = await getDoc(doc(db, "campaigns", receipt.campaignId));
    if (campaignSnap.exists()) {
        campaignTitle = campaignSnap.data().campaignTitle;
    }

    const donationSnap = await getDoc(doc(db, "donations", receipt.donationId));
    if (donationSnap.exists()) {
        donorName = donationSnap.data().donorName;
    }

    const date = receipt.generatedAt?.toDate().toLocaleString() || "-";

    receiptBox.innerHTML = `
        <div class="receipt-card">
            <h2>DERMA360</h2>
            <p><strong>Digital Donation Receipt</strong></p>

            <hr>

            <p><strong>Receipt ID:</strong> ${receiptId}</p>
            <p><strong>Receipt Number:</strong> ${receipt.receiptNumber}</p>
            <p><strong>Donation ID:</strong> ${receipt.donationId}</p>
            <p><strong>Campaign:</strong> ${campaignTitle}</p>
            <p><strong>Donor Name:</strong> ${donorName}</p>
            <p><strong>Amount:</strong> RM ${receipt.amount}</p>
            <p><strong>Payment Method:</strong> ${receipt.paymentMethod}</p>
            <p><strong>Payment Status:</strong> ${receipt.paymentStatus}</p>
            <p><strong>Transaction Reference:</strong> ${receipt.transactionReference}</p>
            <p><strong>Generated At:</strong> ${date}</p>

            <hr>

            <p>Thank you for supporting this campaign through Derma360.</p>
        </div>
    `;
}

printBtn.addEventListener("click", () => {
    window.print();
});