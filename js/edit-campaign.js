import { auth, db, storage } from "./firebase-config.js";

import {
    onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/12.15.0/firebase-auth.js";

import {
    doc,
    getDoc,
    updateDoc,
    serverTimestamp
} from "https://www.gstatic.com/firebasejs/12.15.0/firebase-firestore.js";

import {
    ref,
    uploadBytes,
    getDownloadURL
} from "https://www.gstatic.com/firebasejs/12.15.0/firebase-storage.js";

const editCampaignForm = document.getElementById("editCampaignForm");
const message = document.getElementById("message");

const campaignPoster = document.getElementById("campaignPoster");
const posterPreview = document.getElementById("posterPreview");
const supportingDocs = document.getElementById("supportingDocs");

const params = new URLSearchParams(window.location.search);
const campaignId = params.get("campaignId") || params.get("id");

let currentUser = null;
let existingCampaign = null;

onAuthStateChanged(auth, async (user) => {
    if (!user) {
        window.location.href = "login.html";
        return;
    }

    currentUser = user;

    if (!campaignId) {
        showMessage("Kempen tidak dijumpai.", "red");
        return;
    }

    await loadCampaign();
});

async function loadCampaign() {
    try {
        const campaignRef = doc(db, "campaigns", campaignId);
        const campaignSnap = await getDoc(campaignRef);

        if (!campaignSnap.exists()) {
            showMessage("Kempen tidak dijumpai.", "red");
            return;
        }

        existingCampaign = campaignSnap.data();

        if (existingCampaign.applicantId !== currentUser.uid) {
            alert("Anda tidak dibenarkan mengemas kini kempen ini.");
            window.location.href = "my-campaign.html";
            return;
        }

        document.getElementById("campaignTitle").value = existingCampaign.campaignTitle || "";
        document.getElementById("campaignCategory").value = existingCampaign.campaignCategory || "";
        document.getElementById("targetAmount").value = existingCampaign.targetAmount || "";
        document.getElementById("endDate").value = existingCampaign.endDate || "";
        document.getElementById("beneficiaryName").value = existingCampaign.beneficiaryName || "";
        document.getElementById("location").value = existingCampaign.location || "";
        document.getElementById("description").value = existingCampaign.description || "";

        if (existingCampaign.mediaUrl) {
            posterPreview.src = existingCampaign.mediaUrl;
        }

    } catch (error) {
        console.error(error);
        showMessage(error.message, "red");
    }
}

campaignPoster.addEventListener("change", () => {
    const file = campaignPoster.files[0];

    if (file) {
        posterPreview.src = URL.createObjectURL(file);
    }
});

editCampaignForm.addEventListener("submit", async (e) => {
    e.preventDefault();

    if (!currentUser || !existingCampaign) {
        showMessage("Sila log masuk semula.", "red");
        return;
    }

    const campaignTitle = document.getElementById("campaignTitle").value.trim();
    const campaignCategory = document.getElementById("campaignCategory").value;
    const targetAmount = Number(document.getElementById("targetAmount").value);
    const endDate = document.getElementById("endDate").value;
    const beneficiaryName = document.getElementById("beneficiaryName").value.trim();
    const location = document.getElementById("location").value.trim();
    const description = document.getElementById("description").value.trim();

    if (targetAmount <= 0) {
        showMessage("Sasaran dana mestilah melebihi RM0.", "red");
        return;
    }

    try {
        showMessage("Sedang menyimpan kemas kini...", "blue");

        let mediaUrl = existingCampaign.mediaUrl || "";

        const selectedPoster = campaignPoster.files[0];

        if (selectedPoster) {
            const resizedPoster = await resizeImage(selectedPoster, 800, 450, 0.85);

            mediaUrl = await uploadFile(
                resizedPoster,
                "campaign-media",
                "poster.jpg"
            );
        }

        const existingDocs = existingCampaign.supportingDocumentUrls || [];
        const newDocUrls = [];

        for (const file of supportingDocs.files) {
            const url = await uploadFile(
                file,
                "campaign-supporting-documents",
                file.name
            );

            newDocUrls.push(url);
        }

        await updateDoc(doc(db, "campaigns", campaignId), {
            campaignTitle,
            campaignCategory,
            targetAmount,
            beneficiaryName,
            location,
            description,
            endDate,

            mediaUrl,
            supportingDocumentUrls: [...existingDocs, ...newDocUrls],

            updatedAt: serverTimestamp()
        });

        showMessage("Kempen berjaya dikemas kini.", "green");

        setTimeout(() => {
            window.location.href = "my-campaigns.html";
        }, 1200);

    } catch (error) {
        console.error(error);
        showMessage(error.message, "red");
    }
});

function showMessage(text, color) {
    message.textContent = text;
    message.style.color = color;
}

async function uploadFile(file, folder, filename) {
    const safeName = filename.replace(/\s+/g, "_");
    const filePath = `${folder}/${Date.now()}_${safeName}`;
    const fileRef = ref(storage, filePath);

    await uploadBytes(fileRef, file);

    return await getDownloadURL(fileRef);
}

async function resizeImage(file, maxWidth = 800, maxHeight = 450, quality = 0.85) {
    return new Promise((resolve, reject) => {
        const img = new Image();
        const reader = new FileReader();

        reader.onload = (e) => {
            img.src = e.target.result;
        };

        reader.onerror = reject;

        img.onload = () => {
            let width = img.width;
            let height = img.height;

            const ratio = Math.min(maxWidth / width, maxHeight / height);

            width = Math.round(width * ratio);
            height = Math.round(height * ratio);

            const canvas = document.createElement("canvas");
            canvas.width = maxWidth;
            canvas.height = maxHeight;

            const ctx = canvas.getContext("2d");

            ctx.fillStyle = "#ffffff";
            ctx.fillRect(0, 0, maxWidth, maxHeight);

            const x = (maxWidth - width) / 2;
            const y = (maxHeight - height) / 2;

            ctx.drawImage(img, x, y, width, height);

            canvas.toBlob(
                (blob) => {
                    resolve(blob);
                },
                "image/jpeg",
                quality
            );
        };

        img.onerror = reject;

        reader.readAsDataURL(file);
    });
}