import { auth, db, storage } from "./firebase-config.js";

import {
    onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/12.15.0/firebase-auth.js";

import {
    collection,
    addDoc,
    serverTimestamp
} from "https://www.gstatic.com/firebasejs/12.15.0/firebase-firestore.js";

import {
    ref,
    uploadBytes,
    getDownloadURL
} from "https://www.gstatic.com/firebasejs/12.15.0/firebase-storage.js";

const campaignForm = document.getElementById("campaignForm");
const message = document.getElementById("message");

const campaignPoster = document.getElementById("campaignPoster");
const posterPreview = document.getElementById("posterPreview");
const supportingDocs = document.getElementById("supportingDocs");

let currentUser = null;

onAuthStateChanged(auth, (user) => {
    if (!user) {
        window.location.href = "login.html";
        return;
    }

    currentUser = user;
});

campaignPoster.addEventListener("change", () => {
    const file = campaignPoster.files[0];

    if (!file) return;

    posterPreview.src = URL.createObjectURL(file);
});

campaignForm.addEventListener("submit", async (e) => {
    e.preventDefault();

    if (!currentUser) {
        showMessage("Sila log masuk terlebih dahulu.", "red");
        return;
    }

    const campaignTitle = document.getElementById("campaignTitle").value.trim();
    const campaignCategory = document.getElementById("campaignCategory").value;
    const targetAmount = Number(document.getElementById("targetAmount").value);
    const endDate = document.getElementById("endDate").value;
    const beneficiaryName = document.getElementById("beneficiaryName").value.trim();
    const location = document.getElementById("location").value.trim();
    const description = document.getElementById("description").value.trim();
    const posterFile = campaignPoster.files[0];

    if (!posterFile) {
        showMessage("Sila muat naik poster kempen.", "red");
        return;
    }

    if (targetAmount <= 0) {
        showMessage("Sasaran dana mestilah melebihi RM0.", "red");
        return;
    }

    try {
        showMessage("Sedang menghantar kempen. Sila tunggu...", "blue");

        const resizedPoster = await resizeImage(posterFile, 800, 450, 0.85);

        const mediaUrl = await uploadFile(
            resizedPoster,
            "campaign-media",
            "poster.jpg"
        );

        const supportingDocumentUrls = [];

        for (const file of supportingDocs.files) {
            const url = await uploadFile(
                file,
                "campaign-supporting-documents",
                file.name
            );

            supportingDocumentUrls.push(url);
        }

        await addDoc(collection(db, "campaigns"), {
            applicantId: currentUser.uid,

            campaignTitle,
            campaignCategory,
            targetAmount,
            currentAmount: 0,

            beneficiaryName,
            location,
            description,

            startDate: null,
            endDate,

            campaignStatus: "Pending Verification",
            status_kempen: "Perlu Disahkan",

            mediaUrl,
            supportingDocumentUrls,
            proofOfDistributionUrl: "",
            verificationRemarks: "",

            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp()
        });

        showMessage("Kempen berjaya dihantar. Menunggu pengesahan pentadbir.", "green");

        campaignForm.reset();
        posterPreview.src = "https://placehold.co/800x450?text=Poster+Kempen";

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