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
            <div class="receipt-header">
                <h1>DERMA360</h1>
                <p>Resit Sumbangan Rasmi</p>
            </div>
            
            <div class="receipt-details">
                <div class="detail-row"><span>No. Resit:</span> <strong>${receipt.receiptNumber}</strong></div>
                <div class="detail-row"><span>Tarikh:</span> ${date}</div>
            </div>

            <div class="receipt-body">
                <p>Kepada: <strong>${donorName}</strong></p>
                <p>Terima kasih atas sumbangan anda untuk kempen:</p>
                <h3 class="campaign-title">${campaignTitle}</h3>
                
                <div class="amount-box">
                    <small>JUMLAH SUMBANGAN</small>
                    <h2>RM ${Number(receipt.amount).toFixed(2)}</h2>
                </div>

                <table class="receipt-table">
                    <tr><td>Kaedah Bayaran</td><td>${receipt.paymentMethod}</td></tr>
                    <tr><td>Status</td><td>${receipt.paymentStatus}</td></tr>
                    <tr><td>No. Transaksi</td><td>${receipt.transactionReference}</td></tr>
                </table>
            </div>

            <div class="receipt-footer">
                <p>Ini adalah resit janaan komputer dan tidak memerlukan tandatangan.</p>
                <p><strong>www.derma360.com</strong></p>
            </div>
        </div>
    `;
}

printBtn.addEventListener("click", () => {
    window.print();
});