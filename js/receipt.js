import { auth, db } from "./firebase-config.js";

import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/12.15.0/firebase-auth.js";

import { doc, getDoc } from "https://www.gstatic.com/firebasejs/12.15.0/firebase-firestore.js";

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
        receiptBox.innerHTML = "<p>Resit tidak dijumpai.</p>";
        return;
    }

    await loadReceipt();
});

async function loadReceipt() {
    const receiptSnap = await getDoc(doc(db, "receipts", receiptId));

    if (!receiptSnap.exists()) {
        receiptBox.innerHTML = "<p>Resit tidak dijumpai.</p>";
        return;
    }

    const receipt = receiptSnap.data();

    let donorName = "-";
    let campaignTitle = "-";

    const donationSnap = await getDoc(doc(db, "donations", receipt.donationId));
    if (donationSnap.exists()) donorName = donationSnap.data().donorName;

    const campaignSnap = await getDoc(doc(db, "campaigns", receipt.campaignId));
    if (campaignSnap.exists()) campaignTitle = campaignSnap.data().campaignTitle;

    const date = receipt.generatedAt?.toDate().toLocaleString("ms-MY") || "-";

    receiptBox.innerHTML = `
        <div class="receipt-card">
            <h2>DERMA360</h2>
            <h3>RESIT SUMBANGAN DIGITAL</h3>
            <hr>

            <p><strong>No. Resit:</strong> ${receipt.receiptNumber}</p>
            <p><strong>ID Resit:</strong> ${receiptId}</p>
            <p><strong>Nama Penyumbang:</strong> ${donorName}</p>
            <p><strong>Kempen:</strong> ${campaignTitle}</p>
            <p><strong>Jumlah:</strong> RM ${Number(receipt.amount).toFixed(2)}</p>
            <p><strong>Kaedah Bayaran:</strong> ${receipt.paymentMethod}</p>
            <p><strong>Status:</strong> ${receipt.paymentStatus}</p>
            <p><strong>No. Transaksi:</strong> ${receipt.transactionReference}</p>
            <p><strong>Tarikh:</strong> ${date}</p>

            <hr>
            <p style="text-align:center;">Terima kasih atas sumbangan anda.</p>
            <p style="text-align:center;">Derma360</p>
        </div>
    `;
}

printBtn.addEventListener("click", () => {
    window.print();
});