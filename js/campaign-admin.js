import { db } from "./firebase-config.js";
import {
    collection,
    getDocs
} from "https://www.gstatic.com/firebasejs/12.15.0/firebase-firestore.js";

const tableBody = document.getElementById("campaignTableBody");
const campaignTable = document.getElementById("campaignTable");
const loadingStatus = document.getElementById("loadingStatus");
const modal = document.getElementById("detailModal");
const modalBody = document.getElementById("modalBody");

// Simpan data kempen secara global untuk rujukan paparan butiran
let globalCampaigns = [];

async function loadAdminCampaigns() {
    try {
        const querySnapshot = await getDocs(collection(db, "campaigns"));

        tableBody.innerHTML = "";
        globalCampaigns = [];

        if (querySnapshot.empty) {
            loadingStatus.textContent = "Tiada rekod kempen dijumpai.";
            return;
        }

        querySnapshot.forEach((docSnap) => {
            const data = docSnap.data();
            const id = docSnap.id;

            data.id = id;
            globalCampaigns.push(data);

            // Sokong medan dana_terkumpul atau currentAmount
            const dana = data.dana_terkumpul !== undefined ? data.dana_terkumpul : (data.currentAmount || 0);
            const statusText = data.status_kempen || "-";
            const isActive = statusText.toLowerCase() === "aktif";

            const row = document.createElement("tr");
            row.innerHTML = `
                <td><strong>${data.campaignTitle || "Tiada Tajuk"}</strong></td>
                <td>${data.campaignCategory || "-"}</td>
                <td>${data.beneficiaryName || "-"}</td>
                <td>${data.endDate || "-"}</td>
                <td>RM ${dana} / RM ${data.targetAmount || 0}</td>
                <td><span class="status-badge ${isActive ? "active" : "inactive"}">${statusText}</span></td>
                <td>
                    <button class="btn-detail" type="button" onclick="window.openDetails('${id}')">Lihat Butiran</button>
                </td>
            `;
            tableBody.appendChild(row);
        });

        loadingStatus.style.display = "none";
        campaignTable.style.display = "table";

    } catch (error) {
        console.error("Ralat memuatkan kempen:", error);
        loadingStatus.textContent = "Ralat memuatkan data: " + error.message;
        loadingStatus.style.color = "red";
    }
}

// Fungsi global untuk membuka paparan butiran lengkap (Modal)
window.openDetails = function (campaignId) {
    const campaign = globalCampaigns.find(c => c.id === campaignId);
    if (!campaign) return;

    let createdStr = campaign.createdAt && typeof campaign.createdAt.toDate === "function"
        ? campaign.createdAt.toDate().toLocaleString("ms-MY")
        : "-";

    let updatedStr = campaign.updatedAt && typeof campaign.updatedAt.toDate === "function"
        ? campaign.updatedAt.toDate().toLocaleString("ms-MY")
        : "-";

    let startDateStr = campaign.startDate && typeof campaign.startDate.toDate === "function"
        ? campaign.startDate.toDate().toLocaleString("ms-MY")
        : (campaign.startDate || '-');

    let danaTerkumpul = campaign.dana_terkumpul !== undefined ? campaign.dana_terkumpul : (campaign.currentAmount || 0);

    modalBody.innerHTML = `
        <h3 style="color: #008080; margin-top:0;">${campaign.campaignTitle || '-'}</h3>
        ${campaign.mediaUrl ? `<img src="${campaign.mediaUrl}" alt="Poster Kempen">` : ''}
        <p><strong>ID Pemohon:</strong> ${campaign.applicantId || '-'}</p>
        <p><strong>Kategori:</strong> ${campaign.campaignCategory || '-'}</p>
        <p><strong>Penerima / Benefisiari:</strong> ${campaign.beneficiaryName || '-'}</p>
        <p><strong>Lokasi:</strong> ${campaign.location || '-'}</p>
        <p><strong>Penerangan:</strong> ${campaign.description || '-'}</p>
        <hr>
        <p><strong>Sasaran Dana:</strong> RM ${campaign.targetAmount || 0}</p>
        <p><strong>Dana Terkumpul:</strong> RM ${danaTerkumpul}</p>
        <p><strong>Status Kempen:</strong> ${campaign.status_kempen || '-'}</p>
        <p><strong>Tarikh Mula:</strong> ${startDateStr}</p>
        <p><strong>Tarikh Tamat:</strong> ${campaign.endDate || '-'}</p>
        <p><strong>Tarikh Dicipta:</strong> ${createdStr}</p>
        <p><strong>Tarikh Dikemaskini:</strong> ${updatedStr}</p>
        <p><strong>Catatan Pengesahan:</strong> ${campaign.verificationRemarks || 'Tiada catatan'}</p>
    `;

    modal.style.display = "block";
};

// Fungsi global untuk menutup modal
window.closeModal = function () {
    modal.style.display = "none";
};

// Tutup modal apabila pengguna klik di luar kawasan kotak putih
window.onclick = function (event) {
    if (event.target === modal) {
        modal.style.display = "none";
    }
};

// Jalankan fungsi memuatkan data apabila skrip dimuatkan
loadAdminCampaigns();