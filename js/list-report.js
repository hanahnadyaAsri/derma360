import { db } from "./firebase-config.js";
import {
    collection,
    getDocs
} from "https://www.gstatic.com/firebasejs/12.15.0/firebase-firestore.js";

const totalDonation = document.getElementById("totalDonation");
const weeklyDonation = document.getElementById("weeklyDonation");
const monthlyDonation = document.getElementById("monthlyDonation");
const yearlyDonation = document.getElementById("yearlyDonation");
const campaignReportList = document.getElementById("campaignReportList");
const monthlyChartTitle = document.getElementById("monthlyChartTitle");
const yearlyChartTitle = document.getElementById("yearlyChartTitle");
const reportMonthInput = document.getElementById("reportMonth");
const reportYearSelect = document.getElementById("reportYear");
const downloadMonthlyBtn = document.getElementById("downloadMonthlyBtn");
const downloadYearlyBtn = document.getElementById("downloadYearlyBtn");

const searchCampaignInput = document.getElementById("searchCampaignInput");
const weekPickerInput = document.getElementById("weekPickerInput");

let weeklyChartInstance = null;
let monthlyChartInstance = null;
let yearlyChartInstance = null;

let cachedDonations = [];
let cachedCampaigns = [];

const today = new Date();
const currentYearNum = today.getFullYear();
const currentDateStr = today.toISOString().slice(0, 7);

if (reportMonthInput) {
    reportMonthInput.value = currentDateStr;
}

if (reportYearSelect) {
    reportYearSelect.innerHTML = "";
    for (let y = currentYearNum; y >= currentYearNum - 5; y--) {
        const option = document.createElement("option");
        option.value = y;
        option.textContent = y;
        if (y === currentYearNum) option.selected = true;
        reportYearSelect.appendChild(option);
    }
}

loadReports();

// Event Listeners
if (reportMonthInput) {
    reportMonthInput.addEventListener("change", () => processAndDisplayReports(cachedDonations, cachedCampaigns));
}

if (reportYearSelect) {
    reportYearSelect.addEventListener("change", () => processAndDisplayReports(cachedDonations, cachedCampaigns));
}

if (weekPickerInput) {
    weekPickerInput.addEventListener("change", () => processAndDisplayReports(cachedDonations, cachedCampaigns));
}

if (searchCampaignInput) {
    searchCampaignInput.addEventListener("input", () => processAndDisplayReports(cachedDonations, cachedCampaigns));
}

if (downloadMonthlyBtn) {
    downloadMonthlyBtn.addEventListener("click", () => downloadMonthlyReportCSV(cachedDonations, cachedCampaigns));
}

if (downloadYearlyBtn) {
    downloadYearlyBtn.addEventListener("click", () => downloadYearlyReportCSV(cachedDonations, cachedCampaigns));
}

async function loadReports() {
    try {
        const donationSnapshot = await getDocs(collection(db, "donations"));
        const campaignSnapshot = await getDocs(collection(db, "campaigns"));

        cachedDonations = [];
        donationSnapshot.forEach((docSnap) => {
            cachedDonations.push({ id: docSnap.id, ...docSnap.data() });
        });

        cachedCampaigns = [];
        campaignSnapshot.forEach((docSnap) => {
            cachedCampaigns.push({ id: docSnap.id, ...docSnap.data() });
        });

        processAndDisplayReports(cachedDonations, cachedCampaigns);
    } catch (error) {
        console.error("Ralat memuatkan laporan:", error);
    }
}

function processAndDisplayReports(donations, campaigns) {
    let total = 0;
    let weekly = 0;
    let monthly = 0;
    let yearly = 0;

    const campaignTotals = {};
    const campaignMonthlyTotals = {};
    const campaignYearlyTotals = {};
    const campaignNames = {};

    const monthsMalay = ["Januari", "Februari", "Mac", "April", "Mei", "Jun", "Julai", "Ogos", "September", "Oktober", "November", "Disember"];

    // Pengiraan Tarikh Minggu
    let monday, sunday, weekLabel;
    if (weekPickerInput && weekPickerInput.value) {
        const [wYear, wWeek] = weekPickerInput.value.split("-W").map(Number);
        const simpleDate = new Date(wYear, 0, 1 + (wWeek - 1) * 7);
        const dayOfWeek = simpleDate.getDay();
        monday = new Date(simpleDate);
        monday.setDate(simpleDate.getDate() - (dayOfWeek === 0 ? 6 : dayOfWeek - 1));
        monday.setHours(0, 0, 0, 0);
        sunday = new Date(monday);
        sunday.setDate(monday.getDate() + 6);
        sunday.setHours(23, 59, 59, 999);
    } else {
        const currentDay = today.getDay();
        const diffToMonday = currentDay === 0 ? -6 : 1 - currentDay;
        monday = new Date(today);
        monday.setDate(today.getDate() + diffToMonday);
        monday.setHours(0, 0, 0, 0);
        sunday = new Date(monday);
        sunday.setDate(monday.getDate() + 6);
        sunday.setHours(23, 59, 59, 999);
    }

    const startDay = monday.getDate();
    const endDay = sunday.getDate();
    const startMonth = monthsMalay[monday.getMonth()];
    const endMonth = monthsMalay[sunday.getMonth()];
    weekLabel = monday.getMonth() === sunday.getMonth()
        ? `${startDay}-${endDay} ${endMonth}`
        : `${startDay} ${startMonth} - ${endDay} ${endMonth}`;

    const selectedMonthStr = reportMonthInput ? reportMonthInput.value : currentDateStr;
    const [selectedYearNum, selectedMonthNum] = selectedMonthStr.split("-").map(Number);
    const selectedMonthName = monthsMalay[selectedMonthNum - 1] || "";

    const chosenYearNum = reportYearSelect ? Number(reportYearSelect.value) : currentYearNum;

    if (monthlyChartTitle) monthlyChartTitle.textContent = `Graf Kutipan Bulanan (${selectedMonthName} ${selectedYearNum}) Mengikut Kempen`;
    if (yearlyChartTitle) yearlyChartTitle.textContent = `Graf Kutipan Tahunan (${chosenYearNum}) Mengikut Kempen`;

    const monthStart = new Date(selectedYearNum, selectedMonthNum - 1, 1);
    const monthEnd = new Date(selectedYearNum, selectedMonthNum, 0, 23, 59, 59, 999);

    const yearStart = new Date(chosenYearNum, 0, 1);
    const yearEnd = new Date(chosenYearNum, 11, 31, 23, 59, 59, 999);

    const searchQuery = searchCampaignInput ? searchCampaignInput.value.toLowerCase().trim() : "";

    const activeCampaignsForMonth = [];
    const activeCampaignsForYear = [];
    const monthlyDataValues = [];
    const yearlyDataValues = [];

    campaigns.forEach((campaign) => {
        const campaignId = campaign.id;
        const title = campaign.campaignTitle || campaign.title || "Tanpa Tajuk";

        if (searchQuery && !title.toLowerCase().includes(searchQuery)) return;

        campaignNames[campaignId] = title;
        campaignTotals[campaignId] = 0;
        campaignMonthlyTotals[campaignId] = 0;
        campaignYearlyTotals[campaignId] = 0;

        const cStartDate = campaign.createdAt?.toDate?.() || (campaign.startDate ? new Date(campaign.startDate) : new Date(selectedYearNum, 0, 1));
        const cEndDate = campaign.endDate ? new Date(campaign.endDate) : new Date(selectedYearNum, 11, 31, 23, 59, 59, 999);

        if (cStartDate <= monthEnd && cEndDate >= monthStart) {
            activeCampaignsForMonth.push({ id: campaignId, title: title });
        }

        if (cStartDate <= yearEnd && cEndDate >= yearStart) {
            activeCampaignsForYear.push({ id: campaignId, title: title });
        }
    });

    donations.forEach((donation) => {
        const status = (donation.paymentStatus || "").toLowerCase();
        if (status !== "Selesai" && status !== "selesai") return;

        const amount = Number(donation.amount || 0);
        const campaignId = donation.campaignId;
        const date = donation.createdAt?.toDate?.() || donation.donatedAt?.toDate?.();

        if (!campaignId) return;

        total += amount;

        if (date) {
            if (date >= monday && date <= sunday) {
                weekly += amount;
            }
            if (date >= monthStart && date <= monthEnd) {
                monthly += amount;
                if (campaignMonthlyTotals[campaignId] !== undefined) {
                    campaignMonthlyTotals[campaignId] += amount;
                }
            }
            if (date >= yearStart && date <= yearEnd) {
                yearly += amount;
                if (campaignYearlyTotals[campaignId] !== undefined) {
                    campaignYearlyTotals[campaignId] += amount;
                }
            }
        }

        if (campaignTotals[campaignId] !== undefined) {
            campaignTotals[campaignId] += amount;
        }
    });

    if (totalDonation) totalDonation.textContent = `RM ${total.toFixed(2)}`;
    if (weeklyDonation) weeklyDonation.textContent = `RM ${weekly.toFixed(2)}`;
    if (monthlyDonation) monthlyDonation.textContent = `RM ${monthly.toFixed(2)}`;
    if (yearlyDonation) yearlyDonation.textContent = `RM ${yearly.toFixed(2)}`;

    activeCampaignsForMonth.forEach(c => monthlyDataValues.push(campaignMonthlyTotals[c.id] || 0));
    activeCampaignsForYear.forEach(c => yearlyDataValues.push(campaignYearlyTotals[c.id] || 0));

    renderWeeklyChart(weekly, weekLabel);
    renderMonthlyChart(activeCampaignsForMonth.map(c => c.title), monthlyDataValues);
    renderYearlyChart(activeCampaignsForYear.map(c => c.title), yearlyDataValues);

    // Paparan Jadual Kempen Keseluruhan
    if (campaignReportList) {
        campaignReportList.innerHTML = "";
        let hasCampaigns = false;

        campaigns.forEach((campaign) => {
            const title = campaign.campaignTitle || campaign.title || "Tanpa Tajuk";
            if (searchQuery && !title.toLowerCase().includes(searchQuery)) return;

            hasCampaigns = true;
            const campaignId = campaign.id;
            const collected = campaignTotals[campaignId] || 0;
            const target = Number(campaign.targetAmount || 0);
            const rawPercentage = target > 0 ? (collected / target) * 100 : 0;

            const isCompleted = rawPercentage >= 100;
            const badgeBg = isCompleted ? "rgba(46, 125, 50, 0.15)" : "rgba(245, 124, 0, 0.15)";
            const badgeColor = isCompleted ? "#2e7d32" : "var(--accent)";

            const row = document.createElement("tr");
            row.style.borderBottom = "1px solid var(--border)";
            row.innerHTML = `
                <td style="padding: 12px; font-weight: 500;">${title}</td>
                <td style="padding: 12px; text-align: right;">RM ${collected.toFixed(2)}</td>
                <td style="padding: 12px; text-align: right;">RM ${target.toFixed(2)}</td>
                <td style="padding: 12px; text-align: center;">
                    <span style="display: inline-block; padding: 4px 10px; border-radius: 8px; background: ${badgeBg}; color: ${badgeColor}; font-weight: bold;">
                        ${rawPercentage.toFixed(1)}%
                    </span>
                </td>
            `;
            campaignReportList.appendChild(row);
        });

        if (!hasCampaigns) {
            campaignReportList.innerHTML = `<tr><td colspan="4" style="text-align: center; padding: 20px; color: var(--muted);">Tiada rekod kempen dijumpai.</td></tr>`;
        }
    }
}

// 1. Graf Mingguan
function renderWeeklyChart(weeklyAmount, weekLabel) {
    const canvasElement = document.getElementById("weeklyChart");
    if (!canvasElement) return;
    const ctx = canvasElement.getContext("2d");
    if (weeklyChartInstance) weeklyChartInstance.destroy();

    const maxWeeklyY = weeklyAmount > 1000 ? Math.ceil(weeklyAmount / 1000) * 1000 : 1000;

    weeklyChartInstance = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: [weekLabel],
            datasets: [{
                label: 'Kutipan Mingguan (RM)',
                data: [weeklyAmount],
                backgroundColor: 'rgba(0, 121, 107, 0.8)',
                borderColor: 'rgba(0, 95, 86, 1)',
                borderWidth: 2,
                borderRadius: 8
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: { display: false },
                tooltip: { callbacks: { label: (c) => ` RM ${c.raw.toFixed(2)}` } }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    max: maxWeeklyY,
                    ticks: { callback: (v) => 'RM ' + v },
                    grid: { color: 'rgba(176, 190, 197, 0.2)' }
                },
                x: { grid: { display: false } }
            }
        }
    });
}

// 2. Graf Bulanan (Tanpa Zoom / Zoom Dinyahaktifkan)
function renderMonthlyChart(labels, data) {
    const canvasElement = document.getElementById("monthlyChart");
    if (!canvasElement) return;
    const ctx = canvasElement.getContext("2d");
    if (monthlyChartInstance) monthlyChartInstance.destroy();

    const maxMonthlyVal = Math.max(...data, 0);
    const maxMonthlyY = maxMonthlyVal > 1000 ? Math.ceil(maxMonthlyVal / 1000) * 1000 : 1000;

    monthlyChartInstance = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: labels,
            datasets: [{
                label: 'Kutipan Bulan Ini (RM)',
                data: data,
                backgroundColor: 'rgba(245, 124, 0, 0.8)',
                borderColor: 'rgba(184, 79, 0, 1)',
                borderWidth: 2,
                borderRadius: 8
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: { display: false },
                tooltip: { callbacks: { label: (c) => ` RM ${c.raw.toFixed(2)}` } }
                // Plugin zoom dikeluarkan untuk graf bulanan
            },
            scales: {
                y: {
                    beginAtZero: true,
                    max: maxMonthlyY,
                    ticks: { callback: (v) => 'RM ' + v },
                    grid: { color: 'rgba(176, 190, 197, 0.2)' }
                },
                x: {
                    ticks: { maxRotation: 45, minRotation: 0 },
                    grid: { display: false }
                }
            }
        }
    });
}

// 3. Graf Tahunan (Dengan Zum & Sorot Aktif)
function renderYearlyChart(labels, data) {
    const canvasElement = document.getElementById("yearlyChart");
    if (!canvasElement) return;
    const ctx = canvasElement.getContext("2d");
    if (yearlyChartInstance) yearlyChartInstance.destroy();

    const maxYearlyVal = Math.max(...data, 0);
    const maxYearlyY = maxYearlyVal > 1000 ? Math.ceil(maxYearlyVal / 1000) * 1000 : 1000;

    const backgroundColors = labels.map((_, i) => i % 2 === 0 ? 'rgba(0, 121, 107, 0.8)' : 'rgba(245, 124, 0, 0.8)');
    const borderColors = labels.map((_, i) => i % 2 === 0 ? 'rgba(0, 95, 86, 1)' : 'rgba(184, 79, 0, 1)');

    yearlyChartInstance = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: labels,
            datasets: [{
                label: 'Kutipan Tahunan (RM)',
                data: data,
                backgroundColor: backgroundColors,
                borderColor: borderColors,
                borderWidth: 2,
                borderRadius: 8
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: { display: false },
                tooltip: { callbacks: { label: (c) => ` RM ${c.raw.toFixed(2)}` } },
                zoom: {
                    zoom: { wheel: { enabled: true }, pinch: { enabled: true }, mode: 'x' },
                    pan: { enabled: true, mode: 'x' }
                }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    max: maxYearlyY,
                    ticks: { callback: (v) => 'RM ' + v },
                    grid: { color: 'rgba(176, 190, 197, 0.2)' }
                },
                x: {
                    ticks: { maxRotation: 45, minRotation: 0 },
                    grid: { display: false }
                }
            }
        }
    });
}

// Muat Turun CSV Bulanan
function downloadMonthlyReportCSV(donations, campaigns) {
    const selectedMonthStr = reportMonthInput ? reportMonthInput.value : currentDateStr;
    const [yearNum, monthNum] = selectedMonthStr.split("-").map(Number);
    const start = new Date(yearNum, monthNum - 1, 1);
    const end = new Date(yearNum, monthNum, 0, 23, 59, 59, 999);
    const searchQuery = searchCampaignInput ? searchCampaignInput.value.toLowerCase().trim() : "";

    let csvContent = "data:text/csv;charset=utf-8,ID Sumbangan,Kempen ID,Jumlah (RM),Tarikh,Status\n";

    donations.forEach((d) => {
        const status = (d.paymentStatus || "").toLowerCase();
        if (status !== "success" && status !== "paid" && status !== "paid demo") return;

        const date = d.createdAt?.toDate?.() || d.donatedAt?.toDate?.();
        if (!date || date < start || date > end) return;

        const camp = campaigns.find(c => c.id === d.campaignId);
        const title = camp ? (camp.campaignTitle || camp.title || "") : "";
        if (searchQuery && !title.toLowerCase().includes(searchQuery)) return;

        const row = [d.id, d.campaignId || "-", d.amount || 0, date.toISOString().slice(0, 10), d.paymentStatus].join(",");
        csvContent += row + "\n";
    });

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `laporan_kewangan_bulan_${selectedMonthStr}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
}

// Muat Turun CSV Tahunan
function downloadYearlyReportCSV(donations, campaigns) {
    const chosenYearNum = reportYearSelect ? Number(reportYearSelect.value) : currentYearNum;
    const start = new Date(chosenYearNum, 0, 1);
    const end = new Date(chosenYearNum, 11, 31, 23, 59, 59, 999);
    const searchQuery = searchCampaignInput ? searchCampaignInput.value.toLowerCase().trim() : "";

    let csvContent = "data:text/csv;charset=utf-8,ID Sumbangan,Kempen ID,Jumlah (RM),Tarikh,Status\n";

    donations.forEach((d) => {
        const status = (d.paymentStatus || "").toLowerCase();
        if (status !== "success" && status !== "paid" && status !== "paid demo") return;

        const date = d.createdAt?.toDate?.() || d.donatedAt?.toDate?.();
        if (!date || date < start || date > end) return;

        const camp = campaigns.find(c => c.id === d.campaignId);
        const title = camp ? (camp.campaignTitle || camp.title || "") : "";
        if (searchQuery && !title.toLowerCase().includes(searchQuery)) return;

        const row = [d.id, d.campaignId || "-", d.amount || 0, date.toISOString().slice(0, 10), d.paymentStatus].join(",");
        csvContent += row + "\n";
    });

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `laporan_kewangan_tahun_${chosenYearNum}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
}