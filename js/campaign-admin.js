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
const searchInput = document.getElementById("searchInput");

// Simpan data kempen secara global untuk rujukan paparan butiran dan carian
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
        });

        renderCampaignTable(globalCampaigns);

    } catch (error) {
        console.error("Ralat memuatkan senarai kempen:", error);
        loadingStatus.textContent = "Gagal memuatkan senarai kempen.";
    }
}

// Fungsi untuk memaparkan data ke dalam jadual
function renderCampaignTable(campaigns) {
    tableBody.innerHTML = "";

    if (campaigns.length === 0) {
        campaignTable.style.display = "none";
        loadingStatus.style.display = "block";
        loadingStatus.textContent = "Tiada kempen sepadan dengan carian dijumpai.";
        return;
    }

    loadingStatus.style.display = "none";
    campaignTable.style.display = "table";

    campaigns.forEach((data) => {
        const id = data.id;

        // Sokong pelbagai nama medan bagi dana terkumpul
        const dana = data.dana_terkumpul !== undefined ? data.dana_terkumpul : (data.currentAmount || 0);
        const statusText = data.status_kempen || "-";
        const isActive = statusText.toLowerCase() === "aktif";
        const statusBg = isActive ? "rgba(46, 125, 50, 0.15)" : "rgba(211, 47, 47, 0.15)";
        const statusColor = isActive ? "#2e7d32" : "#d32f2f";

        // Sokong pelbagai nama medan bagi tajuk kempen dan nama pemohon/penerima
        const title = data.campaignTitle || data.title || "Tanpa Tajuk";
        const category = data.campaignCategory || data.category || "-";
        const beneficiary = data.beneficiaryName || data.applicantName || "-";
        const endDate = data.endDate || "-";

        const row = document.createElement("tr");
        row.innerHTML = `
            <td style="padding: 12px; font-weight: bold;">${title}</td>
            <td style="padding: 12px;">${category}</td>
            <td style="padding: 12px;">${beneficiary}</td>
            <td style="padding: 12px;">${endDate}</td>
            <td style="padding: 12px;">RM ${Number(dana).toFixed(2)}</td>
            <td style="padding: 12px;">
                <span style="display: inline-block; padding: 4px 10px; border-radius: 8px; background: ${statusBg}; color: ${statusColor}; font-weight: bold;">
                    ${statusText}
                </span>
            </td>
            <td style="padding: 12px; text-align: center;">
                <button class="btn-detail" onclick="viewDetails('${id}')">Butiran</button>
            </td>
        `;
        tableBody.appendChild(row);
    });
}

// Fungsi Carian Masa Nyata (Nama Kempen / Pemohon / Penerima)
if (searchInput) {
    searchInput.addEventListener("input", (e) => {
        const keyword = e.target.value.toLowerCase().trim();
        const filtered = globalCampaigns.filter((item) => {
            const title = (item.campaignTitle || item.title || "").toLowerCase();
            const beneficiary = (item.beneficiaryName || item.applicantName || "").toLowerCase();
            return title.includes(keyword) || beneficiary.includes(keyword);
        });
        renderCampaignTable(filtered);
    });
}

// Fungsi global untuk paparan butiran kempen dalam modal
window.viewDetails = function (id) {
    const campaign = globalCampaigns.find(c => c.id === id);
    if (!campaign) return;

    const danaTerkumpul = campaign.dana_terkumpul !== undefined ? campaign.dana_terkumpul : (campaign.currentAmount || 0);
    const startDateStr = campaign.startDate || '-';
    const createdStr = campaign.createdAt?.toDate ? campaign.createdAt.toDate().toLocaleString() : (campaign.createdAt || '-');
    const updatedStr = campaign.updatedAt?.toDate ? campaign.updatedAt.toDate().toLocaleString() : (campaign.updatedAt || '-');
    const title = campaign.campaignTitle || campaign.title || "Tanpa Tajuk";
    const beneficiary = campaign.beneficiaryName || campaign.applicantName || "-";

    modalBody.innerHTML = `
        <h2>${title}</h2>
        ${campaign.mediaUrl ? `<img src="${campaign.mediaUrl}" alt="Poster Kempen" style="width:100%; max-height:220px; object-fit:cover; border-radius:8px; margin-bottom:15px;">` : ''}
        <p><strong>ID Pemohon:</strong> ${campaign.applicantId || '-'}</p>
        <p><strong>Kategori:</strong> ${campaign.campaignCategory || campaign.category || '-'}</p>
        <p><strong>Penerima / Benefisiari / Pemohon:</strong> ${beneficiary}</p>
        <p><strong>Lokasi:</strong> ${campaign.location || '-'}</p>
        <p><strong>Penerangan:</strong> ${campaign.description || '-'}</p>
        <hr style="border: 0; border-top: 1px solid var(--border); margin: 15px 0;">
        <p><strong>Sasaran Dana:</strong> RM ${campaign.targetAmount || 0}</p>
        <p><strong>Dana Terkumpul:</strong> RM ${Number(danaTerkumpul).toFixed(2)}</p>
        <p><strong>Status Kempen:</strong> ${campaign.status_kempen || '-'}</p>

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

// Tutup modal apabila pengguna klik di luar kawasan modal
window.onclick = function (event) {
    if (event.target === modal) {
        modal.style.display = "none";
    }
};

// Mulakan muat turun data pentadbir kempen
loadAdminCampaigns();