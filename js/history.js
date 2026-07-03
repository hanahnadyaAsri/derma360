import { auth, db } from "./firebase-config.js";

import {
    onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/12.15.0/firebase-auth.js";

import {
    collection,
    query,
    where,
    getDocs
} from "https://www.gstatic.com/firebasejs/12.15.0/firebase-firestore.js";

const historyList = document.getElementById("historyList");

onAuthStateChanged(auth, async (user) => {
    if (!user) {
        window.location.href = "login.html";
        return;
    }

    await loadHistory(user.uid);
});

async function loadHistory(uid) {
    historyList.innerHTML = "<p>Sedang memuatkan sejarah sumbangan...</p>";

    const q = query(
        collection(db, "receipts"),
        where("donorId", "==", uid)
    );

    const snapshot = await getDocs(q);

    historyList.innerHTML = "";

    if (snapshot.empty) {
        historyList.innerHTML = "<p>Tiada sejarah sumbangan buat masa ini.</p>";
        return;
    }

    snapshot.forEach((docSnap) => {
        const receipt = docSnap.data();
        const receiptId = docSnap.id;

        const date = receipt.generatedAt?.toDate().toLocaleString("ms-MY") || "-";

        const card = document.createElement("div");
        card.className = "campaign-card";

        card.innerHTML = `
            <h3>${receipt.receiptNumber || "Resit Sumbangan"}</h3>

            <p><strong>Jumlah:</strong> RM ${Number(receipt.amount || 0).toFixed(2)}</p>
            <p><strong>Kaedah Bayaran:</strong> ${receipt.paymentMethod || "-"}</p>
            <p><strong>Status:</strong> ${receipt.paymentStatus || "-"}</p>
            <p><strong>No. Transaksi:</strong> ${receipt.transactionReference || "-"}</p>
            <p><strong>Tarikh:</strong> ${date}</p>

            <button onclick="window.location.href='receipt.html?receiptId=${receiptId}'">
                Lihat Resit
            </button>
        `;

        historyList.appendChild(card);
    });
}